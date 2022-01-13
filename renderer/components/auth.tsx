import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { supabase } from '@root/client'
import TabView from '@components/tabview'
import { connect, disconnect, ResedaConnection } from '@root/reseda-api'
import styles from '@styles/Home.module.css'
import { platform } from 'os'
import ip from "ip"
import PlatformControls from '../components/platform_controls'

const fetcher = (url, token) =>
  fetch(url, {
    method: 'GET',
    headers: new Headers({ 'Content-Type': 'application/json', token }),
    credentials: 'same-origin',
  }).then((res) => res.json())

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

const Auth: NextPage = () => {
	const [ maximized, setMaximized ] = useState<"maximized" | "unmaximized">("unmaximized");
	const [ actionTime, setActionTime ] = useState<number>();
	const [ connection, setConnection ] = useState<ResedaConnection>({
		protocol: "wireguard",
		config: null,
		as_string: "",
		connection_id: null,
		connected: false,
		connection: 0,
		location: null,
		server: null
	});
    const [ currentTab, setCurrentTab ] = useState<"servers" | "multi-hop" | "settings">("servers");

	useEffect(() => {
		const session = supabase.auth.session()

		fetcher('/api/getUser', session?.access_token ?? "x").then(e => {
			console.log(e);
		});
	}, []);

	return (
		<div className={styles.container}>
			{
				platform() !== "darwin" ?
				<div className={styles.resedaFrame}>
					<div>
						Reseda VPN
					</div>

					<PlatformControls 
						// onClose={() => remote.getCurrentWindow().close()}
						// onMinimize={() => remote.getCurrentWindow().minimize()}	
						// onMaximize={() => {
						// 	maximized == "maximized" ? remote.getCurrentWindow().unmaximize() : remote.getCurrentWindow().maximize();
						//  	setMaximized(maximized == "maximized" ? "unmaximized" : "maximized")
						// }}
					/>
				</div>
				:
				<></>
			}
			

			<div className={styles.resedaCenter}>
				<div>
					<h1>Reseda</h1>
                </div>
            </div>
		</div>
	)
}

export default Auth
