const hre = require("hardhat");
const { readLastDeployedAddress } = require("../helpers/fileHelpers");
const { getMaxAddress, computeTokenSymbol } = require("../utils/addressUtil");
const {
  tokenParams,
  getChainIdByNetworkName,
  networkParams,
  getContext,
} = require("../helpers/configHelper");
const {
  deploymentCheck,
  deployAndSaveAddress,
} = require("../helpers/functionHelpers");
const { toStyle, display } = require("../helpers/loggingHelper");
const { usedNetworks, usedTokens } = require("../constants/deploymentConfig");

async function main() {
  ///////////////////////////////////////////////////////////////////////////////
  //
  //                CONTEXT LOADING & CHEKCS
  //
  ///////////////////////////////////////////////////////////////////////////////
  const context = await getContext();
  const owner = context.accounts[0];
  let tx;

  display.h1(`Script: setTokens...`);
  display.context(
    "Will set token addresses of other networks on: ",
    context,
    false
  );

  deploymentCheck.noLocalChainDuplicate(usedNetworks);
  deploymentCheck.usedNetworksSetInConfig(usedNetworks);
  deploymentCheck.deploymentOnUsedNetworks(usedNetworks, context.network);

  // Get storage to call
  let storageAddress = readLastDeployedAddress(context.network, "Storage");
  let storage = await hre.ethers.getContractAt("Storage", storageAddress);
  console.log(
    `${toStyle.discrete("Storage contract address used:")} ${storageAddress}\n`
  );
  // Get the networks whose token addresses are to be read to register them
  const networksToSet = usedNetworks.filter(function (usedNetwork) {
    return usedNetwork != context.network;
  });

  const tokensDataToSet = { names: [], chainIds: [], addresses: [] };

  ///////////////////////////////////////////////////////////////////////////////
  //
  //                READ ADDRESSES TO STORE
  //
  ///////////////////////////////////////////////////////////////////////////////
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

  tx = await storage.batchAddNewTokensAddressesByChainId(
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

// $ cd scripts && ./tryDeployAll.sh && cd -
