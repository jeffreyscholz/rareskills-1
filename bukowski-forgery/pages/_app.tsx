import '../styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <h1 className="text-3xl font-bold underline">
      Hello world!
    </h1>
  )
}
