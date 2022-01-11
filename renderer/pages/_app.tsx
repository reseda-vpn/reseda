import Head from 'next/head'
import '../styles/globals.css'
import '../styles/twemoji.css'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>
            Reseda
        </title>
      </Head>
      <Component {...pageProps} />
    </>
  )
}