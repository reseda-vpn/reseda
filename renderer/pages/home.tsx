import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { supabase } from '@root/client'
import Home from '@components/home'
import Auth from '@components/auth'

const fetcher = (url, token) =>
  fetch(url, {
    method: 'GET',
    headers: new Headers({ 'Content-Type': 'application/json', token }),
    credentials: 'same-origin',
  }).then((res) => res.json())

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
	const [ user, setUser ] = useState(true);

	// useEffect(() => {
	// 	const session = supabase.auth.session()

	// 	fetcher('/api/getUser', session?.access_token ?? "x").then(e => {
	// 		console.log(e);
	// 	});
	// }, []);

	return (
		<div>
			{
				!user ?
					<Auth />
				:
					<Home />
			}
		</div>
	)
		
	
}

export default Reseda
