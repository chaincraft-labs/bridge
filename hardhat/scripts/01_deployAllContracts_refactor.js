const hre = require("hardhat");
// import { writeDeployedAddress } from "./util";
const {
  writeDeployedAddress,
  readLastDeployedAddress,
  getMaxAddress,
  computeTokenSymbol,
} = require("./util");

// @todo
// network add polygon for relayer test
// change to hardhat ignition to deploy

// commands:
// npx hardhat run scripts/deploy.js --network localhost

const {
  networkParams,
  tokenList,
  getNetworkNameByChainId,
  usedNetworks,
  usedTokens,
  tokenSymbols,
} = require("./helperConfig");

// return symbol for tokenName and chainId
const getTokenSymbol = (tokenName, chainId) => {
  const token = tokenList.filter((token) => token.tokenName === tokenName)[0];
  return token.symbols.filter((symbol) => symbol.chainId === chainId)[0].symbol;
};
// allfeat, test, ethEquivalent
// const usedNetworks = ["allfeat", "hardhat", "sepolia"];

// TO MOVE IN ENV
operatorAdress = "0xe4192bf486aea10422ee097bc2cf8c28597b9f11";
//@todo LE TOKEN NATIF N EST PAS A AJOUTER SUR LA CHAINE
// car le storage deployment set déjà cette valeur !!!!!

const deployAndSaveAddress = async (network, contractName, params) => {
  const instance = await hre.ethers.deployContract(contractName, params);

  await instance.waitForDeployment();
  console.log(`==> ${contractName} deployed to: `, instance.target);

  const writeParams = [network, contractName, instance.target];
  // try catch
  if (contractName == "BridgedToken" || contractName == "MockedToken") {
    writeParams.push(params[params.length - 1]); // symbol
    // writeDeployedAddress(
    //   network,
    //   contractName,
    //   instance.target,
    //   params[params.length - 1] // symbol
    // );
  } else {
    // writeDeployedAddress(network, contractName, instance.target);
  }
  writeDeployedAddress(...writeParams);

  console.log(
    `Writting deployed address of ${contractName} to deployedAddresses.json...\n`
  );

  return instance;
};

const updateOperators = async (storageInstance, operators) => {
  await Promise.all(
    operators.map(async (operator) => {
      const tx = await storageInstance.updateOperator(
        operator.role,
        operator.address
      );
      await tx.wait();
      console.log(
        `${operator.role} address set in storage : ${operator.address}`
      );
    })
  ).catch((err) => {
    console.log("error updating operators...", err.message);
  });
};

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
      `error calling func ${funcName} on ${instance} with param: ${param}`
    );
  });
};

const formattingStyles = {
  bold: 1,
  italic: 3,
  underline: 4,
  black: 30,
  red: 31,
  green: 32,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
  blackBackground: 40,
  redBackground: 41,
  yellowBackground: 43,
  cyanBackground: 46,
  whiteBackground: 47,
  brightBlack: 90,
  brightRed: 91,
  brightGreen: 92,
  brightYellow: 93,
  brightBlue: 94,
  brightMagenta: 95,
  brightCyan: 96,
  brightWhite: 97,
  brightBlackBackground: 100,
  brightRedBackground: 101,
  brightGreenBackground: 102,
  brightYellowBackground: 103,
  brightBlueBackground: 104,
  brightMagentaBackground: 105,
  brightCyanBackground: 106,
  brightWhiteBackground: 107,
};

const baseStyles = {
  success: ["bold", "brightGreen"],
  error: ["bold", "red", "brightYellowBackground"],
  title: ["bold", "italic"],
};

const styleMessage = (msg, msgStyles) => {
  // const styleHeader = "\x1b[";
  // let styleHeaderClose = "m";

  const preparedStyle = msgStyles.map((style) => {
    return formattingStyles[style];
  });
  const styleHeader = "\x1b[" + preparedStyle.join(";") + "m";
  const styleFooter = "\x1b[0m";

  // console.log(`${styleHeader}${msg}${styleFooter}`);
  return `${styleHeader}${msg}${styleFooter}`;
};

