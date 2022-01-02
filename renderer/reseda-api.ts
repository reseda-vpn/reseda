import path from 'path'
import { dir } from 'console'
import sudo from "sudo-prompt"
import { supabase } from './client'
import { WgConfig } from "wireguard-tools";
import child_process, { exec } from 'child_process'

type Packet = {
	id: number,
	author: string,
	server: string,
	client_pub_key: string,
	svr_pub_key: string,
	client_number: number,
	awaiting: boolean,
	server_endpoint: string
}

const filePath = path.join(process.cwd(), './', '/wg0.conf');
let connected = false;

type ResedaConnection = {
	protocol?: string,
	connected: boolean,
	connection: 0 | 1 | 2,
	config: {},
	as_string: string,
	connection_id: number,
}

type ResedaConnect = (location: string) => Promise<ResedaConnection>;
type ResedaDisconnect = (connection_id: number) => Promise<ResedaConnection>;

const connect: ResedaConnect = async (location: string): Promise<any> => {
	// Create local client-configuration
	const client_config = new WgConfig({
		wgInterface: {
			dns: ["1.1.1.1"]
		},
		filePath
	})
	
	// Generate Private Key for Client
	await client_config.generateKeys();
	console.log("[CONN] >> Generated Client Configuration");
	
	// Generate UNIQUE Public Key using wireguard (wg).
	const puckey = child_process.spawnSync("wg", ["pubkey"], { input: client_config.wgInterface.privateKey }).output;
	const key = puckey.toString();
	
	// Set the public key omitting /n and /t after '='.
	client_config.publicKey = key.substring(0, key.indexOf('=')+1)?.substring(1);
	console.log(client_config.publicKey);

	// Client Event Id
	let EVT_ID;
	
	// Now await a server response, to the current.
	supabase
		.from('open_connections')
		.on("UPDATE", async (event) => {
			const data: Packet = event.new;
			console.log(data.id, EVT_ID);
			
			if(data.id !== EVT_ID || connected) return;
		
			console.log(`[CONN] >> Protocol to ${location} established.`);
		
			client_config.addPeer({
				publicKey: data.svr_pub_key,
				allowedIps: [ "0.0.0.0/0" ],
				endpoint: `${data.server_endpoint}:51820`
			});
		
			client_config.wgInterface.address = [`192.168.69.${data.client_number}/24`]
			client_config.writeToFile();

			console.log(`EXECUTING "${`wireguard /installtunnelservice ${filePath}`}" as sudo (or equiv.)`);
			sudo.exec(`wireguard /installtunnelservice ${filePath}`, { //   ${filePath}
				name: "Reseda Wireguard"
			}, (e, out, err) => {
				if(err) throw err;
				console.log(e, out);
			});

			console.log("[CONN] >> Received! Connecting...");
			connected = true;

			console.log(client_config);

			return {
				protocol: "wireguard",
				config: client_config.toJson(),
				as_string: client_config.toString(),
				connection_id: EVT_ID,
				connected: true,
				connection: 1
			}
		}).subscribe();
	
	await supabase
		.from('open_connections')
		.insert({
			server: location,
			client_pub_key: client_config.publicKey,
			author: supabase.auth.user()?.id
		}).then(e => {
			EVT_ID = e?.data?.[0]?.id;
		});

	console.log("[CONN] >> Published Configuration, Awaiting Response");

	return {
		protocol: "wireguard",
		connected: false,
		connection: 2,
		config: {},
		as_string: "",
		connection_id: EVT_ID,
	}
}

const disconnect: ResedaDisconnect = async (connection_id: number): Promise<any> => {
	sudo.exec(`wireguard /uninstalltunnelservice wg0`, {
        name: "Reseda Wireguard"
    }, (_, __, err) => {
        if(err) throw err;

        supabase
            .from('open_connections')
            .delete()
            .match({
                id: connection_id
            }).then(e => {
				return {
					protocol: "wireguard",
					config: e.data,
					as_string: JSON.stringify(e.data),
					connection_id,
					connected: false,
					connection: 0
				}
            });
    });
}

export { connect, disconnect };