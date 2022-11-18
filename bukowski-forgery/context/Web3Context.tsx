import React, { createContext, useContext, ReactNode, Dispatch } from 'react'
import { useWeb3 } from '../hooks/Web3Client'
import { Web3ProviderState, web3InitialState, Web3Action } from '../reducers'

const Web3Context = createContext<[Web3ProviderState, Dispatch<Web3Action>]>([web3InitialState, () => null])

interface Props {
  children: ReactNode
}

export const Web3ContextProvider = ({ children }: Props) => {
  const [web3ProviderState, dispatch] = useWeb3()

    console.log('here', web3ProviderState.connect)

  return (
    <Web3Context.Provider value={[web3ProviderState, dispatch]}>
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3Context() {
  return useContext(Web3Context)
}