import path from 'path'
import { Server } from './components/tabview';
import { platform } from "process"
import { io, Socket } from "socket.io-client"
import { DefaultEventsMap } from '@socket.io/component-emitter';
import { Session } from 'next-auth';
import { WgConfig, getConfigObjectFromFile } from './lib/wg-tools/src/index';
import { invoke } from '@tauri-apps/api/tauri'

const { generatePublicKey, keyToBase64 } = require('./wireguard_tooling')
const run_loc = path.join(process.cwd(), './', `/wireguard`);

let socket: Socket<DefaultEventsMap, DefaultEventsMap>;

type Packet = {
	id: number,
	author: string,
	server: string,
	client_pub_key: string,
	svr_pub_key: string,
	client_number: number,
	awaiting: boolean,
	server_endpoint: string,
	start_time?: number
}

const filePath = path.join(process.cwd(), './', '/wg0.conf');
let connected = false;

export type ResedaConnection = {
	/**
	 * Protocol Used, Default `wireguard`
	 */
	protocol?: string,
	/**
	 * Connected Boolean `true/false`
	 */
	connected: boolean,
	/**
	 * Used during connecting to show state or to show errors
	 */
	message?: string,
	/**
	 * 0: Disconnected
	 * 1: Connected
	 * 2: Connecting
	 * 3: Error
	 * 4: Disconnecting
	 * 5: Finishing
	 */
	connection: 0 | 1 | 2 | 3 | 4 | 5
	config: {},
	as_string: string,
	connection_id: number,
	location: Server,
	server: string
}

type ResedaConnect = (location: Server, time_callback: Function, reference: Function, user: Session) => Promise<ResedaConnection>;
type ResedaDisconnect = (connection: ResedaConnection, reference: Function, user: Session, publish?: boolean, config?: WgConfig) => Promise<ResedaConnection>;

const connect: ResedaConnect = async (location: Server, time_callback: Function, reference: Function, user: Session): Promise<any> => {
	// if(platform !== "win32") return connect_pure(location, time_callback, reference, user);

	if(socket) socket.disconnect();

	console.time("wireguardSetup")

	time_callback(new Date().getTime());

	//@ts-expect-error
	const client_config: WgConfig = await getConfigObjectFromFile({
		filePath: "wg0.conf"
	});

	const config = new WgConfig({ 
		filePath,
		...client_config
	});

	scrapeConfig(config);

	// Client Event Id
	let EVT_ID;

	const puckey: string = await invoke('generate_public_key', {
		privateKey: config.wgInterface.privateKey
	}); 
	console.log(puckey);
	// should be 44 long
	console.log(puckey.length)
	// spawnSync(path.join(run_loc, './wg.exe'), ["pubkey"], { input: config.wgInterface.privateKey }).output;
	const key = puckey.toString();
	
	// Set the public key omitting /n and /t after '='.
	config.publicKey = key.substring(0, key.indexOf('=')+1);

	console.timeEnd("wireguardSetup");
	console.time("createSocket");

	await isUp(async (up) => {
		if(up) {
			await down(() => {})
		}
	});

	console.log("Starting Socket");

	socket = io(`http://${location.hostname}:6231/`, { 
		withCredentials: true,	
		auth: {
			server: location.id,
			client_pub_key: config.publicKey,
			author: user.id,
			type: "initial"
		}
	});

	socket.emit('request_connect', {
		cPk: config.publicKey
	});

	socket.on('request_accepted', async (connection: Packet) => {
		console.timeEnd("createSocket");
		console.time("establishConnection");
		console.log(connection);
		console.log(`[CONN] >> Protocol to ${location.id} established.`);

		reference({
			protocol: "wireguard",
			connected: false,
			connection: 2,
			config: {},
			message: "Adding Peer",
			as_string: "",
			connection_id: EVT_ID,
			location: location,
			server: location.id
		});
	
		config.addPeer({
			publicKey: connection.svr_pub_key,
			allowedIps: [ "0.0.0.0/0" ],
			endpoint: `${connection.server_endpoint}:51820`
		});

		console.log(config);
	
		config.wgInterface.address = [`192.168.69.${connection.client_number}/24`]
		await config.writeToFile().then(e => {
			console.log("Written!")
		})

		console.timeLog("establishConnection")

		const new_connection = io(`http://192.168.69.1:6231`, {
			withCredentials: true,	
			auth: {
				server: location.id,
				client_pub_key: config.publicKey,
				author: user.id,
				type: "secondary"
			}
		});

		new_connection.on("update_schema", (data) => {
			console.log(data);
		});

		reference({
			protocol: "wireguard",
			connected: false,
			connection: 2,
			config: {},
			message: "Finishing",
			as_string: "",
			connection_id: EVT_ID,
			location: location,
			server: location.id
		});

		console.log("Starting [UP]");

		up(() => {
			time_callback(new Date().getTime());
			console.log("[CONN] >> Received! Connected!");
			connected = true;

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

			socket.disconnect();

			console.timeEnd("establishConnection")
		});
	})

	reference({
		protocol: "wireguard",
		connected: false,
		connection: 2,
		message: "Publishing",
		config: {},
		as_string: "",
		connection_id: EVT_ID,
		location: location,
		server: location.id
	});
}

