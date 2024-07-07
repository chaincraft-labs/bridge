const hre = require("hardhat");

const { getMaxAddress, computeTokenSymbol } = require("../utils/addressUtil");
const { getChainIdByNetworkName } = require("../helpers/configHelper");
const { writeDeployedAddress } = require("../helpers/fileHelpers");
const { toStyle } = require("../helpers/loggingHelper");
const { usedNetworks, usedTokens } = require("../constants/deploymentConfig");
const {
  networkParams,
  tokenList,
  getNetworkNameByChainId,
  tokenSymbols,
} = require("../helpers/configHelper");

// @todo : TO MOVE IN ENV
operatorAdress = "0xe4192bf486aea10422ee097bc2cf8c28597b9f11";

// @todo : add igniton and tasks (for live...)
// @todo : add try catch / error management

const deployAndSaveAddress = async (network, contractName, params) => {
  let tokenSymbol;
  const instance = await hre.ethers.deployContract(contractName, params);
  await instance.waitForDeployment();
  console.log(`==> ${contractName} deployed to: ${instance.target}`);

  const writeParams = [network, contractName, instance.target];
  if (contractName == "BridgedToken" || contractName == "MockedToken") {
    // we add token symbol for bridged & mocked token (last elements of 'params')
    tokenSymbol = params[params.length - 1];
    writeParams.push(tokenSymbol);
  }
  writeDeployedAddress(...writeParams);

  console.log(
    toStyle.discrete(
      `Writing deployed address of ${contractName}${
        tokenSymbol ? " " + tokenSymbol + " " : " "
      }to deployedAddresses.json...`
    )
  );

  return instance;
};

// const updateOperators = async (storageInstance, operators) => {
//   await Promise.all(
//     operators.map(async (operator) => {
//       const tx = await storageInstance.updateOperator(
//         operator.role,
//         operator.address
//       );
//       await tx.wait();
//       console.log(
//         `${operator.role} address set in storage : ${operator.address}`
//       );
//     })
//   ).catch((err) => {
//     console.log("error updating operators...", err.message);
//   });
// };

// ex :   // await batchWriteFunc(storage, "addChainIdToList", [...chainIdToAdd]);

//setter != getter!!
// parallel exec (don't use this if sequential call needed)
const batchWriteFunc = async (instance, funcName, params) => {
  await Promise.all(
    params.map(async (param) => {
      const tx = await instance[funcName](param);
      await tx.wait();
      console.log(`executed func ${funcName} with param: ${param}`);
    })
  ).catch((err) => {
    console.log(
      `${toStyle.error("Error: ")} calling func ${funcName} on ${
        instance.target
      } with params: ${params}\n${err}`
    );
  });
};

