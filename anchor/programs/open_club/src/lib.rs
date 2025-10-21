#![allow(warnings)]
#![allow(deprecated)]
use anchor_lang::prelude::*;

declare_id!("H8RjKyUCMdkSbUmQFCtpcAAfT4E2tjL7LfswjTm38Vz3");

// Anchor programs always use 8 bits for the discriminator
pub const ANCHOR_DISCRIMINATOR: usize = 8;

#[program]
pub mod open_club {

    use super::*;

    pub fn init_config(
        ctx: Context<InitConfig>,
        name: String,
        title: String,
        instance_limit: u16,
        addon_limit: u16,
    ) -> Result<()> {
        require!(!ctx.accounts.config.initialized, ErrorCode::AlreadyInitialized); 
        require!(name.len() <= 20, ErrorCode::LimitExceeded); 
        require!(title.len() <= 64, ErrorCode::LimitExceeded); 

        let cfg = &mut ctx.accounts.config;
        cfg.bump = ctx.bumps.config;
        cfg.manager = ctx.accounts.manager.key();
        cfg.name = name;
        cfg.title = title;
        cfg.initialized = true;

        let stt = &mut ctx.accounts.info;
        stt.instance_ids = 0;
        stt.instance_limit = instance_limit;
        stt.addon_limit = addon_limit;
        stt.admin_requests = Vec::new();

        Ok(())
    }

    pub fn set_manager(
        ctx: Context<SetConfig>, 
        new_manager: Pubkey
    ) -> Result<()> {
        require!(ctx.accounts.config.manager.key() != new_manager.key(), ErrorCode::ExistingValue);
        is_manager(&ctx.accounts.config, &ctx.accounts.manager)?;
        ctx.accounts.config.manager = new_manager;
        Ok(())
    }

    pub fn set_instance_limit(
        ctx: Context<SetInfo>, 
        instance_limit: u16
    ) -> Result<()> {
        is_manager(&ctx.accounts.config, &ctx.accounts.signer)?;
        ctx.accounts.info.instance_limit = instance_limit;
        Ok(())
    }

    pub fn set_addon_limit(
        ctx: Context<SetInfo>, 
        addon_limit: u16
    ) -> Result<()> {
        is_manager(&ctx.accounts.config, &ctx.accounts.signer)?;
        ctx.accounts.info.addon_limit = addon_limit;
        Ok(())
    }

    pub fn request_admin(ctx: Context<SetInfo>) -> Result<()> {
        let stt = &mut ctx.accounts.info;

        if stt.admin_requests.iter().any(|r|*r == ctx.accounts.signer.key()) {
            return err!(ErrorCode::AlreadyRequested);            
        }
        require!(stt.admin_requests.len() < 100, ErrorCode::ListIsFull);

        stt.admin_requests.push(ctx.accounts.signer.key());
        Ok(())
    }

    pub fn approve_admin(
        ctx: Context<ApproveAdmin>, 
        wallet: Pubkey
    ) -> Result<()> {
        is_manager(&ctx.accounts.config, &ctx.accounts.manager)?;

        // Remove pending request if present
        let stt = &mut ctx.accounts.info;
        if let Some(pos) = stt.admin_requests.iter().position(|w| *w == wallet) {
            stt.admin_requests.swap_remove(pos);
        }

        let admin = &mut ctx.accounts.admin;
        admin.active = true;
        admin.wallet = wallet;
        admin.instance_list = Vec::new();
        admin.bump = ctx.bumps.admin;
        Ok(())
    }

    pub fn reject_admin(ctx: Context<RejectAdmin>, wallet: Pubkey) -> Result<()> {
        is_manager(&ctx.accounts.config, &ctx.accounts.manager)?;

        let stt = &mut ctx.accounts.info;
        if let Some(pos) = stt.admin_requests.iter().position(|w| *w == wallet) {
            stt.admin_requests.swap_remove(pos);
            return Ok(());
        }
        err!(ErrorCode::RequestNotFound)
    }

    pub fn set_admin_status(ctx: Context<AlterAdmin>, status: bool) -> Result<()> {
        is_manager(&ctx.accounts.config, &ctx.accounts.manager)?;
        ctx.accounts.admin.active = status;
        Ok(())
    }

    pub fn claim_captainship(ctx: Context<InitCaptain>) -> Result<()> {
        let cap = &mut ctx.accounts.captain;
        cap.wallet = ctx.accounts.payer.key();
        cap.instance_list = Vec::new();
        cap.remaining_limit = ctx.accounts.info.instance_limit;
        cap.addon_count = 0;
        cap.bump = ctx.bumps.captain;
        Ok(())
    }
    
