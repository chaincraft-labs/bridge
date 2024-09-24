const hre = require("hardhat");
// import { writeDeployedAddress } from "./util";
const {
  writeDeployedAddress,
  readLastDeployedAddress,
  readNetworks,
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
const tokenList = [
  {
    tokenName: "ethereum",
    symbols: [
      { chainId: 1, symbol: "ETH" },
      { chainId: 137, symbol: "pbETH" },
      { chainId: 441, symbol: "abETH" },
      { chainId: 31337, symbol: "hbETH" },
      { chainId: 11155111, symbol: "sbETH" },
    ],
  },
  {
    tokenName: "dai",
    symbols: [
      { chainId: 1, symbol: "DAI" },
      { chainId: 137, symbol: "pbDAI" },
      { chainId: 441, symbol: "abDAI" },
      { chainId: 31337, symbol: "hbDAI" },
      { chainId: 11155111, symbol: "sbDAI" },
    ],
  },
  {
    tokenName: "allfeat",
    symbols: [
      { chainId: 1, symbol: "AFT" },
      { chainId: 137, symbol: "pbAFT" },
      { chainId: 441, symbol: "abAFT" },
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
// const usedNetworks = ["allfeat", "hardhat", "sepolia"];

async function main() {
  //get network name
  const network = hre.network.name;
  const nativeSymbol = networkParams[network].nativeSymbol;
  const currentChainId = networkParams[network].chainId;

  // if (!usedNetworks.includes(network)) {
  //   console.log("network not supported");
  //   process.exit(1);
  // }

  console.log(
    "==>01_SETTOKENS\n----------------------------------------------------------\nSetting contracts addresses on network: %s \n----------------------------------------------------------",
    network
  );

  let networks = await readNetworks();
  console.log("reading data for existing networks: %s", networks);

  if (networks.indexOf(network) === -1) {
    //|| networks.length > 2) {
    console.error("network %s not found or too many networks", network);
    process.exit(1);
  }

  // HCKTON => sepolia 11155111 => allfeat 441
  // usedNetworks[0]
  if (network === "allfeat") {
    let storageAddress = readLastDeployedAddress("allfeat", "Storage");
    console.log("ON %s ==> Storage address: %s", network, storageAddress);
    let storage = await hre.ethers.getContractAt("Storage", storageAddress);
    // set on allfeat add of bridged Aft on the other chain
    let tokenSymbol = computeTokenSymbol(
      "sepolia", //networkParams[usedNetworks[2]].chainId,
      "AFT"
    );
    let bridgedAftAddress = readLastDeployedAddress(
      "sepolia", //usedNetworks[2],
      "BridgedToken",
      tokenSymbol
    );
    tx = await storage.addNewTokenAddressByChainId(
      "allfeat",
      11155111, // networkParams[usedNetworks[2]].chainId,
      bridgedAftAddress
    );
    await tx.wait();
    console.log(
      "==> Set on %s data for %s on %s (address %s)",
      network,
      tokenSymbol,
      "sepolia", //usedNetworks[2],
      bridgedAftAddress
    );

    // set on allfeat add of MockedDai on the other chain
    let mockedDaiAddress = readLastDeployedAddress(
      "sepolia", //usedNetworks[2],
      "MockedDai"
    );
    tx = await storage.addNewTokenAddressByChainId(
      "dai",
      11155111, // networkParams[usedNetworks[2]].chainId,
      mockedDaiAddress
    );
    await tx.wait();
    console.log(
      "==> Set on %s data for Dai on %s (address %s)",
      network,
      "sepolia", //usedNetworks[2],
      mockedDaiAddress
    );
  } else {
    //ON SEPOLIA
    let storageAddress = readLastDeployedAddress("sepolia", "Storage");
    console.log("ON %s ==> Storage address: %s", network, storageAddress);
    let storage = await hre.ethers.getContractAt("Storage", storageAddress);
    // set on ethereum like add of bridged Eth on the other chain
    let tokenSymbol = computeTokenSymbol(
      "allfeat", //networkParams[usedNetworks[0]].chainId,
      "ETH"
    );
    let bridgedEthAddress = readLastDeployedAddress(
      "allfeat", //usedNetworks[0],
      "BridgedToken",
      tokenSymbol
    );
    console.log(
      "ON SEPOLIA : read & write bridgedEthAddress: %s deployed on allfeat with symbol %s",
      bridgedEthAddress,
      tokenSymbol
    );
    tx = await storage.addNewTokenAddressByChainId(
      "ethereum",
      441, //networkParams[usedNetworks[0]].chainId,
      bridgedEthAddress
    );
    await tx.wait();
    console.log(
      "==> Set on %s data for %s on %s (address %s)",
      network,
      tokenSymbol,
      "allfeat", //usedNetworks[0],
      bridgedEthAddress
    );

    // set on allfeat add of MockedDai on the other chain
    tokenSymbol = computeTokenSymbol(
      "allfeat", //networkParams[usedNetworks[0]].chainId,
      "DAI"
    );
    let bridgedDaiAddress = readLastDeployedAddress(
      "allfeat", //usedNetworks[0],
      "BridgedToken",
      tokenSymbol
    );
    tx = await storage.addNewTokenAddressByChainId(
      "dai",
      441, // networkParams[usedNetworks[0]].chainId,
      bridgedDaiAddress
    );
    await tx.wait();
    console.log(
      "==> Set on %s data for Dai on %s (address %s)",
      network,
      "allfeat", //usedNetworks[0],
      bridgedDaiAddress
    );
  }

  //   console.log("nativeSymbol: %s", nativeSymbol);
  //   const [owner, user, server] = await hre.ethers.getSigners();
  //   console.log("--> owner address: %s ", owner.address);
  //   console.log("--> user address: %s \n", user.address);
  //   console.log("--> server address: %s \n", server.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/// commands
// npx hardhat run scripts/01_deployAllContracts.js --network localhost
// npx hardhat run scripts /01_setTokens.js--network localhost

// npx hardhat run scripts/01_deployAllContracts.js --network sepolia
// npx hardhat run scripts/01_deployAllContracts.js --network allfeat
// npx hardhat run scripts/01_setTokens.js --network sepolia
// npx hardhat run scripts/01_setTokens.js --network allfeat
