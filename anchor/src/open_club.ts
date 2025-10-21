// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import OpenClubIDL from './../target/idl/open_club.json'
import type { OpenClub } from './../target/types/open_club'

// Re-export the generated IDL and type
export { OpenClub, OpenClubIDL }

// The programId is imported from the program IDL.
export const OPEN_CLUB_PROGRAM_ID = new PublicKey(OpenClubIDL.address)

// This is a helper function to get the OpenClub Anchor program.
export function getOpenClubProgram(provider: AnchorProvider, address?: PublicKey): Program<OpenClub> {
  return new Program(
    { ...OpenClubIDL, address: address ? address.toBase58() : OpenClubIDL.address } as OpenClub,
    provider,
  )
}

// This is a helper function to get the program ID for the OpenClub program depending on the cluster.
export function getOpenClubProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the OpenClub program on devnet and testnet.
      return new PublicKey('JAVuBXeBZqXNtS73azhBDAoYaaAFfo4gWXoZe2e7Jf8H')
    case 'mainnet-beta':
    default:
      return OPEN_CLUB_PROGRAM_ID
  }
}