async function main() {
  ///////////////////////////////////////////////////////////////////////////////
  //
  //                CONTEXT LOADING & CHEKCS
  //
  ///////////////////////////////////////////////////////////////////////////////
  // Load deployment context
  const network = hre.network.name;
  const nativeTokenSymbol = networkParams[network].nativeToken.symbol;
  const nativeTokenName = networkParams[network].nativeToken.name;
  const currentChainId = networkParams[network].chainId;
  const [owner, user, server] = await hre.ethers.getSigners();

  console.log(toStyle.title(`Script: deployAllContracts...`));
  console.log(
    `Will deploy to network: ${toStyle.blueItalic(
      network
    )} (chainId ${toStyle.blueItalic(currentChainId)}) with:`
  );
  console.log(
    `- native token ${toStyle.blueItalic(
      nativeTokenName
    )} (${toStyle.blueItalic(nativeTokenSymbol)})`
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
  if (!usedNetworks.includes(network)) {
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

  ///////////////////////////////////////////////////////////////////////////////
  //
  //                BRIDGE CONTRACTS DEPLOYMENT
  //
  ///////////////////////////////////////////////////////////////////////////////
  console.log(
    toStyle.title(
      `Deploying bridge contracts on network: ${toStyle.blueBold(network)}`
    )
  );

  const storage = await deployAndSaveAddress(network, "Storage", [
    nativeTokenName,
  ]);

  const factory = await deployAndSaveAddress(network, "TokenFactory", [
    storage.target,
  ]);

  const vault = await deployAndSaveAddress(network, "Vault", [storage.target]);

  const relayer = await deployAndSaveAddress(network, "RelayerBase", [
    storage.target,
  ]);

  const bridge = await deployAndSaveAddress(network, "BridgeBase", [
    storage.target,
    relayer.target,
  ]);

  ///////////////////////////////////////////////////////////////////////////////
  //
  //                STORAGE VARIABLES INITIALIZATION
  //
  ///////////////////////////////////////////////////////////////////////////////
  console.log(toStyle.title(`Initializing storage variables`));

  // const operators = [
  //   { role: "factory", address: factory.target },
  //   { role: "vault", address: vault.target },
  //   { role: "bridge", address: bridge.target },
  //   { role: "relayer", address: relayer.target },
  //   { role: "oracle", address: operatorAdress },
  // ];
  // // set addresses in storage
  // await updateOperators(storage, operators);
  const roles = ["factory", "vault", "bridge", "relayer", "oracle"];
  const operators = [
    factory.target,
    vault.target,
    bridge.target,
    relayer.target,
    operatorAdress,
  ];
  // set addresses in storage
  let tx = await storage.batchUpdateOperators(roles, operators);
  await tx.wait();
  const operatorAddresses = await storage.getOperators(roles);
  operatorAddresses.forEach((operatorAddress, index) =>
    console.log(`${roles[index]} adddress set: ${operatorAddress}`)
  );

  // ===> chainIds
  const chainIdsToAdd = usedNetworks
    .map((usedNetwork) => getChainIdByNetworkName(usedNetwork))
    .filter((usedChainId) => usedChainId != getChainIdByNetworkName(network));

  tx = await storage.batchAddChainIdsToList(chainIdsToAdd);
  await tx.wait();

  const chainIdList = await storage.getChainIdsList();
  console.log("chainIds added to chainIdList: %s", chainIdList);

  // ===> tokenNames
  // await batchWriteFunc(storage, "addTokenNameToList", [
  //   "ethereum",
  //   "allfeat",
  //   "mockedDai",
  // ]);
  const tokenNamesToAdd = usedTokens.filter(
    (usedToken) => usedToken != nativeTokenName
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
  console.log(
    toStyle.title(`Deploying tokens contracts and storing addresses in storage`)
  );
  console.log(toStyle.bold(`* Native token:`));
  /*
   * Native token: data are set in storage constructor
   */
  //nativeTokenName
  const currentNetworkNativeToken = networkParams[network].nativeToken.name;
  const tokenAddress = await storage.getTokenAddressByChainId(
    nativeTokenName,
    currentChainId
  );
  console.log(
    `token: ${toStyle.blueItalic(nativeTokenName)} (${toStyle.blueItalic(
      nativeTokenSymbol
    )}) set in storage at ${toStyle.blueItalic(tokenAddress)} for chainId ${
      networkParams[network].chainId
    }`
  );

  /*
   * Mocked tokens: checks whether tokens should be deployed on this network & deploy them
   */
  console.log(toStyle.bold(`* Mocked tokens:`));
  // Load the tokens declared in networkParams
  const currentNetworkTokens = networkParams[network].deployedTokens;

  await Promise.all(
    currentNetworkTokens.map(async (tokenToDeploy) => {
      // Deploy the mocked token
      const token = await deployAndSaveAddress(network, "MockedToken", [
        owner,
        tokenToDeploy.name,
        tokenToDeploy.symbol,
      ]);

      // Store its address in storage for this chainId
      const tx = await storage.addNewTokenAddressByChainId(
        tokenToDeploy.name,
        networkParams[network].chainId, // should be the same as current network (@todo replace by chainId)
        token.target
      );
      await tx.wait();

      console.log(
        `token: ${toStyle.blueItalic(
          tokenToDeploy.name
        )} set in storage at ${toStyle.blueItalic(token.target)} for chainId ${
          networkParams[network].chainId
        }`
      );
    })
  ).catch((err) => {
    console.log(
      `${toStyle.error("Error: ")} Deploying mocked token...\n${err.message}`
    );
  });

  /*
   * Bridged tokens: checks whether tokens are deployed on other chains & so need to be deployed as bridged tokens
   * The factory deploys the bridged tokens and set their data in storage contract
   */
  console.log(toStyle.bold(`* Bridged tokens:`));
  // Load native and mocked tokens of this network, the ones from 'usedTokens' to not deploy as BridgedToken
  const notBridgedTokens = currentNetworkTokens.map((token) => {
    return token.name;
  });
  notBridgedTokens.push(currentNetworkNativeToken);

  await Promise.all(
    usedTokens.map(async (token) => {
      // If token is not native neither a mocked token it's a token from another chain
      // so we need a bridged token to reflect the one from the other chain
      if (!notBridgedTokens.includes(token)) {
        const symbol = computeTokenSymbol(network, tokenSymbols[token]);
        const tx = await factory.createToken(token, symbol);
        await tx.wait();

        // Factory set token data in storage when deploying the token
        const tokenAddress = await factory.getTokenAddress(symbol);

        writeDeployedAddress(network, "BridgedToken", tokenAddress, symbol);
        console.log(
          toStyle.discrete(
            "Writing deployed address in /constants/deployedAddresses.json ..."
          )
        );
        console.log(
          `factory deployed token: ${toStyle.blueItalic(
            token
          )} and set it in storage at ${toStyle.blueItalic(
            tokenAddress
          )} for chainId ${toStyle.blueItalic(networkParams[network].chainId)}.`
        );
      }
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
