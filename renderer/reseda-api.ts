import path from 'path'
import { dir } from 'console'
import sudo from "sudo-prompt"
import { supabase } from './client'
import { getConfigObjectFromFile, parseConfigString, WgConfig } from "wireguard-tools";
import child_process, { exec, execSync, spawnSync } from 'child_process'
import { Server } from './components/tabview';
import { platform } from "process"
import { io, Socket } from "socket.io-client"
import { DefaultEventsMap } from '@socket.io/component-emitter';
import https, { Agent } from "https"
import fetch from "node-fetch"
import axios from "axios"

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
	server_endpoint: string
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
	 */
	connection: 0 | 1 | 2 | 3 | 4,
	config: {},
	as_string: string,
	connection_id: number,
	location: Server,
	server: string
}

type ResedaConnect = (location: Server, time_callback: Function, reference: Function) => Promise<ResedaConnection>;
type ResedaDisconnect = (connection: ResedaConnection, reference: Function, publish?: boolean, config?: WgConfig) => Promise<ResedaConnection>;

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

	await supabase.removeAllSubscriptions();
	
	// Now await a server response, to the current.
	await supabase
		.from('open_connections')
		.on("UPDATE", async (event) => {
			const data: Packet = event.new;
			
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
			// client_config.wgInterface.address = [`192.168.69.19/24`]
			config.writeToFile();

			console.log(config.toString());
			
			if(platform !== 'win32') {
				up((out) => {
					console.log(out);

					time_callback(new Date().getTime());

					console.log("[CONN] >> Received! Connecting...");
					connected = true;

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
				}, config);
			}
			else
				sudo.exec(`${path.join(run_loc, './wireguard.exe')} /installtunnelservice ${filePath}`, { //   ${filePath}
					name: "Reseda Wireguard"
				}, (e, out, err) => {
					if(err) throw err;

					time_callback(new Date().getTime());

					console.log("[CONN] >> Received! Connecting...");
					connected = true;

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

					return;
				});
		}).subscribe((e) => {
			if(e == "SUBSCRIBED") {				
				const public_key = keyToBase64(generatePublicKey(config.wgInterface.privateKey));
				console.log(public_key)
				
				supabase
					.from('open_connections')
					.insert({
						server: location.id,
						client_pub_key: public_key.substring(0, public_key.indexOf('=')+1)?.substring(1),
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

const disconnect_pure: ResedaDisconnect = async (connection: ResedaConnection, reference: Function, _: boolean, config: WgConfig): Promise<any> => {
	if(platform == 'win32') 
		ex(`${run_loc}/wireguard.exe /uninstalltunnelservice wg0`, true, () => {
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

			supabase
				.from('open_connections')
				.delete()
				.match({
					id: connection.connection_id
				}).then(e => {
					reference({
						protocol: "wireguard",
						config: e.data,
						as_string: JSON.stringify(e.data),
						connection_id: connection.connection_id,
						connected: false,
						connection: 0,
						location: null,
						server: null
					});

					return {};
				});
		});
	else {
		scrapeConfig(config);
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

			supabase
				.from('open_connections')
				.delete()
				.match({
					id: connection.connection_id
				}).then(e => {
					reference({
						protocol: "wireguard",
						config: e.data,
						as_string: JSON.stringify(e.data),
						connection_id: connection.connection_id,
						connected: false,
						connection: 0,
						location: null,
						server: null
					});

					return {};
				});
		}, config)
	}
}

const ex = (command: string, with_sudo: boolean, callback: Function) => {
	if(with_sudo) {
		sudo.exec(command, {
			name: "Reseda VPN"
		}, (_, __, err) => {
			if(err) throw err;
			if(_) throw _;

			callback(__);
			return __;
		});
	}else {
		exec(command, (_, __, err) => {
			if(err) throw err;
			callback(__);

			return __;
		})
	}
}

const connect: ResedaConnect = async (location: Server, time_callback: Function, reference: Function): Promise<any> => {
	if(platform !== "win32") return connect_pure(location, time_callback, reference);

	console.time("wireguardSetup")

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
		if(up) down(() => {});
	});

	// Client Event Id
	let EVT_ID;

	const puckey = spawnSync(path.join(run_loc, './wg.exe'), ["pubkey"], { input: config.wgInterface.privateKey }).output;
	const key = puckey.toString();
	
	// Set the public key omitting /n and /t after '='.
	config.publicKey = key.substring(0, key.indexOf('=')+1)?.substring(1);

	console.timeEnd("wireguardSetup");
	console.time("createSocket");

	socket = io(`http://${location.hostname}:6231/`, { auth: {
		server: location.id,
		client_pub_key: config.publicKey,
		author: supabase.auth.user()?.id,
		type: "initial"
	}});

	socket.emit('request_connect', {
		cPk: config.publicKey
	});

	socket.on('request_accepted', (connection: Packet) => {
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
	
		config.wgInterface.address = [`192.168.69.${connection.client_number}/24`]
		config.writeToFile();

		console.timeLog("establishConnection")

		const new_connection = io(`192.168.69.1:6231`, {
			auth: {
				server: location.id,
				client_pub_key: config.publicKey,
				author: supabase.auth.user()?.id,
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

const disconnect: ResedaDisconnect = async (connection: ResedaConnection, reference: Function, publish: boolean = true): Promise<any> => {
	reference({
		protocol: "wireguard",
		config: connection.config,
		as_string: connection.config.toString(),
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

	if(platform !== 'win32') return disconnect_pure(connection, reference, false, config);

	if(socket) {
		socket.disconnect();
	}

	socket = io(`http://192.168.69.1:6231/`, { auth: {
		server: connection.location.id,
		client_pub_key: config.publicKey,
		author: supabase.auth.user()?.id,
		type: "close"
	}});

	socket.on("OK", () => {
		socket.disconnect();
	});

	scrapeConfig(config);

	restart(() => {
		reference({
			protocol: "wireguard",
			config: config.toJson(),
			as_string: config.toString(),
			connection_id: connection.connection_id,
			connected: false,
			connection: 0,
			location: null,
			server: null
		});
	});
}

const scrapeConfig = (config: WgConfig) => {
	config.peers.forEach(e => {
		config.removePeer(e.publicKey);
	});

	config.writeToFile();
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
	client_config.writeToFile();

	restart(() => {});
	
	return client_config;
}

const up = (cb: Function, conf?: WgConfig) => {
	if(platform == 'win32')
		ex("net start WireGuardTunnel$wg0", false, (out) => {console.log(out); cb(); });
	else {
		ex("ls", false, (out) => console.log(out));

		ex(`wg-quick up ./wg0.conf`, true, (out) => {
			cb(out)
		});
	}
}

const down = (cb: Function, conf?: WgConfig) => {
	if(platform == 'win32')
		ex("net stop WireGuardTunnel$wg0", false, (out) => {console.log(out); cb(); });
	else	
		ex(`sudo wg-quick down ${filePath}`, true, (out) => cb(out))
}

const restart = (cb: Function) => {
	isUp((__up) => {
		if(__up) {
			down(() => up(() => cb()));
		}else {
			up(() => cb());
		}
	})
} 

const forceDown = (cb: Function) => {
	ex("sc delete WireGuardTunnel$wg0", true, (out) => {console.log(out); cb(); });
}

const isUp = (cb: Function) => {
	if(platform == 'win32')
		ex("sc query WireGuardTunnel$wg0", false, (out) => {
			const stopped = out.includes("STOPPED");
			cb(!stopped);
		})
	else 
		ex("wg show", false, (out) => {
			const stopped = out.length < 1;
			cb(!stopped);
		})
}

const resumeConnection = async (reference: Function) => {
	//@ts-expect-error
	const client_config: WgConfig = await getConfigObjectFromFile({
		filePath
	});

	const config = new WgConfig({ 
		filePath,
		...client_config
	});

	// Server was connected, but is it actually currently connected?
	const conn_ip = config.peers?.[0]?.endpoint?.split(":")?.[0];

	isUp((det) => {
		if(det) {
			const puckey = spawnSync(path.join(run_loc, './wg.exe'), ["pubkey"], { input: config.wgInterface.privateKey }).output;
			const key = puckey.toString();
			
			// Set the public key omitting /n and /t after '='.
			config.publicKey = key.substring(0, key.indexOf('=')+1)?.substring(1);

			if(conn_ip) {
				supabase
					.from('open_connections')
					.select("*")
					.match({ 
						client_pub_key: config.publicKey
					})
					.order('instantiation_time', {ascending: true})
					.then(async e => {
						const data = e.body[0];

						const svr = await supabase.from('server_registry')
							.select("*")
							.match({ id: data.server });

						reference({
							protocol: "wireguard",
							config: config.toJson(),
							as_string: config.toString(),
							connection_id: data.id,
							connected: true,
							connection: 1,
							location: svr.body[0],
							server: data.server
						});
					})
			}else {
				reference({
					protocol: "wireguard",
					config: null,
					as_string: "",
					connection_id: null,
					connected: false,
					connection: 0,
					location: null,
					server: null
				});
			}
		}else {
			reference({
				protocol: "wireguard",
				config: null,
				as_string: "",
				connection_id: null,
				connected: false,
				connection: 0,
				location: null,
				server: null
			});
		}
	});
}

export { connect, disconnect, resumeConnection, disconnect_pure };