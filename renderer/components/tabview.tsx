import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { supabase } from '../client';
import styles from '../styles/Home.module.css'

type Server = {
    id: string,
    created_at: string,
    uptime: any,
    location: string,
    country: string,
    virtual: boolean,
    hostname: string
};

const TabView: NextPage = () => {
    const [ currentTab, setCurrentTab ] = useState("servers");
    const [ serverRegistry, setServerRegistry ] = useState<Server[]>();

    useEffect(() => {
        supabase
            .from('server_registry')
            .select("*")
            .then(e => {
                setServerRegistry(e.data)
            });

        return () => {
            
        }
    }, []);

	return (
		<div className={styles.resedaContentCenter}>
            <div className={styles.resedaTabBar}>
                <div onClick={() => setCurrentTab("servers")}>Servers</div>
                <div onClick={() => setCurrentTab("multi-hop")}>Multi-Hop</div>
                <div onClick={() => setCurrentTab("settings")}>Settings</div>
            </div>

            <div>
                {
                    (() => {
                        switch(currentTab) {
                            case "servers":
                                return (
                                    <div>
                                        <h1>servers!</h1>
                                    </div>
                                )

                                break;
                            case "multi-hop":
                                break;
                            case "settings":
                                break;
                            default: 
                                break;
                        }
                    })()
                }
            </div>
        </div>
	)
}

export default TabView