    pub fn claim_addon(ctx: Context<GetAddOn>) -> Result<()> {
        let cap = &mut ctx.accounts.captain;
        cap.remaining_limit = cap.remaining_limit.saturating_add(ctx.accounts.info.addon_limit);
        cap.addon_count = cap.addon_count.saturating_add(1);
        Ok(())
    }

    pub fn create_instance(
        ctx: Context<CreateInstance>,
        instance_type: InstanceType,
        name: String,
        days: i64,
    ) -> Result<()> {
        if let InstanceType::Private | InstanceType::Whitelisted = instance_type {
            is_manager(&ctx.accounts.config, &ctx.accounts.creator)?;            
        }

        if instance_type == InstanceType::Portfolio {
            let mut ok = false;

            if let Some(_admin) = ctx.accounts.admin.as_ref() {
                if _admin.active && _admin.wallet == ctx.accounts.creator.key() {ok = true;}
            }
            if !ok {
                if let Some(_cap) = ctx.accounts.captain.as_ref() {
                    if _cap.wallet == ctx.accounts.creator.key() && _cap.remaining_limit > 0 {
                        ok = true;
                    }
                }
            }
            require!(ok, ErrorCode::NotAuthorized);

            if let Some(_cap) = ctx.accounts.captain.as_deref_mut() {
                if _cap.wallet == ctx.accounts.creator.key() {
                    _cap.remaining_limit -= 1;
                }
            }
        }

        // Initialize instance
        ctx.accounts.info.instance_ids = ctx.accounts.info.instance_ids.saturating_add(1);

        let inst = &mut ctx.accounts.instance;
        inst.instance_type = instance_type;
        inst.name = name.to_string();
        inst.owner = ctx.accounts.creator.key();
        inst.instance_id = ctx.accounts.info.instance_ids;
        inst.consumers = Vec::new();
        inst.whitelist = Vec::new();
        inst.bump = ctx.bumps.instance;

        if inst.instance_type == InstanceType::Portfolio {
            let now = Clock::get()?.unix_timestamp;
            let day = 24_i64 * 60 * 60;
            let ttl = days.checked_mul(day).ok_or(ErrorCode::Overflow)?;
            inst.expires_at = now.checked_add(ttl).ok_or(ErrorCode::Overflow)?;
        }

        // Track in creator lists
        if let Some(_admin) = ctx.accounts.admin.as_deref_mut() {
            if _admin.wallet == ctx.accounts.creator.key() {
                require!(_admin.instance_list.len() < 200, ErrorCode::ListIsFull);
                _admin.instance_list.push(inst.key());
            }
        }
        if let Some(_cap) = ctx.accounts.captain.as_deref_mut() {
            if _cap.wallet == ctx.accounts.creator.key() {
                require!(_cap.instance_list.len() < 200, ErrorCode::ListIsFull);
                _cap.instance_list.push(inst.key());
            }
        }

        Ok(())
    }

    pub fn grant_private_instance(ctx: Context<SetInstance>, wallet: Pubkey) -> Result<()> {
        is_manager(&ctx.accounts.config, &ctx.accounts.manager)?;
        let inst = &mut ctx.accounts.instance;

        require!(inst.instance_type == InstanceType::Private, ErrorCode::NotAuthorized);
        require!(inst.consumers.len() < 200, ErrorCode::LimitExceeded);
        require!(!inst.consumers.iter().any(|w| *w == wallet), ErrorCode::ExistingValue);

        inst.consumers.push(wallet);
        Ok(())
    }

    pub fn add_whitelist(ctx: Context<SetInstance>, wallet: Pubkey) -> Result<()> {
        is_manager(&ctx.accounts.config, &ctx.accounts.manager)?;
        let inst = &mut ctx.accounts.instance;

        require!(inst.instance_type == InstanceType::Whitelisted, ErrorCode::NotAuthorized);
        require!(inst.whitelist.len() < 200, ErrorCode::LimitExceeded);
        require!(!inst.consumers.iter().any(|w| *w == wallet), ErrorCode::ExistingValue);

        inst.whitelist.push(wallet);
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

/* ------------------------------------------------------ */
/* ----------------------- Config ----------------------- */
/* ------------------------------------------------------ */
#[account]
#[derive(InitSpace)]
pub struct Config {
    pub initialized: bool,
    pub manager: Pubkey,
    #[max_len(20)]
    pub name: String,
    #[max_len(64)]
    pub title: String,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Info {
    pub instance_ids: u64,
    pub instance_limit: u16,
    pub addon_limit: u16,
    #[max_len(100)]
    pub admin_requests: Vec<Pubkey>,
    pub bump: u8,
}

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
        space = ANCHOR_DISCRIMINATOR + Info::INIT_SPACE,
        seeds = [b"info"],
        bump,
    )]
    pub info: Account<'info, Info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetConfig<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
}