async function main() {
  //get network name
  const network = hre.network.name;
  const nativeSymbol = networkParams[network].nativeSymbol;
  const currentChainId = networkParams[network].chainId;
  let xd = hre.network.config.chainId;

  // styleMessage("test stylise", ["red", "bold", "brightYellowBackground"]);
  // process.exit(0);

  // styleMessage("test stylise", ["red", "bold", "brightYellowBackground"]);

  console.log(
    `==== un text ${styleMessage("TESTING styles", baseStyles.title)} ====`
  );
  // process.exit(0);
  // 1st account metamask: in env or 1st account hardhat
  const [owner, user, server] = await hre.ethers.getSigners();
  // console.log("owner", owner);
  console.log("***** BASE TERMINAL EXAMPLES *****\n");
  console.log("- \\x1b[0m", `  | \x1b[0mReset\x1b[0m`);
  console.log("- \\x1b[1m", `  | \x1b[1;31mBold/Bright\x1b[0m`);
  console.log("- \\x1b[3m", `  | \x1b[3mItalic\x1b[0m`);
  console.log("- \\x1b[4m", `  | \x1b[4mUnderline\x1b[0m`);
  // process.exit(0);
  if (!usedNetworks.includes(network)) {
    throw "Trying to deploy to a network not included in the configured ones!";
  }
  // check all elements of usedNetworks are keys of networkParams:
  // console.log("keys", Object.keys(networkParams));
  // console.log("array", usedNetworks);
  // Object.keys(networkParams).forEach((key) => {
  //   console.log("key", key);
  //   if (!usedNetworks.includes(key)) {
  //     throw "one of the used networks is not included in the networkParams!";
  //   }
  // });
  const networkKeys = Object.keys(networkParams);
  usedNetworks.forEach((usedNetwork) => {
    if (!networkKeys.includes(usedNetwork)) {
      throw "one of the used networks is not included in the networkParams!";
    }
  });

  // console.log("TESTEST", xd);
  // console.log("OBJECT NET", hre.network);
  // SECU TO DEPLOY ON GOOD NETWORK
  //   if (!usedNetworks.includes(network)) {
  //     console.log("network not supported");
  //     process.exit(1);
  //   }

  console.log(
    "==>01_DEPLOYALLCONTRACTS\n----------------------------------------------------------\nDeploying contracts on network: %s \n----------------------------------------------------------",
    network
  );
  console.log("nativeSymbol: %s", nativeSymbol);
  // if (network == "hardhat") {
  // const [owner, user, server] = await hre.ethers.getSigners();
  // }
  // const [owner] = await hre.ethers.getSigners();

  console.log("--> owner address: %s ", owner.address);
  // console.log("--> user address: %s \n", user.address);
  // console.log("--> server address: %s \n", server.address);
  // 1. deploy storage
  // 2. deploy factory
  // 3. deploy vault
  // 4. deploy bridge
  // 5. deploy relayer
  // set addresses in storage
  // deploy BridgeTokenAft via factory and set vault as owner
  // set addresses in bridge

  // 1. deploy storage
  // const storage = await hre.ethers.deployContract("Storage", [nativeSymbol]);
  let nativeName = network == "allfeat" ? "allfeat" : "ethereum";
  console.log("nativeName", nativeName);

  const storage = await deployAndSaveAddress(network, "Storage", [nativeName]);

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

  // console.log(storage, vault, relayer, bridge);
  // be sure address are received !!
  const operators = [
    { role: "factory", address: factory.target },
    { role: "vault", address: vault.target },
    { role: "bridge", address: bridge.target },
    { role: "relayer", address: relayer.target },
    { role: "oracle", address: operatorAdress },
  ];
  // set addresses in storage
  await updateOperators(storage, operators);

  console.log(
    "----------------------------------------------------------\nDeploying tokens contracts \n----------------------------------------------------------"
  );

  //   Object.entries(networkParams).map(([name, params]) => {
  //     console.log(
  //       "network: %s => chainId: %s, nativeSymbol: %s",
  //       name,
  //       params.chainId,
  //       params.nativeSymbol
  //     );
  //   });
  // await Promise.all(
  //   Object.entries(networkParams).map(([name, params]) =>
  //     storage.addChainIdToList(params.chainId)
  //   )
  // );

  await batchWriteFunc(
    storage,
    "addChainIdToList",
    [31337, 441, 137, 11155111, 1]
  );

  // pb 31337 is 3 times instead of 2
  const chainIdList = await storage.getChainIdsList();
  console.log("chainId added to chainIdList: %s\n", chainIdList);

  await batchWriteFunc(storage, "addTokenNameToList", [
    "ethereum",
    "allfeat",
    "mockedDai",
  ]);

  const tokenNameList = await storage.getTokenNamesList();
  console.log("tokenName added to tokenNameList: %s\n", tokenNameList);

  // creating bridged token automatically :
  // +add to authorized list for chainInd tokenName
  // + set token data : [name - chain] => address
  let bridgedEthAddress,
    bridgedAftAddress,
    bridgedDaiAddress,
    mockedDaiAddress,
    bridgedAft,
    bridgedEth,
    bridgedDai,
    mockedDai;

  // ETHEREUM TOKEN
  //   if (network == "sepolia" || network == "hardhat" || network == "localhost") {
  //   } else {
  // @todo @audit (wrong tag) => error revert ethereum
  // no info

  // NATIVE TOKEN IS SET VIA STRORAGE CONSTRUCTOR
  // const deployedTokens = networkParams[network].deployedTokens;
  const currentNetworkNativeToken = networkParams[network].nativeToken.name;
  await Promise.all(
    usedNetworks.map(async (usedNetwork) => {
      // skip current network as storage constructor set data of its native token
      if (usedNetwork != network) {
        tx = await storage.setTokenAddressByChainId(
          networkParams[usedNetwork].nativeToken.name,
          networkParams[usedNetwork].chainId,
          getMaxAddress()
        );
        await tx.wait();
        console.log(
          `token ${
            networkParams[usedNetwork].nativeToken.name
          } set in storage at ${getMaxAddress()} for chainId ${
            networkParams[usedNetwork].chainId
          }`
        );
      }
    })
  ).catch((err) => {
    console.log(
      `error setting native tokens of other chains in storage...\n ${err.message}`
    );
  });

  // DEPLOY MOCKED TOKEN (token origin is this network)
  const currentNetworkDeployedTokens = networkParams[network].deployedTokens;
  await Promise.all(
    currentNetworkDeployedTokens.map(async (deployedToken) => {
      const token = await deployAndSaveAddress(network, "MockedToken", [
        owner,
        deployedToken.name,
        deployedToken.symbol,
      ]);
      // await storageInstance.updateOperator(operator.role, operator.address);
      // await tx.wait();
      // console.log(
      //   `${operator.role} address set in storage : ${operator.address}`
      // );

      tx = await storage.setTokenAddressByChainId(
        deployedToken.name,
        networkParams[network].chainId,
        token.target
      );
      await tx.wait();
      // console.log(
      //   `\x1b[93m\x1b[3m%s\x1b[0m token ${deployedToken.name} set in storage at ${token.target} for chainId ${networkParams[network].chainId}`
      // );
      console.log(
        `token ${styleMessage(deployedToken.name, [
          "yellow",
          "italic",
        ])} set in storage at ${styleMessage(token.target, [
          "yellow",
          "italic",
        ])} for chainId ${styleMessage(networkParams[network].chainId, [
          "yellow",
          "italic",
        ])}`
      );
    })
  ).catch((err) => {
    console.log(
      `${styleMessage("error deploying mocked token...", baseStyles.error)}\n${
        err.message
      }`
    );
  });

  // const storage = await deployAndSaveAddress(network, "Storage", [nativeName]);

  // DEPLOY BRIDGED TOKEN (token origin is not this network)
  const notBridgedToken = currentNetworkDeployedTokens.map((token) => {
    return token.name;
  });
  notBridgedToken.push(currentNetworkNativeToken);
  // DEPLOY MOCKED DAI!!!!! if on ethereum
  await Promise.all(
    usedTokens.map(async (token) => {
      if (!notBridgedToken.includes(token)) {
        const symbol = computeTokenSymbol(network, tokenSymbols[token]);
        // const tokenInstance = await deployAndSaveAddress(
        //   network,
        //   "BridgedToken",
        //   [token, symbol]
        // );
        // // await storageInstance.updateOperator(operator.role, operator.address);
        // // await tx.wait();
        // // console.log(
        // //   `${operator.role} address set in storage : ${operator.address}`
        // // );

        // tx = await storage.setTokenAddressByChainId(
        //   token,
        //   networkParams[network].chainId,
        //   tokenInstance.target
        // );
        // await tx.wait();

        // check bridgt deployd
        const oldstate = await factory.getTokenList();
        console.log("ANCIEN bridged tokens:", oldstate);

        // @todo CLEANUP reprise factory.
        const tx = await factory.createToken(token, symbol);
        await tx.wait();

        const newstate = await factory.getTokenList();
        console.log("NEW state: ", newstate);

        const lastadd = await factory.getTokenAddress(symbol);

        writeDeployedAddress(network, "BridgedToken", lastadd, symbol);
        console.log(
          "writing deployed address in /constants/deployedAddresses.json ...\n"
        );
        // console.log(
        //   `\x1b[93m\x1b[3m%s\x1b[0m token ${deployedToken.name} set in storage at ${token.target} for chainId ${networkParams[network].chainId}`
        // );
        console.log(
          `token ${styleMessage(token, [
            "italic",
            "yellow",
          ])} set in storage at ${styleMessage(lastadd, [
            //tokenInstance.target, [
            "yellow",
            "italic",
          ])} for chainId ${styleMessage(networkParams[network].chainId, [
            "yellow",
            "italic",
          ])}`
        );
      } else {
        console.log(
          `${styleMessage(
            "A SUPPRIMER/token is native so not deploying bridged version",
            baseStyles.success
          )}\n
      ${token}
    `
        );
      }
    })
  ).catch((err) => {
    console.log(
      `${styleMessage("error deploying bridged token...", baseStyles.error)}\n${
        err.message
      }`
    );
  });

  // if (network == "sepolia" || network == "hardhat" || network == "localhost") {
  //   let ehtNativeChainId = networkParams[usedNetworks[2]].chainId;

  // set data for native token
  // tx = await storage.addNativeTokenByChainId("ethereum", ehtNativeChainId);
  // await tx.wait();
  // console.log(
  //   "native token %s set in storage at  %s for chainId %s",
  //   nativeSymbol,
  //   getMaxAddress(),
  //   ehtNativeChainId
  // );

  // CLEANUP => in storage constructor
  // tx = await storage.setTokenAddressByChainId(
  //   "ethereum",
  //   "11155111",
  //   "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF"
  // );
  // await tx.wait();
  // console.log(
  //   "native token %s set in storage at  %s for chainId %s",
  //   nativeSymbol,
  //   getMaxAddress(),
  //   ehtNativeChainId
  // );

  // AFT TOKEN
  // let aftNativeChainId = networkParams[usedNetworks[0]].chainId;
  // if (network == "allfeat") {
  // } else {
  //   let tokenSymbol = getTokenSymbol("allfeat", currentChainId);
  //   tx = await factory.createToken("allfeat", tokenSymbol);
  //   await tx.wait();
  //   bridgedAftAddress = await factory.getTokenAddress(tokenSymbol);
  //   console.log(
  //     "==> BridgedAft (%s) deployed to: %s",
  //     tokenSymbol,
  //     bridgedAftAddress
  //   );
  //   writeDeployedAddress(
  //     network,
  //     "BridgedToken",
  //     bridgedAftAddress,
  //     tokenSymbol
  //   );
  //   console.log(
  //     "writing deployed address in /constants/deployedAddresses.json ...\n"
  //   );
  // }
  // set data for native token
  // tx = await storage.addNativeTokenByChainId("allfeat", aftNativeChainId);
  // await tx.wait();
  // console.log(
  //   "native token %s set in storage at  %s for chainId %s",
  //   nativeSymbol,
  //   getMaxAddress(),
  //   aftNativeChainId
  // );
  // tx = await storage.setTokenAddressByChainId(
  //   "allfeat",
  //   ehtNativeChainId,
  //   getMaxAddress()
  // );
  // tx = await storage.setTokenAddressByChainId(
  //   "allfeat",
  //   "441",
  //   "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF"
  // );
  // await tx.wait();
  // console.log(
  //   "native token %s set in storage at  %s for chainId %s",
  //   nativeSymbol,
  //   getMaxAddress(),
  //   aftNativeChainId
  // );
  // DAI TOKEN
  // if (network != "allfeat") {
  //   mockedDai = await hre.ethers.deployContract("MockedDai");
  //   await mockedDai.waitForDeployment();
  //   mockedDaiAddress = mockedDai.target;
  //   tx = await storage.addNewTokenAddressByChainId(
  //     "dai",
  //     networkParams[network].chainId,
  //     mockedDaiAddress
  //   );
  //   await tx.wait();
  //   console.log("==> MockedDai deployed to:", mockedDaiAddress);
  //   writeDeployedAddress(network, "MockedDai", mockedDaiAddress);
  //   console.log(
  //     "writing deployed address in /constants/deployedAddresses.json ...\n"
  //   );
  // } else {
  //   let tokenSymbol = getTokenSymbol("dai", currentChainId);
  //   tx = await factory.createToken("dai", tokenSymbol);
  //   await tx.wait();
  //   bridgedDaiAddress = await factory.getTokenAddress(tokenSymbol);
  //   console.log(
  //     "==> bridgedDai (%s) deployed to: %s",
  //     tokenSymbol,
  //     bridgedDaiAddress
  //   );
  //   writeDeployedAddress(
  //     network,
  //     "BridgedToken",
  //     bridgedDaiAddress,
  //     tokenSymbol
  //   );
  //   console.log(
  //     "writing deployed address in /constants/deployedAddresses.json ...\n"
  //   );
  // }
  // }

  // if (network == "allfeat") {
  //   let ehtNativeChainId = networkParams[usedNetworks[2]].chainId;

  //   // if (network == "allfeat") {
  //   let tokenSymbol = getTokenSymbol("ethereum", currentChainId);
  //   //   tx = await factory.createToken("ethereum", tokenSymbol);
  //   // await tx.wait();

  //   let BridgedEth = await hre.ethers.deployContract("BridgedToken", [
  //     "ethereum",
  //     tokenSymbol,
  //   ]);
  //   await BridgedEth.waitForDeployment();

  //   tx = await BridgedEth.updateAdmin(vault.target);
  //   tx = await factory.helperHCK("ethereum", tokenSymbol, BridgedEth.target);
  //   await tx.wait();

  //   bridgedEthAddress = await factory.getTokenAddress(tokenSymbol);
  //   console.log(
  //     "==> bridgedEth (%s) deployed to: %s",
  //     tokenSymbol,
  //     bridgedEthAddress
  //   );
  //   writeDeployedAddress(network, "BridgedToken", bridgedEthAddress, tokenSymbol);
  //   console.log(
  //     "writing deployed address in /constants/deployedAddresses.json ...\n"
  //   );
  // }
  // set data for native token
  // tx = await storage.addNativeTokenByChainId("ethereum", ehtNativeChainId);
  // await tx.wait();
  // console.log(
  //   "native token %s set in storage at  %s for chainId %s",
  //   nativeSymbol,
  //   getMaxAddress(),
  //   ehtNativeChainId
  // );
  // tx = await storage.setTokenAddressByChainId(
  //   "ethereum",
  //   ehtNativeChainId,
  //   getMaxAddress()
  // );
  // tx = await storage.setTokenAddressByChainId(
  //   "ethereum",
  //   "11155111",
  //   "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF"
  // );
  // await tx.wait();
  // console.log(
  //   "native token %s set in storage at  %s for chainId %s",
  //   nativeSymbol,
  //   getMaxAddress(),
  //   ehtNativeChainId
  // );
  // // AFT TOKEN
  // let aftNativeChainId = networkParams[usedNetworks[0]].chainId;
  // if (network == "allfeat") {
  // } else {
  // let tokenSymbol = getTokenSymbol("allfeat", currentChainId);
  // tx = await factory.createToken("allfeat", tokenSymbol);
  // await tx.wait();
  // bridgedAftAddress = await factory.getTokenAddress(tokenSymbol);
  // console.log(
  //   "==> BridgedAft (%s) deployed to: %s",
  //   tokenSymbol,
  //   bridgedAftAddress
  // );
  // writeDeployedAddress(
  //   network,
  //   "BridgedToken",
  //   bridgedAftAddress,
  //   tokenSymbol
  // );
  // console.log(
  //   "writing deployed address in /constants/deployedAddresses.json ...\n"
  // );
}
// set data for native token
// tx = await storage.addNativeTokenByChainId("allfeat", aftNativeChainId);
// await tx.wait();
// console.log(
//   "native token %s set in storage at  %s for chainId %s",
//   nativeSymbol,
//   getMaxAddress(),
//   aftNativeChainId
// );
// tx = await storage.setTokenAddressByChainId(
//   "allfeat",
//   aftNativeChainId,
//   getMaxAddress()
// );
// tx = await storage.setTokenAddressByChainId(
//   "allfeat",
//   "441",
//   "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF"
// );
// await tx.wait();
// console.log(
//   "native token %s set in storage at  %s for chainId %s",
//   nativeSymbol,
//   getMaxAddress(),
//   aftNativeChainId
// );
// // DAI TOKEN
// if (network != "allfeat") {
// mockedDai = await hre.ethers.deployContract("MockedDai");
// await mockedDai.waitForDeployment();
// mockedDaiAddress = mockedDai.target;
// tx = await storage.addNewTokenAddressByChainId(
//   "dai",
//   networkParams[network].chainId,
//   mockedDaiAddress
// );
// await tx.wait();
// console.log("==> MockedDai deployed to:", mockedDaiAddress);
// writeDeployedAddress(network, "MockedDai", mockedDaiAddress);
// console.log(
//   "writing deployed address in /constants/deployedAddresses.json ...\n"
// );
// } else {
// let tokenSymbol = getTokenSymbol("dai", currentChainId);
// tx = await factory.createToken("dai", tokenSymbol);
// await tx.wait();
// bridgedDaiAddress = await factory.getTokenAddress(tokenSymbol);
// console.log(
//   "==> bridgedDai (%s) deployed to: %s",
//   tokenSymbol,
//   bridgedDaiAddress
// );
// writeDeployedAddress(
//   network,
//   "BridgedToken",
//   bridgedDaiAddress,
//   tokenSymbol
// );
// console.log(
//   "writing deployed address in /constants/deployedAddresses.json ...\n"
// );

