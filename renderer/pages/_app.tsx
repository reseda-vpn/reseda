import { SessionProvider } from 'next-auth/react'
import { AppProps } from 'next/dist/shared/lib/router/router'
import Head from 'next/head'
import '../styles/globals.css'
import '../styles/twemoji.css'

function SafeHydrate({ children }) {
  return (
    <div suppressHydrationWarning>
      {typeof window === 'undefined' ? null : children}
    </div>
  )
}

function App({ Component, pageProps: { session, metaTags, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <SafeHydrate><Component {...pageProps} /></SafeHydrate>
    </SessionProvider>
  ) 
}

export default App