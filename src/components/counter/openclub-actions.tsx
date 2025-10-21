'use client'

import { getOpenClubProgram, getOpenClubProgramId } from '../../../anchor/src'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey, Signer } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'
import { ICreateInstance, IInitConfig, ISignerBool, ISignerNumber, ISignerWallet, Util } from './util'

export const useSlnContext = () => {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getOpenClubProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getOpenClubProgram(provider, programId), [provider, programId])

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  return { connection, program, programId, getProgramAccount, cluster, provider }
}

// config | info - init_config, set_manager
export const useSlnConfig = () => {
  const transactionToast = useTransactionToast()
  const _ctx = useSlnContext()
  const { program, cluster } = _ctx

  // *****************************  State  *****************************
  const config = useQuery({
    queryKey: ['config', 'all', { cluster }],
    queryFn: () => program.account.config.all(),
  })
  // const fetchConfig = useQuery({
  //   queryKey: ['config', 'all', { cluster, account }],
  //   queryFn: () => program.account.config.fetch(account),
  // })
  const info = useQuery({
    queryKey: ['info', 'all', { cluster }],
    queryFn: () => program.account.info.all(),
  })
  // *****************************  Methods  *****************************
  // .initConfig('The Concrete Garden', 'A Timely, Inspiring, and Uplifting Story', 15, 10)
  const initConfig = useMutation({
    mutationKey: ['config_details', 'init', { cluster }],
    mutationFn: ({ signer, name, title, instanceLimit, addonLimit }: IInitConfig) =>
      program.methods
        .initConfig(name, title, instanceLimit, addonLimit)
        .accounts({ manager: signer.publicKey })
        .signers([signer])
        .rpc(),
    onSuccess: async (signature) => Util.onMutSuccess(transactionToast, signature, [config, info]),
    onError: () => Util.onMutError(toast, 'Failed to Initialize Configuration'),
  })

  const setManager = useMutation({
    mutationKey: ['new_manager', 'update', { cluster }],
    mutationFn: ({ signer, wallet }: ISignerWallet) =>
      program.methods.setManager(wallet).accounts({ manager: signer.publicKey }).signers([signer]).rpc(),
    onSuccess: async (signature) => Util.onMutSuccess(transactionToast, signature, [config]),
    onError: () => Util.onMutError(toast, 'Failed to Update New Manager'),
  })

  return { ..._ctx, state: { config, info }, fn: { initConfig, setManager } }
}

// info - set_instance_limit, set_addon_limit, request_admin, reject_admin
export const useSlnInfo = () => {
  const transactionToast = useTransactionToast()
  const _ctx = useSlnContext()
  const { program, cluster } = _ctx

  // *****************************  State  *****************************
  const info = useQuery({
    queryKey: ['info', 'all', { cluster }],
    queryFn: () => program.account.info.all(),
  })

  // *****************************  Methods  *****************************

  const setInstanceLimit = useMutation({
    mutationKey: ['instance', 'limit', { cluster }],
    mutationFn: ({ signer, value }: ISignerNumber) =>
      program.methods.setInstanceLimit(value).accounts({ signer: signer.publicKey }).signers([signer]).rpc(),
    onSuccess: async (signature) => Util.onMutSuccess(transactionToast, signature, [info]),
    onError: () => Util.onMutError(toast, 'Unable to set Instance Limit'),
  })

  const setAddonLimit = useMutation({
    mutationKey: ['addon', 'limit', { cluster }],
    mutationFn: ({ signer, value }: ISignerNumber) =>
      program.methods.setAddonLimit(value).accounts({ signer: signer.publicKey }).signers([signer]).rpc(),
    onSuccess: async (signature) => Util.onMutSuccess(transactionToast, signature, [info]),
    onError: () => Util.onMutError(toast, 'Unable to set Addon Limit'),
  })

  const requestAdmin = useMutation({
    mutationKey: ['admin', 'request', { cluster }],
    mutationFn: ({ signer }: { signer: Keypair }) =>
      program.methods.requestAdmin().accounts({ signer: signer.publicKey }).signers([signer]).rpc(),
    onSuccess: async (signature) => Util.onMutSuccess(transactionToast, signature, [info]),
    onError: () => Util.onMutError(toast, 'Unable to request admin access'),
  })

  const rejectAdmin = useMutation({
    mutationKey: ['admin', 'reject', { cluster }],
    mutationFn: ({ signer, wallet }: ISignerWallet) =>
      program.methods.rejectAdmin(wallet).accounts({ manager: signer.publicKey }).signers([signer]).rpc(),
    onSuccess: async (signature) => Util.onMutSuccess(transactionToast, signature, [info]),
    onError: () => Util.onMutError(toast, 'Unable to Reject admin access'),
  })

  return {
    ..._ctx,
    state: { info },
    fn: {
      setInstanceLimit,
      setAddonLimit,
      requestAdmin,
      rejectAdmin,
    },
  }
}

