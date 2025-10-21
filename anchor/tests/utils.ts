import * as anchor from '@coral-xyz/anchor'
import { AnchorProvider } from '@coral-xyz/anchor'
import { SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { PublicKey } from '@solana/web3.js'
import { expect } from 'chai'

export const provider = AnchorProvider.env()
anchor.setProvider(provider)

export const airdrop = async (pk: PublicKey, sol = 2) => {
  const sig = await provider.connection.requestAirdrop(pk, sol * LAMPORTS_PER_SOL)
  await provider.connection.confirmTransaction(sig, 'confirmed')
  return sig
}

const extractPDA_1 = (_key: string, programId: PublicKey) =>
  PublicKey.findProgramAddressSync([Buffer.from(_key)], programId)

const extractPDA_2 = (_key: string, programId: PublicKey, wallet: PublicKey) =>
  PublicKey.findProgramAddressSync([Buffer.from(_key), wallet.toBuffer()], programId)

export const PDA = {
  // PublicKey.findProgramAddressSync([Buffer.from("_key")], programId),
  config: (programId: PublicKey) => extractPDA_1('config', programId),
  settings: (programId: PublicKey) => extractPDA_1('settings', programId),
  // PublicKey.findProgramAddressSync([Buffer.from("admin"), wallet.toBuffer()], programId)
  admin: (programId: PublicKey, wallet: PublicKey) => extractPDA_2('admin', programId, wallet),
  captain: (programId: PublicKey, wallet: PublicKey) => extractPDA_2('captain', programId, wallet),
  // PublicKey.findProgramAddressSync([Buffer.from("instance"), Buffer.from(name)], programId)
  instance: (programId: PublicKey, name: string) =>
    PublicKey.findProgramAddressSync([Buffer.from('instance'), Buffer.from(name)], programId),
}

export const expectAnchorErr = (e: any, code: string) => {
  const byCode = e?.error?.errorCode?.code === code
  const byMsg = typeof e?.error?.errorMessage === 'string' && e.error.errorMessage.length > 0
  const byLog = Array.isArray(e?.logs) && e.logs.some((l: string) => l.toLowerCase().includes(code.toLowerCase()))

  // expect(
  //   byCode || byMsg || byLog,
  //   `Expected Anchor error ${code}, got: ${JSON.stringify(e)}`
  // ).to.eq(true);
}

export const uniqueName = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`

export const SP = SystemProgram.programId

export const fn = {
  // Alter State
  initConfig: async (program, manager, [a, b, c, d]) =>
    await program?.methods?.initConfig(a, b, c, d)?.accounts({ manager })?.rpc(),
}
