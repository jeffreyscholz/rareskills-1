import { Web3Provider } from '@ethersproject/providers'
import { BigNumber, ethers } from 'ethers'
import React, { useEffect, useState } from 'react'
import { useWeb3Context } from '../context/Web3Context'
import { useWeb3 } from '../hooks'

interface ConnectProps {
  connect: (() => Promise<void>) | null | undefined
}
const ConnectButton = ({ connect }: ConnectProps) => {
  return connect ? (
    <button onClick={connect}>Connect</button>
  ) : (
    <button>Loading...</button>
  )
}

interface DisconnectProps {
  disconnect: (() => Promise<void>) | null |undefined
  provider: Web3Provider
}

const DisconnectButton = ({ disconnect, provider }: DisconnectProps) => {
  const [{address, network}, dispatch] = useWeb3Context();
  const [balance, setBalance] = useState("");
  const chain = network?.chainId;

  useEffect(()=> {
    async function getBalance() {
      const balance = await provider.getBalance(address as string);
      setBalance((balance).toString());
    }

    getBalance();
  },[address, network])

  return disconnect && address && chain? (
    <div>
      <button onClick={disconnect}>{ address }</button>
      {
        chain == 80001 ? "" :
        <p>Please switch to polygon mumbai network</p>
      }
      <div>
      {
        chain != 80001 || balance == ""? "" :
        <p>{`matic balance: ${(+ethers.utils.formatEther(balance)).toFixed(4)}`}</p>
      }
      </div>
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