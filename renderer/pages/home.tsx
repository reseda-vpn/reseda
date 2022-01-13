import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { supabase } from '@root/client'
import Home from '@components/home'
import Auth from '@components/auth'
import path from 'path'
import { app } from 'electron'
import fs from "fs"

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

	useEffect(() => {
		const firstTime = process.argv[1] == '--squirrel-firstrun';

		if(firstTime) {
			console.log(`FIRST TIME`);
			setUser(false);
		}else {
			console.log(`NOT THE FIRST TIME`);
			setUser(true);
		}
	}, [])

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
