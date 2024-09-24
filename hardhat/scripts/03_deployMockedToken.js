const {
  logCurrentFileName,
  readLastDeployedAddress,
} = require("../helpers/fileHelpers");
const { toStyle, display } = require("../helpers/loggingHelper");
const {
  deploymentCheck,
  deployAndSaveAddress,
} = require("../helpers/functionHelpers");
const { getContext } = require("../helpers/contextHelper");
const { tokenParams } = require("../helpers/configHelper");
const { usedNetworks } = require("../constants/deploymentConfig");

/**
 * @description This script will deploy a new mocked Token and set its address in storage
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
  const owner = context.accounts[0];

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
  ///////////////////////////////////////////////////////////////////////////////
  //
  //                DEPLOYMENT
  //
  ///////////////////////////////////////////////////////////////////////////////
  display.h2(
    `Deploying mocked token on network: ${toStyle.blueBold(context.network)}`
  );

  try {
    // Add tokenName to authorized tokens list in Storage contract
    let tx = await storage.addTokenNameToList(tokenInfo[0]);
    await tx.wait();
    const tokenNameList = await storage.getTokenNamesList();
    console.log(
      toStyle.discrete("tokenName added to tokenNameList: " + tokenNameList)
    );

    // Deploy the mocked token
    // console.log(toStyle.discrete("deploying token.."));
    const token = await deployAndSaveAddress(context.network, "MockedToken", [
      owner, //....... holder of the supply
      tokenInfo[0], // token name
      tokenInfo[1], // token symbol
    ]);
    // Store its address in storage for this chainId
    // console.log(toStyle.discrete("adding token address in Storage.."));
    tx = await storage.addNewTokenAddressByChainId(
      tokenInfo[0],
      context.chainId,
      token.target
    );
    await tx.wait();

    display.tokenSet(tokenInfo[0], token.target, context.chainId);
  } catch (err) {
    console.log(
      `${toStyle.error("Error: ")} Deploying mocked token...\n${err.message}`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
