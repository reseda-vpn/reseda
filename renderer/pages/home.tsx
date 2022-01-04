import type { NextPage } from 'next'
import { useState } from 'react'
import { Settings } from 'react-feather'
import { exec } from 'sudo-prompt'
import { supabase } from '../client'
import TabView from '../components/tabview'
import { connect, disconnect, ResedaConnection } from '../reseda-api'
import styles from '../styles/Home.module.css'
import Button from '../components/un-ui/button'

type Packet = {
	id: number,
	author: string,
	server: string,
	client_pub_key: string,
	svr_pub_key: string,
	client_number: number,
	awaiting: boolean,
	server_endpoint: string
}

const Home: NextPage = () => {
	const [ status, setStatus ] = useState<"disconnected" | "connected">("disconnected");
	const [ actionTime, setActionTime ] = useState<number>();
	const [ connection, setConnection ] = useState<ResedaConnection>();

	return (
		<div className={styles.container}>
			<div className={styles.resedaCenter}>
				<div className={styles.resedaHeader}>
					{/* Header - Title */}
					<div className={styles.title}>Reseda</div>

					<div>
						{/* <Settings size={18} /> */}
					</div>
				</div>

				<div>
					{/* Body */}
					<TabView connectionCallback={setConnection}/>
				</div>
			</div>

			<div className={styles.resedaBottom}>
				{/* Bottom Viewport (Small) */}

				<div>
					<div className={status == "connected" ? styles.connected : styles.disconnected}>
						{/* <div className={styles.connectionStatus}></div> */}
						<h4>{status == "connected" ? "CONNECTED" : "DISCONNECTED"}</h4>
					</div>
					
					<p>{connection?.location?.toUpperCase() ?? ""}</p>
					<h6>{connection?.server ?? ""}</h6>
				</div>

				<div>
					{
						status == "connected" ? 
						<Button onClick={() => disconnect(connection.connection_id)}>Disconnect</Button>
						:
						<></>
					}
				</div>
			</div>

			{/* <button onClick={() => {
				switch(status) {
					case "disconnected": 
						const conn_start = new Date().getTime();
						connect("singapore-1").then(res => {
							const { connection_id, connected } = res;
							const end = new Date().getTime();

							setConnectionId(connection_id);
							setActionTime(end - conn_start);
		
							// if(connected) 
							setStatus("connected");
						});
						break;

					case "connected":
						const disc_start = new Date().getTime();
						disconnect(connectionId).then(res => {
							// const { connected } = res;
							const end = new Date().getTime();

							setConnectionId(-1);
							setActionTime(end - disc_start);
		
							// if(!connected) 
							setStatus("disconnected");
							supabase.removeAllSubscriptions();
						});
						break;
					
					default:
						console.log("Something went wrong...");
				}
				
			}}>{status == "connected" ? "Disconnect" : "Connect"}</button>

			<p>Action performed in {(actionTime ?? 0) / 1000}s</p> */}
		</div>
	)
}

export default Home
