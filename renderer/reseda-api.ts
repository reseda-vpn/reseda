import path from 'path'
import { dir } from 'console'
import sudo from "sudo-prompt"
import { supabase } from './client'
import { getConfigObjectFromFile, parseConfigString, WgConfig } from "wireguard-tools";
import child_process, { exec, execSync, spawnSync } from 'child_process'
import { Server } from './components/tabview';

const run_loc = path.join(process.cwd(), './', `/wireguard`);

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

export type ResedaConnection = {
	protocol?: string,
	connected: boolean,
	connection: 0 | 1 | 2 | 3,
	config: {},
	as_string: string,
	connection_id: number,
	location: Server,
	server: string
}

type ResedaConnect = (location: Server, time_callback: Function, reference: Function) => Promise<ResedaConnection>;
type ResedaDisconnect = (connection_id: number, reference: Function) => Promise<ResedaConnection>;

const connect_pure: ResedaConnect = async (location: Server, time_callback: Function, reference: Function): Promise<any> => {
	time_callback(new Date().getTime());

	const client_config = new WgConfig({
		wgInterface: {
			dns: ["1.1.1.1"]
		},
		filePath
	});

	// Client Event Id
	let EVT_ID;

	await supabase.removeAllSubscriptions();
	
	// Now await a server response, to the current.
	await supabase
		.from('open_connections')
		.on("UPDATE", async (event) => {
			const data: Packet = event.new;
			console.log(data.id, EVT_ID);
			
			if(data.id !== EVT_ID || connected) {
				reference({
					protocol: "wireguard",
					config: client_config.toJson(),
					as_string: client_config.toString(),
					connection_id: EVT_ID,
					connected: false,
					connection: 3,
					location: location,
					server: location.id
				});
			}
		
			console.log(`[CONN] >> Protocol to ${location.id} established.`);
		
			client_config.addPeer({
				publicKey: data.svr_pub_key,
				allowedIps: [ "0.0.0.0/0" ],
				endpoint: `${data.server_endpoint}:51820`
			});
		
			client_config.wgInterface.address = [`192.168.69.${data.client_number}/24`]
			// client_config.wgInterface.address = [`192.168.69.19/24`]
			client_config.writeToFile();

			console.log(`EXECUTING "${`${path.join(run_loc, './wireguard.exe')} /installtunnelservice ${filePath}`}" as sudo (or equiv.)`);
			sudo.exec(`${path.join(run_loc, './wireguard.exe')} /installtunnelservice ${filePath}`, { //   ${filePath}
				name: "Reseda Wireguard"
			}, (e, out, err) => {
				if(err) throw err;
				console.log(e, out);

				time_callback(new Date().getTime());

				console.log("[CONN] >> Received! Connecting...");
				connected = true;

				console.log(client_config);

				supabase.removeAllSubscriptions();

				reference({
					protocol: "wireguard",
					config: client_config.toJson(),
					as_string: client_config.toString(),
					connection_id: EVT_ID,
					connected: true,
					connection: 1,
					location: location,
					server: location.id
				});

				return;
			});
		}).subscribe((e) => {
			console.log("SUBSCRIBED TO REALTIME.", e);

			if(e == "SUBSCRIBED") {
				supabase
					.from('open_connections')
					.insert({
						server: location.id,
						client_pub_key: client_config.publicKey,
						author: supabase.auth.user()?.id
					}).then(e => {
						EVT_ID = e?.data?.[0]?.id;

						console.log("[CONN] >> Published Configuration, Awaiting Response");
					});
			}
		})

	reference({
		protocol: "wireguard",
		connected: false,
		connection: 2,
		config: {},
		as_string: "",
		connection_id: EVT_ID,
		location: location,
		server: location.id
	});
}

const disconnect_pure: ResedaDisconnect = async (connection_id: number, reference: Function): Promise<any> => {
	ex(`${run_loc}/wireguard.exe /uninstalltunnelservice wg0`, true, () => {
		reference({
			protocol: "wireguard",
			config: {},
			as_string: "",
			connection_id,
			connected: false,
			connection: 0,
			location: null,
			server: null
		});

        supabase
            .from('open_connections')
            .delete()
            .match({
                id: connection_id
            }).then(e => {
				reference({
					protocol: "wireguard",
					config: e.data,
					as_string: JSON.stringify(e.data),
					connection_id,
					connected: false,
					connection: 0,
					location: null,
					server: null
				});

				return {};
            });
	});
}

const ex = (command: string, with_sudo: boolean, callback: Function) => {
	if(with_sudo) {
		sudo.exec(command, {
			name: "Reseda Wireguard"
		}, (_, __, err) => {
			if(err) throw err;
			callback(__);
		});
	}else {
		exec(command, (_, __, err) => {
			if(err) throw err;
			callback(__);
		})
	}
}

