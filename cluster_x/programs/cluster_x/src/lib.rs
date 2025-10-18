#![allow(warnings)]
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::{invoke, invoke_signed};
use anchor_lang::solana_program::system_instruction;
use anchor_lang::system_program;
use anchor_lang::system_program::Transfer;

declare_id!("GaR9gLTt5sgZozzyn8oqgLWhGWwGhN6pTMiy5haJbgq9");

// Anchor programs always use 8 bits for the discriminator
pub const ANCHOR_DISCRIMINATOR: usize = 8;

#[program]
pub mod cluster_x {

    use super::*;

    pub fn init_config(
        ctx: Context<InitConfig>,
        name: String,
        title: String,
        instance_price: u64,
        instance_limit: u16,
        addon_price: u64,
        addon_limit: u16,
    ) -> Result<()> {
        require!(name.len() <= 20, ErrorCode::LengthExceeded); 
        require!(title.len() <= 20, ErrorCode::LengthExceeded); 
        
        let cfg = &mut ctx.accounts.config;
        cfg.name = name;
        cfg.title = title;
        cfg.instance_ids = 0;
        cfg.instance_price = instance_price;
        cfg.instance_limit = instance_limit;
        cfg.addon_price = addon_price;
        cfg.addon_limit = addon_limit;

        cfg.treasury = ctx.accounts.treasury.key();
        cfg.bump = ctx.bumps.config;
        ctx.accounts.requests.bump = ctx.bumps.requests;

        Ok(())
    }

    pub fn set_manager(ctx: Context<SetConfig>, new_manager: Pubkey) -> Result<()> {
        only_manager(&ctx.accounts.config, &ctx.accounts.manager)?;
        ctx.accounts.config.owner = new_manager;
        Ok(())
    }

    pub fn set_addon(
        ctx: Context<SetConfig>, 
        addon_price: u64,
        addon_limit: u16
    ) -> Result<()> {
        only_manager(&ctx.accounts.config, &ctx.accounts.manager)?;
        ctx.accounts.config.addon_price = addon_price;
        ctx.accounts.config.addon_limit = addon_limit;
        Ok(())
    }

    pub fn set_instance(
        ctx: Context<SetConfig>, 
        instance_price: u64,
        instance_limit: u16
    ) -> Result<()> {
        only_manager(&ctx.accounts.config, &ctx.accounts.manager)?;
        ctx.accounts.config.instance_price = instance_price;
        ctx.accounts.config.instance_limit = instance_limit;
        Ok(())
    }

    pub fn request_admin(
        ctx: Context<RequestAdmin>, 
        uri: String
    ) -> Result<()> {
        require!(uri.len() < 128, ErrorCode::LengthExceeded);
        let req = &mut ctx.accounts.requests;

        if req.requests.iter().any(|r|r.wallet == ctx.accounts.requester.key()) {
            return err!(ErrorCode::AlreadyRequested);
        }
        require!(req.requests.len() < 100, ErrorCode::RequestListFull);

        req.requests.push(Portfolio {wallet: ctx.accounts.requester.key(), uri});
        Ok(())
    }

    pub fn approve_admin(
        ctx: Context<ApproveAdmin>, 
        wallet: Pubkey
    ) -> Result<()> {
        only_manager(&ctx.accounts.config, &ctx.accounts.manager)?;

        // Remove pending request if present
        let reqs = &mut ctx.accounts.requests;
        if let Some(pos) = reqs.requests.iter().position(|r| r.wallet == wallet) {
            reqs.requests.swap_remove(pos);
        }

        let admin = &mut ctx.accounts.admin;
        admin.active = true;
        admin.owner = wallet;
        admin.instance_list = Vec::new();
        admin.bump = ctx.bumps.admin;
        Ok(())
    }

    pub fn reject_admin(ctx: Context<RejectAdmin>, wallet: Pubkey) -> Result<()> {
        only_manager(&ctx.accounts.config, &ctx.accounts.manager)?;

        let reqs = &mut ctx.accounts.requests;
        if let Some(pos) = reqs.requests.iter().position(|r| r.wallet == wallet) {
            reqs.requests.swap_remove(pos);
            return Ok(());
        }
        err!(ErrorCode::RequestNotFound)
    }

