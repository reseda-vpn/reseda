import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { supabase } from '../client';
import { connect } from '../reseda-api';
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

const TabView: NextPage<{ connectionCallback: Function }> = ({ connectionCallback }) => {
    const [ currentTab, setCurrentTab ] = useState("servers");
    const [ serverRegistry, setServerRegistry ] = useState<Server[]>();

    useEffect(() => {
        supabase
            .from('server_registry')
            .select("*")
            .then(e => {
                setServerRegistry(e.data)
            });

        const subscription = supabase
            .from('server_registry')
            .on('*', (e) => {
                setServerRegistry(e.new)
            })
            .subscribe();

        return () => {
            subscription.unsubscribe()
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
                                        {
                                            serverRegistry?.map(e => {
                                                return (
                                                    <div onClick={() => {
                                                        connect(e.id).then((conn) => {
                                                            connectionCallback({
                                                                ...conn,
                                                                location: e.location
                                                            })
                                                        });
                                                    }}>{e.location}</div>
                                                )
                                            })
                                        }
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
