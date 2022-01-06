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
import PlatformControls from '../components/platform_controls'
import { ipcRenderer } from 'electron'

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
	const [ status, setStatus ] = useState<"disconnected" | "connected">("connected");
	const [ maximized, setMaximized ] = useState<"maximized" | "unmaximized">("unmaximized");

	const [ actionTime, setActionTime ] = useState<number>();
	const [ connection, setConnection ] = useState<ResedaConnection>();
    const [ currentTab, setCurrentTab ] = useState<"servers" | "multi-hop" | "settings">("servers");

	return (
		<div className={styles.container}>
			{
				platform() !== "darwin" ?
				<div className={styles.resedaFrame}>
					<div>
						Reseda VPN
					</div>

					<PlatformControls 
						onClose={() => ipcRenderer.send("close")}
						onMinimize={() => ipcRenderer.send("close")}	
						onMaximize={() => {
							ipcRenderer.send(maximized == "maximized" ? "unmaximize" : "maximize");
						 	setMaximized(maximized == "maximized" ? "unmaximized" : "maximized")
						}}
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
						<div>Reseda</div>
					</div>

					<div>
						<div className={styles.resedaTabBar}>
							<div onClick={() => setCurrentTab("servers")}>Servers</div>
							<div onClick={() => setCurrentTab("multi-hop")}>Multi-Hop</div>
							<div onClick={() => setCurrentTab("settings")}>Settings</div>
						</div>
					</div>
				</div>

				<div>
					{/* Body */}
					<TabView connectionCallback={setConnection} tab={currentTab} />
				</div>
			</div>

			<div className={styles.resedaBottom}>
				{/* Bottom Viewport (Small) */}

				<div>
					<div className={status == "connected" ? styles.connected : styles.disconnected}>
						{/* <div className={styles.connectionStatus}></div> */}
						<h4>{status == "connected" ? "CONNECTED" : "DISCONNECTED"}</h4>
					</div>
					
					<p>{connection?.location?.toUpperCase() ?? "Singapore"}</p>
					<h6>{connection?.server ?? "singapore-1"}</h6>
				</div>

				<div>
					{
						status == "connected" ? 
						<Button onClick={() => disconnect(connection.connection_id)}>Disconnect</Button>
						:
						<></>
					}
				</div>
			</div>
		</div>
	)
}

export default Home
