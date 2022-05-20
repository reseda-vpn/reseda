import moment from 'moment';
import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { connect, disconnect, disconnect_pure, ResedaConnection, resumeConnection } from '../reseda-api';
import styles from '../styles/Home.module.css'
import Button from "./un-ui/button"
import { CornerDownRight, Link, Loader } from 'react-feather';
import { useDate } from './useDate';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import bgImage from "../public/images/reseda_bg.svg"

export type Server = {
    id: string,
    serverUp: string,
    location: string,
    country: string,
    virtual: boolean,
    hostname: string,
    flag: string
};

const TabView: NextPage<{ connectionCallback: Function, tab: "servers" | "settings", connection: ResedaConnection }> = ({ connectionCallback, tab, connection }) => {
    const [ serverRegistry, setServerRegistry ] = useState<Server[]>();
    const [ fetching, setFetching ] = useState<boolean>(true);
    const [ connectionTime, setConnectionTime ] = useState(null);
    const { today } = useDate();

    const [ session, setSession ] = useState(null);
    // const session = useSession();

    useEffect(() => {
        const sess = JSON.parse(localStorage.getItem("reseda.safeguard"));
        setSession(sess);

        fetch('https://reseda.app/api/server/list', {
            method: "GET",
            redirect: 'follow'
        })
            .then(async e => {
                const json = await e.json();
                setServerRegistry(json);
                setFetching(false);
                resumeConnection(connectionCallback, setConnectionTime, json, sess);
            })
            .catch(e => {
                console.log(e)
            })
    }, []);

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
                                            className={connection?.server == e.id && connection.connected ? `bg-gray-900 ${styles.resedaServerConnected}` : (connection?.server == e.id && !connection.connected) ? styles.resedaServerConnecting : styles.resedaServer}
                                            onClick={() => {
                                                if(connection?.server == e.id) return;

                                                if(connection?.connected) {
                                                    disconnect(connection, connectionCallback, session).then(() => {
                                                        connect(e, setConnectionTime, connectionCallback, session)
                                                    })
                                                }else {
                                                    connect(e, setConnectionTime, connectionCallback, session)
                                                }
                                            }}>
                                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: "center", gap: ".6rem" }}>
                                                    <span style={{ height: '22px' }} className={`twa twa-${e.flag}`}></span>
                                                    <p>{ e.country }</p>
                                                </div>
                                                
                                                <p className={styles.mono}>{e.hostname}</p>
                                                {
                                                    connection?.server == e.id && connection.connection == 1 ?
                                                        <div className='flex flex-row items-center gap-4'>
                                                            <p className={styles.mono}>Connected</p>
                                                            <Link size={16}></Link>
                                                        </div> 
                                                    :
                                                        <div className={styles.mono}>
                                                            Running for { moment.duration(new Date().getTime() - new Date(e.serverUp).getTime()).humanize() }
                                                        </div>
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
                            case "settings":
                                return (
                                    <div className={styles.settings}>
                                        <div>
                                            <h4>Protocol</h4>
                                            <p>Wireguard</p>
                                        </div>

                                        <div style={{ backgroundColor: 'transparent', justifyContent: 'space-around' }}>
                                            <Button className="text-black" onClick={() => { disconnect_pure(connection, connectionCallback, session)} }>Uninstall Service</Button>

                                            <Button className="text-black" onClick={() => { disconnect(connection, connectionCallback, session)} }>Force Disconnect</Button>
                                        </div>
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
                <div className={`bg-gray-900 ${styles.resedaUsageBox} relative`}>
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
                                                        <span style={{ borderColor: 'rgba(255, 255, 255, 0.158)', color: 'rgba(255, 255, 255, 0.25)', background: 'none', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                                                            R
                                                        </span>
                                                    </span>
                                                </span>
                                            )
                                        case 1:
                                            return (
                                                <span className={styles.connectedToServerOuter}>
                                                    <span className={styles.connectedToServerInner}>
                                                        <span style={{ backgroundSize: '400%', animationDuration: '10s' }} >
                                                            {
                                                                connection.location ?
                                                                <span style={{  filter: 'drop-shadow( 0px 0px 6px rgba(18, 24, 41, .5))', height: '150px', width: '150px' }} className={`twa twa-${connection.location.flag}`}></span>
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
                                        case 4: 
                                            return (
                                                <span>
                                                    <span style={{ borderColor: 'rgba(255, 255, 255, 0.158)' }}>
                                                        <div className={styles.rev}></div>

                                                        <span style={{ borderColor: 'rgba(255, 255, 255, 0.158)', color: 'rgba(255, 255, 255, 0.25)'}}>
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
                                                <p style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>{ connection?.location?.country } <i className={styles.mono} style={{ opacity: 0.6 }}>{connection?.location?.id}</i>  </p>
                                                <h2 className="font-mono font-bold text-base">{connectionTime > 0 ? moment.utc(moment(today.getTime()).diff(moment(connectionTime))).format("HH:mm:ss") : "..."}</h2>
                                                <p style={{ opacity: 0.6 }} className={styles.mono}>{connection?.location?.hostname}</p>
                                                {/* <p style={{ opacity: 0.2 }} className={styles.mono}>{connection?.server}</p> */}
                                            </div>
                                        )
                                    case 2:
                                        return <p>{ connection?.message ?? "Connecting..." }</p>
                                    case 3:
                                        return (
                                            <div>
                                                <p>Connection Failed</p>
                                                <p style={{ opacity: 0.6, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }} className={styles.mono}>{btoa(connection.as_string)}</p>
                                            </div>
                                        )
                                    case 4:
                                        return <p>{ "Disconnecting..." }</p>
                                    case 5:
                                        return <p>{ "Finishing..."}</p>
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
                                    return (
                                        <Button style={{ flexGrow: 0, height: 'fit-content', width: '100%', backgroundColor: '#fff', padding: '.4rem 1rem', color: "#000", fontWeight: '600', fontFamily: "GT Walsheim Pro" }}  icon={false} onClick={() => {
                                            disconnect(connection, connectionCallback, session);
                                        }}>Connect to {"Singapore"}</Button>
                                    )
                                case 1:
                                    return (
                                        <Button style={{ flexGrow: 0, height: 'fit-content', width: '100%', backgroundColor: '#fff', padding: '.4rem 1rem', color: "#000", fontWeight: '600', fontFamily: "GT Walsheim Pro" }}  icon={false} onClick={() => {
                                            disconnect(connection, connectionCallback, session);
                                        }}>Disconnect</Button>
                                    )
                                case 2:
                                    return (
                                        <Button style={{ flexGrow: 0, height: 'fit-content', width: '100%', backgroundColor: '#fff', padding: '.4rem 1rem', color: "#000", fontWeight: '600', fontFamily: "GT Walsheim Pro" }} icon={false} onClick={() => {
                                            disconnect(connection, connectionCallback, session);
                                        }}>Cancel</Button>
                                    )
                                case 3:
                                    return (
                                        <Button style={{ flexGrow: 0, height: 'fit-content', width: '100%', backgroundColor: '#fff', padding: '.4rem 1rem', color: "#000", fontWeight: '600', fontFamily: "GT Walsheim Pro" }} icon={false} onClick={() => {
                                            disconnect(connection, connectionCallback, session).then(e => {
                                                if(e?.location?.id) connect(connection.location, setConnectionTime, connectionCallback, session);
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
