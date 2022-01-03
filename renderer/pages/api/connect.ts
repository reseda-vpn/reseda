import { generateKeyPair, WgConfig } from 'wireguard-tools'
import path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../client'
import sudo from "sudo-prompt"
import child_process, { exec } from 'child_process'
import { dir } from 'console'

const filePath = path.join(dir.name, './', '/wg0.conf');
let connected = false;

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
    // const { privateKey } = await generateKeyPair({ preSharedKey: true });

    const client_config = new WgConfig({
        wgInterface: {
            dns: ["1.1.1.1"]
        },
        filePath
    })

    await client_config.generateKeys();

    console.log("[CONN] >> Generated Client Configuration");

    const puckey = child_process.spawnSync("wg", ["pubkey"], { input: client_config.wgInterface.privateKey }).output;
    const key = puckey.toString();

    client_config.publicKey = key.substring(0, key.indexOf('=')+1);
    console.log(client_config.publicKey);
    
    let EVT_ID = 0;

    // Now await a server response, to the current.
    supabase
    .from('open_connections')
    .on("UPDATE", (event) => {
        const data: Packet = event.new;
        if(data.id !== EVT_ID || connected) return;

        console.log("VPN SERVER RESPONDED, CONNECTING...")

        client_config.addPeer({
            publicKey: data.svr_pub_key,
            allowedIps: [ "0.0.0.0/0" ],
            endpoint: `${data.server_endpoint}:51820`
        });

        client_config.wgInterface.address = [`192.168.69.${data.client_number+1 ?? '2'}/24`]
        client_config.writeToFile();
        
        // exec("wire").on("message", (e) => {
        //     console.log(e);
        // })

        // const ex = child_process.spawnSync("wg", ["setconf", "wg0", "./wg0.conf"]).output;
        // console.log(ex.toString());

        // const ex = child_process.spawnSync("runas", [ "/user:Administrator", `"wireguard /installtunnelservice ${filePath}"` ], {
        //     shell: true
        // }).output;
        // console.log(ex.toString(), filePath);

        sudo.exec(`wireguard /installtunnelservice ${filePath}`, {
            name: "Reseda Wireguard"
        }, (e, out, err) => {
            if(err) throw err;
            console.log(e, out);
        });

        res.status(200).json({
            config: client_config.toJson(),
            as_string: client_config.toString(),
            conn_id: EVT_ID,
            connected: true
        });

        console.log("[CONN] >> Received! Connecting...");
        connected = true;

        return () => supabase.removeAllSubscriptions();
    }).subscribe();

    supabase
        .from('open_connections')
        .insert({
            server: "singapore-1",
            client_pub_key: client_config.publicKey?.substring(1),
            author: supabase.auth.user()?.id
        }).then(e => {
            console.log("[CONN] >> Published Configuration, Awaiting Response");
            EVT_ID = e?.data?.[0]?.id;
        });
}