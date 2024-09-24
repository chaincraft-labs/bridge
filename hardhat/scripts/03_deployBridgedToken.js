const {
  readLastDeployedAddress,
  writeDeployedAddress,
  logCurrentFileName,
} = require("../helpers/fileHelpers");
const { toStyle, display } = require("../helpers/loggingHelper");
const { computeTokenSymbol } = require("../utils/util");
const { deploymentCheck } = require("../helpers/functionHelpers");
const { getContext } = require("../helpers/contextHelper");
const { tokenParams } = require("../helpers/configHelper");
const { usedNetworks } = require("../constants/deploymentConfig");

/**
 * @description This script will deploy a new bridged Token and set its address in storage
 *
 * @dev The token MUST BE configured in 'tokenParams' before
 * @dev ARGS: MOCKED_TOKEN_OPTION="tokenName,tokenSymbol"
 */
async function main() {
  ///////////////////////////////////////////////////////////////////////////////
  //
  //                GET CONTEXT & PARAMS
  //
  ///////////////////////////////////////////////////////////////////////////////
  display.h1(`Script: ${logCurrentFileName()}...`);

  const context = await getContext();

  const options = process.env.MOCKED_TOKEN_OPTION;
  const tokenInfo = options.split(",");
  if (tokenInfo.length != 2) {
    throw "Missing data in MOCKED_TOKEN_OPTION to deploy.";
  }
  if (!tokenParams[tokenInfo[0]]) {
    throw "Token not configured in configHelper!";
  }

  deploymentCheck.validateNetworks(usedNetworks, context.network);

  // Get storage to call
  let storageAddress = readLastDeployedAddress(context.network, "Storage");
  let storage = await hre.ethers.getContractAt("Storage", storageAddress);
  console.log(
    `${toStyle.discrete("Storage contract address used:")} ${storageAddress}`
  );
  // Get Factory to call
  let factoryAddress = readLastDeployedAddress(context.network, "TokenFactory");
  let factory = await hre.ethers.getContractAt("TokenFactory", factoryAddress);
  console.log(
    `${toStyle.discrete("Factory contract address used:")} ${factoryAddress}`
  );
  ///////////////////////////////////////////////////////////////////////////////
  //
  //                DEPLOYMENT
  //
  ///////////////////////////////////////////////////////////////////////////////
  display.h2(
    `Deploying bridged token on network: ${toStyle.blueBold(context.network)}`
  );

  try {
    // compute bridged symbol
    const symbol = computeTokenSymbol(context.network, tokenInfo[1]);
    // Add tokenName to authorized tokens list in Storage contract
    let tx = await storage.addTokenNameToList(tokenInfo[0]);
    await tx.wait();

    tx = await factory.createToken(tokenInfo[0], symbol);
    await tx.wait();
    // Factory set token data in storage when deploying the token
    const tokenAddress = await factory.getTokenAddress(symbol);
    display.deployContract("BridgedToken", tokenAddress, "factory");

    writeDeployedAddress(context.network, "BridgedToken", tokenAddress, symbol);
    display.writingAddress("BridgedToken", symbol);
    display.tokenSet(tokenInfo[0], tokenAddress, context.chainId);
  } catch (err) {
    console.log(
      `${toStyle.error("Error: ")} Deploying bridged token...\n${err.message}`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
