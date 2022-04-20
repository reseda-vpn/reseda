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
    <SafeHydrate><Component {...pageProps} /></SafeHydrate>
  ) 
}

export default App