    pub fn set_admin_Status(ctx: Context<SetAdminStatus>, status: bool) -> Result<()> {
        only_manager(&ctx.accounts.config, &ctx.accounts.manager)?;
        ctx.accounts.admin.active = status;
        Ok(())
    }

    pub fn buy_captainship(ctx: Context<BuyCaptainship>) -> Result<()> {
        transfer_lamports(
            &ctx.accounts.payer, 
            &ctx.accounts.treasury, 
            &ctx.accounts.system_program, 
            &ctx.accounts.config.instance_price
        );

        let cap = &mut ctx.accounts.captain;
        cap.owner = ctx.accounts.payer.key();
        cap.instance_list = Vec::new();
        cap.remaining_instance_count = ctx.accounts.config.instance_limit;
        cap.addon_count = 0;
        cap.bump = ctx.bumps.captain;
        Ok(())
    }
    
    pub fn buy_addon(ctx: Context<BuyAddOn>) -> Result<()> {
        let price  = &ctx.accounts.config.addon_price;
        transfer_lamports(
            &ctx.accounts.payer,
            &ctx.accounts.treasury,
            &ctx.accounts.system_program,
            price
        )?;

        let add_on = &mut ctx.accounts.add_on;
        add_on.captain = ctx.accounts.captain.key();
        add_on.limit = ctx.accounts.config.addon_limit;
        add_on.price = *price;
        add_on.bump = ctx.bumps.add_on;

        let cap = &mut ctx.accounts.captain;
        cap.remaining_instance_count = cap.remaining_instance_count.saturating_add(add_on.limit);
        cap.addon_count = cap.addon_count.saturating_add(1);
        Ok(())
    }

    pub fn create_instance(
        ctx: Context<CreateInstance>,
        instance_type: InstanceType,
        name: String,
        price: u64,
        consumers: Vec<Pubkey>,
        whitelist: Vec<Pubkey>,
    ) -> Result<()> {
        require!(whitelist.len() <= 200, ErrorCode::LimitExceeded);

        // Enforce creation rules
        match instance_type {
            InstanceType::Public => { /* anyone can create */ }
            InstanceType::Private | InstanceType::Whitelisted => {
                only_manager(&ctx.accounts.config, &ctx.accounts.creator)?;
            }
            InstanceType::Paid => {
                let mut ok = false;

                if let Some(_admin) = ctx.accounts.admin.as_ref() {
                    if _admin.active && _admin.owner == ctx.accounts.creator.key() {ok = true;}
                }
                if !ok {
                    if let Some(_cap) = ctx.accounts.captain.as_ref() {
                        if _cap.owner == ctx.accounts.creator.key() && _cap.remaining_instance_count > 0 {
                            ok = true;
                        }
                    }
                }
                require!(ok, ErrorCode::NotAuthorized);

                if let Some(_cap) = ctx.accounts.captain.as_deref_mut() {
                    if _cap.owner == ctx.accounts.creator.key() {
                        _cap.remaining_instance_count -= 1;
                    }
                }


            }
        }

        // Initialize instance
        ctx.accounts.config.instance_ids = ctx.accounts.config.instance_ids.saturating_add(1);

        let inst = &mut ctx.accounts.instance;
        inst.instance_type = instance_type;
        inst.name = name.to_string();
        inst.price = price;
        inst.owner = ctx.accounts.creator.key();
        inst.instance_id = ctx.accounts.config.instance_ids;
        inst.instance_treasury = ctx.accounts.instance_treasury.key();
        inst.consumers = consumers;
        inst.whitelist = whitelist;
        inst.bump = ctx.bumps.instance;

        // Track in creator lists
        if let Some(_admin) = ctx.accounts.admin.as_deref_mut() {
            if _admin.owner == ctx.accounts.creator.key() {
                require!(_admin.instance_list.len() < 200, ErrorCode::InstanceListFull);
                _admin.instance_list.push(inst.key());
            }
        }
        if let Some(_cap) = ctx.accounts.captain.as_deref_mut() {
            if _cap.owner == ctx.accounts.creator.key() {
                require!(_cap.instance_list.len() < 200, ErrorCode::InstanceListFull);
                _cap.instance_list.push(inst.key());
            }
        }

        Ok(())
    }

