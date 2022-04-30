import type { NextPage } from 'next'
import { IframeHTMLAttributes, useEffect, useRef, useState } from 'react'
import Home from '@components/home'
import { getCsrfToken, getSession } from 'next-auth/react'
import { invoke } from '@tauri-apps/api/tauri'

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

const Reseda: NextPage = () => {
	const [ firstTime, setFirstTime ] = useState(false);
	const [ loading, setLoading ] = useState(true);
	const iframe_ref = useRef<HTMLIFrameElement>();

	useEffect(() => {
		// window.location.href = "https://reseda.app"
		iframe_ref.current.onload = () => {
			setLoading(false)
		}

		if(window.navigator) {
			const listener = (event) => {
				const msg = JSON.parse(event.data);
				console.log(`invoke(${msg.message}, ${msg.data})`);
	
				if(msg.data) 
					invoke(msg.message, msg.data).then(e => {
						iframe_ref.current.contentWindow.postMessage(JSON.stringify({
							message: msg.message,
							data: e,
							type: "call-of-the-shallows",
							nonce: msg.nonce
						}), "*");

						console.log(e);
					})
	
				else 
					invoke(msg.message).then(e => {
						iframe_ref.current.contentWindow.postMessage(JSON.stringify({
							message: msg.message,
							data: e,
							type: "call-of-the-shallows",
							nonce: msg.nonce
						}), "*");
						
						console.log(e);
					})
			};
	
			window.addEventListener("message", listener, false);
	
			console.log("Event Listener Added");
		}
	}, [])

	return ( 
		<>
			<iframe src="http://localhost:3000" sandbox="allow-scripts allow-same-origin" frameBorder={0} style={{ display: loading ? 'none' : 'inherit', height: '100vh', width: '100vw' }} ref={iframe_ref}></iframe>

			{
				loading ?
					<div>Loading</div>
				:
					<></>
			}
		</>
	)
}

export default Reseda
