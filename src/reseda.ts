import path from 'path'
import { Session } from 'next-auth';
import { WgConfig, getConfigObjectFromFile } from './lib/wg-tools/src/index';
import { invoke } from '@tauri-apps/api/tauri'
import { ok } from 'assert';

export type Server = {
    id: string,
    serverUp: string,
    location: string,
    country: string,
    virtual: boolean,
    hostname: string,
    flag: string
};

type Incoming = {
	message: string | object,
	type: "update" | "message" | "error"
}

type Verification =  { 
    server_public_key: string, 
    client_address: string, 
    endpoint: string,
    subdomain: string,
};

type State = {
    location: Server,
    server: string,
    connected: boolean,
    /**
     * States are as follows:
     * - 0 is Disconnected
     * - 1 is Connected 
     * - 2 is Connecting...
     * - 3 is Connection FAILED
     * - 4 is Disconnecting
     * - 5 is Finishing (Either Way)
     */
    connection_type: 0 | 1 | 2 | 3 | 4 | 5,
    message: string
}

type Usage = {
    up: number,
    down: number
}

class WireGuard {
    state: {
        connection: State,
        path: string,
        fetching: boolean
    };
    registry: Server[];
    config: {
        keys: {
            public_key: string,
            private_key: string
        },
        wg: WgConfig
    };
    socket: WebSocket;
    user: Session;
    usage: Usage;

    constructor(file_path: string, user: Session) {
        this.user = user;

        this.state = {
            connection: {
                location: null,
                connected: false,
                connection_type: 0,
                server: "def-1",
                message: "Disconnected..."
            },
            path: file_path,
            fetching: false
        };

        this.config = {
            keys: {
                public_key: "",
                private_key: ""
            },
            wg: new WgConfig({
                filePath: file_path
            })
        };

        this.usage = {
            up: 0,
            down: 0
        };

        getConfigObjectFromFile({ filePath: file_path }).then((e) => {
            const config = new WgConfig({ 
                filePath: file_path,
                ...e
            });

            this.config.wg = config;
            this.scrapeConfig();
            this.generate_keys();
        });
    }

    async generate_keys() {
        console.log(this.config.wg);

        const privkey: string = this.config.wg.wgInterface.privateKey;

        const puckey: string = await invoke('generate_public_key', {
            privateKey: privkey
        }); 

        this.config.keys.public_key  = puckey.toString().substring(0, puckey.indexOf('=')+1);
        this.config.keys.private_key = privkey;
    }

    setUser(user: Session) {
        this.user = user;
    }

    setPath(path: string) {
        this.state.path = path;
    }

    getRegistry() {
        return this.registry;
    }

    setRegistry(register: any[]) {
        this.registry = register;
    }

    setFetching(fetching: boolean) {
        this.state.fetching = fetching;
    }

    setState(state: State) {
        this.state.connection = state;
    }

    connect(location: Server, callback_time: Function) {
        callback_time(new Date().getTime());
        this.socket = new WebSocket(`wss://${location.id}.reseda.app:443/?author=${this.user.id}&public_key=${this.config.keys.public_key}`);

        this.socket.addEventListener('open', () => {
            this.socket.send(JSON.stringify({
                query_type: "open"
            }));

            this.setState({
                connected: false,
                connection_type: 2,
                message: "Publishing",
                location: location,
                server: location.id
            });
        });

        this.socket.addEventListener('message', async (connection) => {
            const connection_notes: Incoming = JSON.parse(connection.data);
            console.log(connection_notes);

            if(connection_notes.type == "message" && typeof connection_notes.message == "object") {
                const message: Verification = connection_notes.message as Verification;

                this.setState({
                    connected: false,
                    connection_type: 2,
                    message: "Adding Peer",
                    location: location,
                    server: location.id
                });

                await this.addPeer(message.server_public_key, message.endpoint, message.subdomain, callback_time);

                this.setState({
                    connected: true,
                    connection_type: 1,
                    location: location,
                    server: location.id,
                    message: "Completed."
                });

                callback_time(new Date().getTime());
            }
        })
    }

