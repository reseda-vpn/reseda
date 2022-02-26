import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import TabView from '@components/tabview'
import { connect, disconnect, ResedaConnection, resumeConnection } from '@root/reseda-api'
import styles from '@styles/Home.module.css'
import ip from "ip"
import PlatformControls from '../components/platform_controls'
import { platform } from 'process';
import publicIp from 'public-ip'
import { useSession } from 'next-auth/react'

const Home: NextPage = () => {
	const [ maximized, setMaximized ] = useState<"maximized" | "unmaximized">("unmaximized");
	const [ actionTime, setActionTime ] = useState<number>();

	const showFrame = false;
	const session = useSession();
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
    const [ currentTab, setCurrentTab ] = useState<"servers" | "settings">("servers");
	const [ ip, setIP ] = useState(null); 

	useEffect(() => {
		// resumeConnection(setConnection);

		publicIp.v4().then(e => {
			setIP(e);
		})
	}, [])

	console.log(session);

	return (
		<div className={styles.container}>
			{
				platform !== "darwin" && showFrame ?
				<div className={`bg-gray-900 ${styles.resedaFrame}`}>
					<div>
						Reseda VPN
					</div>

					<PlatformControls 
						// onClose={() => ipcRenderer.send('close')}
						// onMinimize={() => ipcRenderer.send('minimize')}	
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
						{/* <div className={styles.title}>R.</div> */}
						<div className={`font-bold uppercase relative after:content-['ALPHA'] text-slate-800 after:text-black after:absolute after:b-0 after:-right-10 after:-bottom-1 after:text-xs after:bg-clip-text after:bg-violet-600 select-none ${styles.reseda}`}>Reseda</div>
					</div>

					<div>
						<div className={styles.resedaTabBar}>
							<div onClick={() => setCurrentTab("servers")}>Servers</div>
							<div onClick={() => setCurrentTab("settings")}>Settings</div>
						</div>
					</div>
				</div>

				<div className={styles.resedaBody}>
					{/* Body */}
					<TabView connectionCallback={setConnection} tab={currentTab} connection={connection} />
				</div>
			</div>

			<div className="h-16 flex flex-row justify-between w-full bg-gray-900 items-center gap-4 px-4 py-4 text-xs m-0 text-slate-200 select-none">
				{/* Bottom Viewport (Small) */}

				<div className="flex-1 flex flex-row items-center gap-4 w-full">
					<div className={connection ? styles.connected : styles.disconnected}>
						{/* <div className={styles.connectionStatus}></div> */}
						<h4 className=" font-sans font-extrabold" style={{ fontSize: '0.9rem' }}>{connection.connection == 1 ? "CONNECTED" : connection.connection == 2 ? "CONNECTING" : "DISCONNECTED"}</h4>
					</div>
					
					<p>{connection?.location?.country ?? ""}</p>
					<h6 className="font-mono opacity-40">{connection?.server ?? ip }</h6>
				</div>

				<div className="w-fit opacity-80" style={{ fontSize: '0.88rem' }}>
					{
						session?.data?.user?.email
					}
				</div>
			</div>
		</div>
	)
}

export default Home
