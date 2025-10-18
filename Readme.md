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

### Accounts

- Config
  - Fields: owner, name, title, instance_ids counter, instance_price, addon_price, instance_limit, addon_limit, treasury, bump.
  - PDA: seeds ["config"].
- AdminRequest
  - Stores pending admin requests as Portfolio { wallet, uri }.
  - PDA: seeds ["requests"].
- AdminAccount
  - Fields: active, owner, instance_list, bump.
  - PDA: seeds ["admin", wallet].
- CaptainAccount
  - Fields: owner, instance_list, remaining_instance_count, addon_count, bump.
  - PDA: seeds ["captain", payer].
- AddOn
  - Fields: captain, limit, price, bump.
  - PDA: seeds ["addon", captain, addon_count].
- Instance
  - Fields: owner, instance_id, price, instance_type, consumers, whitelist, instance_treasury, bump.
  - PDA: seeds ["instance", instance_id].
- Treasuries
  - Global treasury: SystemAccount PDA at seeds ["global_treasury"] (system‑owned).
  - Instance treasury: SystemAccount PDA at seeds ["instance_treasury"] (system‑owned).

`Note`: system‑owned PDAs are not auto‑initialized; create them with a client using SystemProgram::create_account to zero space and fund to rent‑exempt before first use.

## Instructions

- init_config(name, title, instance_price, instance_limit, addon_price, addon_limit)
  - Initializes Config and AdminRequest PDAs; stores prices/limits and sets treasury Pubkey to the global treasury PDA; length checks on name/title.
- set_manager(new_manager)
  - Only manager; transfers config.owner to new_manager.
- set_addon(addon_price, addon_limit)
  - Only manager; updates addon pricing and per‑addon limit.
- set_instance(instance_price, instance_limit)
  - Only manager; updates captainship base price and included instance quota.
- request_admin(uri)
  - Any wallet; appends a unique Portfolio {wallet, uri} to pending requests (bounded list).
- approve_admin(wallet)
  - Only manager; removes pending request for wallet, initializes AdminAccount PDA as active with empty instance list; closes requests account only when list is empty (enforced by constraint).
- reject_admin(wallet)
  - Only manager; removes request for wallet if present.
- set_admin_status(status)
  - Only manager; toggles AdminAccount.active.
- buy_captainship()
  - Payer sends config.instance_price lamports to the global treasury; creates a CaptainAccount with remaining_instance_count = config.instance_limit and addon_count = 0.
- buy_addon()
  - Payer sends config.addon_price lamports to the global treasury; creates AddOn for the captain; increases captain.remaining_instance_count by addon.limit and increments addon_count.
- create_instance(instance_type, price, consumers, whitelist)
  - Enforces creation rules:
    - Public: anyone can create.
    - Private/Whitelisted: only manager can create.
    - Paid: creator must be an active Admin or a Captain with remaining quota; captain quota decremented on success.
  - Increments config.instance_ids, initializes Instance PDA with owner, type, price, whitelist/consumers, and binds instance_treasury PDA; tracks instance Pubkey in Admin/Captain lists (bounded).
- set_private_instance(wallet)
  - Only manager; pushes wallet to instance.consumers (bounded).
- set_whitelist(wallet)
  - Only manager; pushes wallet to instance.whitelist (bounded).
- claim_instance()
  - For:
    - Public: accepts.
    - Private: rejects unless managed via set_private_instance by manager (direct claim path returns NotManager).
    - Whitelisted: requires claimer in whitelist.
    - Paid: transfers inst.price lamports to instance_treasury.
  - Adds claimer to consumers if not already present.
- withdraw_global_treasury(lamports)
  - Only manager; CPI transfer from the global treasury PDA to manager using invoke_signed with seeds ["global_treasury"].
- withdraw_instance_treasury(lamports)
  - Claimer signed; CPI transfer from instance treasury to claimer using invoke_signed; note the current seed array uses ["global_treasury"], which should be aligned to the instance treasury seeds for correct PDA signing (see Caveats).

## Build and Test

- Prereqs
  - Anchor 0.31.x, Rust nightly toolchain, Solana CLI latest stable, Node 18+ for TypeScript client.
- Commands
  - anchor build
  - anchor test
  - anchor deploy
- Localnet
  - solana-test-validator
  - Set program ID in Anchor.toml and declare_id! if changed.
