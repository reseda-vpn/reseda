import { Session } from 'next-auth';
import { WgConfig, getConfigObjectFromFile } from '../lib/wg-tools/src/index';
import { invoke } from '@tauri-apps/api/tauri'
import { Component } from 'react';
import { ArrowDownRight, ArrowUpRight, Check, Power } from 'react-feather';
import UsageGraph from '@components/usage_graph';
import styles from '../styles/Home.module.css'
import { register } from '@tauri-apps/api/globalShortcut';
import Loader from './un-ui/loader';
import { useRouter } from 'next/dist/client/router';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification';

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

type UsageLog = { 
    connEnd: string 
    connStart: string

    down: string
    up: string

    id: string
    serverId: string
    userId: string
}

class WireGuard extends Component<{ file_path: string, user: any }> {
    state: {
        connection: State,
        path: string,
        fetching: boolean,
        usage: Usage[],
        registry: Server[],
        installed: boolean,
        has: {
            has_exceeded_usage: boolean
        },
        tier: "FREE" | "SUPPORTER" | "PRO" | "BASIC",
        usage_history: UsageLog[]
    };
    config: {
        keys: {
            public_key: string,
            private_key: string
        },
        wg: WgConfig
    };
    socket: WebSocket;
    user: Session;
    setUsage: Function;
    location: Server;

