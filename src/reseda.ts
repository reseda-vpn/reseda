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
    endpoint: string 
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
        }

        this.config = {
            keys: {
                public_key: "",
                private_key: ""
            },
            wg: new WgConfig({
                filePath: file_path
            })
        }

        console.log(this.config.wg.parseFile());

        this.generate_keys();
    }

    async generate_keys() {
        const privkey: string = await invoke('generate_private_key'); 

        const puckey: string = await invoke('generate_public_key', {
            privateKey: privkey
        }); 

        this.config.keys.public_key  = puckey.toString().substring(0, puckey.indexOf('=')+1);
        this.config.keys.private_key = privkey;
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

                await this.addPeer(message.server_public_key, message.endpoint);

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
        this.socket.send(JSON.stringify({
			query_type: "close"
		}));

        this.socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            console.log(`Disconnect handler posted: ${data}`);

            this.setState({
                connected: false,
                connection_type: 0,
                location: null,
                server: null,
                message: "Disconnected."
            });
        })
    }

    async uninstallService() {
        //... remove_windows_service
        await invoke('remove_windows_service'); 
    }

    resumeConnection() {
        //... 
    }

    async addPeer(public_key: string, endpoint: string) {
        // this.state.connected.endpoint = endpoint;

        await invoke('add_peer', {
            publicKey: public_key,
            endpoint: endpoint
        }); 
    }

    async removePeer(public_key: string) {
        await invoke('remove_peer', {
            publicKey: public_key
        }); 
    }
}

export default WireGuard;