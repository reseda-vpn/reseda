import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../client'
import sudo from "sudo-prompt"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
    sudo.exec(`wireguard /uninstalltunnelservice wg0`, {
        name: "Reseda Wireguard"
    }, (_, __, err) => {
        if(err) throw err;

        supabase
            .from('open_connections')
            .delete()
            .match({
                id: req.query.id
            }).then(e => {
                res.status(200).json({
                    config: e.data,
                    as_string: JSON.stringify(e.data),
                    connected: false
                });
            });
    });
}