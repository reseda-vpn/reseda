import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import TabView from '@components/tabview'
import { connect, disconnect, ResedaConnection, resumeConnection } from '../reseda-api'
import styles from '@styles/app.module.css'
import PlatformControls from '@components/platform_controls'
import { platform } from 'process';
import publicIp from "public-ip"
import Button from '@components/un-ui/button'

const Home: NextPage = () => {
	const [ maximized, setMaximized ] = useState<"maximized" | "unmaximized">("unmaximized");
	const [ actionTime, setActionTime ] = useState<number>();

    const [ isTauri, setIsTauri ] = useState(false);
    const [ session, setSession ] = useState(null);

    useEffect(() => {
        setSession(JSON.parse(localStorage.getItem("reseda.safeguard")));

        //@ts-expect-error
        setIsTauri(!!window.__TAURI_METADATA__);
    }, [])

	const showFrame = false;
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
		publicIp.v4().then(e => {
			setIP(e);
		});
	}, [])

	return isTauri ?
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
                            <h4 className=" font-sans font-extrabold" style={{ fontSize: '0.9rem' }}>{connection.connection == 1 ? "CONNECTED" : connection.connection == 2 ? "CONNECTING" : "DISCONNECTED"}</h4>
                        </div>
                        
                        <p>{connection?.location?.country ?? ""}</p>
                        <h6 className="font-mono opacity-40">{connection?.server ?? ip }</h6>
                    </div>

                    <div className="w-fit opacity-80" style={{ fontSize: '0.88rem' }}>
                        {
                            session?.email
                        }
                    </div>
                </div>
            </div>
            :
            <div className="flex flex-col items-center justify-center flex-1 h-screen w-screen">
                <p className="text-2xl font-bold font-sans">404</p>
                <p>We{"\'"}re not sure how you got here..</p>

                <br />
                <p className="text-center">If you think you{"\'"}re in the right place, <br /> you may need to download the reseda client to access this endpoint.</p> 
                <Button className="text-violet-500" href="./download">Download</Button>    
            </div>
}

export default Home
