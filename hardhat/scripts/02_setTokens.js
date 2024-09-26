const hre = require("hardhat");
const {
  readLastDeployedAddress,
  logCurrentFileName,
} = require("../helpers/fileHelpers");
const { getMaxAddress, computeTokenSymbol } = require("../utils/util");
const {
  networkParams,
  tokenParams,
  getChainIdByNetworkName,
  usedNetworks,
  usedTokens,
} = require("../helpers/configHelper");
const { getContext } = require("../helpers/contextHelper");
const { deploymentCheck } = require("../helpers/functionHelpers");
const { toStyle, display } = require("../helpers/loggingHelper");

/**
 * @description set token addresses by chain Id
 *
 * This script will read last deployed addresses of networks included in 'usedNetworks'
 * and set in Storage contract token addresses of other networks,
 *
 * @dev Contracts should be deployed on all desired networks BEFORE,
 * and then this script should be run on these networks.
 */
async function main() {
  ///////////////////////////////////////////////////////////////////////////////
  //
  //                CONTEXT LOADING & CHECKS
  //
  ///////////////////////////////////////////////////////////////////////////////
  const context = await getContext();
  let tx;

  display.h1(`Script: ${logCurrentFileName()}...`);
  display.context(
    "Will set token addresses of other networks on: ",
    context,
    false
  );

  deploymentCheck.validateNetworks(usedNetworks, context.network);

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
  for (const index in networksToSet) {
    const networkToSet = networksToSet[index];
    const chainIdToSet = getChainIdByNetworkName(networkToSet);
    const deployedTokens = networkParams[networkToSet].deployedTokens;

    for (const usedToken in usedTokens) {
      const tokenToSet = usedTokens[usedToken];

      tokensDataToSet.names.push(tokenToSet);
      tokensDataToSet.chainIds.push(chainIdToSet);

      // this chainId is the origin chain of the token to set
      if (tokenParams[tokenToSet].originChainId.includes(chainIdToSet)) {
        // Native token on chainIdToSet
        if (tokenParams[tokenToSet].isNative) {
          tokensDataToSet.addresses.push(getMaxAddress());

          continue;
        }

        // Real token whose address is already set take this one
        let tokenToSetObject = deployedTokens.find(
          (element) => element.name === tokenToSet
        );
        if (tokenToSetObject && tokenToSetObject.address) {
          tokensDataToSet.addresses.push(tokenToSetObject.address);

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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
