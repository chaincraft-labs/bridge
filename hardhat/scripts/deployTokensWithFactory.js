// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
// import { writeDeployedAddress } from "./util";
const { writeDeployedAddress } = require("./util");

async function callCreateToken(factory, tokenName, symbol) {
  const bridgedTokenTx = await factory.createToken(tokenName, symbol);
  const bridgedTokenReceipt = await bridgedTokenTx.wait();
  const tokenContractName = bridgedTokenReceipt.logs[0].args[1];
  const tokenContractAddress = bridgedTokenReceipt.logs[0].args[0];
  console.log(
    `createToken Receipt Logs: ${tokenContractName} deployed to: ${tokenContractAddress}`
  );
  return { name: tokenContractName, address: tokenContractAddress };
}

async function main() {
  // Get network name
  const network = hre.network.name;
  console.log("Deploying tokens on network: ", network);

  // Deploy the TokenFactory contract
  const factory = await hre.ethers.deployContract("TokenFactory");
  await factory.waitForDeployment();

  console.log("factory deployed to:", factory.target);

  //   factory.on(
  //     "BridgeTokenCreated",
  //     function (tokenAddress, tokenName, symbol, owner) {
  //       console.log(
  //         `BridgeTokenCreated event: token ${tokenName} created at address ${tokenAddress} by ${owner}`
  //       );
  //       writeDeployedAddress(network, "BridgedToken", tokenAddress, tokenName);
  //     }
  //   );

  // Create the bridged tokens
  const promises = [
    await callCreateToken(factory, "BridgedAft", "Aft"),
    await callCreateToken(factory, "BridgedDai", "Dai"),
    await callCreateToken(factory, "BridgedEth", "Eth"),
  ];

  const tokens = await Promise.all(promises);

  // Deploy the MockedDai contract
  const mockedDai = await hre.ethers.deployContract("MockedDai");
  await mockedDai.waitForDeployment();
  console.log("mocked Dai deployed to:", mockedDai.target);

  // Write the deployed addresses to deployedAddresses.json
  writeDeployedAddress(network, "TokenFactory", factory.target);
  tokens.forEach((token) => {
    writeDeployedAddress(network, "BridgedToken", token.address, token.name);
  });
  writeDeployedAddress(network, "MockedDai", mockedDai.target);

  // unsubscribe from the event
  //   factory.removeAllListeners();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