    constructor(props) {
        super(props);
        let { file_path, user } = props;

        console.log("Constructing Wireguard Object");

        // Check if wireguard is installed,
        // Check if there are any problems with setup, i.e. wireguard is on when meant to be off...
        // Add loading UI so the user knows what is happening, i.e. disconnecting messages, reconnecting messages, ...

        this.user = user;

        this.state = {
            installed: false,
            connection: {
                location: null,
                connected: false,
                connection_type: 0,
                server: "def-1",
                message: "Disconnected..."
            },
            path: file_path,
            fetching: false,
            usage: [{
                up: 0,
                down: 0
            }],
            registry: [],
            has: {
                has_exceeded_usage: false
            },
            tier: null,
            usage_history: null
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

        invoke('verify_installation').then((e: boolean) => {
            this.state.installed = e;
        });

        console.log("Loading configuration from file: ", file_path);

        getConfigObjectFromFile({ filePath: file_path }).then((e) => {
            console.log("Retrieved Configuration from file, ", e);

            const config = new WgConfig({ 
                filePath: file_path,
                ...e
            });

            this.config.wg = config;
            this.scrapeConfig();
            this.generate_keys();

            // this.up(() => {
            //     console.log("Wireguard Up")
            // });
        });

        fetch('https://reseda.app/api/server/list', {
            method: "GET",
            redirect: 'follow'
        })
            .then(async e => {
                const json = await e.json();

                console.log("Fetched List, Attempting Resume.")

                this.setRegistry(json);
                this.setFetching(false);
                this.resumeConnection();
            })
            .catch(e => {
                console.log(e)
            })

        fetch(`https://reseda.app/next-api/user/tier/${this.user.id}`, {
            method: "GET",
            redirect: 'follow'
        })
            .then(async e => {
                const json = await e.text();
                console.log("Tier:", json);

                this.setState({
                    ...this.state,
                    tier: json
                });
            })
            .catch(e => {
                console.log(e)
            })
        
        fetch(`https://reseda.app/next-api/user/usage/this-month/${this.user.id}`, {
            method: "GET",
            redirect: 'follow'
        })
            .then(async e => {
                const json = await e.json();
                console.log("Usage: ", json);

                this.setState({
                    ...this.state,
                    usage_history: json
                });

                this.determineLimits();
            })
            .catch(e => {
                console.log(e)
            })

        console.log(this);
    }

    render() {
        return (
            <div className="flex flex-col flex-1 h-screen text-white bg-[#fff]">
                <svg height="0" width="0">
                    <defs>
                        <clipPath id="clipPathURL">
                            <path d="M12.0001 2V12M18.3601 6.64C19.6185 7.89879 20.4754 9.50244 20.8224 11.2482C21.1694 12.9939 20.991 14.8034 20.3098 16.4478C19.6285 18.0921 18.4749 19.4976 16.9949 20.4864C15.515 21.4752 13.775 22.0029 11.9951 22.0029C10.2152 22.0029 8.47527 21.4752 6.99529 20.4864C5.51532 19.4976 4.36176 18.0921 3.68049 16.4478C2.99921 14.8034 2.82081 12.9939 3.16784 11.2482C3.51487 9.50244 4.37174 7.89879 5.63012 6.64" strokeLinecap="round" strokeLinejoin="round"/>
                        </clipPath>
                    </defs>
                </svg>

                <div className="flex flex-col">
                    <div 
                        className={`flex flex-col h-56 relative items-center justify-center ${this.state.connection.connection_type == 2 ? styles.fancyGradientGreen : this.state.connection.connection_type == 0 ? styles.fancyGradientGrey : this.state.connection.connected ? styles.fancyGradient : styles.fancyGradientRed}`}
                        // style={{ 
                        //     backgroundSize: "400% 400%",
                        //     animation: "animated_text 5s linear infinite",
                        //     background: this.state.connection.connected ? "linear-gradient(45deg, #6355a4 0%, #e89a3e 33%, rgba(99,85,164,1) 66%, rgba(232,154,62,1) 100%)" : "linear-gradient(45deg, #6355a4 0%, #e89a3e 33%, rgba(99,85,164,1) 66%, rgba(232,154,62,1) 100%)" 
                        // }}
                        >
                        <span 
                            className="w-28 h-28 -mb-14 absolute bottom-0 rounded-full bg-white shadow-md flex justify-center items-center text-6xl font-bold hover:cursor-pointer"
                            onClick={async (e) => {
                                if(this.state.connection.connected) {
                                    await this.disconnect();
                                }else {
                                    this.connect(this.getRegistry()[0], () => {});
                                }
                            }}
                        >
                            {
                                (() => {
                                    switch(this.state.connection.connection_type) {
                                        case 0:
                                            return (
                                                <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="#131414" strokeWidth={2} xmlns="http://www.w3.org/2000/svg" shapeRendering="geometricPrecision">
                                                    <path d="M12.0001 2V12M18.3601 6.64C19.6185 7.89879 20.4754 9.50244 20.8224 11.2482C21.1694 12.9939 20.991 14.8034 20.3098 16.4478C19.6285 18.0921 18.4749 19.4976 16.9949 20.4864C15.515 21.4752 13.775 22.0029 11.9951 22.0029C10.2152 22.0029 8.47527 21.4752 6.99529 20.4864C5.51532 19.4976 4.36176 18.0921 3.68049 16.4478C2.99921 14.8034 2.82081 12.9939 3.16784 11.2482C3.51487 9.50244 4.37174 7.89879 5.63012 6.64" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            )
                                        case 1:
                                            return (
                                                <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="#131414" strokeWidth={2} xmlns="http://www.w3.org/2000/svg" shapeRendering="geometricPrecision">
                                                    <path d="M12.0001 2V12M18.3601 6.64C19.6185 7.89879 20.4754 9.50244 20.8224 11.2482C21.1694 12.9939 20.991 14.8034 20.3098 16.4478C19.6285 18.0921 18.4749 19.4976 16.9949 20.4864C15.515 21.4752 13.775 22.0029 11.9951 22.0029C10.2152 22.0029 8.47527 21.4752 6.99529 20.4864C5.51532 19.4976 4.36176 18.0921 3.68049 16.4478C2.99921 14.8034 2.82081 12.9939 3.16784 11.2482C3.51487 9.50244 4.37174 7.89879 5.63012 6.64" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            )
                                        case 2:
                                            return (
                                                <Loader color={"#000"} height={60} />
                                            )
                                        case 4:
                                            return (
                                                <Loader color={"#000"} height={60} />

                                            )
                                        default:
                                            return (
                                                <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="#131414" strokeWidth={2} xmlns="http://www.w3.org/2000/svg" shape-Rendering="geometricPrecision">
                                                    <path d="M12.0001 2V12M18.3601 6.64C19.6185 7.89879 20.4754 9.50244 20.8224 11.2482C21.1694 12.9939 20.991 14.8034 20.3098 16.4478C19.6285 18.0921 18.4749 19.4976 16.9949 20.4864C15.515 21.4752 13.775 22.0029 11.9951 22.0029C10.2152 22.0029 8.47527 21.4752 6.99529 20.4864C5.51532 19.4976 4.36176 18.0921 3.68049 16.4478C2.99921 14.8034 2.82081 12.9939 3.16784 11.2482C3.51487 9.50244 4.37174 7.89879 5.63012 6.64" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            )
                                    }
                                })()
                            }
                            
                        </span>

                        <div className="text-lg font-bold text-black font-altsans">
                            {
                                (() => {
                                    switch(this?.state?.connection?.connection_type) {
                                        case 0: 
                                            return (
                                                <h1 className="font-mono">Disconnected</h1>
                                            )
                                        case 1:
                                            return (
                                                <div className="flex flex-col items-center">
                                                    <h1 className="font-mono">{this?.state?.connection?.location?.country.replaceAll("_", " ")}</h1>
                                                        <p className="font-normal font-mono opacity-60 text-sm">
                                                        {
                                                            this?.state?.connection?.location?.id?.split("-").filter((e,i) => {
                                                                return i <= 1
                                                            }).map(e => {
                                                                const k = e[0].toUpperCase();
                                                                return k + e.substring(1, e.length)
                                                            }).join(" ")
                                                        }
                                                    </p>
                                                </div>
                                            )
                                        case 2: 
                                            return (
                                                <h1 className="font-mono">Connecting</h1>
                                            )
                                        case 3: 
                                            return (
                                                <h1 className="font-mono">Connecting</h1>
                                            )
                                        case 4: 
                                            return (
                                                <h1 className="font-mono">Disconnecting</h1>
                                            )
                                        case 5: 
                                            return (
                                                <h1 className="font-mono">Finalizing</h1>
                                            )
                                        default:
                                            return (
                                                <h1 className="font-mono">Error</h1>
                                            )
                                    }
                                })()
                            }
                        </div>
                    </div>
                    <div className="h-16"></div>
                </div>

                <div className="flex flex-col gap-2 flex-1 p-2">                
                    <div className="flex flex-col gap-4 text-slate-800 flex-1 p-2">
                        {
                            this?.state?.has?.has_exceeded_usage ? 
                            <div>
                                <h1>You have exceeded your monthly allocated usage for your free tier.</h1>
                                <p>To unlock unlimited data options, click <a href="https://reseda.app/billing/plan">here</a></p>
                            </div>
                            :
                            <></>
                        }

                        {
                            this?.state?.connection?.connected ?
                            <div className="p-1 flex flex-col gap-2 flex-1 h-full">
                                <div className="flex flex-row items-baseline flex-1">
                                    <div className="flex flex-1 w-1/2 flex-col">
                                        <ArrowUpRight size={54} strokeWidth={1}></ArrowUpRight>
                                        <h1 className="text-3xl font-bold">{ getSize(this.state.usage[this.state.usage.length - 1].up) }</h1>
                                        <UsageGraph ekey={"up"} usage={this.state.usage}  />
                                        {/* Graph for Down Information */}
                                    </div>
                                    <div className="flex flex-1 w-1/2 flex-col items-end">
                                        <ArrowDownRight size={54} strokeWidth={1}></ArrowDownRight>
                                        <h1 className="text-3xl font-bold items-start">{ getSize(this.state.usage[this.state.usage.length - 1].down) }</h1>
                                        <UsageGraph ekey={"down"} usage={this.state.usage} />
                                        {/* Graph for Up Information */}
                                    </div>
                                </div>
                            </div>
                            :
                            <div className="p-1 flex flex-col gap-2 flex-1 h-full ">
                                {
                                    this?.state?.registry?.map(e => 
                                        <div 
                                            key={`server-${e.id}`}
                                            className=" 
                                            rounded-lg overflow-hidden p-2 border hover:text-gray-900 border-[#eceded] shadow-lg hover:shadow-gray-100/80 transition-shadow duration-450 ease-in-out flex flex-col justify-between min-h-72 text-slate-700 font-sans cursor-pointer
                                            "
                                            onClick={() => {
                                                this.connect(e, () => {})
                                            }}
                                        >
                                            <div className="flex flex-row items-center gap-2">
                                                <span style={{ height: '22px' }} className={`twa-lg twa-${e.flag}`}></span>
                                                <p>{ e.country.replaceAll("_", " ") }</p>
                                            </div>

                                            <div></div>
                                        </div>
                                    )
                                }
                            </div>
                        }

                        <div className="flex flex-row items-center justify-between">
                            <p>Reseda {this?.state?.tier}</p>
                            <p>{this?.user?.user?.email}</p>

                            <div onClick={() => { 
                                localStorage.removeItem("reseda.safeguard");
                                window.location.href = "/";
                            }}>
                                Sign Out
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    async generate_keys() {
        const privkey: string = this.config.wg.wgInterface.privateKey;

        let utf8Encode = new TextEncoder();
        console.log(privkey)

        const puckey: string = await invoke('generate_public_key', {
            privateKey: privkey
        }); 

        console.log(puckey);

        this.config.keys.public_key  = puckey.toString().substring(0, puckey.indexOf('=')+1);
        this.config.keys.private_key = privkey;
    }

    determineLimits() {
        let totalDown = 0
        let totalUp = 0;

        this.state.usage_history.map(e => {
            totalDown += parseInt(e.down);
            totalUp += parseInt(e.up);
        });

        return {totalDown, totalUp};

        console.log(totalDown, totalUp);
    }

    setUser(user: Session) {
        this.user = user;
    }

    setPath(path: string) {
        this.setState({
            ...this.state,
            path: path
        });
    }

    getRegistry() {
        return this.state.registry;
    }

    setRegistry(register: any[]) {
        this.setState({
            ...this.state,
            registry: register
        })
    }

    setFetching(fetching: boolean) {
        this.setState({
            ...this.state,
            fetching
        })
    }

    // setState(state: State) {
    //     this.state.connection = state;
    // }

    bounceWs(fn: Function, location: Server, force: boolean = false) {
        if(this.socket && this.socket.readyState == this.socket.OPEN && !force) {
            fn();
        }else if(this.socket && this.socket.readyState == this.socket.OPEN) {
            this.socket.close();

            this.socket.addEventListener('close', () => {
                this.socket = new WebSocket(`wss://${location.id}.reseda.app:443/ws?author=${this.user.id}&public_key=${this.config.keys.public_key}`);

                this.socket.addEventListener('open', () => {
                    fn();
                })
            })
        }else {
            this.socket = new WebSocket(`wss://${location.id}.reseda.app:443/ws?author=${this.user.id}&public_key=${this.config.keys.public_key}`);

            this.socket.addEventListener('open', () => {
                fn();
            })
        }
    }

    connect(location: Server, callback_time: Function) {
        // If user has exceeded limits, do not allow them to connect.
        if(this.state.tier == "FREE" || this.state.tier == "SUPPORTER") {
            const limits = this.determineLimits();

            if(this.state.tier == "FREE") {
                const limit = 5000000000;

                if(limits.totalDown >= limit || limits.totalUp >= limit) {
                    return;
                }
            }else {
                const limit = 50000000000;

                if(limits.totalDown >= limit || limits.totalUp >= limit) {
                    return;
                }
            }
        }

        console.time("start->sendws");
        callback_time(new Date().getTime());
        console.log(this.config.keys);
        
        this.setState({
            ...this.state,
            connection: {
                connected: false,
                connection_type: 2,
                message: "Instigating",
                location: location,
                server: location.id
            }
        });

        this.bounceWs(() => {
            this.socket.send(JSON.stringify({
                query_type: "open"
            }));

            console.timeEnd("start->sendws");

            this.setState({
                ...this.state,
                connection: {
                    connected: false,
                    connection_type: 2,
                    message: "Publishing",
                    location: location,
                    server: location.id
                }
            });

            console.time("evt-listener->get-message");
            console.time("evt-listener->get-right-message");

            this.socket.addEventListener('message', async (connection) => {
                const connection_notes: Incoming = JSON.parse(connection.data);
                console.log(connection_notes);
                
                console.timeEnd("evt-listener->get-message");

                if(connection_notes.type == "message" && typeof connection_notes.message == "object") {
                    console.timeEnd("evt-listener->get-right-message");
                    console.time("get-message->add-peer");
                    const message: Verification = connection_notes.message as Verification;

                    this.setState({
                        ...this.state,
                        connection: {
                            connected: false,
                            connection_type: 2,
                            message: "Adding Peer",
                            location: location,
                            server: location.id
                        }
                    });
    
                    this.socket.close();
                    
                    console.timeEnd("get-message->add-peer");
                    console.time("add-peer->finish");
                    await this.addPeer(location, message.server_public_key, message.subdomain, callback_time);
                    
                    this.setState({
                        ...this.state,
                        connection: {
                            connected: true,
                            connection_type: 1,
                            location: location,
                            server: location.id,
                            message: "Completed."
                        }
                    });
    
                    callback_time(new Date().getTime());
                    console.timeEnd("add-peer->finish");
                }
            })
        }, location, true)
    }

    async disconnect() {
        await this.removePeer()

        setTimeout(async () => {
            this.bounceWs(() => {
                this.socket.send(JSON.stringify({
                    query_type: "close"
                }));
            }, this.state.connection.location)

            this.setState({
                ...this.state,
                connection: {
                    connected: false,
                    connection_type: 0,
                    location: null,
                    server: null,
                    message: "Disconnected."
                }
            });
        }, 1000);
    }

    async uninstallService() {
        await invoke('remove_windows_service'); 
    }

    resumeConnection() {
        console.log("Resuming Connection...");

        getConfigObjectFromFile({ filePath: this.state.path }).then((e) => {
            const config = new WgConfig({ 
                filePath: this.state.path,
                ...e
            });

            console.log(config);

            this.config.wg = config;
            const conn_ip = this.config.wg.peers?.[0]?.endpoint?.split(":")?.[0]?.split(".")?.[0];

            if(!this?.user?.id || !conn_ip) {
                console.log(conn_ip, this?.user?.id)
                this.down(() => {});
                return;
            }

            let loc = this.state.registry.filter(e => {
                console.log(e.id == conn_ip, {
                    connected: true,
                    connection_type: 1,
                    location: e,
                    server: e.id,
                    message: "Connected."
                });

                if(e.id == conn_ip) {
                    return true;
                }
                else {
                    return false
                }
            })[0];

            if(loc) {
                this.setState({
                    ...this.state,
                    connection: {
                        connected: true,
                        connection_type: 1,
                        location: loc,
                        server: loc.id,
                        message: "Connected."
                    }
                });
    
                this.bounceWs(() => {
                    this.socket.addEventListener('message', (connection) => {
                        const connection_notes = JSON.parse(connection.data);
        
                        if(connection_notes.type == "update" && connection_notes.message?.up && connection_notes.message?.down) {
                            this.setState({
                                ...this.state,
                                usage: [
                                    ...this.state.usage,
                                    {
                                        up: connection_notes.message?.up,
                                        down: connection_notes.message?.down
                                    }
                                ]
                            });
                        }
                    })
                }, loc)
            }else {
                console.log("UNABLE TO INSTIGATE RESUME", loc, this.state.registry)
                this.down(() => {});
            }   
        });
    }

    async addPeer(location: Server, public_key: string, subdomain: string, callback_time: Function) {
        // this.state.connected.endpoint = endpoint;
        this.config.wg.addPeer({
			publicKey: public_key,
			allowedIps: [ "0.0.0.0/0" ],
			endpoint: `${location.id}.dns.reseda.app:8443`
		});

        this.config.wg.wgInterface.address = [`10.8.${subdomain}/24`];

        await this.config.wg.writeToFile(this.state.path);
        // new
//         await invoke('add_peer', { publicKey: public_key, endpoint: `${location.id}.dns.reseda.app:8443` }).then(e => {
//             callback_time(new Date().getTime());
//             this.listenForUpdates(location);
//         })

        await this.up(() => {
            callback_time(new Date().getTime());
            this.listenForUpdates(location);
        })
    }

    listenForUpdates(location: Server) {
        this.bounceWs(() => {
            this.socket.addEventListener('message', async (event) => {
                const connection_notes = JSON.parse(event.data);

                if(connection_notes.type == "update" && connection_notes.message?.up && connection_notes.message?.down) {
                    this.setState({
                        ...this.state,
                        usage: [
                            ...this.state.usage,
                            {
                                up: connection_notes.message?.up,
                                down: connection_notes.message?.down
                            }
                        ]
                    });
                }
                
                if(connection_notes.type == "error" && connection_notes.message == "UDC-EU") {
                    await this.disconnect();

                    this.setState({
                        ...this.state,
                        has: {
                            has_exceeded_usage: true
                        }
                    });

                    let permissionGranted = await isPermissionGranted();
                    if (!permissionGranted) {
                        const permission = await requestPermission();
                        permissionGranted = permission === 'granted';
                    }

                    if (permissionGranted) {
                        sendNotification({
                            title: "Reseda",
                            body: "Usage limit met"
                        });
                    }
                }
            })
        }, location)
    }

    async removePeer() {
        this.setState({
            ...this.state,
            connection: {
                connected: false,
                connection_type: 4,
                location: this.state.connection.location,
                server: this.state.connection.location.id,
                message: "Disconnecting..."
            }
        });

        this.scrapeConfig();

        await this.config.wg.writeToFile(this.state.path);

        //new
//         await invoke('remove_peer', { publicKey: this.config.wg.peers[0].publicKey }).then(e => {
//             this.setState({
//                 ...this.state,
//                 connection: {
//                     connected: false,
//                     connection_type: 0,
//                     location: this.state.connection.location,
//                     server: this.state.connection.location.id,
//                     message: "Disconnected."
//                 }
//             });
//         })

        await this.down(() => {
            this.setState({
                ...this.state,
                connection: {
                    connected: false,
                    connection_type: 0,
                    location: this.state.connection.location,
                    server: this.state.connection.location.id,
                    message: "Disconnected."
                }
            });
        });
    }

    async up(cb: Function) {
        console.time("up: checking wg");
        let k = await invoke('is_wireguard_up').then(e => {
            return `${e}`;
        });
        console.timeEnd("up: checking wg");

        if(k.includes('RUNNING')) {
            await this.down(async () => {
                await invoke('start_wireguard_tunnel', { path: this.config.wg.filePath }).then(e => {
                    cb();
                })
            });
        }else {
            await invoke('start_wireguard_tunnel', { path: this.config.wg.filePath }).then(e => {
                cb();
            })
        }
    }
    
    async down(cb: Function) {
        console.time("down: stopping wg");
        await invoke('stop_wireguard_tunnel', { path: this.config.wg.filePath }).then(e => {
            cb();
        })
        console.timeEnd("down: stopping wg");

    }

    scrapeConfig() {
        this.config.wg.peers.forEach(e => {
            this.config.wg.removePeer(e.publicKey);
        });
    }
}

function getSize(size) {
    const sizes = [' Bytes', ' KB', ' MB', ' GB', ' TB', ' PB', ' EB', ' ZB', ' YB'];
    
    for (let i = 1; i < sizes.length; i++) {
        if (size < Math.pow(1024, i)) 
          return (Math.round((size / Math.pow(
            1024, i - 1)) * 100) / 100) + sizes[i - 1];
    }
    return size;
}

export default WireGuard;
export { getSize };