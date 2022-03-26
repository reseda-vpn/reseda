import type { NextPage } from 'next'
import { useState } from 'react'
import Home from '@components/home'
import { getCsrfToken, getSession } from 'next-auth/react'

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
	return ( <Home></Home> )
}

export default Reseda
