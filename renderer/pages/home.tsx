import type { NextPage } from 'next'
import { useState } from 'react'
import { Settings } from 'react-feather'
import { exec } from 'sudo-prompt'
import { supabase } from '../client'
import TabView from '../components/tabview'
import { connect, disconnect } from '../reseda-api'
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
	const [ status, setStatus ] = useState<"disconnected" | "connected">("connected"); // ETS: change to disconnected when done
	const [ actionTime, setActionTime ] = useState<number>();
	const [ connectionId, setConnectionId ] = useState<number>();

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
					<TabView />
				</div>
			</div>

			<div className={styles.resedaBottom}>
				{/* Bottom Viewport (Small) */}

				<div>
					<div className={styles.connection}>
						{/* <div className={styles.connectionStatus}></div> */}
						<h4>{status == "connected" ? "CONNECTED" : "DISCONNECTED"}</h4>
					</div>
					
					<p>Singapore</p>
					<h6>singapore-1</h6>
				</div>

				<div>
					<Button>Disconnect</Button>
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
