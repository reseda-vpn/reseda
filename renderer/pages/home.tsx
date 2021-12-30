import type { NextPage } from 'next'
import { useState } from 'react'
import { exec } from 'sudo-prompt'
import { supabase } from '../client'
import { connect, disconnect } from '../reseda-api'
import styles from '../styles/Home.module.css'

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
	const [ connectionId, setConnectionId ] = useState<number>();

	return (
		<div className={styles.container}>
			<title>reseda</title>
			<h1>{status}</h1>

			<button onClick={() => {
				switch(status) {
					case "disconnected": 
						const conn_start = new Date().getTime();
						connect("singapore-1").then(res => {
							console.log(res);

							// const { connection_id, connected } = res;
							const end = new Date().getTime();

							// setConnectionId(connection_id);
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
						});
						break;
					
					default:
						console.log("Something went wrong...");
				}
				
			}}>{status == "connected" ? "Disconnect" : "Connect"}</button>

			<p>Action performed in {(actionTime ?? 0) / 1000}s</p>
		</div>
	)
}

export default Home
