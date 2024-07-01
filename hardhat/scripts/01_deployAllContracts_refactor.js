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

const networkParams = {
  localhost: {
    chainId: 31337,
    nativeSymbol: "ETH",
  },
  hardhat: {
    chainId: 31337,
    nativeSymbol: "ETH",
  },
  allfeat: {
    chainId: 441,
    nativeSymbol: "AFT",
  },
  polygon: {
    chainId: 137,
    nativeSymbol: "MATIC",
  },
  sepolia: {
    chainId: 11155111,
    nativeSymbol: "ETH",
  },
  ethereum: {
    chainId: 1,
    nativeSymbol: "ETH",
  },
};

// only 2 chain allfeat // ethereum == polygon, sepolia, hardhat, localhost
const tokenList = [
  {
    tokenName: "ethereum",
    symbols: [
      { chainId: 1, symbol: "ETH" },
      { chainId: 137, symbol: "ETH" },
      { chainId: 441, symbol: "abETH" },
      { chainId: 31337, symbol: "ETH" },
      { chainId: 11155111, symbol: "ETH" },
    ],
  },
  {
    tokenName: "dai",
    symbols: [
      { chainId: 1, symbol: "DAI" },
      { chainId: 137, symbol: "DAI" },
      { chainId: 441, symbol: "abDAI" },
      { chainId: 31337, symbol: "DAI" },
      { chainId: 11155111, symbol: "DAI" },
    ],
  },
  {
    tokenName: "allfeat",
    symbols: [
      { chainId: 1, symbol: "ebAFT" },
      { chainId: 137, symbol: "pbAFT" },
      { chainId: 441, symbol: "AFT" },
      { chainId: 31337, symbol: "hbAFT" },
      { chainId: 11155111, symbol: "sbAFT" },
    ],
  },
];

// return symbol for tokenName and chainId
const getTokenSymbol = (tokenName, chainId) => {
  const token = tokenList.filter((token) => token.tokenName === tokenName)[0];
  return token.symbols.filter((symbol) => symbol.chainId === chainId)[0].symbol;
};
// allfeat, test, ethEquivalent
const usedNetworks = ["allfeat", "hardhat", "sepolia"];

// TO MOVE IN ENV
operatorAdress = "0xe4192bf486aea10422ee097bc2cf8c28597b9f11";
//@todo LE TOKEN NATIF N EST PAS A AJOUTER SUR LA CHAINE
// car le storage deployment set déjà cette valeur !!!!!

const deployAndSaveAddress = async (network, contractName, params) => {
  const instance = await hre.ethers.deployContract(contractName, params);

  await instance.waitForDeployment();
  console.log("==> Storage deployed to:", storage.target);

  writeDeployedAddress(network, contractName, instance.target);
  console.log("address written in /constants/deployedAddresses.json ...\n");

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
      console.log(`${operator.role} address set in storage`);
    })
  ).catch((err) => {
    console.log("error updating operators...", err.message);
  });
};

// parallel exec (don't use this if sequential call needed)
const batchFunc = async (instance, funcName, params) => {
  await Promise.all(
    params.map(async (param) => {
      const tx = await instance[funcName](param);
      await tx.wait();
      console.log(
        `error calling func ${funcName} on ${instance} with param: ${param}`
      );
    })
  ).catch((err) => {
    console.log("error updating operators...", err.message);
  });
};

