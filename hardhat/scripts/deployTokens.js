// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
// import { writeDeployedAddress } from "./util";
const { writeDeployedAddress } = require("./util");

async function main() {
  //get network name
  const network = hre.network.name;
  console.log("Deploying tokens on network: ", network);

  const bridgedAft = await hre.ethers.deployContract("BridgedTokenAft");
  await bridgedAft.waitForDeployment();
  console.log("token Aft deployed to:", bridgedAft.target);

  const bridgedDai = await hre.ethers.deployContract("BridgedTokenAft");
  await bridgedDai.waitForDeployment();
  console.log("token Dai deployed to:", bridgedDai.target);

  const bridgedEth = await hre.ethers.deployContract("BridgedTokenEth");
  await bridgedEth.waitForDeployment();
  console.log("token Eth deployed to:", bridgedEth.target);

  const mockedDai = await hre.ethers.deployContract("MockedTokenDai");
  await mockedDai.waitForDeployment();
  console.log("mocked Dai deployed to:", mockedDai.target);

  console.log("Writing deployed addresses to deployedAddresses.json");
  writeDeployedAddress(
    network,
    "BridgedToken",
    bridgedAft.target,
    "BridgedTokenAft"
  );
  writeDeployedAddress(
    network,
    "BridgedToken",
    bridgedDai.target,
    "BridgedTokenDai"
  );
  writeDeployedAddress(
    network,
    "BridgedToken",
    bridgedEth.target,
    "BridgedTokenEth"
  );
  writeDeployedAddress(network, "MockedTokenDai", mockedDai.target);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
