#![allow(warnings)]
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::{invoke, invoke_signed};
use anchor_lang::solana_program::system_instruction;
use anchor_lang::system_program;
use anchor_lang::system_program::Transfer;

declare_id!("D2s8xbXyKVEePW2KH8Kcn1wySnK2rzAd6eVb42WoYXHC");

// Anchor programs always use 8 bits for the discriminator
pub const ANCHOR_DISCRIMINATOR: usize = 8;

#[program]
pub mod cluster_x {

    use super::*;

    pub fn init_config(
        ctx: Context<InitConfig>,
        name: String,
        title: String,
        instance_limit: u16,
        addon_limit: u16,
    ) -> Result<()> {
        require!(name.len() <= 20, ErrorCode::LimitExceeded); 
        require!(title.len() <= 20, ErrorCode::LimitExceeded); 

        let cfg = &mut ctx.accounts.config;
        cfg.owner = ctx.accounts.manager.key();
        cfg.name = name;
        cfg.title = title;
        cfg.instance_ids = 0;
        cfg.instance_limit = instance_limit;
        cfg.addon_limit = addon_limit;

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
        addon_limit: u16
    ) -> Result<()> {
        only_manager(&ctx.accounts.config, &ctx.accounts.manager)?;
        ctx.accounts.config.addon_limit = addon_limit;
        Ok(())
    }

    pub fn set_instance(
        ctx: Context<SetConfig>, 
        instance_limit: u16
    ) -> Result<()> {
        only_manager(&ctx.accounts.config, &ctx.accounts.manager)?;
        ctx.accounts.config.instance_limit = instance_limit;
        Ok(())
    }

