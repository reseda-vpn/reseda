import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import Home from '@components/home'
import Auth from '@components/auth'
import path from 'path'
import f from "@tauri-apps/api/fs"
const fs = f;
import { getCsrfToken, getSession } from 'next-auth/react'
import { invoke } from '@tauri-apps/api/tauri'
import { WgConfig } from '@root/lib/wg-tools/src'

const fetcher = (url, token) =>
  fetch(url, {
    method: 'GET',
    headers: new Headers({ 'Content-Type': 'application/json', token }),
    credentials: 'same-origin',
  }).then((res) => res.json())

export const getServerSideProps = async ({ req, res }) => {
	const session = await getSession({ req });
	const csrfToken = await getCsrfToken({ req: req });

	if (!session) return { props: {}, redirect: { destination: '/login', permanent: false } }
	console.log(session, csrfToken);

	return {
		props: {
			session,
			csrfToken
		},
	}
}

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
	const [ authView, setAuthView ] = useState('sign_in')
	const [ firstTime, setFirstTime ] = useState(false);
	
	return ( <Home></Home> )
}

export default Reseda
