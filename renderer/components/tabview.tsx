import moment from 'moment';
import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { supabase } from '../client';
import { connect, disconnect, ResedaConnection } from '../reseda-api';
import styles from '../styles/Home.module.css'
import Button from "./un-ui/button"
import { CornerDownRight, Link, Loader } from 'react-feather';

type Server = {
    id: string,
    created_at: string,
    uptime: any,
    location: string,
    country: string,
    virtual: boolean,
    hostname: string
};

const TabView: NextPage<{ connectionCallback: Function, tab: "servers" | "multi-hop" | "settings", connection: ResedaConnection }> = ({ connectionCallback, tab, connection }) => {
    const [ serverRegistry, setServerRegistry ] = useState<Server[]>();
    const [ fetching, setFetching ] = useState<boolean>(true);

    useEffect(() => {
        supabase
            .from('server_registry')
            .select("*")
            .then(e => {
                setServerRegistry(e.data);
                setFetching(false);
            });

        const subscription = supabase
            .from('server_registry')
            .on('*', (e) => {
                console.log(e);
                console.log(e.eventType);
                // setServerRegistry(e.new)
            })
            .subscribe();

        return () => {
            subscription.unsubscribe()
        }
    }, []);

    useEffect(() => {
        console.log(connection);
    }, [connection])

	return (
		<div className={styles.resedaContentCenter}>
            <div>
                <h4>{tab.toUpperCase()}</h4>

                {
                    (() => {
                        switch(tab) {
                            case "servers":
                                return (
                                    serverRegistry?.length > 0
                                    ? serverRegistry?.map(e => {
                                        return (
                                            <div 
                                            key={e.id}
                                            className={connection?.server == e.id && connection.connected ? styles.resedaServerConnected : (connection?.server == e.id && !connection.connected) ? styles.resedaServerConnecting : styles.resedaServer}
                                            onClick={() => {
                                                if(connection?.connected) {
                                                    disconnect(connection.connection_id, connectionCallback).then(() => {
                                                        connect(e.id, connectionCallback)
                                                    })
                                                }else {
                                                    connect(e.id, connectionCallback)
                                                }
                                            }}>
                                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: "center", gap: ".6rem" }}>
                                                    <span style={{ height: '22px' }} className={`twa twa-${e.location.toLowerCase().replaceAll(" ", "-")}-flag`}></span>
                                                    <p>{ e.country }</p>
                                                </div>
                                                
                                                <p className={styles.mono}>{e.hostname}</p>
                                                {
                                                    connection?.server == e.id && connection.connected ? 
                                                        <Link size={16}></Link>
                                                    :
                                                        <div className={styles.mono}>Running for { moment.duration(new Date().getTime() - new Date(e.created_at).getTime()).humanize() }</div>
                                                }
                                                
                                                
                                            </div>
                                        )
                                    }) : (
                                        fetching ? 
                                            <div className={styles.loadingContent}>
                                                <Loader />
                                            </div>
                                        :
                                            <div>
                                                <p>No Servers</p>
                                            </div>
                                    )
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

            <div className={styles.resedaRightBoxes}>
                <div className={styles.resedaUsageBox}>
                    {/* <h2>Connection</h2> */}

                    <div className={styles.resedaFancyConnection}>
                        <div>
                            {
                                connection?.connected ? 
                                <span>
                                    <span>
                                        <span>
                                            R
                                        </span>
                                    </span>
                                </span>
                                :
                                <span>
                                    <span style={{ borderColor: 'rgba(255, 255, 255, 0.158)' }}>
                                        <span style={{ borderColor: 'rgba(255, 255, 255, 0.158)', color: 'rgba(255, 255, 255, 0.158)'}}>
                                            R
                                        </span>
                                    </span>
                                </span>
                            }
                        </div>

                        {
                            (() => {
                                switch(connection?.connection) {
                                    case 0:
                                        return <p>Not Connected</p>
                                    case 1:
                                        return (
                                            <div>
                                                <h2>Connected</h2>
                                                <p style={{ opacity: 0.2 }} className={styles.mono}>{connection?.server}</p>
                                            </div>
                                        )
                                    case 2:
                                        return <p>Connecting...</p>
                                    default:
                                        return <p>Not Connected</p>
                                }
                            })()
                        }

                        
                    </div>

                    <Button disabled={!connection.connected} icon={false} onClick={() => {
                        disconnect(connection.connection_id, connectionCallback);
                    }}>Disconnect</Button>
                </div>
            </div>
        </div>
	)
}

export default TabView