const disconnect: ResedaDisconnect = async (connection: ResedaConnection, reference: Function, user: Session, publish: boolean = true): Promise<any> => {
	reference({
		protocol: "wireguard",
		config: connection.config,
		as_string: "",
		connection_id: connection.connection_id,
		connected: false,
		connection: 4,
		location: null,
		server: null
	});

	//@ts-expect-error
	const client_config: WgConfig = await getConfigObjectFromFile({
		filePath
	});

	const config = new WgConfig({ 
		filePath,
		...client_config
	});

	// if(platform !== 'win32') return disconnect_pure(connection, reference, user, false, config);

	if(socket) {
		socket.disconnect();
	}

	if(connection.connection == 1) {
		socket = io(`http://${connection.location.hostname}:6231/`, { auth: {
			server: connection.location.id,
			client_pub_key: config.publicKey,
			author: user.id,
			type: "close"
		}});

		socket.on("OK", () => {
			socket.disconnect();
		});
	}

	scrapeConfig(config);

	reference({
		protocol: "wireguard",
		config: connection.config,
		as_string: "",
		connection_id: connection.connection_id,
		connected: false,
		connection: 4,
		location: null,
		server: null
	});

	down(() => {
		reference({
			protocol: "wireguard",
			config: config.toJson(),
			as_string: "",
			connection_id: connection.connection_id,
			connected: false,
			connection: 0,
			location: null,
			server: null
		});
	});
}

const scrapeConfig = async (config: WgConfig) => {
	config.peers.forEach(e => {
		config.removePeer(e.publicKey);
	});

	await config.writeToFile();
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
	const puckey = ""; //child_process.spawnSync(path.join(run_loc, './wg.exe'), ["pubkey"], { input: client_config.wgInterface.privateKey }).output;
	const key = puckey.toString();
	
	// Set the public key omitting /n and /t after '='.
	client_config.publicKey = key.substring(0, key.indexOf('=')+1)?.substring(1);
	client_config.writeToFile();

	restart(() => {});
	
	return client_config;
}

const up = async (cb: Function, conf?: WgConfig) => {
	await invoke('start_wireguard_tunnel').then(e => {
		console.log(e);
		cb();
	})
}

const down = async (cb: Function, conf?: WgConfig) => {
	await invoke('stop_wireguard_tunnel').then(e => {
		cb();
	})
}

const restart = (cb: Function) => {
	isUp((__up) => {
		if(__up) {
			down(() => 
				cb()
				// up(() => cb())
			);
		}else {
			up(() => cb());
		}
	})
} 

const forceDown = (cb: Function) => {
	invoke('remove_windows_service').then(e => {
		cb();
	})
	
	// ex("sc delete WireGuardTunnel$wg0", true, (out) => {console.log(out); cb(); });
}

const isUp = async (cb: Function) => {
	const data: string = await invoke('is_wireguard_up');
	console.log(data, data.includes("STOPPED"));

	const stopped = data.includes("STOPPED");
	cb(stopped);

	// if(platform == 'win32')
	// 	ex("sc query WireGuardTunnel$wg0", false, (out) => {
	// 		const stopped = out.includes("STOPPED");
	// 		cb(!stopped);
	// 	})
	// else 
	// 	ex("wg show", false, (out) => {
	// 		const stopped = out.length < 1;
	// 		cb(!stopped);
	// 	})
}

const resumeConnection = async (reference: Function, timeCallback: Function, server_pool: Server[], user: Session) => {
	//@ts-expect-error
	const client_config: WgConfig = await getConfigObjectFromFile({
		filePath
	});

	const config = new WgConfig({ 
		filePath,
		...client_config
	});

	const public_key: string = await invoke('generate_public_key', {
		privateKey: config.wgInterface.privateKey
	})
	
	const key = public_key.substring(0, public_key.indexOf('=')+1);

	// Server was connected, but is it actually currently connected?
	const conn_ip = config.peers?.[0]?.endpoint?.split(":")?.[0];

	console.log(`Already Connected ${conn_ip}`);

	socket = io(`http://${conn_ip}:6231/`, { 
		withCredentials: true,	
		auth: {
			server: conn_ip,
			client_pub_key: key,
			author: user.id,
			type: "secondary"
		}
	});

	socket.on('request_response', (data: { connection: Packet }) => {
		const conn: Packet = data.connection;
		console.log(data.connection, {
			server: conn_ip,
			client_pub_key: key,
			author: user.id,
			type: "secondary"
		});

		timeCallback(conn.start_time);

		console.log("set time ", data);
		console.log("[CONN] >> Received! Connected!");
		connected = true;

		server_pool.forEach(e => {
			if(e.hostname == conn_ip) {
				reference({
					protocol: "wireguard",
					config: config.toJson(),
					as_string: config.toString(),
					connection_id: conn.client_number,
					connected: true,
					connection: 1,
					location: e,
					server: e.id
				});
			}
		})
	})

	reference({
		protocol: "wireguard",
		connected: false,
		connection: 1,
		config: {},
		message: "Finishing",
		as_string: "",
		connection_id: "--",
		location: {},
		server: conn_ip
	});
}