const connect: ResedaConnect = async (location: Server, time_callback: Function, reference: Function): Promise<any> => {
	time_callback(new Date().getTime());

	//@ts-expect-error
	const client_config: WgConfig = await getConfigObjectFromFile({
		filePath
	});

	const config = new WgConfig({ 
		filePath,
		...client_config
	})

	console.log(client_config, config);

	down();

	// Client Event Id
	let EVT_ID;

	await supabase.removeAllSubscriptions();
	
	// Now await a server response, to the current.
	await supabase
		.from('open_connections')
		.on("UPDATE", async (event) => {
			const data: Packet = event.new;
			console.log(data.id, EVT_ID);

			console.log(`[CON/W] >> Connecting with `, config);
			
			if(data.id !== EVT_ID || connected) {
				reference({
					protocol: "wireguard",
					config: config.toJson(),
					as_string: config.toString(),
					connection_id: EVT_ID,
					connected: false,
					connection: 3,
					location: location,
					server: location.id
				});
			}
		
			console.log(`[CONN] >> Protocol to ${location.id} established.`);
		
			config.addPeer({
				publicKey: data.svr_pub_key,
				allowedIps: [ "0.0.0.0/0" ],
				endpoint: `${data.server_endpoint}:51820`
			});
		
			config.wgInterface.address = [`192.168.69.${data.client_number}/24`]
			config.writeToFile();

			up();


			time_callback(new Date().getTime());

			console.log("[CONN] >> Received! Connecting...");
			connected = true;

			console.log(config);

			supabase.removeAllSubscriptions();

			reference({
				protocol: "wireguard",
				config: config.toJson(),
				as_string: config.toString(),
				connection_id: EVT_ID,
				connected: true,
				connection: 1,
				location: location,
				server: location.id
			});
		}).subscribe((e) => {
			console.log("SUBSCRIBED TO REALTIME.", e);

			if(e == "SUBSCRIBED") {
				const puckey = spawnSync(path.join(run_loc, './wg.exe'), ["pubkey"], { input: config.wgInterface.privateKey }).output;
				const key = puckey.toString();
				
				// Set the public key omitting /n and /t after '='.
				config.publicKey = key.substring(0, key.indexOf('=')+1)?.substring(1);

				supabase
					.from('open_connections')
					.insert({
						server: location.id,
						client_pub_key: config.publicKey,
						author: supabase.auth.user()?.id
					}).then(e => {
						EVT_ID = e?.data?.[0]?.id;

						console.log("[CONN] >> Published Configuration, Awaiting Response");
					});
			}
		})

	reference({
		protocol: "wireguard",
		connected: false,
		connection: 2,
		config: {},
		as_string: "",
		connection_id: EVT_ID,
		location: location,
		server: location.id
	});
}

const disconnect: ResedaDisconnect = async (connection_id: number, reference: Function): Promise<any> => {
	//@ts-expect-error
	const client_config: WgConfig = await getConfigObjectFromFile({
		filePath
	});

	const config = new WgConfig({ 
		filePath,
		...client_config
	});

	config.peers.forEach(e => {
		config.removePeer(e.publicKey);
	});

	down();
	up();

	reference({
		protocol: "wireguard",
		config: {},
		as_string: "",
		connection_id,
		connected: false,
		connection: 0,
		location: null,
		server: null
	});

	supabase
		.from('open_connections')
		.delete()
		.match({
			id: connection_id
		}).then(e => {
			reference({
				protocol: "wireguard",
				config: e.data,
				as_string: JSON.stringify(e.data),
				connection_id,
				connected: false,
				connection: 0,
				location: null,
				server: null
			});

			return {};
		});
}

const init = async () => {
	// Create local client-configuration
	const client_config = new WgConfig({
		wgInterface: {
			dns: ["1.1.1.1"],
			address: ["192.168.69.2/24"]
		},
		filePath
	})
	
	// Generate Private Key for Client
	await client_config.generateKeys();
	console.log("[CONN] >> Generated Client Configuration");
	
	// Generate UNIQUE Public Key using wireguard (wg). public key -> pu-c-key
	const puckey = child_process.spawnSync(path.join(run_loc, './wg.exe'), ["pubkey"], { input: client_config.wgInterface.privateKey }).output;
	const key = puckey.toString();
	
	// Set the public key omitting /n and /t after '='.
	client_config.publicKey = key.substring(0, key.indexOf('=')+1)?.substring(1);
	console.log(client_config.publicKey);

	client_config.writeToFile();

	down();
	up();
	
	return client_config;
}

const up = () => {
	ex("net start WireGuardTunnel$wg0", false, (out) => {console.log(out)});
}

const down = () => {
	ex("net stop WireGuardTunnel$wg0", false, (out) => {console.log(out)});
}

const forceDown = () => {
	ex("sc delete WireGuardTunnel$wg0", true, (out) => {console.log(out)});
}

export { init, connect, connect_pure, disconnect };