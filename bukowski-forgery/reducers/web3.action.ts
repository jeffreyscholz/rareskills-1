import { ContractProviderState, Web3ProviderState } from "./web3.state"

export type Web3Action =
  | {
      type: 'SET_WEB3_PROVIDER'
      provider?: Web3ProviderState['provider']
      web3Provider?: Web3ProviderState['web3Provider']
      address?: Web3ProviderState['address']
      network?: Web3ProviderState['network']
      txPending: Web3ProviderState['txPending']
      connect?: Web3ProviderState['connect'],
      disconnect?: Web3ProviderState['disconnect']
    }
  | {
      type: 'SET_ADDRESS'
      address?: Web3ProviderState['address']
    }
  | {
      type: 'SET_NETWORK'
      network?: Web3ProviderState['network']
    }
  | {
      type: 'SET_TX_PENDING'
      txPending: Web3ProviderState['txPending']
    }
  | {
      type: 'RESET_WEB3_PROVIDER'
    }

export type ContractAction = 
  | {
      type: 'SET_CONTRACT_PROVIDER'
      nftContract?: ContractProviderState['nftContract']
      forgeContract?: ContractProviderState['forgeContract']
      metadata?: ContractProviderState['metadata']
    }
  | {
      type: 'SET_METADATA_URL'
      metadata?: ContractProviderState['metadata']
    }
  | {
      type: 'RESET_CONTRACT_PROVIDER'
    }