    pub fn set_private_instance(ctx: Context<SetInstance>, wallet: Pubkey) -> Result<()> {
        only_manager(&ctx.accounts.config, &ctx.accounts.manager)?;
        require!(ctx.accounts.instance.consumers.len() < 200, ErrorCode::LengthExceeded);
        ctx.accounts.instance.consumers.push(wallet);
        Ok(())
    }

    pub fn set_whitelist(ctx: Context<SetInstance>, wallet: Pubkey) -> Result<()> {
        only_manager(&ctx.accounts.config, &ctx.accounts.manager)?;
        require!(ctx.accounts.instance.whitelist.len() < 200, ErrorCode::LengthExceeded);
        ctx.accounts.instance.whitelist.push(wallet);
        Ok(())
    }

    pub fn claim_instance(ctx: Context<ClaimInstance>) -> Result<()> {

        let inst = &mut ctx.accounts.instance;
        let claimer_key = ctx.accounts.claimer.key();
        require!(inst.consumers.len() < 200, ErrorCode::LengthExceeded);

        match inst.instance_type {
            InstanceType::Public => {}
            InstanceType::Private => {
                return err!(ErrorCode::NotManager);
            }
            InstanceType::Whitelisted => {
                require!(inst.whitelist.iter().any(|w| *w == claimer_key), ErrorCode::NotAuthorized);
            }
            InstanceType::Paid => {
                transfer_lamports(
                    &ctx.accounts.claimer,
                    &ctx.accounts.instance_treasury,
                    &ctx.accounts.system_program,
                    &inst.price,
                )?;
            }
        }
        if inst.consumers.iter().all(|claimer| *claimer != claimer_key) {
            inst.consumers.push(claimer_key);
        }

        Ok(())
    }

    pub fn withdraw_global_treasury(
        ctx: Context<WithdrawFromTreasury>, 
        lamports: u64
    ) -> Result<()> {
        only_manager(&ctx.accounts.config, &ctx.accounts.manager)?;
        require!(ctx.accounts.treasury.lamports() >= lamports, ErrorCode::InsufficientFunds);

        let ix = system_instruction::transfer(
            &ctx.accounts.treasury.key(),
            &ctx.accounts.manager.key(),
            lamports,
        );
        let account_infos = [
                ctx.accounts.treasury.to_account_info(),
                ctx.accounts.manager.to_account_info(),
                ctx.accounts.system_program.to_account_info()
        ];
        let signer_seeds: &[&[u8]] = &[b"global_treasury", &[ctx.bumps.treasury]];

        invoke_signed(&ix, &account_infos, &[signer_seeds]);
        Ok(())
    }

    pub fn withdraw_Instance_treasury(
        ctx: Context<WithdrawFromInstanceTreasury>, 
        lamports: u64
    ) -> Result<()> {
        let inst = &mut ctx.accounts.instance;
        require!(ctx.accounts.treasury.lamports() >= lamports, ErrorCode::InsufficientFunds);

        let ix = system_instruction::transfer(
            &ctx.accounts.treasury.key(),
            &ctx.accounts.claimer.key(),
            lamports,
        );
        let account_infos = [
                ctx.accounts.treasury.to_account_info(),
                ctx.accounts.claimer.to_account_info(),
                ctx.accounts.system_program.to_account_info()
        ];
        let signer_seeds: &[&[u8]] = &[b"global_treasury", &[ctx.bumps.treasury]];

        invoke_signed(&ix, &account_infos, &[signer_seeds]);
        Ok(())
    }

}



