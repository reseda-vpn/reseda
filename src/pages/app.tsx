import styles from '@styles/app.module.css'
import TabView from '@components/tabview'
import WireGuard from '@root/reseda'
import publicIp from "public-ip"

import { useEffect, useState } from 'react'
import type { NextPage } from 'next'

const Home: NextPage = () => {
    const [ session, setSession ] = useState(null);
    const [ config, setConfig ] = useState<WireGuard>(null);

    const [ currentTab, setCurrentTab ] = useState<"servers" | "settings">("servers");
	const [ ip, setIP ] = useState(null); 
    const [ filePath, setFilePath ] = useState(null);

    useEffect(() => {
        const sesh = JSON.parse(localStorage.getItem("reseda.safeguard"));
        setSession(sesh);

        publicIp.v4().then(e => {
			setIP(e);
		});

        if(typeof navigator !== 'undefined') {
            (async () => {
                const { appDir } = await import('@tauri-apps/api/path');
                setFilePath(await appDir() + "lib\\wg0.conf");

                const _config = new WireGuard(await appDir() + "lib\\wg0.conf", sesh)
                
                fetch('https://reseda.app/api/server/list', {
                    method: "GET",
                    redirect: 'follow'
                })
                    .then(async e => {
                        const json = await e.json();
                        _config.setRegistry(json);
                        _config.setFetching(false);
                        _config.resumeConnection();

                        console.log(_config);

                        setConfig(_config);
                    })
                    .catch(e => {
                        console.log(e)
                    })
            })();
        }
    }, [])

	return (
            <div className={styles.container}>                
                <div className={styles.resedaCenter}>
                    <div className={styles.resedaHeader}>
                        <div>
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
                    <div className="flex-1 flex flex-row items-center gap-4 w-full">
                        <div className={config?.state.connection ? styles.connected : styles.disconnected}>
                            <h4 className=" font-sans font-extrabold" style={{ fontSize: '0.9rem' }}>{config?.state.connection.connection_type == 1 ? "CONNECTED" : config?.state.connection.connection_type == 2 ? "CONNECTING" : "DISCONNECTED"}</h4>
                        </div>
                        
                        <p>{config?.state.connection.location?.country ?? ""}</p>
                        <h6 className="font-mono opacity-40">{config?.state.connection?.server ?? ip }</h6>
                    </div>

                    <div className="w-fit opacity-80" style={{ fontSize: '0.88rem' }}> { session?.email } </div>
                </div>
            </div>
    )
}

export default Home
