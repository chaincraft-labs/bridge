// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
// import { writeDeployedAddress } from "./util";
const { writeDeployedAddress, readLastDeployedAddress } = require("./util");

async function main() {
  //get network name
  const network = hre.network.name;
  console.log("Deploying contracts on network: ", network);

  // 1. deploy storage
  // 2. deploy factory
  // 3. deploy vault
  // 4. deploy bridge
  // 5. deploy relayer
  // set addresses in storage
  // deploy BridgeTokenAft via factory and set vault as owner
  // set addresses in bridge

  // 1. deploy storage
  const storage = await hre.ethers.deployContract("Storage");
  await storage.waitForDeployment();
  console.log("Storage deployed to:", storage.target);

  // 2. deploy factory
  const factory = await hre.ethers.deployContract("TokenFactory", [
    storage.target,
  ]);
  await factory.waitForDeployment();
  console.log("factory deployed to:", factory.target);

  // 3. deploy vault
  const vault = await hre.ethers.deployContract("Vault", [storage.target]);
  await vault.waitForDeployment();
  console.log("vault deployed to:", vault.target);

  // 5. deploy relayer
  const relayer = await hre.ethers.deployContract("RelayerBase", [
    storage.target,
  ]);
  await relayer.waitForDeployment();
  console.log("Relayer deployed to:", relayer.target);

  // 4. deploy bridge
  const bridge = await hre.ethers.deployContract("BridgeBase", [
    storage.target,
    relayer.target,
  ]);
  await bridge.waitForDeployment();
  console.log("Bridge deployed to:", bridge.target);

  // set addresses in storage
  let tx = await storage.updateOperator("factory", factory.target);
  await tx.wait();
  console.log("factory address set in storage");
  tx = await storage.updateOperator("vault", vault.target);
  await tx.wait();
  console.log("vault address set in storage");
  tx = await storage.updateOperator("bridge", bridge.target);
  await tx.wait();
  console.log("bridge address set in storage");
  tx = await storage.updateOperator("relayer", relayer.target);
  await tx.wait();
  console.log("relayer address set in storage");

  // address 0 = 0x
  const zeroAddress = "0x" + "0".repeat(40);
  // deploy BridgeTokenAft via factory and set vault as owner
  const bridgedTokenAftTx = await factory.createToken(
    "BridgedTokenAft",
    "Aft",
    "AFT",
    zeroAddress
  );
  const bridgedTokenAftReceipt = await bridgedTokenAftTx.wait();
  const bridgedTokenAftAddress = bridgedTokenAftReceipt.logs[0].args[0];
  console.log(`BridgedTokenAft deployed to: ${bridgedTokenAftAddress}`);

  // set addresses in storage cahinid allfeat: 441
  tokenName = ["AFT"];
  chainIds = [441, 1];
  tokenAddresses = [zeroAddress, bridgedTokenAftAddress];
  tx = await storage.batchSetTokenOnChainId(
    tokenName,
    chainIds,
    tokenAddresses
  );
  await tx.wait();
  console.log("token addresses set in storage");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