#[derive(Accounts)]
pub struct SetInfo<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    pub config: Account<'info, Config>,

    #[account(mut, seeds = [b"info"], bump)]
    pub info: Account<'info, Info>,
}

/* ----------------------------------------------------- */
/* ----------------------- Admin ----------------------- */
/* ----------------------------------------------------- */
#[account]
#[derive(InitSpace)]
pub struct Admin {
    pub active: bool,
    pub wallet: Pubkey,
    #[max_len(200)]
    pub instance_list: Vec<Pubkey>,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct AlterAdmin<'info> {
    pub manager: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"admin", admin.wallet.as_ref()], bump = admin.bump)]
    pub admin: Account<'info, Admin>,
}

// RequestAdmin
#[derive(Accounts)]
#[instruction(wallet: Pubkey)]
pub struct ApproveAdmin<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(seeds = [b"info"], bump = info.bump)]
    pub info: Account<'info, Info>,

     #[account( 
        init, 
        payer = manager, 
        space = 8 + Admin::INIT_SPACE,
        seeds = [b"admin", wallet.as_ref()], 
        bump,
    )]
    pub admin: Account<'info, Admin>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RejectAdmin<'info> {
    pub manager: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(seeds = [b"info"], bump = info.bump)]
    pub info: Account<'info, Info>
}
/* ----------------------------------------------------------- */
/* ----------------------- Captainship ----------------------- */
/* ----------------------------------------------------------- */
#[account]
#[derive(InitSpace)] 
pub struct Captain {
    pub wallet: Pubkey,
    #[max_len(200)]
    pub instance_list: Vec<Pubkey>,
    pub remaining_limit: u16,
    pub addon_count: u16,
    pub bump: u8,
}

// InitCaptain
#[derive(Accounts)]
pub struct InitCaptain<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(seeds = [b"info"], bump = info.bump)]
    pub info: Account<'info, Info>,
    
    #[account(
        init,
        payer = payer,
        seeds = [b"captain", payer.key().as_ref()],
        bump,
        space = 8 + Captain::INIT_SPACE,
    )]
    pub captain: Account<'info, Captain>,
    pub system_program: Program<'info, System>,
}

// GetAddOn
#[derive(Accounts)]
pub struct GetAddOn<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(seeds = [b"info"], bump = info.bump)]
    pub info: Account<'info, Info>,
    #[account(mut, seeds = [b"captain", payer.key().as_ref()], bump = captain.bump)]
    pub captain: Account<'info, Captain>,
    pub system_program: Program<'info, System>,
}

/* -------------------------------------------------------- */
/* ----------------------- Instance ----------------------- */
/* -------------------------------------------------------- */
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

// CreateInstance
#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateInstance<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(seeds = [b"info"], bump = info.bump)]
    pub info: Account<'info, Info>,

    // Optional paths; validated in instruction logic
    pub admin: Option<Account<'info, Admin>>,
    pub captain: Option<Account<'info, Captain>>,

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

// ClaimInstance
#[derive(Accounts)]
pub struct ClaimInstance<'info> {
    #[account(mut)]
    pub claimer: Signer<'info>,
    #[account(mut, seeds = [b"instance", &instance.name.as_bytes()], bump = instance.bump)]
    pub instance: Account<'info, Instance>,
    pub system_program: Program<'info, System>,
}

// SetInstance
#[derive(Accounts)]

pub struct SetInstance<'info> {
    pub manager: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(mut, seeds = [b"instance", &instance.name.as_bytes()], bump = instance.bump)]
    pub instance: Account<'info, Instance>,
    pub system_program: Program<'info, System>,
}


/* -------------------------------------------------------------------- */
/* ----------------------------- Utilities ---------------------------- */
/* -------------------------------------------------------------------- */
fn is_manager(cfg: &Account<Config>, signer: &Signer) -> Result<()> {
    require!(cfg.manager == signer.key(), ErrorCode::NotManager);
    Ok(())
}

/* -------------------------------------------------------------------- */
/* ------------------------------ Errors ------------------------------ */
/* -------------------------------------------------------------------- */
#[error_code]
pub enum ErrorCode {
    #[msg("Config Already Initialized")]
    AlreadyInitialized,
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
    Expired,
    #[msg("Existing Value")]
    ExistingValue
}
