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
	const session = supabase.auth.session()

	const [ user, setUser ] = useState(supabase.auth.user());
	const [ authView, setAuthView ] = useState('sign_in')
	const [ firstTime, setFirstTime ] = useState(false);

	useEffect(() => {
		const firstTimeFilePath = path.join(process.cwd(), './', '.first-time');
		let isFirstTime;

		try {
			fs.closeSync(fs.openSync(firstTimeFilePath, 'wx'));
			isFirstTime = true;
		} catch(e) {
			if (e.code === 'EEXIST') {
				isFirstTime = false;
			} else {
				// something gone wrong
				throw e;
			}
		}

		if(isFirstTime) {
			console.log(`FIRST TIME`);
			setFirstTime(true);
		}else {
			console.log(`NOT THE FIRST TIME`);
			setFirstTime(false);
		}
	}, [])

	useEffect(() => {
		// if(session)
		// 	fetcher('/api/getUser', session.access_token).then(e => {
		// 		setUser(e);
		// 	});
		
		const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
			setUser(supabase.auth.user());

			console.log("User Auth Changed!", supabase.auth.user());
			setFirstTime(false);

			// fetch('/api/auth', {
			// 	method: 'POST',
			// 	headers: new Headers({ 'Content-Type': 'application/json' }),
			// 	credentials: 'same-origin',
			// 	body: JSON.stringify({ event, session }),
			// });
		})

		return () => {
			authListener.unsubscribe()
		}
	}, []);

	console.log(firstTime, user)

	if(firstTime || !user) {
		return ( <Auth></Auth> )
	}else {
		return ( <Home></Home> )
	}
}

export default Reseda
