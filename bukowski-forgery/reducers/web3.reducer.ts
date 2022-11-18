import { ContractAction, Web3Action } from "./web3.action"
import { contractInitialState, web3InitialState } from "./web3.initialstate"
import { ContractProviderState, Web3ProviderState } from "./web3.state"

export function web3Reducer(
    state: Web3ProviderState,
    action: Web3Action
  ): Web3ProviderState {
    switch (action.type) {
      case 'SET_WEB3_PROVIDER':
        return {
          ...state,
          provider: action.provider,
          web3Provider: action.web3Provider,
          address: action.address,
          network: action.network,
          txPending: action.txPending,
          connect: action.connect,
          disconnect: action.disconnect
        }
      case 'SET_ADDRESS':
        return {
          ...state,
          address: action.address,
        }
      case 'SET_NETWORK':
        return {
          ...state,
          network: action.network,
        }
      case 'SET_TX_PENDING':
        return {
          ...state,
          txPending: action.txPending
        }
      case 'RESET_WEB3_PROVIDER':
        return web3InitialState
      default:
        throw new Error()
    }
  }

export function contractReducer(
  state: ContractProviderState,
  action: ContractAction
) {
  switch(action.type) {
    case 'SET_CONTRACT_PROVIDER':
      return {
        ...state,
        nftContract: action.nftContract,
        forgeContract: action.forgeContract,
        metadata: action.metadata
      }
    case 'SET_METADATA_URL':
      return {
        ...state,
        metadata: action.metadata
      }
    case 'RESET_CONTRACT_PROVIDER':
      return contractInitialState
    default:
        throw new Error()
  }
}