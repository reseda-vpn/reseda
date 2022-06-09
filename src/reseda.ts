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

class WireGuard {
    state: {
        connected: {
            location: string,
            endpoint: string,
            conn: false
        },
        path: string
    };
    config: {
        keys: {
            public_key: string,
            private_key: string
        }
    };
    socket: WebSocket;
    user: Session;

    constructor(file_path: string, user: Session) {
        this.user = user;

        this.state = {
            connected: {
                location: "def",
                endpoint: "0.0.0.0",
                conn: false
            },
            path: file_path
        }

        this.config = {
            keys: {
                public_key: "",
                private_key: ""
            },
        }

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

    connect(location: Server, callback_time: Function, callback_inform: Function) {
        callback_time(new Date().getTime());
        this.socket = new WebSocket(`wss://${location.id}.reseda.app:443/?author=${this.user.id}&public_key=${this.config.keys.public_key}`);

        this.socket.addEventListener('open', () => {
            this.socket.send(JSON.stringify({
                query_type: "open"
            }));

            callback_inform({
                protocol: "wireguard",
                connected: false,
                connection: 2,
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

                callback_inform({
                    protocol: "wireguard",
                    connected: false,
                    connection: 2,
                    message: "Adding Peer",
                    location: location,
                    server: location.id
                });

                await this.addPeer(message.server_public_key, message.endpoint);

                callback_inform({
                    protocol: "wireguard",
                    connected: true,
                    connection: 1,
                    location: location,
                    server: location.id
                });

                callback_time(new Date().getTime());
            }
        })
    }

    disconnect() {

    }

    addPeer(public_key: string, endpoint: string) {
        this.state.connected.endpoint = endpoint;
        // ... 
    }

    removePeer() {
        
    }
}

export const reseda = new WireGuard("", {} as Session);