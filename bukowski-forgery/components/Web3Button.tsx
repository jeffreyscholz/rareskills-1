import { Web3Provider } from '@ethersproject/providers'
import React, { useEffect, useState } from 'react'
import { useWeb3Context } from '../context/Web3Context'
import { useWeb3 } from '../hooks'

interface ConnectProps {
  connect: (() => Promise<void>) | null
}
const ConnectButton = ({ connect }: ConnectProps) => {
  return connect ? (
    <button onClick={connect}>Connect</button>
  ) : (
    <button>Loading...</button>
  )
}

interface DisconnectProps {
  disconnect: (() => Promise<void>) | null
  provider: Web3Provider
}

const DisconnectButton = ({ disconnect, provider }: DisconnectProps) => {
  const [{address, network}, dispatch] = useWeb3Context();
  const chain = network?.chainId;

  return disconnect && address && chain? (
    <div>
      <button onClick={disconnect}>{ address }</button>
      {
        chain == 80001 ? "" :
        <p>Please switch to polygon mumbai network</p>
      }
    </div>
  ) : (
    <button>Loading...</button>
  )
}

export function Web3Button() {
  const [{ web3Provider, connect, disconnect }, dispatch] = useWeb3Context()
  console.log(connect)
  return web3Provider ? (
    <DisconnectButton disconnect={disconnect} provider={web3Provider}/>
  ) : (
    <ConnectButton connect={connect} />
  )
}