/* --------------------------------------------------------------------- */
/* ----------------------- Accounts & Validation ----------------------- */
/* --------------------------------------------------------------------- */
#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,

    #[account(
        init,
        payer = manager,
        space = ANCHOR_DISCRIMINATOR + Config::INIT_SPACE,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = manager,
        space = ANCHOR_DISCRIMINATOR + AdminRequest::INIT_SPACE,
        seeds = [b"requests"],
        bump,
    )]
    pub requests: Account<'info, AdminRequest>,

    #[account(mut, seeds = [b"global_treasury"], bump)]
    /// CHECK: Will be created via CPI as a system-owned account with 0 space
    pub treasury: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct SetConfig<'info> {
    pub manager: Signer<'info>,
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
}

#[derive(Accounts)]
pub struct GlobalTreasuryConfig<'info> {
    pub manager: Signer<'info>,
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"global_treasury"], bump)]
    pub treasury: SystemAccount<'info>,
}

#[derive(Accounts)]
pub struct WithdrawFromTreasury<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    
    #[account(mut, seeds = [b"global_treasury"], bump)]
    pub treasury: SystemAccount<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct WithdrawFromInstanceTreasury<'info> {
    #[account(mut)]
    pub claimer: Signer<'info>,

    #[account(mut, seeds = [b"instance", &instance.name.as_bytes()], bump = instance.bump)]
    pub instance: Account<'info, Instance>,

    #[account(mut, seeds = [b"instance_treasury"], bump)]
    pub treasury: SystemAccount<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct RequestAdmin<'info> {
    #[account(mut)]
    pub requester: Signer<'info>,
    #[account(mut, seeds = [b"requests"], bump = requests.bump)]
    pub requests: Account<'info, AdminRequest>,
}

#[derive(Accounts)]
#[instruction(wallet: Pubkey)]
pub struct ApproveAdmin<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,

    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(
        mut, seeds = [b"requests"], 
        bump = requests.bump,
        // only allow closing when there are no pending requests
        constraint = requests.requests.is_empty(),
        close = manager
    )]
    pub requests: Account<'info, AdminRequest>,

     #[account( 
        init, 
        payer = manager, 
        space = 8 + AdminAccount::INIT_SPACE,
        seeds = [b"admin", wallet.as_ref()], 
        bump,
    )]
    pub admin: Account<'info, AdminAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RejectAdmin<'info> {
    pub manager: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"requests"], bump = requests.bump)]
    pub requests: Account<'info, AdminRequest>,
}


#[derive(Accounts)]
pub struct SetAdminStatus<'info> {
    pub manager: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"admin", admin.owner.as_ref()], bump = admin.bump)]
    pub admin: Account<'info, AdminAccount>,
}

#[derive(Accounts)]
pub struct BuyCaptainship<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"global_treasury"], bump)]
    pub treasury: SystemAccount<'info>,
    
    #[account(
        init,
        payer = payer,
        seeds = [b"captain", payer.key().as_ref()],
        bump,
        space = 8 + CaptainAccount::INIT_SPACE,
    )]
    pub captain: Account<'info, CaptainAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyAddOn<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"global_treasury"], bump)]
    pub treasury: SystemAccount<'info>,
    #[account(mut, seeds = [b"captain", payer.key().as_ref()], bump = captain.bump)]
    pub captain: Account<'info, CaptainAccount>,
    #[account(
        init,
        payer = payer,
        space = ANCHOR_DISCRIMINATOR + AddOn::INIT_SPACE,
        seeds = [b"addon", captain.key().as_ref(), &captain.addon_count.to_le_bytes()],
        bump,
    )]
    pub add_on: Account<'info, AddOn>,
    pub system_program: Program<'info, System>,

}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateInstance<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,

    // Optional paths; validated in instruction logic
    pub admin: Option<Account<'info, AdminAccount>>,
    pub captain: Option<Account<'info, CaptainAccount>>,

    #[account(
        init,
        payer = creator,
        space = ANCHOR_DISCRIMINATOR + Instance::INIT_SPACE,
        seeds = [b"instance", name.as_bytes()],
        bump,
    )]
    pub instance: Account<'info, Instance>,

    #[account(mut, seeds = [b"instance_treasury"], bump)]
    /// CHECK: Will be created via CPI as a system-owned account with 0 space
    pub instance_treasury: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimInstance<'info> {
    #[account(mut)]
    pub claimer: Signer<'info>,
    #[account(mut, seeds = [b"instance", &instance.name.as_bytes()], bump = instance.bump)]
    pub instance: Account<'info, Instance>,
    #[account(mut, seeds = [b"instance_treasury"], bump)]
    pub instance_treasury: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct SetInstance<'info> {
    pub manager: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(mut, seeds = [b"instance", &instance.name.as_bytes()], bump = instance.bump)]
    pub instance: Account<'info, Instance>,
    pub system_program: Program<'info, System>,
}

