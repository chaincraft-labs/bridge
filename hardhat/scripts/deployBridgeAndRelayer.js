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
  console.log("Deploying tokens on network: ", network);

  // Get factory contract
  const factoryAddress = readLastDeployedAddress(network, "TokenFactory");
  console.log("factoryAddress: ", factoryAddress);
  //   const relayerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const oracleAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  // checksum address oracleAddress
  // if (!hre.ethers.utils.isAddress(oracleAddress)) {

  // dploy relayer contract
  const relayer = await hre.ethers.deployContract("RelayerBase", [
    oracleAddress,
  ]);
  await relayer.waitForDeployment();
  console.log("Relayer deployed to:", relayer.target);
  const relayerAddress = relayer.target;

  // deploy bridge contract
  const bridge = await hre.ethers.deployContract("BridgeBase", [
    relayerAddress,
    oracleAddress,
    factoryAddress,
  ]);
  await bridge.waitForDeployment();
  console.log("Bridge deployed to:", bridge.target);

  //@todo CHANGE THE WAY TO SET ADDRESSES IF WE WANT TO UPGRADE ONE BY ONE
  // set bridge address in relayer
  const tx = await relayer.updateBridgeAddress(bridge.target);
  await tx.wait();
  console.log("Bridge address set in relayer");

  // Write the deployed addresses to deployedAddresses.json
  writeDeployedAddress(network, "BridgeBase", bridge.target);
  writeDeployedAddress(network, "RelayerBase", relayer.target);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
