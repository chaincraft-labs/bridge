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
  const [owner, user, server] = await hre.ethers.getSigners();
  console.log("--> owner address: %s ", owner.address);
  console.log("--> user address: %s \n", user.address);
  console.log("--> server address: %s \n", server.address);
  // 1. deploy storage
  // 2. deploy factory
  // 3. deploy vault
  // 4. deploy bridge
  // 5. deploy relayer
  // set addresses in storage
  // deploy BridgeTokenAft via factory and set vault as owner
  // set addresses in bridge

  // 1. deploy storage
  const storage = await hre.ethers.deployContract("Storage", [nativeSymbol]);
  await storage.waitForDeployment();
  console.log("==> Storage deployed to:", storage.target);

  // 2. deploy factory
  const factory = await hre.ethers.deployContract("TokenFactory", [
    storage.target,
  ]);
  await factory.waitForDeployment();
  console.log("==> TokenFactory deployed to:", factory.target);

  // 3. deploy vault
  const vault = await hre.ethers.deployContract("Vault", [storage.target]);
  await vault.waitForDeployment();
  console.log("==> Vault deployed to:", vault.target);

  // 5. deploy relayer
  const relayer = await hre.ethers.deployContract("RelayerBase", [
    storage.target,
  ]);
  await relayer.waitForDeployment();
  console.log("==> Relayer deployed to:", relayer.target);

  // 4. deploy bridge
  const bridge = await hre.ethers.deployContract("BridgeBase", [
    storage.target,
    relayer.target,
  ]);
  await bridge.waitForDeployment();
  console.log("==> Bridge deployed to:", bridge.target);

  console.log(
    "writing deployed addresses in /constants/deployedAddresses.json ...\n"
  );
  writeDeployedAddress(network, "Storage", storage.target);
  writeDeployedAddress(network, "TokenFactory", factory.target);
  writeDeployedAddress(network, "Vault", vault.target);
  writeDeployedAddress(network, "RelayerBase", relayer.target);
  writeDeployedAddress(network, "BridgeBase", bridge.target);

  // set addresses in storage
  let tx = await storage.updateOperator("factory", factory.target);
  await tx.wait();
  console.log("factory address set in storage");
  tx = await storage.updateOperator("vault", vault.target);
  await tx.wait();
  console.log("vault address set in storage");
  tx = await storage.updateOperator("bridge", bridge.target);
  await tx.wait();
  console.log("bridge address set in storage");
  tx = await storage.updateOperator("relayer", relayer.target);
  await tx.wait();
  console.log("relayer address set in storage\n");

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
  await Promise.all(
    Object.entries(networkParams).map(([name, params]) =>
      storage.addChainIdToList(params.chainId)
    )
  );
  // pb 31337 is 3 times instead of 2
  const chainIdList = await storage.getChainIdsList();
  console.log("chainId added to chainIdList: %s\n", chainIdList);

  await Promise.all(
    tokenList.map((tokenData) =>
      storage.addTokenNameToList(tokenData.tokenName)
    )
  );
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
  let ehtNativeChainId = networkParams[usedNetworks[2]].chainId;

  if (network == "allfeat") {
    let tokenSymbol = getTokenSymbol("ethereum", currentChainId);
    tx = await factory.createToken("ethereum", tokenSymbol);
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
  }
  // set data for native token
  tx = await storage.addNativeTokenByChainId("ethereum", ehtNativeChainId);
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
  tx = await storage.addNativeTokenByChainId("allfeat", aftNativeChainId);
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