    async disconnect() {
        if(this.socket.CLOSED || this.socket.CLOSING) {
            this.socket = new WebSocket(`wss://${this.state.connection.location.id}.reseda.app:443/?author=${this.user.id}&public_key=${this.config.keys.public_key}`);

            this.socket.addEventListener('open', () => {
                this.socket.send(JSON.stringify({
                    query_type: "close"
                }));

                this.socket.addEventListener('message', (event) => {
                    const data = JSON.parse(event.data);
                    console.log(`Disconnect handler posted:`, data);

                    if(data?.message?.includes("Removed")) {
                        this.removePeer()
        
                        this.setState({
                            connected: false,
                            connection_type: 0,
                            location: null,
                            server: null,
                            message: "Disconnected."
                        });
                    }
                })
            });
        }else {
            this.socket.send(JSON.stringify({
                query_type: "close"
            }));
        }
    }

    async uninstallService() {
        await invoke('remove_windows_service'); 
    }

    resumeConnection() {
        getConfigObjectFromFile({ filePath: this.state.path }).then((e) => {
            const config = new WgConfig({ 
                filePath: this.state.path,
                ...e
            });

            this.config.wg = config;
            const conn_ip = this.config.wg.peers?.[0]?.endpoint?.split(":")?.[0];

            if(!this?.user?.id || !this?.config?.keys?.public_key || !conn_ip) return;
            this.socket = new WebSocket(`wss://10.8.2.1:443/?author=${this.user.id}&public_key=${this.config.keys.public_key}`);

            this.socket.addEventListener('message', async (connection) => {
                const connection_notes: Incoming = JSON.parse(connection.data);
                console.log(connection_notes);

                if(connection_notes.type == "message" && typeof connection_notes.message == "object") {
                    this.registry.forEach(e => {
                        if(e.hostname == conn_ip) {
                            this.setState({
                                connected: true,
                                connection_type: 1,
                                location: e,
                                server: e.id,
                                message: "Connected."
                            });
                        }
                    })
                }
            })
        });
    }

    async addPeer(public_key: string, endpoint: string, subdomain: string, callback_time: Function) {
        console.log(`Adding ${public_key} ${endpoint} @ ${subdomain}`);
        console.log({
			publicKey: public_key,
			allowedIps: [ "0.0.0.0/0" ],
			endpoint: endpoint
		});

        // this.state.connected.endpoint = endpoint;
        this.config.wg.addPeer({
			publicKey: public_key,
			allowedIps: [ "0.0.0.0/0" ],
			endpoint: endpoint
		});

        this.config.wg.wgInterface.address = [`10.8.${subdomain}/24`];

        await this.config.wg.writeToFile(this.state.path).then(e => {
			console.log("Written!")
		})

        await this.up(() => {
            callback_time(new Date().getTime());
        })
    }

    async removePeer() {
        this.setState({
            connected: false,
            connection_type: 4,
            location: null,
            server: null,
            message: "Disconnecting..."
        });

        this.scrapeConfig();

        await this.config.wg.writeToFile(this.state.path).then(e => {
			console.log("Written!")
		})

        this.down(() => {
            this.setState({
                connected: false,
                connection_type: 0,
                location: null,
                server: null,
                message: "Disconnected."
            });
        });
    }

    async up(cb: Function) {
        await invoke('start_wireguard_tunnel').then(e => {
            console.log(e);
            cb();
        })
    }
    
    async down(cb: Function) {
        await invoke('stop_wireguard_tunnel').then(e => {
            cb();
        })
    }

    scrapeConfig() {
        this.config.wg.peers.forEach(e => {
            this.config.wg.removePeer(e.publicKey);
        });
    }
}

export default WireGuard;