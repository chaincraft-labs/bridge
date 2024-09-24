const hre = require("hardhat");
const ethers = require("ethers");
// import { writeDeployedAddress } from "./util";
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

// commands:
// npx hardhat run scripts/deploy.js --network localhost


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
  // BRIDGE ETHEREUM   TO ALLFEAT
  if (
    network !== "sepolia" &&
    network !== "hardhat" &&
    network !== "anvil_local" &&
    network !== "localhost"
  ) {
    console.log("WRONG NETWORK SHOULD BE SEPOLIA");
    process.exit(1);
  }
  
  console.log(
    "USER ACTION ON %s\n----------------------------------------------------------\nDeposit ETH to bridge \n----------------------------------------------------------",
    network
  );
  // 0.01 ether
  // let amount = ethers.utils.parseEther("0.01"); // == 10000000000000000
  let amount = 1_000_000_000_000_000n;
  
  // get deployed Utils
  // @todo CODE GET NONCE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  let nonce = 0; //3; //2; // 1; //0; //1; // 0;
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
  const signedMsgHased = await userWallet.signMessage(ethers.getBytes(msgHashed));
  console.log("Signed Message Hash", signedMsgHased);
  
  console.log(`await bridge.connect(userWallet).createBridgeOperation(${userWallet.address},${userWallet.address},31337,440,'ethereum',${amount},${nonce},${signedMsgHased},{ value: ${amount} })`);
  
  let tx = await bridge
    .connect(userWallet)
    .createBridgeOperation(
      userWallet.address,
      userWallet.address,  // can be modified, by default same as user
      31337,
      440,
      //11155111,
      //441,                 // can be selected by user
      "ethereum",          // must be selected by user (ethereum, allfeat)
      amount,              // provided by user
      nonce,               // call getNewUserNonce(address user)
      signedMsgHased,      // Get signed message
      { value: amount }    // if ethereum value = amount; if allfeat value = amount ; If token value = 0
    );

                           // To check progress status => fct vs events
                           //
                           // Contract RelayerBase
                           // getDetailedOriginOperation(bytes32 operationHash)
                           // getDetailedDestinationOperation(bytes32 operationHash) 
                           // 
                           // Contract Storage
                           // getChainIdsList() public view returns (uint256[] memory)
                           // getTokenNamesList() public view returns (string[] memory)

  console.log("Bridge Operation", tx.hash);
  await tx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

//commands

// npx hardhat run scripts/11_userAction_depositSepolia.js --network sepolia
// npx hardhat run scripts/12_userAction_depositFeesAllfeat.js --network allfeat