async function main() {
  //get network name
  const network = hre.network.name;
  const nativeSymbol = networkParams[network].nativeSymbol;
  const currentChainId = networkParams[network].chainId;

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
  const [owner] = await hre.ethers.getSigners();

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

  const storage = await deployAndSaveAddress(network, "Storage", [
    nativeSymbol,
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

  const operators = [
    { role: "factory", address: factory.target },
    { role: "vault", address: vault.target },
    { role: "bridge", address: bridge.target },
    { role: "relayer", address: relayer.target },
    { role: "oracle", address: operatorAdress },
  ];
  // set addresses in storage
  await updateOperators(operators);

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

  await batchFunc(storage, "addChainIdToList", [31337, 441, 137, 11155111, 1]);

  // pb 31337 is 3 times instead of 2
  const chainIdList = await storage.getChainIdsList();
  console.log("chainId added to chainIdList: %s\n", chainIdList);

  // await Promise.all(
  //   tokenList.map((tokenData) =>
  //     storage.addTokenNameToList(tokenData.tokenName)
  //   )
  // );
  await batchFunc(storage, "addTokenNameToList", [
    "ethereum",
    "allfeat",
    "dai",
  ]);

  await storage.addTokenNameToList("ethereum");
  await storage.addTokenNameToList("allfeat");
  await storage.addTokenNameToList("dai");

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
  /*ProviderError: VM Exception while processing transaction: revert ethereum
    at HttpProvider.request (/home/ibournubuntu/DEVALLFEAT/Allfeat-EVM-bridge-POC/hardhat/node_modules/hardhat/src/internal/core/providers/http.ts:90:21)
    at runMicrotasks (<anonymous>)
    at processTicksAndRejections (node:internal/process/task_queues:96:5)
    at HardhatEthersProvider.estimateGas (/home/ibournubuntu/DEVALLFEAT/Allfeat-EVM-bridge-POC/hardhat/node_modules/@nomicfoundation/hardhat-ethers/src/internal/hardhat-ethers-provider.ts:246:27)
    at /home/ibournubuntu/DEVALLFEAT/Allfeat-EVM-bridge-POC/hardhat/node_modules/@nomicfoundation/hardhat-ethers/src/signers.ts:235:35
    at async Promise.all (index 0)
    at HardhatEthersSigner._sendUncheckedTransaction (/home/ibournubuntu/DEVALLFEAT/Allfeat-EVM-bridge-POC/hardhat/node_modules/@nomicfoundation/hardhat-ethers/src/signers.ts:256:7)
    at HardhatEthersSigner.sendTransaction (/home/ibournubuntu/DEVALLFEAT/Allfeat-EVM-bridge-POC/hardhat/node_modules/@nomicfoundation/hardhat-ethers/src/signers.ts:125:18)
    at send (/home/ibournubuntu/DEVALLFEAT/Allfeat-EVM-bridge-POC/hardhat/node_modules/ethers/src.ts/contract/contract.ts:313:20)
      at Proxy.createToken (/home/ibournubuntu/DEVALLFEAT/Allfeat-EVM-bridge-POC/hardhat/node_modules/ethers/src.ts/contract/contract.ts:352:16)
      ast ref : "at  HardhatEthersProvider.estimateGas" */
  // SO SPLIT CASE FOR ETHEREUM
  // and allfeat where we deploy manually bridged token (not passing via factory)

  if (network == "sepolia" || network == "hardhat" || network == "localhost") {
    let ehtNativeChainId = networkParams[usedNetworks[2]].chainId;

    // if (network == "allfeat") {
    //   let tokenSymbol = getTokenSymbol("ethereum", currentChainId);
    //   tx = await factory.createToken("ethereum", tokenSymbol);
    //   await tx.wait();
    //   bridgedEthAddress = await factory.getTokenAddress(tokenSymbol);
    //   console.log(
    //     "==> bridgedEth (%s) deployed to: %s",
    //     tokenSymbol,
    //     bridgedEthAddress
    //   );
    //   writeDeployedAddress(
    //     network,
    //     "BridgedToken",
    //     bridgedEthAddress,
    //     tokenSymbol
    //   );
    //   console.log(
    //     "writing deployed address in /constants/deployedAddresses.json ...\n"
    //   );
    // }
    // set data for native token
    tx = await storage.addNativeTokenByChainId("ethereum", ehtNativeChainId);
    await tx.wait();
    console.log(
      "native token %s set in storage at  %s for chainId %s",
      nativeSymbol,
      getMaxAddress(),
      ehtNativeChainId
    );
    // tx = await storage.setTokenAddressByChainId(
    //   "ethereum",
    //   ehtNativeChainId,
    //   getMaxAddress()
    // );
    tx = await storage.setTokenAddressByChainId(
      "ethereum",
      "11155111",
      "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF"
    );
    await tx.wait();
    console.log(
      "native token %s set in storage at  %s for chainId %s",
      nativeSymbol,
      getMaxAddress(),
      ehtNativeChainId
    );
    // AFT TOKEN
    let aftNativeChainId = networkParams[usedNetworks[0]].chainId;
    if (network == "allfeat") {
    } else {
      let tokenSymbol = getTokenSymbol("allfeat", currentChainId);
      tx = await factory.createToken("allfeat", tokenSymbol);
      await tx.wait();
      bridgedAftAddress = await factory.getTokenAddress(tokenSymbol);
      console.log(
        "==> BridgedAft (%s) deployed to: %s",
        tokenSymbol,
        bridgedAftAddress
      );
      writeDeployedAddress(
        network,
        "BridgedToken",
        bridgedAftAddress,
        tokenSymbol
      );
      console.log(
        "writing deployed address in /constants/deployedAddresses.json ...\n"
      );
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
    //   ehtNativeChainId,
    //   getMaxAddress()
    // );
    tx = await storage.setTokenAddressByChainId(
      "allfeat",
      "441",
      "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF"
    );
    await tx.wait();
    console.log(
      "native token %s set in storage at  %s for chainId %s",
      nativeSymbol,
      getMaxAddress(),
      aftNativeChainId
    );
    // DAI TOKEN
    if (network != "allfeat") {
      mockedDai = await hre.ethers.deployContract("MockedDai");
      await mockedDai.waitForDeployment();
      mockedDaiAddress = mockedDai.target;
      tx = await storage.addNewTokenAddressByChainId(
        "dai",
        networkParams[network].chainId,
        mockedDaiAddress
      );
      await tx.wait();
      console.log("==> MockedDai deployed to:", mockedDaiAddress);
      writeDeployedAddress(network, "MockedDai", mockedDaiAddress);
      console.log(
        "writing deployed address in /constants/deployedAddresses.json ...\n"
      );
    } else {
      let tokenSymbol = getTokenSymbol("dai", currentChainId);
      tx = await factory.createToken("dai", tokenSymbol);
      await tx.wait();
      bridgedDaiAddress = await factory.getTokenAddress(tokenSymbol);
      console.log(
        "==> bridgedDai (%s) deployed to: %s",
        tokenSymbol,
        bridgedDaiAddress
      );
      writeDeployedAddress(
        network,
        "BridgedToken",
        bridgedDaiAddress,
        tokenSymbol
      );
      console.log(
        "writing deployed address in /constants/deployedAddresses.json ...\n"
      );
    }
  }

  if (network == "allfeat") {
    let ehtNativeChainId = networkParams[usedNetworks[2]].chainId;

    // if (network == "allfeat") {
    let tokenSymbol = getTokenSymbol("ethereum", currentChainId);
    //   tx = await factory.createToken("ethereum", tokenSymbol);
    // await tx.wait();

    let BridgedEth = await hre.ethers.deployContract("BridgedToken", [
      "ethereum",
      tokenSymbol,
    ]);
    await BridgedEth.waitForDeployment();

    // tx = await storage.addNewTokenAddressByChainId(
    //   "ethereum",
    //   currentChainId,
    //   BridgedEth.target
    // );
    // await tx.wait();
    // tx = await BridgedEth.updateAdmin(vault.target);
    // await tx.wait();
    tx = await BridgedEth.updateAdmin(vault.target);
    tx = await factory.helperHCK("ethereum", tokenSymbol, BridgedEth.target);
    await tx.wait();

    bridgedEthAddress = await factory.getTokenAddress(tokenSymbol);
    console.log(
      "==> bridgedEth (%s) deployed to: %s",
      tokenSymbol,
      bridgedEthAddress
    );
    writeDeployedAddress(
      network,
      "BridgedToken",
      bridgedEthAddress,
      tokenSymbol
    );
    console.log(
      "writing deployed address in /constants/deployedAddresses.json ...\n"
    );
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
    tx = await storage.setTokenAddressByChainId(
      "ethereum",
      "11155111",
      "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF"
    );
    await tx.wait();
    console.log(
      "native token %s set in storage at  %s for chainId %s",
      nativeSymbol,
      getMaxAddress(),
      ehtNativeChainId
    );
    // AFT TOKEN
    let aftNativeChainId = networkParams[usedNetworks[0]].chainId;
    if (network == "allfeat") {
    } else {
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
    tx = await storage.setTokenAddressByChainId(
      "allfeat",
      "441",
      "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF"
    );
    await tx.wait();
    console.log(
      "native token %s set in storage at  %s for chainId %s",
      nativeSymbol,
      getMaxAddress(),
      aftNativeChainId
    );
    // DAI TOKEN
    if (network != "allfeat") {
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
    } else {
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

      let tokenSymbol = getTokenSymbol("dai", currentChainId);
      //   tx = await factory.createToken("ethereum", tokenSymbol);
      // await tx.wait();

      let BridgedDai = await hre.ethers.deployContract("BridgedToken", [
        "dai",
        tokenSymbol,
      ]);
      await BridgedDai.waitForDeployment();

      // tx = await storage.addNewTokenAddressByChainId(
      //   "ethereum",
      //   currentChainId,
      //   BridgedEth.target
      // );
      // await tx.wait();
      // tx = await BridgedEth.updateAdmin(vault.target);
      // await tx.wait();
      tx = await BridgedDai.updateAdmin(vault.target);

      tx = await factory.helperHCK("dai", tokenSymbol, BridgedDai.target);
      await tx.wait();

      BridgedDaiAddress = await factory.getTokenAddress(tokenSymbol);
      console.log(
        "==> bridgedDai (%s) deployed to: %s",
        tokenSymbol,
        BridgedDaiAddress
      );
      writeDeployedAddress(
        network,
        "BridgedToken",
        BridgedDaiAddress,
        tokenSymbol
      );
      console.log(
        "writing deployed address in /constants/deployedAddresses.json ...\n"
      );
    }
  }
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
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