// admin - approve_admin, set_admin_status,
export const useSlnAdmin = () => {
  const transactionToast = useTransactionToast()
  const _ctx = useSlnContext()
  const { program, cluster } = _ctx

  // *****************************  State  *****************************
  const admin = useQuery({
    queryKey: ['admin', 'all', { cluster }],
    queryFn: () => program.account.admin.all(),
  })

  // const fetchInstance = useQuery({
  //   queryKey: ['info', 'all', { cluster, account }],
  //   queryFn: () => program.account.admin.fetch(account),
  // })

  // *****************************  Methods  *****************************
  const approveAdmin = useMutation({
    mutationKey: ['admin', 'approve', { cluster }],
    mutationFn: ({ signer, wallet }: ISignerWallet) =>
      program.methods.approveAdmin(wallet).accounts({ manager: signer.publicKey }).signers([signer]).rpc(),
    onSuccess: async (signature) => Util.onMutSuccess(transactionToast, signature, [admin]),
    onError: () => Util.onMutError(toast, 'Unable to Approve admin access'),
  })

  const setAdminStatus = useMutation({
    mutationKey: ['admin_status', 'update', { cluster }],
    mutationFn: ({ signer, value }: ISignerBool) =>
      program.methods.setAdminStatus(value).accounts({ manager: signer.publicKey }).signers([signer]).rpc(),
    onSuccess: async (signature) => Util.onMutSuccess(transactionToast, signature, [admin]),
    onError: () => Util.onMutError(toast, 'Unable to request admin access'),
  })

  return { ..._ctx, state: { admin }, fn: { approveAdmin, setAdminStatus } }
}

// captain - claim_captainship, claim_addon
export const useSlnCaptain = () => {
  const transactionToast = useTransactionToast()
  const _ctx = useSlnContext()
  const { program, cluster } = _ctx

  // *****************************  State  *****************************
  const captain = useQuery({
    queryKey: ['captain', 'all', { cluster }],
    queryFn: () => program.account.captain.all(),
  })

  // *****************************  State  *****************************
  const claimAddon = useMutation({
    mutationKey: ['whitelist', 'add', { cluster }],
    mutationFn: ({ signer }: { signer: Keypair }) =>
      program.methods.claimAddon().accounts({ payer: signer.publicKey }).signers([signer]).rpc(),
    onSuccess: async (signature) => Util.onMutSuccess(transactionToast, signature, [captain]),
    onError: () => Util.onMutError(toast, 'Unable to aad whitelist'),
  })

  const claimCaptainship = useMutation({
    mutationKey: ['whitelist', 'add', { cluster }],
    mutationFn: ({ signer }: { signer: Keypair }) =>
      program.methods.claimCaptainship().accounts({ payer: signer.publicKey }).signers([signer]).rpc(),
    onSuccess: async (signature) => Util.onMutSuccess(transactionToast, signature, [captain]),
    onError: () => Util.onMutError(toast, 'Unable to aad whitelist'),
  })

  return { ..._ctx, state: { captain }, fn: { claimAddon, claimCaptainship } }
}

// instance - create_instance, grant_private_instance, add_whitelist, claim_instance
export const useSlnInstance = () => {
  const transactionToast = useTransactionToast()
  const _ctx = useSlnContext()
  const { program, cluster } = _ctx

  // *****************************  State  *****************************
  const instance = useQuery({
    queryKey: ['instance', 'all', { cluster }],
    queryFn: () => program.account.instance.all(),
  })

  // const fetchInstance = useQuery({
  //   queryKey: ['info', 'all', { cluster, account }],
  //   queryFn: () => program.account.admin.fetch(account),
  // })

  // *****************************  Methods  *****************************

  const createInstance = useMutation({
    mutationKey: ['whitelist', 'add', { cluster }],
    mutationFn: ({ creator, instanceType, name, days }: ICreateInstance) =>
      program.methods.createInstance(instanceType, name, days).signers([creator]).rpc(),
    onSuccess: async (signature) => Util.onMutSuccess(transactionToast, signature, [instance]),
    onError: () => Util.onMutError(toast, 'Unable to aad whitelist'),
  })

  const grantPrivateInstance = useMutation({
    mutationKey: ['whitelist', 'add', { cluster }],
    mutationFn: ({ signer, wallet }: ISignerWallet) =>
      program.methods.grantPrivateInstance(wallet).accounts({ manager: signer.publicKey }).signers([signer]).rpc(),
    onSuccess: async (signature) => Util.onMutSuccess(transactionToast, signature, [instance]),
    onError: () => Util.onMutError(toast, 'Unable to aad whitelist'),
  })

  const addWhitelist = useMutation({
    mutationKey: ['whitelist', 'add', { cluster }],
    mutationFn: ({ signer, wallet }: ISignerWallet) =>
      program.methods.addWhitelist(wallet).accounts({ manager: signer.publicKey }).signers([signer]).rpc(),
    onSuccess: async (signature) => Util.onMutSuccess(transactionToast, signature, [instance]),
    onError: () => Util.onMutError(toast, 'Unable to aad whitelist'),
  })

  const claimInstance = useMutation({
    mutationKey: ['whitelist', 'add', { cluster }],
    mutationFn: ({ signer }: { signer: Keypair }) =>
      program.methods.claimInstance().accounts({ claimer: signer.publicKey }).signers([signer]).rpc(),
    onSuccess: async (signature) => Util.onMutSuccess(transactionToast, signature, [instance]),
    onError: () => Util.onMutError(toast, 'Unable to aad whitelist'),
  })

  return { ..._ctx, state: { instance }, fn: { createInstance, grantPrivateInstance, claimInstance, addWhitelist } }
}
