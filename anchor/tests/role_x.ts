import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { PublicKey, Keypair } from '@solana/web3.js'
import { ClusterX } from './../target/types/cluster_x'

import * as Util from './utils'

describe('cluster_x: end-to-end', () => {
  const program = anchor.workspace.ClusterX as Program<ClusterX>

  // Core PDAs (persist through suite)
  const [configPDA, configBump] = Util.PDA.config(program.programId)
  const [sttPDA, sttBump] = Util.PDA.settings(program.programId)

  // Actors
  const manager = Util.provider.wallet // typed in Anchor 0.31+
  let managerPub = manager.publicKey

  // Secondary actors
  let newManager: Keypair
  let admin_1: Keypair
  let admin_2: Keypair
  let admin_3: Keypair
  let captainUser: Keypair
  let randomUser: Keypair

  before(async () => {
    //
    newManager = new anchor.web3.Keypair()
    admin_1 = new anchor.web3.Keypair()
    admin_2 = new anchor.web3.Keypair()
    admin_3 = new anchor.web3.Keypair()
    captainUser = new anchor.web3.Keypair()
    randomUser = new anchor.web3.Keypair()
    //
    await Util.airdrop(newManager.publicKey, 2)
    await Util.airdrop(admin_1.publicKey, 2)
    await Util.airdrop(admin_2.publicKey, 2)
    await Util.airdrop(admin_3.publicKey, 2)
    await Util.airdrop(captainUser.publicKey, 2)
    await Util.airdrop(randomUser.publicKey, 2)
  })

  const fetchConfig = async () => await program.account.config.fetch(configPDA)
  const fetchSettings = async () => await program.account.settings.fetch(sttPDA)

  it('init_config: rejects overlong fields', async () => {
    await (async () => {
      try {
        const long = 'ABCDEFGHIJKLMNOPQRSTU' // 21
        await Util.fn.initConfig(program, managerPub, [long, 'OK', 1, 1])
      } catch (e) {
        Util.expectAnchorErr(e, 'LimitExceeded')
      }
    })()

    await (async () => {
      try {
        const too_long = '1234567890_2345678901_3456789012_4567890123_5678901234_6789012345' // 65 letters
        await Util.fn.initConfig(program, managerPub, ['OK', too_long, 1, 1])
      } catch (e) {
        Util.expectAnchorErr(e, 'LimitExceeded')
      }
    })()
  })

  it('init_config: Creates config and requests PDAs with canonical bumps', async () => {
    const [name, title] = ['ClusterX', 'Cluster X | AR_VR']
    await Util.fn.initConfig(program, managerPub, [name, title, 3, 2])

    const cfg = await fetchConfig()
    expect(cfg.owner.toBase58()).toEqual(managerPub.toBase58())
    expect(cfg.name).toEqual(name)
    expect(cfg.title).toEqual(title)
    expect(cfg.bump).toEqual(configBump)

    const stt = await fetchSettings()
    expect(stt.owner.toBase58()).toEqual(managerPub.toBase58())
    expect(stt.instanceLimit).toEqual(3)
    expect(stt.addonLimit).toEqual(2)
    expect(stt.instanceIds.toString()).toEqual('0')

    const reqs = await program.account.adminAccount.all()
    expect(reqs.length).toEqual(0)
  })

  it('init_config: Set Managers', async () => {
    const setManager = async (key_1: any, key_2: any) =>
      await program.methods.setManager(key_2).accounts({ manager: key_1 }).rpc()

    const ownerPub = async () => {
      const _tx = await fetchConfig()
      return _tx.owner.toBase58()
    }
    try {
      await setManager(managerPub, managerPub)
    } catch (e) {
      // Util.expectAnchorErr(e, "ExistingValue");
    }
    const checkManager = async (isNew: boolean) =>
      expect(await ownerPub()).toEqual(isNew ? newManager.publicKey.toBase58() : managerPub.toBase58())

    checkManager(false)
    await setManager(managerPub, newManager.publicKey)
    checkManager(true)
    await program.methods.setManager(managerPub).accounts({ manager: newManager.publicKey }).signers([newManager]).rpc()
    checkManager(false)
  })

  it('set_addon_limit and set_instance_limit: only manager can update limits', async () => {
    console.log('CLG_0')
    // await Util.fn.initConfig(program, managerPub, ['JDP', 'LAKSHMAN', 5, 3])
    // // Unauthorized attempt (random user)
    // console.log('CLG_1')

    // const FN1 = async (P: any, V: any, usr: any, s: boolean) =>
    //   s
    //     ? await P(V)?.accounts({ manager: usr?.publicKey })?.signers([usr])?.rpc()
    //     : await P(V)?.accounts({ manager: usr?.publicKey })?.rpc()

    // const setAddonLimit = async (vl: any, usr: any, s = true) => await FN1(program.methods.setAddonLimit, vl, usr, s)
    // console.log('CLG_2')

    // const setInstanceLimit = async (vl: any, usr: any, s = true) =>
    //   await FN1(program.methods.setInstanceLimit, vl, usr, s)

    // const getConfig = async () => {
    //   const vl = await fetchSettings()
    //   return [vl.instanceLimit, vl.addonLimit]
    // }
    // console.log('CLG_3')

    // let [I1, A1] = await getConfig()
    // expect(I1).toEqual(5)
    // expect(A1).toEqual(3)
    // try {
    //   await setInstanceLimit(9, randomUser)
    //   await setAddonLimit(9, randomUser)
    // } catch (e) {}
    // await setInstanceLimit(15, manager, false)
    // await setAddonLimit(10, manager, false)
    // console.log('CLG_4')
    // let [I2, A2] = await getConfig()
    // expect(I2).toEqual(15)
    // expect(A2).toEqual(10)
  })

  it('request_admin: queues applicant with URI, blocks duplicates and oversize', async () => {
    await Util.fn.initConfig(program, managerPub, ['JDP', 'LAKSHMAN', 15, 10])
    const reqs = async () => {
      const _tx = await fetchSettings()
      return _tx.adminRequests
    }
    // const reqAminL1 = async (requester) =>
    //   await program.methods.requestAdmin().accounts({ requester }).rpc();
    // const reqAmin = async (usr: any) =>
    //   await program.methods
    //     .requestAdmin()
    //     .accounts({ requester: usr.publicKey })
    //     .signers([usr])
    //     .rpc();

    // await program.methods.requestAdmin().accounts({ requester: managerPub }).signers([manager.payer]).rpc()
    // await program.methods.requestAdmin().accounts({ requester: admin_1.publicKey }).signers([admin_1]).rpc()

    // await reqAmin(admin_1);
    // await reqAmin(admin_2);
    // await reqAmin(admin_3);

    console.log({ cfg: await reqs() })

    // expect(after.requests.length).toEqual(1);
    // expect(after.requests[0].wallet.toBase58()).toEqual(
    //   adminApplicant.publicKey.toBase58()
    // );
    // expect(after.requests[0].uri).toEqual(okUri);

    // // Duplicate should fail
    // try {
    //   await program.methods
    //     .requestAdmin(okUri)
    //     .accounts({
    //       requester: adminApplicant.publicKey,
    //       requests: requestsPda,
    //     })
    //     .signers([adminApplicant])
    //     .rpc();
    //   expect.fail("Duplicate admin request should fail");
    // } catch (e) {
    //   expectAnchorErr(e, "AlreadyRequested");
    // }

    // // Oversize URI should fail
    // const bigUri = "x".repeat(129);
    // try {
    //   await program.methods
    //     .requestAdmin(bigUri)
    //     .accounts({ requester: randomUser.publicKey, requests: requestsPda })
    //     .signers([randomUser])
    //     .rpc();
    //   expect.fail("Oversize URI should fail");
    // } catch (e) {
    //   expectAnchorErr(e, "LimitExceeded");
    // }
  })

  //   // it("approve_admin: manager removes pending entry and inits admin PDA", async () => {
  //   //   const [adminPda, adminBump] = pda.admin(
  //   //     program.programId,
  //   //     adminApplicant.publicKey
  //   //   );

  //   //   await program.methods
  //   //     .approveAdmin(adminApplicant.publicKey)
  //   //     .accounts({
  //   //       manager: managerPub,
  //   //       config: configPda,
  //   //       requests: requestsPda,
  //   //       admin: adminPda,
  //   //       systemProgram: SP,
  //   //     })
  //   //     .rpc();

  //   //   const adminAcc = await program.account.adminAccount.fetch(adminPda);
  //   //   expect(adminAcc.active).toEqual(true);
  //   //   expect(adminAcc.owner.toBase58()).toEqual(
  //   //     adminApplicant.publicKey.toBase58()
  //   //   );
  //   //   expect(adminAcc.instanceList.length).toEqual(0);
  //   //   expect(adminAcc.bump).toEqual(adminBump);

  //   //   const reqs = await program.account.adminRequest.fetch(requestsPda);
  //   //   expect(reqs.requests.length).toEqual(0);
  //   // });

  //   // it("reject_admin: manager can remove non-empty queue entries or fail if not found", async () => {
  //   //   // Recreate a request
  //   //   await program.methods
  //   //     .requestAdmin("ok")
  //   //     .accounts({ requester: randomUser.publicKey, requests: requestsPda })
  //   //     .signers([randomUser])
  //   //     .rpc();

  //   //   // Reject succeeds
  //   //   await program.methods
  //   //     .rejectAdmin(randomUser.publicKey)
  //   //     .accounts({
  //   //       manager: managerPub,
  //   //       config: configPda,
  //   //       requests: requestsPda,
  //   //     })
  //   //     .rpc();

  //   //   // Reject again should fail with RequestNotFound
  //   //   try {
  //   //     await program.methods
  //   //       .rejectAdmin(randomUser.publicKey)
  //   //       .accounts({
  //   //         manager: managerPub,
  //   //         config: configPda,
  //   //         requests: requestsPda,
  //   //       })
  //   //       .rpc();
  //   //     expect.fail("Rejecting non-existent request should fail");
  //   //   } catch (e) {
  //   //     expectAnchorErr(e, "RequestNotFound");
  //   //   }
  //   // });

  //   // it("set_manager: only current manager can transfer control", async () => {
  //   //   // Unauthorized transfer by random user
  //   //   try {
  //   //     await program.methods
  //   //       .setManager(newManager.publicKey)
  //   //       .accounts({ manager: randomUser.publicKey, config: configPda })
  //   //       .signers([randomUser])
  //   //       .rpc();
  //   //     expect.fail("Only manager can transfer control");
  //   //   } catch (e) {
  //   //     expectAnchorErr(e, "NotManager");
  //   //   }

  //   //   // Authorized transfer
  //   //   await program.methods
  //   //     .setManager(newManager.publicKey)
  //   //     .accounts({ manager: managerPub, config: configPda })
  //   //     .rpc();

  //   //   // Update the in-memory manager for following tests
  //   //   managerPub = newManager.publicKey;

  //   //   const cfg = await program.account.config.fetch(configPda);
  //   //   expect(cfg.owner.toBase58()).to.eq(newManager.publicKey.toBase58());
  //   // });

  //   // it("claim_captainship: initializes captain with quota from config.instance_limit", async () => {
  //   //   const [capPda, capBump] = pda.captain(
  //   //     program.programId,
  //   //     captainUser.publicKey
  //   //   );

  //   //   await program.methods
  //   //     .claimCaptainship()
  //   //     .accounts({
  //   //       payer: captainUser.publicKey,
  //   //       config: configPda,
  //   //       captain: capPda,
  //   //       systemProgram: SP,
  //   //     })
  //   //     .signers([captainUser])
  //   //     .rpc();

  //   //   const cap = await program.account.captainAccount.fetch(capPda);
  //   //   expect(cap.owner.toBase58()).to.eq(captainUser.publicKey.toBase58());
  //   //   expect(cap.instanceList.length).to.eq(0);
  //   //   expect(cap.remainingLimit).to.eq(5); // updated earlier via set_instance_limit
  //   //   expect(cap.addonCount).to.eq(0);
  //   //   expect(cap.bump).to.eq(capBump);
  //   // });

  //   // it("claim_addon: increases captain remaining_limit and addon_count", async () => {
  //   //   const [capPda] = pda.captain(program.programId, captainUser.publicKey);

  //   //   const before = await program.account.captainAccount.fetch(capPda);
  //   //   await program.methods
  //   //     .claimAddon()
  //   //     .accounts({
  //   //       payer: captainUser.publicKey,
  //   //       config: configPda,
  //   //       captain: capPda,
  //   //       systemProgram: SP,
  //   //     })
  //   //     .signers([captainUser])
  //   //     .rpc();

  //   //   const after = await program.account.captainAccount.fetch(capPda);
  //   //   expect(after.remainingLimit).to.eq(before.remainingLimit + 7); // addon_limit = 7
  //   //   expect(after.addonCount).to.eq(before.addonCount + 1);
  //   // });

  //   // it("create_instance: Portfolio by captain decrements quota and sets expiry", async () => {
  //   //   const name = uniqueName("folio");
  //   //   const [capPda] = pda.captain(program.programId, captainUser.publicKey);
  //   //   const [instPda] = pda.instance(program.programId, name);

  //   //   const before = await program.account.captainAccount.fetch(capPda);

  //   //   await program.methods
  //   //     .createInstance({ portfolio: {} }, name, 3, [], [])
  //   //     .accounts({
  //   //       creator: captainUser.publicKey,
  //   //       config: configPda,
  //   //       admin: null,
  //   //       captain: capPda,
  //   //       instance: instPda,
  //   //       systemProgram: SP,
  //   //     })
  //   //     .signers([captainUser])
  //   //     .rpc();

  //   //   const capAfter = await program.account.captainAccount.fetch(capPda);
  //   //   expect(capAfter.remainingLimit).to.eq(before.remainingLimit - 1);
  //   //   expect(capAfter.instanceList).to.have.length(
  //   //     before.instanceList.length + 1
  //   //   );

  //   //   const inst = await program.account.instance.fetch(instPda);
  //   //   expect(inst.instanceType.portfolio).to.eq({});
  //   //   expect(inst.name).to.eq(name);
  //   //   expect(inst.owner.toBase58()).to.eq(captainUser.publicKey.toBase58());
  //   //   expect(inst.expiresAt.toNumber()).to.be.greaterThan(0);
  //   //   expect(inst.consumers.length).to.eq(0);
  //   //   expect(inst.whitelist.length).to.eq(0);

  //   //   const cfg = await program.account.config.fetch(configPda);
  //   //   expect(cfg.instanceIds.toNumber()).to.be.greaterThan(0);
  //   // });

  //   // it("create_instance: Private and Whitelisted require manager as creator", async () => {
  //   //   const privateName = uniqueName("priv");
  //   //   const [privPda] = pda.instance(program.programId, privateName);

  //   //   // Non-manager should fail
  //   //   try {
  //   //     await program.methods
  //   //       .createInstance({ private: {} }, privateName, 0, [], [])
  //   //       .accounts({
  //   //         creator: randomUser.publicKey,
  //   //         config: configPda,
  //   //         admin: null,
  //   //         captain: null,
  //   //         instance: privPda,
  //   //         systemProgram: SP,
  //   //       })
  //   //       .signers([randomUser])
  //   //       .rpc();
  //   //     expect.fail("Non-manager cannot create Private");
  //   //   } catch (e) {
  //   //     expectAnchorErr(e, "NotManager");
  //   //   }

  //   //   // Manager succeeds
  //   //   await program.methods
  //   //     .createInstance({ private: {} }, privateName, 0, [], [])
  //   //     .accounts({
  //   //       creator: managerPub,
  //   //       config: configPda,
  //   //       admin: null,
  //   //       captain: null,
  //   //       instance: privPda,
  //   //       systemProgram: SP,
  //   //     })
  //   //     .rpc();

  //   //   const instPriv = await program.account.instance.fetch(privPda);
  //   //   expect(instPriv.instanceType.private).to.eq({});
  //   // });

  //   // it("create_instance: Whitelisted caps whitelist length and stores list", async () => {
  //   //   const wlName = uniqueName("wl");
  //   //   const [wlPda] = pda.instance(program.programId, wlName);

  //   //   const wl = [randomUser.publicKey, captainUser.publicKey];

  //   //   await program.methods
  //   //     .createInstance({ whitelisted: {} }, wlName, 0, [], wl)
  //   //     .accounts({
  //   //       creator: managerPub,
  //   //       config: configPda,
  //   //       admin: null,
  //   //       captain: null,
  //   //       instance: wlPda,
  //   //       systemProgram: SP,
  //   //     })
  //   //     .rpc();

  //   //   const inst = await program.account.instance.fetch(wlPda);
  //   //   expect(
  //   //     inst.whitelist.map((k: PublicKey) => k.toBase58()).sort()
  //   //   ).to.deep.eq(wl.map((k) => k.toBase58()).sort());
  //   // });

  //   // it("grant_private_instance and add_whitelist: only manager mutates lists and caps at 200", async () => {
  //   //   const name = uniqueName("priv2");
  //   //   const [instPda] = pda.instance(program.programId, name);

  //   //   await program.methods
  //   //     .createInstance({ private: {} }, name, 0, [], [])
  //   //     .accounts({
  //   //       creator: managerPub,
  //   //       config: configPda,
  //   //       admin: null,
  //   //       captain: null,
  //   //       instance: instPda,
  //   //       systemProgram: SP,
  //   //     })
  //   //     .rpc();

  //   //   // Unauthorized grant
  //   //   try {
  //   //     await program.methods
  //   //       .grantPrivateInstance(randomUser.publicKey)
  //   //       .accounts({
  //   //         manager: randomUser.publicKey,
  //   //         config: configPda,
  //   //         instance: instPda,
  //   //         systemProgram: SP,
  //   //       })
  //   //       .signers([randomUser])
  //   //       .rpc();
  //   //     expect.fail("Only manager can grant private access");
  //   //   } catch (e) {
  //   //     expectAnchorErr(e, "NotManager");
  //   //   }

  //   //   // Authorized grant
  //   //   await program.methods
  //   //     .grantPrivateInstance(randomUser.publicKey)
  //   //     .accounts({
  //   //       manager: managerPub,
  //   //       config: configPda,
  //   //       instance: instPda,
  //   //       systemProgram: SP,
  //   //     })
  //   //     .rpc();

  //   //   // Whitelist add
  //   //   await program.methods
  //   //     .addWhitelist(captainUser.publicKey)
  //   //     .accounts({
  //   //       manager: managerPub,
  //   //       config: configPda,
  //   //       instance: instPda,
  //   //       systemProgram: SP,
  //   //     })
  //   //     .rpc();

  //   //   const inst = await program.account.instance.fetch(instPda);
  //   //   expect(inst.consumers.map((k: PublicKey) => k.toBase58())).to.include(
  //   //     randomUser.publicKey.toBase58()
  //   //   );
  //   //   expect(inst.whitelist.map((k: PublicKey) => k.toBase58())).to.include(
  //   //     captainUser.publicKey.toBase58()
  //   //   );
  //   // });

  //   // it("claim_instance: enforces type rules (Public ok, Private blocks, Whitelisted checks, Portfolio checks TTL)", async () => {
  //   //   // Public instance anyone can claim
  //   //   const pubName = uniqueName("pub");
  //   //   const [pubPda] = pda.instance(program.programId, pubName);
  //   //   await program.methods
  //   //     .createInstance({ public: {} }, pubName, 0, [], [])
  //   //     .accounts({
  //   //       creator: managerPub,
  //   //       config: configPda,
  //   //       admin: null,
  //   //       captain: null,
  //   //       instance: pubPda,
  //   //       systemProgram: SP,
  //   //     })
  //   //     .rpc();

  //   //   await program.methods
  //   //     .claimInstance()
  //   //     .accounts({
  //   //       claimer: randomUser.publicKey,
  //   //       instance: pubPda,
  //   //       systemProgram: SP,
  //   //     })
  //   //     .signers([randomUser])
  //   //     .rpc();

  //   //   const pubInst = await program.account.instance.fetch(pubPda);
  //   //   expect(pubInst.consumers.map((k: PublicKey) => k.toBase58())).to.include(
  //   //     randomUser.publicKey.toBase58()
  //   //   );

  //   //   // Private denies claim
  //   //   const privName = uniqueName("priv3");
  //   //   const [privPda] = pda.instance(program.programId, privName);
  //   //   await program.methods
  //   //     .createInstance({ private: {} }, privName, 0, [], [])
  //   //     .accounts({
  //   //       creator: managerPub,
  //   //       config: configPda,
  //   //       admin: null,
  //   //       captain: null,
  //   //       instance: privPda,
  //   //       systemProgram: SP,
  //   //     })
  //   //     .rpc();

  //   //   try {
  //   //     await program.methods
  //   //       .claimInstance()
  //   //       .accounts({
  //   //         claimer: randomUser.publicKey,
  //   //         instance: privPda,
  //   //         systemProgram: SP,
  //   //       })
  //   //       .signers([randomUser])
  //   //       .rpc();
  //   //     expect.fail("Private claim should fail");
  //   //   } catch (e) {
  //   //     expectAnchorErr(e, "NotManager");
  //   //   }

  //   //   // Whitelisted only allows prelisted
  //   //   const wlName = uniqueName("wl2");
  //   //   const [wlPda] = pda.instance(program.programId, wlName);
  //   //   await program.methods
  //   //     .createInstance(
  //   //       { whitelisted: {} },
  //   //       wlName,
  //   //       0,
  //   //       [],
  //   //       [randomUser.publicKey]
  //   //     )
  //   //     .accounts({
  //   //       creator: managerPub,
  //   //       config: configPda,
  //   //       admin: null,
  //   //       captain: null,
  //   //       instance: wlPda,
  //   //       systemProgram: SP,
  //   //     })
  //   //     .rpc();

  //   //   // Not on list
  //   //   try {
  //   //     await program.methods
  //   //       .claimInstance()
  //   //       .accounts({
  //   //         claimer: captainUser.publicKey,
  //   //         instance: wlPda,
  //   //         systemProgram: SP,
  //   //       })
  //   //       .signers([captainUser])
  //   //       .rpc();
  //   //     expect.fail("Whitelisted claim should reject non-listed");
  //   //   } catch (e) {
  //   //     expectAnchorErr(e, "NotAuthorized");
  //   //   }

  //   //   // On list
  //   //   await program.methods
  //   //     .claimInstance()
  //   //     .accounts({
  //   //       claimer: randomUser.publicKey,
  //   //       instance: wlPda,
  //   //       systemProgram: SP,
  //   //     })
  //   //     .signers([randomUser])
  //   //     .rpc();

  //   //   const wlInst = await program.account.instance.fetch(wlPda);
  //   //   expect(wlInst.consumers.map((k: PublicKey) => k.toBase58())).to.include(
  //   //     randomUser.publicKey.toBase58()
  //   //   );
  //   // });
})