//     let tokenSymbol = getTokenSymbol("dai", currentChainId);
//     //   tx = await factory.createToken("ethereum", tokenSymbol);
//     // await tx.wait();

//     let BridgedDai = await hre.ethers.deployContract("BridgedToken", [
//       "dai",
//       tokenSymbol,
//     ]);
//     await BridgedDai.waitForDeployment();

//     // tx = await storage.addNewTokenAddressByChainId(
//     //   "ethereum",
//     //   currentChainId,
//     //   BridgedEth.target
//     // );
//     // await tx.wait();
//     // tx = await BridgedEth.updateAdmin(vault.target);
//     // await tx.wait();
//     tx = await BridgedDai.updateAdmin(vault.target);

//     tx = await factory.helperHCK("dai", tokenSymbol, BridgedDai.target);
//     await tx.wait();

//     BridgedDaiAddress = await factory.getTokenAddress(tokenSymbol);
//     console.log(
//       "==> bridgedDai (%s) deployed to: %s",
//       tokenSymbol,
//       BridgedDaiAddress
//     );
//     writeDeployedAddress(
//       network,
//       "BridgedToken",
//       BridgedDaiAddress,
//       tokenSymbol
//     );
//     console.log(
//       "writing deployed address in /constants/deployedAddresses.json ...\n"
//     );
//   }
// }
// @todo NEED AFTER TO SET ADDRESS ON THE OTHER CHAIN

