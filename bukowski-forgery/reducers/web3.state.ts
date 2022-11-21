import { ethers } from "ethers"

export type Web3ProviderState = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider: any 
    web3Provider: ethers.providers.Web3Provider | null | undefined
    address: string | null | undefined
    network: ethers.providers.Network | null | undefined
    txPending: boolean,
    balance: string | null | undefined
    connect: (() => Promise<void>) | null | undefined
    disconnect: (() => Promise<void>) | null | undefined
}

export type ContractProviderState = {
    nftContract: ethers.Contract | null | undefined
    forgeContract: ethers.Contract | null | undefined
    metadata: string | null | undefined
}