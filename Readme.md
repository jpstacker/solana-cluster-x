### Cluster X — Instances, Roles, and Treasuries

A Solana Anchor program for creating and managing "instances" with role‑based creation rights, paid claims, and global/instance treasuries. It supports manager‑controlled configuration, admin approvals, captainship with paid quotas, addons to extend quotas, and four instance types: Public, Private, Whitelisted, and Paid.

### Overview

Cluster X implements a role and quota system to gate instance creation and claiming: the manager configures pricing and limits, admins are approved by the manager, captains buy quotas, and users can claim instances depending on the access type and price set by instance owners.

- **Roles and rights**
  - Manager: owns Config, approves admins, sets prices/limits, and withdraws the global treasury.
  - Admin: manager‑approved creator, active/inactive status controls the ability to create Paid instances.
  - Captain: purchased role with a limited instance creation quota that can be extended via paid AddOns.
  - User/Claimer: can claim instances (free, whitelisted, or paid depending on instance type).
- **Access types**
  - Public: anyone can claim.
  - Private: only manager can add consumers; public claims are rejected.
  - Whitelisted: only addresses in the instance whitelist can claim.
  - Paid: claims require lamport payment to the instance treasury; creation is gated to active Admins or Captains with remaining quota.

### Program ID

    - GaR9gLTt5sgZozzyn8oqgLWhGWwGhN6pTMiy5haJbgq9

## PDA Setup Notes

- Global treasury PDA: SystemAccount at seeds ["global_treasury"]; must be created and funded before any transfer into it; create via `SystemProgram::create_account` with `owner = SystemProgram, lamports = rent_exempt(0), space = 0`.
- Instance treasury PDA: SystemAccount at seeds ["instance_treasury"]; currently shared across instances; consider deriving per‑instance PDA seeds such as ["instance_treasury", instance_id] for isolation.
- Client snippet (TypeScript)
  - Example to create a system‑owned PDA:
    - Derive PDA and bump with `PublicKey.findProgramAddressSync([seed], programId)`.
    - Use SystemProgram.createAccount with `fromPubkey = payer, newAccountPubkey = pda, lamports = rentExempt(0), space = 0, programId = SystemProgram.programId`.
    - This requires the PDA to sign; because PDAs cannot sign directly, instead use the on‑chain program to create the system account or switch to a program‑owned account via anchor init where appropriate. For system‑owned zero‑space PDAs, add a dedicated init instruction that calls create_account with invoke_signed.

## Caveats and Recommendations

- Treasury initialization: No instruction currently initializes the global or instance treasuries; add an init_treasury and init_instance_treasury instruction to create/fund SystemAccount PDAs via invoke_signed before first use.
- Instance treasury seeds: withdraw_Instance_treasury uses signer seeds ["global_treasury"]; switch to ["instance_treasury"] and ensure the treasury PDA derivation matches to authorize CPI transfers correctly.
- Private instance claims: claim_instance returns NotManager for Private; that enforces manager‑mediated add of consumers but prevents direct claim even by listed consumers; confirm if intended UX.
- Shared instance treasury: As written, all instances share one instance_treasury PDA; consider per‑instance treasury using seeds with instance_id or instance Pubkey.

## Example Flows

- Manager bootstrap: Derive/create/fund global treasury PDA; call init_config to set prices/limits; process/review admin requests; approve admins as needed.
- Captain onboarding: User calls buy_captainship, receives captain quota = instance_limit; can extend quota by buy_addon.
- Creating instances: Admins or captains create Paid instances; manager creates Private/Whitelisted; anyone can create Public.
- Claiming: Users claim per rules; Paid claims transfer lamports to instance treasury.
- Withdrawals: Manager withdraws from global treasury; instance withdrawals go to claimer per current instruction, or adjust to owner payouts depending on your business rules.
