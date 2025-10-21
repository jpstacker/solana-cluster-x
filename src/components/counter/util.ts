import { Keypair, PublicKey } from '@solana/web3.js'

interface Refetchable {
  refetch: () => Promise<unknown> | Promise<void>
}

const onMutSuccess = async (toast: any, signature: any, items: Refetchable[]) => {
  toast(signature)
  for (const item of items) await item?.refetch()
}

const onMutError = async (toast: any, msg: string) => toast?.error('Failed to Initialize Configuration')

export type ISignerWallet = { signer: Keypair; wallet: PublicKey }
export type ISignerNumber = { signer: Keypair; value: number }
export type ISignerBool = { signer: Keypair; value: boolean }

export type IInitConfig = {
  signer: Keypair
  name: string
  title: string
  instanceLimit: number
  addonLimit: number
}
export type InstanceType = { private: number } | { whitelisted: number } | { portfolio: number } | { public: number }

export type ICreateInstance = {
  creator: Keypair
  instanceType: InstanceType
  name: string
  days: number
}

export const Util = {
  onMutSuccess,
  onMutError,
}
