import styles from '../styles/Home.module.css'
import WireGuard, { getSize } from '@root/reseda'
import Button from "./un-ui/button"
import moment from 'moment'

import { ArrowDown, ArrowUp, Link, Loader, Upload } from 'react-feather'
import { useEffect, useState } from 'react'
import type { NextPage } from 'next'
import { useDate } from './useDate'

const TabView: NextPage<{ configuration: WireGuard, tab: "servers" | "settings" }> = ({ configuration, tab }) => {
    const [ connectionTime, setConnectionTime ] = useState(null);
    const { today } = useDate();

	return configuration ? (
		<div className={styles.resedaContentCenter}>
            <div>
                <h4>{tab.toUpperCase()}</h4>
                {
                    (() => {
                        switch(tab) {
                            case "servers":
                                return (
                                    configuration.getRegistry()?.length > 0
                                    ? configuration.getRegistry()?.map(e => {
                                        return (
                                            <div 
                                                key={e.id}
                                                className={configuration.state.connection.server == e.id && configuration.state.connection.connected ? `bg-gray-900 ${styles.resedaServerConnected}` : (configuration.state.connection.server == e.id && !configuration.state.connection.connected) ? styles.resedaServerConnecting : styles.resedaServer}
                                                onClick={() => {
                                                    if(configuration.state.connection.server == e.id) return;

                                                    if(configuration.state.connection.connected) {
                                                        configuration.disconnect().then(() => {
                                                            configuration.connect(e, setConnectionTime)
                                                        })
                                                    }else {
                                                        configuration.connect(e, setConnectionTime)
                                                    }
                                            }}>
                                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: "center", gap: ".6rem" }}>
                                                    <span style={{ height: '22px' }} className={`twa twa-${e.flag}`}></span>
                                                    <p>{ e.country }</p>
                                                </div>
                                                
                                                <p className={styles.mono}>{e.hostname}</p>
                                                {
                                                    configuration.state.connection.server == e.id && configuration.state.connection.connection_type == 1 ?
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
                                        configuration.state.fetching ? 
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
                                            <Button className="text-black" onClick={() => { configuration.uninstallService()} }>Uninstall Service</Button>

                                            <Button className="text-black" onClick={() => { configuration.disconnect()} }>Force Disconnect</Button>
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
                                    switch(configuration.state.connection.connection_type) {
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
                                                                configuration.state.connection.location ?
                                                                <span style={{  filter: 'drop-shadow( 0px 0px 6px rgba(18, 24, 41, .5))', height: '150px', width: '150px' }} className={`twa twa-${configuration.state.connection?.location?.flag}`}></span>
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
                                switch(configuration.state.connection?.connection_type) {
                                    case 0:
                                        return <p>Not Connected</p>
                                    case 1:
                                        return (
                                            <div className="flex flex-col">
                                                <p style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>{ configuration.state.connection?.location?.country } <i className={styles.mono} style={{ opacity: 0.6 }}>{configuration.state.connection?.location?.id}</i>  </p>
                                                <h2 className="font-mono font-bold text-base">{connectionTime > 0 ? moment.utc(moment(today.getTime()).diff(moment(connectionTime))).format("HH:mm:ss") : "..."}</h2>
                                            </div>
                                        )
                                    case 2:
                                        return <p>{ configuration.state.connection?.message ?? "Connecting..." }</p>
                                    case 3:
                                        return (
                                            <div className="flex flex-col">
                                                <p>Connection Failed</p>
                                                <p style={{ opacity: 0.6, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }} className={styles.mono}>{btoa(configuration.config.wg.toString())}</p>
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

                        {
                            (() => {
                                switch(configuration.state.connection?.connection_type) {
                                    case 0:
                                        return <></>;
                                    case 1:
                                        return (
                                            <div className="flex flex-row items-center gap-4">
                                                <div className="flex flex-row gap-2">
                                                    <p className="font-mono">{ getSize(configuration?.usage?.up) }</p>
                                                    <ArrowUp />
                                                </div>

                                                <div className="flex flex-row gap-2">
                                                    <ArrowDown />
                                                    <p className="font-mono">{ getSize(configuration?.usage?.down) }</p>
                                                </div>
                                            </div>
                                        )

                                    case 2:
                                        return <></>;
                                    case 3:
                                        return <></>;
                                    case 4:
                                        return <></>;
                                    case 5:
                                        return <></>;
                                }
                            })()
                        }
                    </div>

                    {
                        (() => {
                            switch(configuration.state.connection?.connection_type) {
                                case 0:
                                    return (
                                        <Button style={{ flexGrow: 0, height: 'fit-content', width: '100%', backgroundColor: '#fff', padding: '.4rem 1rem', color: "#000", fontWeight: '600', fontFamily: "GT Walsheim Pro" }}  icon={false} onClick={() => {
                                            configuration.disconnect();
                                        }}>Connect to {"Singapore"}</Button>
                                    )
                                case 1:
                                    return (
                                        <Button style={{ flexGrow: 0, height: 'fit-content', width: '100%', backgroundColor: '#fff', padding: '.4rem 1rem', color: "#000", fontWeight: '600', fontFamily: "GT Walsheim Pro" }}  icon={false} onClick={() => {
                                            configuration.disconnect();
                                        }}>Disconnect</Button>
                                    )
                                case 2:
                                    return (
                                        <Button style={{ flexGrow: 0, height: 'fit-content', width: '100%', backgroundColor: '#fff', padding: '.4rem 1rem', color: "#000", fontWeight: '600', fontFamily: "GT Walsheim Pro" }} icon={false} onClick={() => {
                                            configuration.disconnect();
                                        }}>Cancel</Button>
                                    )
                                case 3:
                                    return (
                                        <Button style={{ flexGrow: 0, height: 'fit-content', width: '100%', backgroundColor: '#fff', padding: '.4rem 1rem', color: "#000", fontWeight: '600', fontFamily: "GT Walsheim Pro" }} icon={false} onClick={() => {
                                            configuration.disconnect().then(e => {
                                                if(configuration.state.connection?.location?.id) configuration.connect(configuration.state.connection.location, setConnectionTime);
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
	) : <div>
        <p>loading...</p>
    </div>
}

export default TabView