const connect_pure: ResedaConnect = async (location: Server, time_callback: Function, reference: Function): Promise<any> => {
	time_callback(new Date().getTime());

	//@ts-expect-error
	const client_config: WgConfig = await getConfigObjectFromFile({
		filePath
	});

	const config = new WgConfig({ 
		filePath,
		...client_config
	});

	scrapeConfig(config);

	isUp((up) => {
		if(up) {
			scrapeConfig(config);
		}
	});

	// Client Event Id
	let EVT_ID;

	// await supabase.removeAllSubscriptions();
	
	// // Now await a server response, to the current.
	// await supabase
	// 	.from('open_connections')
	// 	.on("UPDATE", async (event) => {
	// 		const data: Packet = event.new;
			
	// 		if(data.id !== EVT_ID || connected) {
	// 			reference({
	// 				protocol: "wireguard",
	// 				config: config.toJson(),
	// 				as_string: config.toString(),
	// 				connection_id: EVT_ID,
	// 				connected: false,
	// 				connection: 3,
	// 				location: location,
	// 				server: location.id
	// 			});
	// 		}
		
	// 		console.log(`[CONN] >> Protocol to ${location.id} established.`);
		
	// 		config.addPeer({
	// 			publicKey: data.svr_pub_key,
	// 			allowedIps: [ "0.0.0.0/0" ],
	// 			endpoint: `${data.server_endpoint}:51820`
	// 		});
		
	// 		config.wgInterface.address = [`192.168.69.${data.client_number}/24`]
	// 		// client_config.wgInterface.address = [`192.168.69.19/24`]
	// 		config.writeToFile();

	// 		console.log(config.toString());
			
	// 		if(platform !== 'win32') {
	// 			up((out) => {
	// 				console.log(out);

	// 				time_callback(new Date().getTime());

	// 				console.log("[CONN] >> Received! Connecting...");
	// 				connected = true;

	// 				supabase.removeAllSubscriptions();

	// 				reference({
	// 					protocol: "wireguard",
	// 					config: config.toJson(),
	// 					as_string: config.toString(),
	// 					connection_id: EVT_ID,
	// 					connected: true,
	// 					connection: 1,
	// 					location: location,
	// 					server: location.id
	// 				});
	// 			}, config);
	// 		}
	// 		else
	// 			sudo.exec(`${path.join(run_loc, './wireguard.exe')} /installtunnelservice ${filePath}`, { //   ${filePath}
	// 				name: "Reseda Wireguard"
	// 			}, (e, out, err) => {
	// 				if(err) throw err;

	// 				time_callback(new Date().getTime());

	// 				console.log("[CONN] >> Received! Connecting...");
	// 				connected = true;

	// 				supabase.removeAllSubscriptions();

	// 				reference({
	// 					protocol: "wireguard",
	// 					config: config.toJson(),
	// 					as_string: config.toString(),
	// 					connection_id: EVT_ID,
	// 					connected: true,
	// 					connection: 1,
	// 					location: location,
	// 					server: location.id
	// 				});

	// 				return;
	// 			});
	// 	}).subscribe((e) => {
	// 		if(e == "SUBSCRIBED") {				
	// 			const public_key = keyToBase64(generatePublicKey(config.wgInterface.privateKey));
	// 			console.log(public_key)
				
	// 			supabase
	// 				.from('open_connections')
	// 				.insert({
	// 					server: location.id,
	// 					client_pub_key: public_key.substring(0, public_key.indexOf('=')+1)?.substring(1),
	// 					author: supabase.auth.user()?.id
	// 				}).then(e => {
	// 					EVT_ID = e?.data?.[0]?.id;

	// 					console.log("[CONN] >> Published Configuration, Awaiting Response");
	// 				});
	// 		}
	// 	})

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

const disconnect_pure: ResedaDisconnect = async (connection: ResedaConnection, reference: Function, user: Session,  _: boolean, config: WgConfig): Promise<any> => {
	down(() => {
		reference({
			protocol: "wireguard",
			config: {},
			as_string: "",
			connection_id: connection.connection_id,
			connected: false,
			connection: 0,
			location: null,
			server: null
		});
	}, config)
}

export { connect, disconnect, resumeConnection, disconnect_pure };