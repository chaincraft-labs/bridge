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
  let network = await hre.network.name;
  let storageAddress = await readLastDeployedAddress(network, "Storage");
  let storage = await hre.ethers.getContractAt("Storage", storageAddress);

  let user = await hre.ethers.provider.getSigner();
  let userAddress = user.address;

  // chain & symbol & name
  let chainIds = ["441", "11155111"];
  let tokenNames = ["allfeat", "ethereum", "dai"];
  let tokenSymbols = ["AFT", "ETH", "DAI", "abETH", "abDAI", "ebAFT"];

  console.log(
    "---------------------------------\nbefore data\n---------------------------------"
  );
  let tAddress = await storage.getTokenAddressByChainId("ethereum", "441");
  console.log(
    "SEOPLIA storage side : ethereum symb/add on allfeat: abETH/",
    tAddress
  );
  tAddress = await storage.getTokenAddressByChainId("ethereum", "11155111");
  console.log(
    "SEOPLIA storage side : ethereum symb/add on sepolia: ETH/",
    tAddress
  );
  tAddress = await storage.getTokenAddressByChainId("allfeat", "441");
  console.log(
    "SEOPLIA storage side : allfeat symb/add on sepolia: AFT/",
    tAddress
  );

  console.log(
    "---------------------------------\new data\n---------------------------------"
  );
  //   let tx = await storage.addNativeTokenByChainId("ethereum", "11155111");
  //   await tx.wait();
  //   tAddress = await storage.getTokenAddressByChainId("ethereum", "11155111");
  //   console.log(
  //     "SEOPLIA storage side (DEBUG) : ethereum symb/add on sepolia: ETH/",
  //     tAddress
  //   );

  //   tx = await storage.addNativeTokenByChainId("allfeat", "441");
  //   await tx.wait();
  //   tAddress = await storage.getTokenAddressByChainId("allfeat", "441");
  //   console.log(
  //     "SEOPLIA storage side (DEBUG) : allfeat symb/add on sepolia: AFT/",
  //     tAddress
  //   );
  let tx = await storage.setTokenAddressByChainId(
    "ethereum",
    "11155111",
    "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF"
  );
  await tx.wait();
  tAddress = await storage.getTokenAddressByChainId("ethereum", "11155111");
  console.log(
    "SEOPLIA storage side (DEBUG) : ethereum symb/add on sepolia: ETH/",
    tAddress
  );

  tx = await storage.setTokenAddressByChainId(
    "allfeat",
    "441",
    "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF"
  );
  await tx.wait();
  tAddress = await storage.getTokenAddressByChainId("allfeat", "441");
  console.log(
    "SEOPLIA storage side (DEBUG) : allfeat symb/add on sepolia: AFT/",
    tAddress
  );
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
// npx hardhat run scripts /01_setTokens.js--network sepolia
// npx hardhat run scripts /01_setTokens.js--network allfeat
