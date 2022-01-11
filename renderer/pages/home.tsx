import type { NextPage } from 'next'
import { useState } from 'react'
import { Settings } from 'react-feather'
import { exec } from 'sudo-prompt'
import { supabase } from '../client'
import TabView from '../components/tabview'
import { connect, disconnect, ResedaConnection } from '../reseda-api'
import styles from '../styles/Home.module.css'
import Button from '../components/un-ui/button'
import { platform } from 'os'
import ip from "ip"
import PlatformControls from '../components/platform_controls'
// const remote = require('@electron/remote')

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

const Home: NextPage = () => {
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

	// console.log(remote)

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
				<div className={styles.resedaHeader}>
					{/* Header - Title */}
					<div>
						<div className={styles.title}>R.</div>
						<div className={styles.reseda}>Reseda</div>
					</div>

					<div>
						<div className={styles.resedaTabBar}>
							<div onClick={() => setCurrentTab("servers")}>Servers</div>
							<div onClick={() => setCurrentTab("multi-hop")}>Multi-Hop</div>
							<div onClick={() => setCurrentTab("settings")}>Settings</div>
						</div>
					</div>
				</div>

				<div className={styles.resedaBody}>
					{/* Body */}
					<TabView connectionCallback={setConnection} tab={currentTab} connection={connection} />
				</div>
			</div>

			<div className={styles.resedaBottom}>
				{/* Bottom Viewport (Small) */}

				<div>
					<div className={connection ? styles.connected : styles.disconnected}>
						{/* <div className={styles.connectionStatus}></div> */}
						<h4>{connection.connection == 1 ? "CONNECTED" : connection.connection == 2 ? "CONNECTING" : "DISCONNECTED"}</h4>
					</div>
					
					<p>{connection?.location ?? ""}</p>
					<h6>{connection?.server ?? ip.address("public") }</h6>
				</div>

				<div>
					{
						connection ? 
						<></>
						// <Button onClick={() => disconnect(connection.connection_id).then(e => setConnection(null))}>Disconnect</Button>
						:
						<></>
					}
				</div>
			</div>
		</div>
	)
}

export default Home