    pub fn request_admin(
        ctx: Context<RequestAdmin>, 
        uri: String
    ) -> Result<()> {
        require!(uri.len() < 128, ErrorCode::LimitExceeded);
        let req = &mut ctx.accounts.requests;

        if req.requests.iter().any(|r|r.wallet == ctx.accounts.requester.key()) {
            return err!(ErrorCode::AlreadyRequested);
        }
        require!(req.requests.len() < 100, ErrorCode::ListIsFull);

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

    pub fn claim_captainship(ctx: Context<BuyCaptainship>) -> Result<()> {
        let cap = &mut ctx.accounts.captain;
        cap.owner = ctx.accounts.payer.key();
        cap.instance_list = Vec::new();
        cap.remaining_limit = ctx.accounts.config.instance_limit;
        cap.addon_count = 0;
        cap.bump = ctx.bumps.captain;
        Ok(())
    }
    
    pub fn claim_addon(ctx: Context<BuyAddOn>) -> Result<()> {
        let cap = &mut ctx.accounts.captain;
        cap.remaining_limit = cap.remaining_limit.saturating_add(ctx.accounts.config.addon_limit);
        cap.addon_count = cap.addon_count.saturating_add(1);
        Ok(())
    }

    pub fn create_instance(
        ctx: Context<CreateInstance>,
        instance_type: InstanceType,
        name: String,
        days: i64,
        consumers: Vec<Pubkey>,
        whitelist: Vec<Pubkey>,
    ) -> Result<()> {
        require!(whitelist.len() <= 200, ErrorCode::LimitExceeded);

        if let InstanceType::Private | InstanceType::Whitelisted = instance_type {
            only_manager(&ctx.accounts.config, &ctx.accounts.creator)?;            
        }

        if instance_type == InstanceType::Portfolio {
            let mut ok = false;

            if let Some(_admin) = ctx.accounts.admin.as_ref() {
                if _admin.active && _admin.owner == ctx.accounts.creator.key() {ok = true;}
            }
            if !ok {
                if let Some(_cap) = ctx.accounts.captain.as_ref() {
                    if _cap.owner == ctx.accounts.creator.key() && _cap.remaining_limit > 0 {
                        ok = true;
                    }
                }
            }
            require!(ok, ErrorCode::NotAuthorized);

            if let Some(_cap) = ctx.accounts.captain.as_deref_mut() {
                if _cap.owner == ctx.accounts.creator.key() {
                    _cap.remaining_limit -= 1;
                }
            }
        }

        // Initialize instance
        ctx.accounts.config.instance_ids = ctx.accounts.config.instance_ids.saturating_add(1);

        let inst = &mut ctx.accounts.instance;
        inst.instance_type = instance_type;
        inst.name = name.to_string();
        inst.owner = ctx.accounts.creator.key();
        inst.instance_id = ctx.accounts.config.instance_ids;
        inst.consumers = consumers;
        inst.whitelist = whitelist;
        inst.bump = ctx.bumps.instance;

        if inst.instance_type == InstanceType::Portfolio {
            let now = Clock::get()?.unix_timestamp;
            let day = 24_i64 * 60 * 60;
            let ttl = days.checked_mul(day).ok_or(ErrorCode::Overflow)?;
            inst.expires_at = now.checked_add(ttl).ok_or(ErrorCode::Overflow)?;
        }

        // Track in creator lists
        if let Some(_admin) = ctx.accounts.admin.as_deref_mut() {
            if _admin.owner == ctx.accounts.creator.key() {
                require!(_admin.instance_list.len() < 200, ErrorCode::ListIsFull);
                _admin.instance_list.push(inst.key());
            }
        }
        if let Some(_cap) = ctx.accounts.captain.as_deref_mut() {
            if _cap.owner == ctx.accounts.creator.key() {
                require!(_cap.instance_list.len() < 200, ErrorCode::ListIsFull);
                _cap.instance_list.push(inst.key());
            }
        }

        Ok(())
    }

    pub fn grant_private_instance(ctx: Context<SetInstance>, wallet: Pubkey) -> Result<()> {
        only_manager(&ctx.accounts.config, &ctx.accounts.manager)?;
        require!(ctx.accounts.instance.consumers.len() < 200, ErrorCode::LimitExceeded);
        ctx.accounts.instance.consumers.push(wallet);
        Ok(())
    }

    pub fn add_whitelist(ctx: Context<SetInstance>, wallet: Pubkey) -> Result<()> {
        only_manager(&ctx.accounts.config, &ctx.accounts.manager)?;
        require!(ctx.accounts.instance.whitelist.len() < 200, ErrorCode::LimitExceeded);
        ctx.accounts.instance.whitelist.push(wallet);
        Ok(())
    }

    pub fn claim_instance(ctx: Context<ClaimInstance>) -> Result<()> {
        let inst = &mut ctx.accounts.instance;
        let claimer_key = ctx.accounts.claimer.key();
        require!(inst.consumers.len() < 200, ErrorCode::LimitExceeded);

        match inst.instance_type {
            InstanceType::Public => {}
            InstanceType::Private => {return err!(ErrorCode::NotManager);}
            InstanceType::Whitelisted => {
                require!(inst.whitelist.iter().any(|w| *w == claimer_key), ErrorCode::NotAuthorized);
            }
            InstanceType::Portfolio => {
                let now = Clock::get()?.unix_timestamp;
                require!(now <= inst.expires_at, ErrorCode::Expired);
            }
        }
        if inst.consumers.iter().all(|claimer| *claimer != claimer_key) {
            inst.consumers.push(claimer_key);
        }

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

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetConfig<'info> {
    pub manager: Signer<'info>,
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
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

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimInstance<'info> {
    #[account(mut)]
    pub claimer: Signer<'info>,
    #[account(mut, seeds = [b"instance", &instance.name.as_bytes()], bump = instance.bump)]
    pub instance: Account<'info, Instance>,
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
    pub instance_limit: u16,
    pub addon_limit: u16,
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
    pub remaining_limit: u16,
    pub addon_count: u16,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AddOn {
    pub captain: Pubkey,
    pub limit: u16,
    pub bump: u8,
}

#[derive(InitSpace, AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum InstanceType {
    Private,
    Whitelisted,
    Portfolio,
    Public,
}

#[account]
#[derive(InitSpace)]
pub struct Instance {
    pub owner: Pubkey,
    #[max_len(30)]
    pub name: String,
    pub instance_id: u64,
    pub expires_at: i64,        // unix timestamp (seconds)
    pub instance_type: InstanceType,
    #[max_len(200)]
    pub consumers: Vec<Pubkey>,
    #[max_len(200)]
    pub whitelist: Vec<Pubkey>,
    pub bump: u8,
}

/* -------------------------------------------------------------------- */
/* ----------------------------- Utilities ---------------------------- */
/* -------------------------------------------------------------------- */
fn only_manager(cfg: &Account<Config>, signer: &Signer) -> Result<()> {
    require!(cfg.owner == signer.key(), ErrorCode::NotManager);
    Ok(())
}

/* -------------------------------------------------------------------- */
/* ------------------------------ Errors ------------------------------ */
/* -------------------------------------------------------------------- */
#[error_code]
pub enum ErrorCode {
    #[msg("Limit Exceeded")]
    LimitExceeded,
    #[msg("Only Manager")]
    NotManager,
    #[msg("Not authorized")]
    NotAuthorized,
    #[msg("Already requested")]
    AlreadyRequested,
    #[msg("List Is Full")]
    ListIsFull,
    #[msg("Request not found")]
    RequestNotFound,
    #[msg("Insufficient Funds")]
    InsufficientFunds,
    #[msg("Overflow")]
    Overflow,
    #[msg("Expired")]
    Expired
}