/* --------------------------------------------------------------------- */
/* ---------------------------- State Types ---------------------------- */
/* --------------------------------------------------------------------- */
#[account]
#[derive(InitSpace)]
pub struct Config {
    pub owner: Pubkey,
    #[max_len(20)]
    pub name: String,
    #[max_len(64)]
    pub title: String,
    pub instance_ids: u64,
    pub instance_price: u64, // in lamports
    pub addon_price: u64, // in lamports
    pub instance_limit: u16,
    pub addon_limit: u16,
    pub treasury: Pubkey,
    pub bump: u8,
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Portfolio{
    pub wallet: Pubkey,

    #[max_len(128)]
    pub uri: String
}

#[account]
#[derive(InitSpace)]
pub struct AdminRequest{
    #[max_len(100)]
    pub requests: Vec<Portfolio>,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AdminAccount {
    pub active: bool,
    pub owner: Pubkey,
    #[max_len(200)]
    pub instance_list: Vec<Pubkey>,
    pub bump: u8,
}


#[account]
#[derive(InitSpace)]
pub struct CaptainAccount {
    pub owner: Pubkey,
    #[max_len(200)]
    pub instance_list: Vec<Pubkey>,
    pub remaining_instance_count: u16,
    pub addon_count: u16,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AddOn {
    pub captain: Pubkey,
    pub limit: u16,
    pub price: u64,
    pub bump: u8,
}

#[derive(InitSpace, AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum InstanceType {
    Private,
    Whitelisted,
    Paid,
    Public,
}

#[account]
#[derive(InitSpace)]
pub struct Instance {
    pub owner: Pubkey,
    #[max_len(30)]
    pub name: String,
    pub instance_id: u64,
    pub price: u64,
    pub instance_type: InstanceType,
    #[max_len(200)]
    pub consumers: Vec<Pubkey>,
    #[max_len(200)]
    pub whitelist: Vec<Pubkey>,
    pub instance_treasury: Pubkey,
    pub bump: u8,
}

/* ----------------------------- Utilities ---------------------------- */
fn only_manager(cfg: &Account<Config>, signer: &Signer) -> Result<()> {
    require!(cfg.owner == signer.key(), ErrorCode::NotManager);
    Ok(())
}

fn transfer_lamports<'info>(
    from: &Signer<'info>,
    to: &SystemAccount<'info>,
    system_program: &Program<'info, System>,
    amount: &u64
) -> Result<()> {
    let ix = system_instruction::transfer(&from.key(), &to.key(), *amount);
    invoke(&ix, &[
        from.to_account_info(),
        to.to_account_info(),
        system_program.to_account_info(),
    ])?;
    Ok(())
}

/* ------------------------------ Errors ------------------------------ */
#[error_code]
pub enum ErrorCode {
    #[msg("Length Exceeded")]
    LengthExceeded,
    #[msg("Limit Exceeded")]
    LimitExceeded,
    #[msg("Only Manager")]
    NotManager,
    #[msg("Not authorized")]
    NotAuthorized,
    #[msg("Already requested")]
    AlreadyRequested,
    #[msg("Request list full")]
    RequestListFull,
    #[msg("Request not found")]
    RequestNotFound,
    #[msg("Instance list full")]
    InstanceListFull,
    #[msg("Insufficient Funds")]
    InsufficientFunds
}
