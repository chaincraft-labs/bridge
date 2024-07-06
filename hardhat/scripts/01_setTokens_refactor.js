const hre = require("hardhat");
// import { writeDeployedAddress } from "./util";
const {
  writeDeployedAddress,
  readLastDeployedAddress,
  readNetworks,
} = require("../helpers/fileHelpers");
const { getMaxAddress, computeTokenSymbol } = require("../utils/addressUtil");
const {
  tokenParams,
  getNetworkNameByChainId,
  getChainIdByNetworkName,
} = require("../helpers/configHelper");
const { usedNetworks, usedTokens } = require("../constants/deploymentConfig");

async function main() {
  //get network name
  const currentNetwork = hre.network.name;

  let storageAddress = readLastDeployedAddress(currentNetwork, "Storage");
  console.log("ON %s ==> Storage address: %s", currentNetwork, storageAddress);
  let storage = await hre.ethers.getContractAt("Storage", storageAddress);

  const networksToSet = usedNetworks.filter(function (usedNetwork) {
    return usedNetwork != currentNetwork;
  });

  const tokensToSet = { names: [], chaindIds: [], addresses: [] };
  console.log("net:", networksToSet);
  console.log("tok:", tokensToSet);
  for (index in networksToSet) {
    const network = networksToSet[index];
    for (usedToken in usedTokens) {
      // do checks before and try cath or thrw
      const tokenToSet = usedTokens[usedToken];
      console.log("network", network);
      console.log("tokenToSet", tokenToSet);
      const chainId = getChainIdByNetworkName(network);

      tokensToSet.names.push(tokenToSet);
      tokensToSet.chaindIds.push(chainId);
      // console.log("tp", tokenParams);
      if (tokenParams[tokenToSet].isNative) {
        tokensToSet.addresses.push(getMaxAddress());
        continue;
      }
      if (tokenParams[tokenToSet].originChainId.includes(chainId)) {
        let address = await readLastDeployedAddress(
          network,
          "MockedToken",
          tokenToSet
        );
        tokensToSet.addresses.push(address);

        continue;
      }
      // else it's a bridged token
      let address = await readLastDeployedAddress(
        network,
        "BridgedToken",
        tokenToSet
      );
      tokensToSet.addresses.push(address);

      // check somethong else msg warning no token found: token net

      // mockedToken = networkParams.network1.nativeToken.deployedTokens;
    }
  }

  // set newtoken batch

  let tx = await storage.batchAddNewTokensAddressesByChainId(
    tokensToSet.names,
    tokensToSet.chaindIds,
    tokensToSet.addresses
  );
  console.log("tx batch settokens", tx);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/// commands
// npx hardhat run scripts/01_deployAllContracts.js --network localhost
// npx hardhat run scripts /01_setTokens.js--network localhost

// npx hardhat run scripts/01_deployAllContracts.js --network sepolia
// npx hardhat run scripts/01_deployAllContracts.js --network allfeat
// npx hardhat run scripts/01_setTokens.js --network sepolia
// npx hardhat run scripts/01_setTokens.js --network allfeat
