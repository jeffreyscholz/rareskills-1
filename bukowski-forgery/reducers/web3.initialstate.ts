import { ContractProviderState, Web3ProviderState } from "./web3.state";

export const web3InitialState: Web3ProviderState = {
    provider: null,
    web3Provider: null,
    address: null,
    network: null,
    txPending: false,
    balance: null,
    connect: null,
    disconnect: null,
  }

export const contractInitialState: ContractProviderState = {
  nftContract: null,
  forgeContract: null,
  metadata: null
}