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

const TabView: NextPage<{ connectionCallback: Function, tab: "servers" | "multi-hop" | "settings" }> = ({ connectionCallback, tab }) => {
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
            <div>
                {
                    (() => {
                        switch(tab) {
                            case "servers":
                                return (
                                    serverRegistry?.length > 0
                                    ? serverRegistry?.map(e => {
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
                                    }) : (<div><p>No Servers</p></div>)
                                )

                                break;
                            case "multi-hop":
                                return (
                                    <div>
                                        <p>multi</p>
                                    </div>
                                )
                                break;
                            case "settings":
                                return (
                                    <div>
                                        <p>settings</p>
                                    </div>
                                )
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
