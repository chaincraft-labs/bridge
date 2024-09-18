const hre = require("hardhat");

const {
  writeDeployedAddress,
  readLastDeployedAddress,
  readNetworks,
  getMaxAddress,
  computeTokenSymbol,
} = require("./util");
const { networkParams } = require('../constants/networks');
// @todo
// network add polygon for relayer test
// change to hardhat ignition to deploy

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
  const [userWallet] = await hre.ethers.getSigners(); // attention the one of owner change it !!
  let bridgeAddress = await readLastDeployedAddress(network, "BridgeBase");
  console.log("Bridge Address", bridgeAddress);
  let bridge = await hre.ethers.getContractAt("BridgeBase", bridgeAddress);
  // DEPOSIT FEES ON ALLFEAT
  if (
    network !== "allfeat" &&
    network !== "allfeat_local"
) {
    console.log("WRONG NETWORK SHOULD BE ALLFEAT");
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
  let nonce = 0; //3; //2; //1; //0; //1; //0;
  const msgHashed = await bridge.getMessageHash(
    userWallet.address,
    userWallet.address,
    // 11155111,
    // 441,
    31337,
    440,
    "ethereum",
    amount,
    nonce
  );
  console.log("Message Hash", msgHashed);
  console.log(`await bridge.connect(userWallet).depositFees(${msgHashed}, 31337, 440, { value: ${amount} })`);
  
  // process.exit(0)
  let tx = await bridge
    .connect(userWallet)
    // .depositFees(msgHashed, 11155111, 441, { value: amount });
    .depositFees(msgHashed, 31337, 440, { value: amount });

  console.log("Relayer lock fees:", tx.hash);
  await tx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
