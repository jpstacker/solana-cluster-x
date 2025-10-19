import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ClusterX } from "../target/types/cluster_x";

describe("Cluster X", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  const wallet = provider.wallet as anchor.Wallet;
  anchor.setProvider(provider);

  const program = anchor.workspace.ClusterX as Program<ClusterX>;

  it("Is initialized!", async () => {
    const initConfigIx = await program.methods
      .initConfig(
        "ClusterX",
        "Extended reality | mixed reality",
        new anchor.BN(2400),
        new anchor.BN(600),
        new anchor.BN(10),
        new anchor.BN(3)
      )
      .instruction();

    const latestBlockhash = await provider.connection.getLatestBlockhash();
    const tx = new anchor.web3.Transaction({
      feePayer: wallet.publicKey,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    }).add(initConfigIx);

    // const signature = await anchor.web3.sendAndConfirmTransaction(
    //   connection,
    //   tx,
    //   [wallet.payer]
    // );

    console.log({ signature: "" });
  });
});

// initConfig(name, title, instancePrice, instanceLimit, addonPrice)
