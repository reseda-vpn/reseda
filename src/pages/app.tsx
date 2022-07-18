import styles from '@styles/app.module.css'
import TabView from '@components/tabview'
import WireGuard from '@root/reseda'
import publicIp from "public-ip"

import { createContext, useEffect, useState } from 'react'
import type { NextPage } from 'next'
import Loader from '@components/un-ui/loader'
import { Check } from 'react-feather'
import UsageGraph from '@components/usage_graph'
import WireguardContext from '@root/lib/state'

const Home: NextPage = () => {
    const [ session, setSession ] = useState(null);
    const [ config, setConfig ] = useState<WireGuard>(null);

    const [ currentTab, setCurrentTab ] = useState<"servers" | "settings">("servers");
    const [ time, setTime ] = useState(null); 

    useEffect(() => {
        const sesh = JSON.parse(localStorage.getItem("reseda.safeguard"));
        setSession(sesh);

        if(typeof navigator !== 'undefined') {
            (async () => {
                const { appDir } = await import('@tauri-apps/api/path');
                const _config = new WireGuard({ file_path: await appDir() + "lib\\wg0.conf",user: sesh })
                
                fetch('https://reseda.app/api/server/list', {
                    method: "GET",
                    redirect: 'follow'
                })
                    .then(async e => {
                        const json = await e.json();

                        _config.setRegistry(json);
                        _config.setFetching(false);
                        _config.resumeConnection((config: WireGuard) => {
                            setConfig(config);
                        });
                    })
                    .catch(e => {
                        console.log(e)
                    })
            })();
        }
    }, [])

	return (
        <WireguardContext.Provider value={config}>
            <div className="flex flex-col flex-1 h-screen bg-black text-white">
                <div className="flex flex-col h-56">
                    {/* Idk whats gonna go here... */}
                </div>

                <div className="flex flex-col gap-2 px-2 flex-1">
                    {
                        (() => {
                            switch(config?.state?.connection?.connection_type) {
                                case 0: 
                                    return (
                                        <div>   
                                            {/* { JSON.stringify(config?.state?.connection) } */}
                                        </div>
                                    )
                                case 1:
                                    return (
                                        <div 
                                            className="rounded-lg bg-slate-700 flex flex-row items-center gap-4 px-4 py-3"
                                            >
                                            <div className="flex flex-row items-center aspect-square rounded-full bg-blue-500 p-1">
                                                <Check color={"#fff"} height={22}></Check>
                                            </div>

                                            <div className="flex flex-col">
                                                <h1 className="font-mono">{config?.state?.connection?.location?.country} </h1>
                                                <p className="font-normal font-mono opacity-60 text-sm">
                                                    {
                                                        config?.state?.connection?.location?.id?.split("-").filter((e,i) => {
                                                            return i <= 1
                                                        }).join("-")
                                                    }
                                                </p>
                                                {/* <p className="opacity-50">IP Address: {config?.state?.connection?.location?.hostname}</p> */}
                                            </div>
                                        </div>
                                    )
                                case 2: 
                                    return (
                                        <div className="rounded-lg bg-slate-700 flex flex-row items-center gap-4 px-4 py-3">
                                            <div className="flex flex-row items-center aspect-square rounded-full bg-blue-500 justify-center p-1">
                                                <Loader color={"#fff"} height={22}></Loader>
                                            </div>

                                            <div className="flex flex-col">
                                                <h1 className="font-mono">Connecting</h1>
                                                <p className="opacity-50">...</p>
                                            </div>
                                        </div>
                                    )
                                case 3: 
                                    return (
                                        <div className="rounded-lg bg-red-300 flex flex-row items-center gap-4 px-4 py-3">
                                            <div className="flex flex-row items-center aspect-square rounded-full bg-blue-500 justify-center p-1">
                                                <Loader color={"#fff"} height={22}></Loader>
                                            </div>

                                            <div className="flex flex-col">
                                                <h1 className="font-mono">Connecting</h1>
                                                <p className="opacity-50">...</p>
                                            </div>
                                        </div>
                                    )
                                case 4: 
                                    return (
                                        <div className="rounded-lg bg-slate-700 flex flex-row items-center gap-4 px-4 py-3">
                                            <div className="flex flex-row items-center aspect-square rounded-full bg-blue-500 justify-center p-1">
                                                <Loader color={"#fff"} height={22}></Loader>
                                            </div>

                                            <div className="flex flex-col">
                                                <h1 className="font-mono">Disconnecting</h1>
                                                <p className="opacity-50">...</p>
                                            </div>
                                        </div>
                                    )
                                case 5: 
                                    return (
                                        <div className="rounded-lg bg-slate-700 flex flex-row items-center gap-4 px-4 py-3">
                                            <div className="flex flex-row items-center aspect-square rounded-full bg-blue-500 justify-center p-1">
                                                <Loader color={"#fff"} height={22}></Loader>
                                            </div>

                                            <div className="flex flex-col">
                                                <h1 className="font-mono">Finalizing</h1>
                                                <p className="opacity-50">...</p>
                                            </div>
                                        </div>
                                    )
                                default:
                                    return (
                                        <div>   
                                            { JSON.stringify(config?.state?.connection) }
                                        </div>
                                    )
                            }
                        })()
                    }
                    
                    <div className="rounded-t-lg flex flex-col gap-4 bg-white text-slate-800 flex-1 p-2">
                        {
                            config?.state?.connection?.connected ?
                            <div className="p-1 flex flex-col gap-2 flex-1 h-full">
                                <div className="rounded-lg bg-slate-700 flex flex-row items-center gap-4 px-4 py-3 text-white font-bold">
                                    <a href="#" onClick={() => {
                                        config.disconnect()
                                    }}>Disconnect</a>
                                </div>

                                <div className="flex flex-row items-center flex-1">
                                    <div className="flex flex-1">
                                        <UsageGraph ekey={"down"} />
                                        {/* Graph for Down Information */}
                                    </div>
                                    <div className="flex flex-1">
                                        <UsageGraph ekey={"up"} />
                                        {/* Graph for Up Information */}
                                    </div>
                                </div>
                            </div>
                            :
                            <div className="p-1 flex flex-col gap-2 flex-1 h-full">
                                {
                                    config?.registry?.map(e => 
                                        <div 
                                            key={`server-${e.id}`}
                                            className="flex flex-row justify-between items-center p-2 rounded-lg bg-[#eaeaec] text-slate-700 font-semibold font-sans cursor-pointer"
                                            onClick={() => {
                                                config.connect(e, setTime)
                                            }}
                                        >
                                            <div className="flex flex-row items-center gap-2">
                                                <span style={{ height: '22px' }} className={`twa-lg twa-${e.flag}`}></span>
                                                <p>{ e.country }</p>
                                            </div>

                                            <div></div>
                                        </div>
                                    )
                                }
                            </div>
                        }

                        <div className="flex flex-row items-center">
                            <p>Reseda FREE</p>
                            <p>{config?.user?.user?.email}</p>
                        </div>
                    </div>
                </div>

            </div>
        </WireguardContext.Provider>
    )
}

export default Home
