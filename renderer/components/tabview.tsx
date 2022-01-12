import moment from 'moment';
import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { supabase } from '../client';
import { connect, disconnect, ResedaConnection } from '../reseda-api';
import styles from '../styles/Home.module.css'
import Button from "./un-ui/button"
import { CornerDownRight, Link, Loader } from 'react-feather';
import { useDate } from './useDate';

export type Server = {
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
    const [ connectionTime, setConnectionTime ] = useState(null);
    const { today } = useDate();

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
                                                if(connection?.server == e.id) return;

                                                if(connection?.connected) {
                                                    disconnect(connection.connection_id, connectionCallback).then(() => {
                                                        connect(e, setConnectionTime, connectionCallback)
                                                    })
                                                }else {
                                                    connect(e, setConnectionTime, connectionCallback)
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
                                (() => {
                                    switch(connection?.connection) {
                                        case 0:
                                            return (
                                                <span style={{ animation: 'none'  }}>
                                                    <span style={{ borderColor: 'rgba(255, 255, 255, 0.158)', animation: 'none' }}>
                                                        <span style={{ borderColor: 'rgba(255, 255, 255, 0.158)', color: 'rgba(255, 255, 255, 0.25)', background: 'none', backgroundColor: 'rgba(255,255,255,0.1' }}>
                                                            R
                                                        </span>
                                                    </span>
                                                </span>
                                            )
                                        case 1:
                                            return (
                                                <span style={{ animation: 'none'  }} >
                                                    <span style={{ animation: 'none'  }} >
                                                        <span style={{ backgroundSize: '400%', animationDuration: '10s' }} >
                                                            {
                                                                connection.location ?
                                                                <span style={{  filter: 'drop-shadow( 0px 0px 6px rgba(18, 24, 41, .5))' }} className={`twa twa-${connection.location.country.toLowerCase().replaceAll(" ", "-")}-flag`}></span>
                                                                :
                                                                "R"
                                                            }
                                                        </span>
                                                    </span>
                                                </span>
                                            )
                                        case 2:
                                            return (
                                                <span>
                                                    <span style={{ borderColor: 'rgba(255, 255, 255, 0.158)' }}>
                                                        <div></div>

                                                        <span style={{ borderColor: 'rgba(255, 255, 255, 0.158)', color: 'rgba(255, 255, 255, 0.25)'}}>
                                                            R
                                                        </span>
                                                    </span>
                                                </span>
                                            )
                                        case 3:
                                            return (
                                                <span>
                                                    <span style={{ borderColor: 'rgba(255, 255, 255, 0.158)' }}>
                                                        <div style={{ animationDuration: '15s', animationTimingFunction: 'linear' }}></div>

                                                        <span style={{ borderColor: 'rgba(255, 255, 255, 0.158)', color: 'rgba(255, 255, 255, 0.25)', background: 'linear-gradient(45deg, rgba(213,109,97,1) 0%, rgba(232,82,62,1) 33%, rgba(213,109,97,1) 66%, rgba(232,82,62,1) 100%)', backgroundSize: '400%'}}>
                                                            R
                                                        </span>
                                                    </span>
                                                </span>
                                            )
                                        default:
                                            return (
                                                <span>
                                                    <span style={{ borderColor: 'rgba(255, 255, 255, 0.158)' }}>
                                                        <span style={{ borderColor: 'rgba(255, 255, 255, 0.158)', color: 'rgba(255, 255, 255, 0.25)', background: 'none'}}>
                                                            R
                                                        </span>
                                                    </span>
                                                </span>
                                            )
                                    }
                                })()
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
                                                <p>Connected</p>
                                                <h2>{connectionTime > 0 ? moment.utc(moment(today.getTime()).diff(moment(connectionTime))).format("HH:mm:ss") : "..."}</h2>
                                                <p style={{ opacity: 0.6 }} className={styles.mono}>{connection?.location?.hostname}</p>
                                                {/* <p style={{ opacity: 0.2 }} className={styles.mono}>{connection?.server}</p> */}
                                            </div>
                                        )
                                    case 2:
                                        return <p>Connecting...</p>
                                    case 3:
                                        return (
                                            <div>
                                                <p>Connection Failed</p>
                                                <p style={{ opacity: 0.6 }} className={styles.mono}>{btoa(connection.as_string)}</p>
                                            </div>
                                        )
                                    default:
                                        return <p>Not Connected</p>
                                }
                            })()
                        }

                        
                    </div>
                    
                    {
                        (() => {
                            switch(connection?.connection) {
                                case 0:
                                    return <></>
                                case 1:
                                    return (
                                        <Button icon={false} onClick={() => {
                                            disconnect(connection.connection_id, connectionCallback);
                                        }}>Disconnect</Button>
                                    )
                                case 2:
                                    return (
                                        <Button icon={false} onClick={() => {
                                            disconnect(connection.connection_id, connectionCallback);
                                        }}>Cancel</Button>
                                    )
                                case 3:
                                    return (
                                        <Button icon={false} onClick={() => {
                                            disconnect(connection.connection_id, connectionCallback).then(e => {
                                                if(e?.location?.id) connect(connection.location, setConnectionTime, connectionCallback);
                                                else return;
                                            })
                                        }}>Retry</Button>
                                    )
                                default:
                                    return <></>
                            }
                        })()
                    }
                    
                </div>
            </div>
        </div>
	)
}

export default TabView
