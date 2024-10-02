const {
  logCurrentFileName,
  readLastDeployedAddress,
} = require("../helpers/fileHelpers");
const { toStyle, display } = require("../helpers/loggingHelper");
const { deploymentCheck } = require("../helpers/functionHelpers");
const { getContext } = require("../helpers/contextHelper");
const {
  tokenParams,
  networkParams,
  usedNetworks,
} = require("../helpers/configHelper");

/**
 * @description This script will set this address of a real deployed token in storage
 *
 * @dev The token MUST BE configured in 'tokenParams' before
 * @dev ARGS: TOKEN_OPTION="tokenName,tokenSymbol,tokenAddress"
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
  if (tokenInfo.length !== 3) {
    throw "Missing data in TOKEN_OPTION to set its address.";
  }
  if (!tokenParams[tokenInfo[0]]) {
    throw "Token not configured in configHelper!";
  }
  const deployedTokens = networkParams[networkToSet].deployedTokens;
  let tokenToSetObject = deployedTokens.find(
    (element) => element.name === tokenToSet
  );
  if (!tokenToSetObject.address || tokenInfo[2] !== tokenToSetObject.address) {
    throw "Wrong token address to set, address given don't match the one in deployedAddresses.json!";
  }

  deploymentCheck.validateNetworks(usedNetworks, context.network);

  // Get storage to call
  let storageAddress = readLastDeployedAddress(context.network, "Storage");
  let storage = await hre.ethers.getContractAt("Storage", storageAddress);
  console.log(
    `${toStyle.discrete("Storage contract address used:")} ${storageAddress}`
  );
  ///////////////////////////////////////////////////////////////////////////////
  //
  //                DEPLOYMENT
  //
  ///////////////////////////////////////////////////////////////////////////////
  display.h2(
    `Setting deployed token address on network: ${toStyle.blueBold(
      context.network
    )}`
  );

  try {
    // Add tokenName to authorized tokens list in Storage contract
    let tx = await storage.addTokenNameToList(tokenInfo[0]);
    await tx.wait();
    const tokenNameList = await storage.getTokenNamesList();
    console.log(
      toStyle.discrete("tokenName added to tokenNameList: " + tokenNameList)
    );

    // Store its address in storage for this chainId
    // console.log(toStyle.discrete("adding token address in Storage.."));
    tx = await storage.addNewTokenAddressByChainId(
      tokenInfo[0],
      context.chainId,
      tokenInfo[2]
    );
    await tx.wait();

    display.tokenSet(tokenInfo[0], token.target, context.chainId);
  } catch (err) {
    console.log(
      `${toStyle.error("Error: ")} Setting token address...\n${err.message}`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
