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
  writeLastUsedNonce,
  logCurrentFileName,
} = require("../helpers/fileHelpers");
const { networkParams } = require("../helpers/configHelper");
const { simulationParams } = require("../constants/simulationParams");
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

// let amount = ethers.utils.parseEther("0.01"); // == 10000000000000000
let amount = 10_000_000_000_000_000n;
let nonce = 0; //3; //2; // 1; //0; //1; // 0;

// let operationParams = [
//   userWallet.address,
//   userWallet.address,
//   11155111,
//   441,
//   "ethereum",
//   amount,
//   nonce,
// ];

const option = {};

const getSigner = async (signerOption, networkName) => {
  // let userWallet, user1, user2, test1, test2; //signer

  // account defined in hardhat.config for each network
  // if localhost => hardhat accounts used

  // to replace with another pvt key:
  // userWallet = new ethers.Wallet(
  // process.env.USER_PRIVATE_KEY_2,
  // hre.ethers.provider
  // );

  //signerOption is index of accounts array

  //   const [owner, user2, user3] = await hre.ethers.getSigners();

  // if (signerOption === "signer2") return user2;
  // if (signerOption === "signer3") return user3;
  // return owner;

  const signersArray = await hre.ethers.getSigners();
  if (!signerOption) signerOption = 0;
  if (signerOption >= signersArray.length)
    throw "Signer index out of bound of accounts arrays defined in hardhat.config";

  // AFFICHER signer selected
  return signersArray[signerOption];
  // switch (signerOption) {
  //   case "signer2":
  //     userWallet = user2;
  //     break;
  //   case "signer3":
  //     userWallet = user3;
  //     break;
  //   default:
  //     userWallet = owner;

  //     console.log("User Wallet => ", userWallet.address);
  //     [, test1,] = await hre.ethers.getSigners();
  //     [, , test2] = await hre.ethers.getSigners();
  //     console.log("test1", test1);
  //     console.log("test2", test2);
  //     // console.log("Other wallets ", user1.address, user2.address);
  //     // [userWallet, user1, user2] = await hre.network.acc
  //     // console.log("User Wallet => ", userWallet.address);
  //     console.log(hre.network);
  // }

  // console.log("User Wallet => ", userWallet.address);
  // console.log("Other wallets ", user1.address, user2.address);
  // // command line argument

  // return userWallet;
};

// paramsOption format: null | "chainIdFrom,chainIdTo,tokenName,amount"
// simulationOption format: null | "name,chain"
const getOperationParams = (paramsOption, simulationOption) => {
  if (paramsOption) {
    // get params from paramsOption
    let [chainIdFrom, chainIdTo, tokenName, etherAmount] =
      paramsOption.split(",");
    // convert amount from ethers to wei (if ethers '.' is used as decimal point)
    const amount = ethers.utils.parseEther(etherAmount);
    // convert chainIdFrom, chainIdTo to number

    chainIdFrom = Number(chainIdFrom);
    chainIdTo = Number(chainIdTo);

    return [chainIdFrom, chainIdTo, tokenName, amount];
  }

  if (!simulationOption) {
    simulationOption = "defaultOrigin,sepolia";
  }
  //

  // format: scenrioName, chain
  // get params from simulationOption "name,chain" => name, chain
  const [simuName, simuOriginChain] = simulationOption.split(",");
  const simuParams = simulationParams[simuName][simuOriginChain];

  // check if object is empty and throw error
  if (!simuParams || Object.keys(simuParams).length === 0) {
    throw "Simulation Params not found";
  }
  const params = [
    simuParams.chainIdFrom,
    simuParams.chainIdTo,
    simuParams.tokenName,
    simuParams.amount,
  ];
  return params;
};

async function main() {
  //get network name
  const network = hre.network.name;
  const nativeSymbol = networkParams[network].nativeToken.symbol;
  const currentChainId = networkParams[network].chainId;
  // const [userWallet] = await hre.ethers.getSigners(); // attention the one of owner change it !!

  // const args = process.argv.slice(2); // On ignore les deux premiers éléments
  // const param = args[0];

  // console.log("PARAM TESTESTEST", param);
  // Récupérer l'argument de la ligne de commande
  // = USER2, USER3, add: "0x....", void
  const signerOption = process.env.SIGNER_OPTION; //process.argv[2]

  let userWallet = await getSigner(signerOption, network);

  console.log("User Wallet => ", userWallet.address);
  // console.log("Other wallets ", user1.address, user2.address);

  // void => default simulation
  // scenario name "name", chain
  // params: "chainIdFrom,chainIdTo,tokenName,amount (in ethers not wei)"
  const paramsOption = process.env.PARAMS_OPTION;
  const simulationOption = process.env.SIMULATION_OPTION;

  let operationParams = getOperationParams(paramsOption, simulationOption);

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

  //get nonce and write in constants/nonceRecord.js
  let nonce = await bridge.getNewUserNonce(userWallet.address);
  // convert nonce from BigInt to number
  nonce = Number(nonce);

  console.log("Nonce", nonce);
  // write nonce in constants/nonceRecord.json
  // format is:
  // {
  //   "lastOriginNonce": { "sepolia": 0, "allfeat": 0 }
  // }
  writeLastUsedNonce(network, nonce); // to be used for fees

  console.log(
    "==>USER ACTION ON %s\n----------------------------------------------------------\nDeposit ETH to bridge \n----------------------------------------------------------",
    network
  );

  operationParams = [
    userWallet.address,
    userWallet.address,
    ...operationParams,
    nonce,
  ];
  console.log("Operation Params", operationParams);

  const msgHashed = await bridge.getMessageHash(...operationParams);

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

    [...operationParams]
  );

  console.log("hashes");
  console.log("msgHashed", msgHashed);
  console.log("hash", hash);

  console.log("Message Hash", msgHashed);
  const signedMsgHashed = await userWallet.signMessage(
    ethers.getBytes(msgHashed)
  );
  console.log("Signed Message Hash", signedMsgHashed);

  // for native: value = amount
  let tx = await bridge
    .connect(userWallet)
    .createBridgeOperation(...operationParams, signedMsgHashed, {
      value: amount,
    });

  console.log("Bridge Operation", tx.hash);
  const receipt = await tx.wait();

  console.log("Bridge Operation Receipt", receipt);
  const txStatus = receipt.status;
  console.log("Transaction Status: ", txStatus == 1 ? "Success" : "Failed");

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

// npx hardhat run scripts/11_userAction_deposit_refactor0.js --network sepolia
// npx hardhat run scripts/12_userAction_depositFees_refactor0.js --network allfeat
