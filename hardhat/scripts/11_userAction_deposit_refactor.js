const hre = require("hardhat");
// import { writeDeployedAddress } from "./util";
// const {
//   writeDeployedAddress,
//   readLastDeployedAddress,
//   readNetworks,
//   getMaxAddress,
//   computeTokenSymbol,
// } = require("./util");
const {
  readLastDeployedAddress,
  logCurrentFileName,
} = require("../helpers/fileHelpers");
const { networkParams } = require("../helpers/configHelper");
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
  const nativeSymbol = networkParams[network].nativeToken.symbol;
  const currentChainId = networkParams[network].chainId;
  // const [userWallet] = await hre.ethers.getSigners(); // attention the one of owner change it !!

  // Récupérer l'argument de la ligne de commande
  const signerOption = process.env.SIGNER_OPTION; //process.argv[2];

  let userWallet, user1, user2, test1, test2; //signer
  switch (signerOption) {
    case "signer2":
      userWallet = new ethers.Wallet(
        process.env.USER_PRIVATE_KEY_2,
        hre.ethers.provider
      );
      break;
    case "signer3":
      userWallet = new ethers.Wallet(
        process.env.USER_PRIVATE_KEY_3,
        hre.ethers.provider
      );
      break;
    default:
      console.log("ICCCCI");
      const artest = await hre.ethers.getSigners();
      console.log("artest", artest);

      [userWallet, user1, user2] = await hre.ethers.getSigners();
      console.log("User Wallet => ", userWallet.address);
      [, test1] = await hre.ethers.getSigners();
      [, , test2] = await hre.ethers.getSigners();
      console.log("test1", test1.address);
      console.log("test2", test2.address);
      // console.log("Other wallets ", user1.address, user2.address);
      // [userWallet, user1, user2] = await hre.network.acc
      // console.log("User Wallet => ", userWallet.address);
      console.log(hre.network);
  }

  console.log("User Wallet => ", userWallet.address);
  console.log("Other wallets ", user1.address, user2.address);

  [, test1] = await hre.ethers.getSigners();
  [, , test2] = await hre.ethers.getSigners();
  console.log("test1", test1.address);
  console.log("test2", test2.address);
  // command line argument
  // npx hardhat run scripts/deploy.js signer2 or 3 or nothing (default)
  // SIGNER_OPTION=signer2 npx hardhat run scripts/11_userAction_depositSepolia.js --network sepolia

  console.log("NETWORK", network);
  let bridgeAddress = await readLastDeployedAddress(network, "BridgeBase");
  console.log("Bridge Address", bridgeAddress);
  let bridge = await hre.ethers.getContractAt("BridgeBase", bridgeAddress);
  // BRIDGE ETHEREUM   TO ALLFEAT
  // if (network != "sepolia") {
  //   console.log("WRONG NETWORK SHOULD BE SEPOLIA");
  //   process.exit(1);
  // }

  console.log(
    "==>USER ACTION ON %s\n----------------------------------------------------------\nDeposit ETH to bridge \n----------------------------------------------------------",
    network
  );
  // 0.01 ether
  // let amount = ethers.utils.parseEther("0.01"); // == 10000000000000000
  let amount = 10_000_000_000_000_000n;

  // get deployed Utils
  // @todo CODE GET NONCE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  let nonce = 0; //3; //2; // 1; //0; //1; // 0;
  const msgHashed = await bridge.getMessageHash(
    userWallet.address,
    userWallet.address,
    11155111,
    441,
    "ethereum",
    amount,
    nonce
  );

  // // ou
  const hash = hre.ethers.solidityPackedKeccak256(
    [
      "address",
      "address",
      "uint256",
      "uint256",
      "string",
      "uint256",
      "uint256",
    ],

    [
      userWallet.address,
      userWallet.address,
      11155111,
      441,
      "ethereum",
      amount,
      nonce,
    ]
  );

  console.log("hashes");
  console.log("msgHashed", msgHashed);
  console.log("hash", hash);

  console.log("Message Hash", msgHashed);
  const signedMsgHashed = await userWallet.signMessage(
    ethers.getBytes(msgHashed)
  );
  console.log("Signed Message Hash", signedMsgHashed);
  let tx = await bridge
    .connect(userWallet)
    .createBridgeOperation(
      userWallet.address,
      userWallet.address,
      11155111,
      441,
      "ethereum",
      amount,
      nonce,
      signedMsgHashed,
      { value: amount }
    );

  console.log("Bridge Operation", tx.hash);
  await tx.wait();

  // set a new signer from pvt key in .env : USER_PRIVATE_KEY_2
  // let userWallet2 = new ethers.Wallet(process.env.USER_PRIVATE_KEY_2, hre.ethers.provider);
  // console.log("USER 2", userWallet2.address);
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