- Windows/Kali
  - Works well under WSL2 Ubuntu; use Windows Terminal; ensure OpenSSL and LLVM toolchains are present for Rust builds.

## PDA Setup Notes

- Global treasury PDA
  - SystemAccount at seeds ["global_treasury"]; must be created and funded before any transfer into it; create via SystemProgram::create_account with owner = SystemProgram, lamports = rent_exempt(0), space = 0.
- Instance treasury PDA
  - SystemAccount at seeds ["instance_treasury"]; currently shared across instances; consider deriving per‑instance PDA seeds such as ["instance_treasury", instance_id] for isolation.
- Client snippet (TypeScript)
  - Example to create a system‑owned PDA:
    - Derive PDA and bump with PublicKey.findProgramAddressSync([seed], programId).
    - Use SystemProgram.createAccount with fromPubkey = payer, newAccountPubkey = pda, lamports = rentExempt(0), space = 0, programId = SystemProgram.programId.
    - This requires the PDA to sign; because PDAs cannot sign directly, instead use the on‑chain program to create the system account or switch to a program‑owned account via anchor init where appropriate. For system‑owned zero‑space PDAs, add a dedicated init instruction that calls create_account with invoke_signed.

## Data Limits

- Length/size guards
  - name <= 20; title <= 20; uri < 128.
  - whitelist and consumers capped at 200 entries.
  - admin request list capped at 100 entries.
  - admin/captain instance_list capped at 200 entries.
- Counters use saturating_add to prevent overflow where applied.

## Errors

- LengthExceeded, LimitExceeded
- NotManager, NotAuthorized
- AlreadyRequested, RequestListFull, RequestNotFound
- InstanceListFull
- InsufficientFunds

## Caveats and Recommendations

- Treasury initialization
  - No instruction currently initializes the global or instance treasuries; add an init_treasury and init_instance_treasury instruction to create/fund SystemAccount PDAs via invoke_signed before first use.
- Instance treasury seeds
  - withdraw_Instance_treasury uses signer seeds ["global_treasury"]; switch to ["instance_treasury"] and ensure the treasury PDA derivation matches to authorize CPI transfers correctly.
- Private instance claims
  - claim_instance returns NotManager for Private; that enforces manager‑mediated add of consumers but prevents direct claim even by listed consumers; confirm if intended UX.
- Shared instance treasury
  - As written, all instances share one instance_treasury PDA; consider per‑instance treasury using seeds with instance_id or instance Pubkey.

## Example Flows

- Manager bootstrap
  - Derive/create/fund global treasury PDA; call init_config to set prices/limits; process/review admin requests; approve admins as needed.
- Captain onboarding
  - User calls buy_captainship, receives captain quota = instance_limit; can extend quota by buy_addon.
- Creating instances
  - Admins or captains create Paid instances; manager creates Private/Whitelisted; anyone can create Public.
- Claiming
  - Users claim per rules; Paid claims transfer lamports to instance treasury.
- Withdrawals
  - Manager withdraws from global treasury; instance withdrawals go to claimer per current instruction, or adjust to owner payouts depending on your business rules.

## Development Status

- Anchor derive macros used for InitSpace sizing and PDA bumps.
- System transfers done via invoke/invoke_signed and system_instruction::transfer.
- Designed for iteration: limits and prices configurable by manager; extensible with additional roles or revenue split logic.

## License

- MIT or Apache‑2.0 recommended; add a LICENSE file to the repo.

## Directory Structure (suggested)

- programs/cluster_x/src/lib.rs
- Anchor.toml
- Cargo.toml
- tests/cluster_x.spec.ts (Anchor Mocha)
- app/ client scaffolding for scripts

## Scripts (suggested)

- scripts/airdrop.ts: Airdrop and fund treasuries.
- scripts/init.ts: Initialize config and treasuries.
- scripts/captain.ts: Buy captainship, addons.
- scripts/instances.ts: Create/claim instances; set whitelist/private consumers.
- scripts/withdraw.ts: Withdraw from treasuries with proper signer seeds.

## Future Enhancements

- Per‑instance treasuries and revenue splits to owners/admins.
- Events for indexing and analytics.
- Rate limiting and anti‑spam on requests/claims.
- Program‑owned treasury accounts instead of raw SystemAccount PDAs for easier lifecycle management.
- Explicit instruction to initialize treasuries on‑chain with invoke_signed.
