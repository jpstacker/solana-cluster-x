'use client'

import { Keypair, PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import { ExplorerLink } from '../cluster/cluster-ui'
import { ellipsify } from '../../lib/utils'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { useSlnConfig, useSlnInfo } from './openclub-actions'

export function CounterCreate() {
  return (
    // <Button onClick={() => initialize.mutateAsync(Keypair.generate())}
    // disabled={initialize.isPending}>Create {initialize.isPending && '...'}
    <Button onClick={() => console.log('initConfig')}>Create</Button>
  )
}

export function CounterList() {
  const { getProgramAccount, state } = useSlnConfig()
  const { config } = state

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }
  return (
    <div className={'space-y-6'}>
      {config.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : config.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {config.data?.map((account) => (
            <CounterCard key={account.publicKey.toString()} account={account.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  )
}

function CounterCard({ account }: { account: PublicKey }) {
  const {
    state: { config },
  } = useSlnConfig()

  // const title = useMemo(() => config?.data?.title?.toString(), [configAQry.data?.title])
  const title = useMemo(() => console.log(config.data), [config?.data])
  // const count = useMemo(() => infoAQry.data?.count ?? 0, [accountQuery.data?.count])

  return config.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <Card>
      <CardHeader>
        <CardTitle>Title: {JSON.stringify(config)}</CardTitle>
        <CardDescription>
          Account: <ExplorerLink path={`account/${account}`} label={ellipsify(account.toString())} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => console.log('incrementMutation')}>
            Increment
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
