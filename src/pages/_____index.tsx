import type { NextPage } from 'next'
import { IframeHTMLAttributes, useEffect, useRef, useState } from 'react'
import Home from '@components/home'
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
		// iframe_ref.current.onload = () => {
		// 	setLoading(false)
		// }

		if(window.navigator) {
			const listener = (event) => {
				const msg = JSON.parse(event.data);
				console.log(`invoke(${msg.message}, ${JSON.stringify(msg.data)} )})`,);
	
				if(msg.data) 
					invoke(msg.message, msg.data).then(e => {
						iframe_ref.current.contentWindow.postMessage(JSON.stringify({
							message: msg.message,
							data: e,
							type: "call-of-the-shallows",
							nonce: msg.nonce
						}), "*");

						console.log(">> ", e);
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

		console.log(window.localStorage.getItem("reseda.jwt"))
	}, [])

	return ( 
		<>
			<a href="./login">APP</a>
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
