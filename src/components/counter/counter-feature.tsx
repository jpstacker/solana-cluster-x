'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { ExplorerLink } from '../cluster/cluster-ui'
import { CounterCreate, CounterList } from './counter-ui'
import { AppHero } from '../app-hero'
import { ellipsify } from '../../lib/utils'
import { ReactNode } from 'react'
import { useSlnConfig, useSlnContext } from './openclub-actions'
import { useSlnInfo, useSlnAdmin } from './openclub-actions'
import { useSlnCaptain, useSlnInstance } from './openclub-actions'

export default function CounterFeature() {
  const { publicKey } = useWallet()
  const { programId } = useSlnContext()

  return publicKey ? (
    <div>
      <AppHero title="Counter" subtitle={'.'}>
        <p className="mb-6">
          <ExplorerLink path={`account/${programId}`} label={ellipsify(programId.toString())} />
        </p>
        <CounterCreate />
      </AppHero>
      <CounterList />
      <SlnConfig />
      <SlnInfo />
      <SlnAdmin />
      <SlnCaptain />
      <SlnInstance />
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  )
}

// info - init_config, set_manager
const SlnConfig = () => {
  const { state, fn } = useSlnConfig()

  const onInitConfig = async () => {
    await fn.initConfig.mutateAsync()
  }
  const onSetManager = async () => {
    await fn.setManager()
  }

  return (
    <SlnWarpper>
      <Btn onClick={onInitConfig} content="Init Config" />
      <Btn onClick={onSetManager} content="Set Manager" />
    </SlnWarpper>
  )
}

// set_instance_limit, set_addon_limit, request_admin, reject_admin,
const SlnInfo = () => {
  const { state, fn } = useSlnInfo()
  const onSetInstanceLimit = async () => {
    await fn.setInstanceLimit()
  }
  const onSetAddonLimit = async () => {
    await fn.setAddonLimit()
  }
  const onRequestAdmin = async () => {
    await fn.rejectAdmin()
  }
  const onRejectAdmin = async () => {
    await fn.rejectAdmin()
  }

  return (
    <SlnWarpper>
      <Btn onClick={onSetInstanceLimit} content="Set Instance Limit" />
      <Btn onClick={onSetAddonLimit} content="Set Addon Limit" />
      <Btn onClick={onRequestAdmin} content="Request Admin" />
      <Btn onClick={onRejectAdmin} content="Reject Admin" />
    </SlnWarpper>
  )
}

// approve_admin, set_admin_status,
const SlnAdmin = () => {
  const { state, fn } = useSlnAdmin()
  const onApproveAdmin = async () => {
    await fn.approveAdmin()
  }
  const onSetAdminStatus = async () => {
    await fn.setAdminStatus()
  }

  return (
    <SlnWarpper>
      <Btn onClick={onApproveAdmin} content="Approve Admin" />
      <Btn onClick={onSetAdminStatus} content="Set Admin Status" />
    </SlnWarpper>
  )
}

// claim_captainship, claim_addon,
const SlnCaptain = () => {
  const { state, fn } = useSlnCaptain()
  const onClaimCaptainship = async () => {
    await fn.claimCaptainship()
  }
  const onClaimAddon = async () => {
    await fn.claimAddon()
  }

  return (
    <SlnWarpper>
      <Btn onClick={onClaimCaptainship} content="Claim Captainship" />
      <Btn onClick={onClaimAddon} content="Claim Addon" />
    </SlnWarpper>
  )
}

// create_instance, grant_private_instance, add_whitelist, claim_instance,
const SlnInstance = () => {
  const { state, fn } = useSlnInstance()
  const onCreateInstance = async () => {
    await fn.createInstance()
  }
  const onGrantPrivateInstance = async () => {
    await fn.grantPrivateInstance()
  }
  const onAddWhitelist = async () => {
    await fn.addWhitelist()
  }
  const onClaimInstance = async () => {
    await fn.claimInstance()
  }

  return (
    <SlnWarpper>
      <Btn onClick={onCreateInstance} content="Create Instance" />
      <Btn onClick={onGrantPrivateInstance} content="Grant Private Instance" />
      <Btn onClick={onAddWhitelist} content="Add Whitelist" />
      <Btn onClick={onClaimInstance} content="claim Instance" />
    </SlnWarpper>
  )
}

const SlnWarpper = ({ children }: { children: ReactNode }) => (
  <div className="flex justify-center align-middle mx-4 my-1">{children}</div>
)

const Btn = ({ content, onClick }: { content: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-pink-500 group-hover:to-orange-400 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800"
  >
    <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
      {content}
    </span>
  </button>
)
