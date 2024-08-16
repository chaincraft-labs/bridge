const hre = require("hardhat");

const { getMaxAddress, computeTokenSymbol } = require("../utils/addressUtil");
const {
  getChainIdByNetworkName,
  getContext,
} = require("../helpers/configHelper");
const { writeDeployedAddress } = require("../helpers/fileHelpers");
const { toStyle, display } = require("../helpers/loggingHelper");
const { usedNetworks, usedTokens } = require("../constants/deploymentConfig");
const {
  networkParams,
  tokenList,
  getNetworkNameByChainId,
  tokenSymbols,
  tokenParams,
} = require("../helpers/configHelper");
const {
  deploymentCheck,
  deployAndSaveAddress,
} = require("../helpers/functionHelpers");

// @todo : TO MOVE IN ENV
operatorAddress = "0xe4192bf486aea10422ee097bc2cf8c28597b9f11";

// @todo : add igniton and tasks (for live...)
// @todo : add try catch / error management

async function main() {
  ///////////////////////////////////////////////////////////////////////////////
  //
  //                CONTEXT LOADING & CHECKS
  //
  ///////////////////////////////////////////////////////////////////////////////
  const context = await getContext();
  const owner = context.accounts[0];
  let tx;

  display.h1(`Script: deployAllContracts...`);
  display.context("Will deploy to network: ", context);

  deploymentCheck.validateNetworks(usedNetworks, context.network);

  ///////////////////////////////////////////////////////////////////////////////
  //
  //                BRIDGE CONTRACTS DEPLOYMENT
  //
  ///////////////////////////////////////////////////////////////////////////////
  display.h2(
    `Deploying bridge contracts on network: ${toStyle.blueBold(
      context.network
    )}`
  );

  const storage = await deployAndSaveAddress(context.network, "Storage", [
    context.nativeTokenName,
  ]);

  const factory = await deployAndSaveAddress(context.network, "TokenFactory", [
    storage.target,
  ]);

  const vault = await deployAndSaveAddress(context.network, "Vault", [
    storage.target,
  ]);

  const relayer = await deployAndSaveAddress(context.network, "RelayerBase", [
    storage.target,
  ]);

  const bridge = await deployAndSaveAddress(context.network, "BridgeBase", [
    storage.target,
    relayer.target,
  ]);

  ///////////////////////////////////////////////////////////////////////////////
  //
  //                STORAGE VARIABLES INITIALIZATION
  //
  ///////////////////////////////////////////////////////////////////////////////
  display.h2(`Initializing storage variables`);

  // ===> operator addresses
  const roles = ["factory", "vault", "bridge", "relayer", "oracle"];
  const operators = [
    factory.target,
    vault.target,
    bridge.target,
    relayer.target,
    operatorAddress,
  ];
  tx = await storage.batchUpdateOperators(roles, operators);
  await tx.wait();
  const operatorAddresses = await storage.getOperators(roles);
  operatorAddresses.forEach((operatorAddress, index) =>
    console.log(`${roles[index]} address set: ${operatorAddress}`)
  );

  // ===> chainIds
  const chainIdsToAdd = usedNetworks
    .map((usedNetwork) => getChainIdByNetworkName(usedNetwork))
    .filter(
      (usedChainId) => usedChainId != getChainIdByNetworkName(context.network)
    );
  tx = await storage.batchAddChainIdsToList(chainIdsToAdd);
  await tx.wait();
  const chainIdList = await storage.getChainIdsList();
  console.log("chainIds added to chainIdList: %s", chainIdList);

  // ===> tokenNames
  const tokenNamesToAdd = usedTokens.filter(
    (usedToken) => usedToken != context.nativeTokenName
  );
  tx = await storage.batchAddTokenNamesToList(tokenNamesToAdd);
  await tx.wait();
  const tokenNameList = await storage.getTokenNamesList();
  console.log("tokenNames added to tokenNameList: %s", tokenNameList);

  ///////////////////////////////////////////////////////////////////////////////
  //
  //                TOKENS CONTRACTS DEPLOYMENT
  //
  ///////////////////////////////////////////////////////////////////////////////
  display.h2(`Deploying tokens contracts and storing addresses in storage`);

  /*
   * ===> Native token: data are set in storage constructor
   */
  console.log(toStyle.bold(`* Native token:`));
  const tokenAddress = await storage.getTokenAddressByChainId(
    context.nativeTokenName,
    context.chainId
  );
  console.log(
    `token: ${toStyle.blueItalic(
      context.nativeTokenName
    )} (${toStyle.blueItalic(
      context.nativeTokenSymbol
    )}) set in storage at ${toStyle.blueItalic(tokenAddress)} for chainId ${
      context.chainId
    }`
  );

  /*
   * ===> Mocked tokens: checks whether tokens should be deployed on this network & deploy them
   */
  console.log(toStyle.bold(`* Mocked tokens:`));
  // Load the tokens declared in networkParams & filtered the ones included in usedNetworks
  const currentNetworkTokens = networkParams[
    context.network
  ].deployedTokens.filter((deployToken) => {
    return usedTokens.includes(deployToken.name);
  });

  await Promise.all(
    currentNetworkTokens.map(async (tokenToDeploy) => {
      // Deploy the mocked token
      const token = await deployAndSaveAddress(context.network, "MockedToken", [
        owner,
        tokenToDeploy.name,
        tokenToDeploy.symbol,
      ]);
      // Store its address in storage for this chainId
      const tx = await storage.addNewTokenAddressByChainId(
        tokenToDeploy.name,
        context.chainId,
        token.target
      );
      await tx.wait();
      display.tokenSet(tokenToDeploy.name, token.target, context.chainId);
    })
  ).catch((err) => {
    console.log(
      `${toStyle.error("Error: ")} Deploying mocked token...\n${err.message}`
    );
  });

  /*
   * ===> Bridged tokens: checks whether tokens are deployed on other chains & so need to be deployed as bridged tokens
   * The factory deploys the bridged tokens and set their data in storage contract
   */
  console.log(toStyle.bold(`* Bridged tokens:`));
  // Load native and mocked tokens of this network, the ones from 'usedTokens' to not deploy as BridgedToken
  const notBridgedTokens = currentNetworkTokens.map((token) => {
    return token.name;
  });
  notBridgedTokens.push(context.nativeTokenName);
  const bridgedTokens = usedTokens.filter(
    (usedToken) => !notBridgedTokens.includes(usedToken)
  );

  // @todo refactor and export deployment and log as for deployAnSaveAddress
  await Promise.all(
    bridgedTokens.map(async (token) => {
      const symbol = computeTokenSymbol(
        context.network,
        tokenParams[token].tokenSymbol
      );
      const tx = await factory.createToken(token, symbol);
      await tx.wait();
      // Factory set token data in storage when deploying the token
      const tokenAddress = await factory.getTokenAddress(symbol);
      display.deployContract("BridgedToken", tokenAddress, "factory");

      writeDeployedAddress(
        context.network,
        "BridgedToken",
        tokenAddress,
        symbol
      );
      display.writingAddress("BridgedToken", symbol);
      display.tokenSet(token, tokenAddress, context.chainId);
    })
  ).catch((err) => {
    console.log(
      `${toStyle.error("Error deploying bridged token...")}\n${err.message}`
    );
  });
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
