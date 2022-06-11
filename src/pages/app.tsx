import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import TabView from '@components/tabview'
import { connect, disconnect, ResedaConnection, resumeConnection } from '../reseda-api'
import styles from '@styles/app.module.css'
import PlatformControls from '@components/platform_controls'
import { platform } from 'process';
import publicIp from "public-ip"
import Button from '@components/un-ui/button'
import WireGuard from '@root/reseda'

const Home: NextPage = () => {
    const [ session, setSession ] = useState(null);
    const [ config, setConfig ] = useState<WireGuard>(null);

    const [ currentTab, setCurrentTab ] = useState<"servers" | "settings">("servers");
	const [ ip, setIP ] = useState(null); 
    const [ filePath, setFilePath ] = useState(null);

    useEffect(() => {
        setSession(JSON.parse(localStorage.getItem("reseda.safeguard")));

        publicIp.v4().then(e => {
			setIP(e);
		});

        if(typeof navigator !== 'undefined') {
            (async () => {
                const { appDir } = await import('@tauri-apps/api/path');
                setFilePath(await appDir() + "lib\\wg0.conf");
            })();
        }

        setConfig(new WireGuard(filePath, session));

        fetch('https://reseda.app/api/server/list', {
            method: "GET",
            redirect: 'follow'
        })
            .then(async e => {
                const json = await e.json();
                config.setRegistry(json);
                config.setFetching(false);
                config.resumeConnection();
            })
            .catch(e => {
                console.log(e)
            })
    }, [])

	return (
            <div className={styles.container}>
                {
                    platform !== "darwin" ?
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
                        <TabView configuration={config} tab={currentTab} />
                    </div>
                </div>

                <div className="h-16 flex flex-row justify-between w-full bg-gray-900 items-center gap-4 px-4 py-4 text-xs m-0 text-slate-200 select-none">
                    {/* Bottom Viewport (Small) */}

                    <div className="flex-1 flex flex-row items-center gap-4 w-full">
                        <div className={config.state.connection ? styles.connected : styles.disconnected}>
                            <h4 className=" font-sans font-extrabold" style={{ fontSize: '0.9rem' }}>{config.state.connection.connection_type == 1 ? "CONNECTED" : config.state.connection.connection_type == 2 ? "CONNECTING" : "DISCONNECTED"}</h4>
                        </div>
                        
                        <p>{config.state.connection.location?.country ?? ""}</p>
                        <h6 className="font-mono opacity-40">{config.state.connection?.server ?? ip }</h6>
                    </div>

                    <div className="w-fit opacity-80" style={{ fontSize: '0.88rem' }}>
                        {
                            session?.email
                        }
                    </div>
                </div>
            </div>
    )
}

export default Home
