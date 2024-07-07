const hre = require("hardhat");
const { readLastDeployedAddress } = require("../helpers/fileHelpers");
const { getMaxAddress, computeTokenSymbol } = require("../utils/addressUtil");
const {
  tokenParams,
  getChainIdByNetworkName,
  networkParams,
} = require("../helpers/configHelper");
const { toStyle } = require("../helpers/loggingHelper");
const { usedNetworks, usedTokens } = require("../constants/deploymentConfig");

async function main() {
  ///////////////////////////////////////////////////////////////////////////////
  //
  //                CONTEXT LOADING & CHEKCS
  //
  ///////////////////////////////////////////////////////////////////////////////
  const currentNetwork = hre.network.name;
  const currentChainId = networkParams[currentNetwork].chainId;
  const [owner, user, server] = await hre.ethers.getSigners();

  console.log(toStyle.title(`Script: setTokens...`));
  console.log(
    `Setting token addresses of other chains on: ${toStyle.blueItalic(
      currentNetwork
    )} (chainId ${toStyle.blueItalic(currentChainId)}) with:`
  );
  console.log(
    `- admin / deployer address: ${toStyle.blueItalic(owner.address)}`
  );
  // Check we don't have localhost AND hardhat in network used (same id)
  if (usedNetworks.includes("localhost") && usedNetworks.includes("hardhat")) {
    throw `${toStyle.error("Error: ")}${toStyle.yellowItalic(
      "usedNetworks"
    )} should NOT include "localhost" and "hardhat" at the same time in${toStyle.yellowItalic(
      "constants/deploymentConfig.js"
    )}!\n`;
  }
  // Check if we deploy to a network from the deploymentConfig (deployment security)
  if (!usedNetworks.includes(currentNetwork)) {
    throw `${toStyle.error(
      "Error: "
    )}Trying to deploy to a network not included in ${toStyle.yellowItalic(
      "constants/deploymentConfig.js"
    )}!`;
  }
  // Check if the networks in deploymentConfig are amongst networkParams (to have their data)
  const networkKeys = Object.keys(networkParams);
  usedNetworks.forEach((usedNetwork) => {
    if (!networkKeys.includes(usedNetwork)) {
      throw `${toStyle.error("Error: ")}Used network: ${toStyle.yellowItalic(
        usedNetwork
      )} is not included in the networkParams!!`;
    }
  });
  // Get storage to call
  let storageAddress = readLastDeployedAddress(currentNetwork, "Storage");
  let storage = await hre.ethers.getContractAt("Storage", storageAddress);
  console.log(
    `${toStyle.discrete("Storage contract address used:")} ${storageAddress}\n`
  );
  // Get the networks whose token addresses are to be read to register them
  const networksToSet = usedNetworks.filter(function (usedNetwork) {
    return usedNetwork != currentNetwork;
  });

  const tokensDataToSet = { names: [], chainIds: [], addresses: [] };

  for (index in networksToSet) {
    const networkToSet = networksToSet[index];

    for (usedToken in usedTokens) {
      const tokenToSet = usedTokens[usedToken];
      const chainIdToSet = getChainIdByNetworkName(networkToSet);
      tokensDataToSet.names.push(tokenToSet);
      tokensDataToSet.chainIds.push(chainIdToSet);

      // this chainId is the origin chain of the token to set
      if (tokenParams[tokenToSet].originChainId.includes(chainIdToSet)) {
        // Native token on chainIdToSet
        if (tokenParams[tokenToSet].isNative) {
          tokensDataToSet.addresses.push(getMaxAddress());
          continue;
        }
        // Mocked token on chainIdToSet
        let address = await readLastDeployedAddress(
          networkToSet,
          "MockedToken",
          tokenParams[tokenToSet].tokenSymbol
        );
        tokensDataToSet.addresses.push(address);
        continue;
      }
      // Else it's a bridged token on chainIdToSet
      let address = await readLastDeployedAddress(
        networkToSet,
        "BridgedToken",
        computeTokenSymbol(networkToSet, tokenParams[tokenToSet].tokenSymbol)
      );
      tokensDataToSet.addresses.push(address);
    }
  }

  let tx = await storage.batchAddNewTokensAddressesByChainId(
    tokensDataToSet.names,
    tokensDataToSet.chainIds,
    tokensDataToSet.addresses
  );
  await tx.wait();
  for (let i = 0; i < tokensDataToSet.names.length; i++) {
    console.log(
      `set token: ${toStyle.blueItalic(
        tokensDataToSet.names[i]
      )} with ${toStyle.blueItalic(
        tokensDataToSet.addresses[i]
      )} on chainID ${toStyle.blueItalic(tokensDataToSet.chainIds[i])}`
    );
  }
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
