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
  const [userWallet] = await hre.ethers.getSigners(); // attention the one of owner change it !!

  let bridgeAddress = await readLastDeployedAddress(network, "BridgeBase");
  console.log("Bridge Address", bridgeAddress);
  let bridge = await hre.ethers.getContractAt("BridgeBase", bridgeAddress);

  let relayerAddress = await readLastDeployedAddress(network, "RelayerBase");
  let relayer = await hre.ethers.getContractAt("RelayerBase", relayerAddress);
  // DEPOSIT FEES ON ALLFEAT
  if (network != "sepolia") {
    console.log("WRONG NETWORK SHOULD BE SEPOLIA");
    process.exit(1);
  }

  console.log(
    "==>USER ACTION ON %s\n----------------------------------------------------------\nDeposit AFT fees \n----------------------------------------------------------",
    network
  );
  // 0.01 ether
  // let amount = ethers.utils.parseEther("0.001"); // == 10000000000000000
  let amount = 1_000_000_000_000_000n;

  // @todo CODE GET NONCE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  let nonce = 0; //2; //1; //0; //1; //0;
  const msgHashed = await bridge.getMessageHash(
    userWallet.address,
    userWallet.address,
    441,
    11155111,
    "allfeat",
    amount,
    nonce
  );
  console.log("Message Hash", msgHashed);

  // let tx = await relayer
  //   .connect(userWallet)
  //   .lockDestinationFees(msgHashed, 11155111, { value: amount });
  let tx = await bridge
    .connect(userWallet)
    .depositFees(msgHashed, 441, 11155111, { value: amount });

  console.log("Relayer lock fees:", tx.hash);
  await tx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
