const hre = require("hardhat");
const {
  readLastDeployedAddress,
  logCurrentFileName,
} = require("../helpers/fileHelpers");
const { getMaxAddress, computeTokenSymbol } = require("../utils/util");
const {
  tokenParams,
  getChainIdByNetworkName,
} = require("../helpers/configHelper");
const { getContext } = require("../helpers/contextHelper");
const { deploymentCheck } = require("../helpers/functionHelpers");
const { toStyle, display } = require("../helpers/loggingHelper");
const { usedNetworks } = require("../constants/deploymentConfig");

/**
 * @description This script set addresses of a new token in Storage of each chain used
 *
 * It will read the address of the token on all networks except the command,
 * determine if it is a bridged or a mocked token from 'deployedAddresses.json'
 * and save these addresses for the corresponding 'chainId' in the 'Storage' contract
 *
 * @dev The token MUST BE configured in 'tokenParams' before
 * @dev ARGS: TOKEN_OPTION=tokenName
 */
async function main() {
  ///////////////////////////////////////////////////////////////////////////////
  //
  //                CONTEXT LOADING & CHECKS
  //
  ///////////////////////////////////////////////////////////////////////////////
  display.h1(`Script: ${logCurrentFileName()}...`);

  const context = await getContext();
  let tx;

  deploymentCheck.validateNetworks(usedNetworks, context.network);

  const tokenName = process.env.TOKEN_OPTION;
  if (!tokenName) {
    throw "No token name to set addresses!";
  }
  if (!tokenParams[tokenName]) {
    throw "Token not configured in configHelper!";
  }

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
  display.h2(
    `Setting addresses of the new token on: ${toStyle.blueBold(
      context.network
    )}`
  );

  for (index in networksToSet) {
    const networkToSet = networksToSet[index];
    const chainIdToSet = getChainIdByNetworkName(networkToSet);
    tokensDataToSet.names.push(tokenName);
    tokensDataToSet.chainIds.push(chainIdToSet);

    // this chainId is the origin chain of the token to set
    if (tokenParams[tokenName].originChainId.includes(chainIdToSet)) {
      // Native token on chainIdToSet
      if (tokenParams[tokenName].isNative) {
        tokensDataToSet.addresses.push(getMaxAddress());
        continue;
      }
      // Mocked token on chainIdToSet
      let address = await readLastDeployedAddress(
        networkToSet,
        "MockedToken",
        tokenParams[tokenName].tokenSymbol
      );
      tokensDataToSet.addresses.push(address);
      continue;
    }
    // Else it's a bridged token on chainIdToSet
    let address = await readLastDeployedAddress(
      networkToSet,
      "BridgedToken",
      computeTokenSymbol(networkToSet, tokenParams[tokenName].tokenSymbol)
    );
    tokensDataToSet.addresses.push(address);
  }

  // console.table(tokensDataToSet);
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