// @todo NEED AFTER TO SET ADDRESS ON THE OTHER CHAIN

//   writeDeployedAddress(network, "BridgedToken", storage.target);
//   writeDeployedAddress(network, "TokenFactory", factory.target);
//   writeDeployedAddress(network, "Vault", vault.target);
//   writeDeployedAddress(network, "RelayerBase", relayer.target);
//   writeDeployedAddress(network, "BridgeBase", bridge.target);

// mocked dai and native token :  add to authorized list [name-chain => address]

//   // address 0 = 0x
//   const zeroAddress = "0x" + "0".repeat(40);
//   // deploy BridgeTokenAft via factory and set vault as owner
//   const bridgedTokenAftTx = await factory.createToken(
//     "BridgedTokenAft",
//     "Aft",
//     "AFT",
//     zeroAddress
//   );
//   const bridgedTokenAftReceipt = await bridgedTokenAftTx.wait();
//   const bridgedTokenAftAddress = bridgedTokenAftReceipt.logs[0].args[0];
//   console.log(`BridgedTokenAft deployed to: ${bridgedTokenAftAddress}`);

// set addresses in storage cahinid allfeat: 441
//   tokenName = ["AFT"];
//   chainIds = [441, 1];
//   tokenAddresses = [zeroAddress, bridgedTokenAftAddress];
//   tx = await storage.batchSetTokenOnChainId(
//     tokenName,
//     chainIds,
//     tokenAddresses
//   );
//   await tx.wait();
//   console.log("token addresses set in storage");
// }

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
