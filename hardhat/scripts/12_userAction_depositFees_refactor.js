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
  readLastUsedNonce,
  logCurrentFileName,
} = require("../helpers/fileHelpers");
const { getNetworkNameByChainId } = require("../helpers/configHelper");
const { networkParams } = require("../helpers/configHelper");
const { simulationParams } = require("../constants/simulationParams");
// @todo
// @todo
// network add polygon for relayer test
// change to hardhat ignition to deploy

// commands:
// npx hardhat run scripts/deploy.js --network localhost

// const networkParams = {
//   localhost: {
//     chainId: 31337,
//     nativeSymbol: "ETH",
//   },
//   hardhat: {
//     chainId: 31337,
//     nativeSymbol: "ETH",
//   },
//   allfeat: {
//     chainId: 441,
//     nativeSymbol: "AFT",
//   },
//   polygon: {
//     chainId: 137,
//     nativeSymbol: "MATIC",
//   },
//   sepolia: {
//     chainId: 11155111,
//     nativeSymbol: "ETH",
//   },
//   ethereum: {
//     chainId: 1,
//     nativeSymbol: "ETH",
//   },
// // };
// const tokenList = [
//   {
//     tokenName: "ethereum",
//     symbols: [
//       { chainId: 1, symbol: "ETH" },
//       { chainId: 137, symbol: "pbETH" },
//       { chainId: 441, symbol: "abETH" },
//       { chainId: 31337, symbol: "hbETH" },
//       { chainId: 11155111, symbol: "sbETH" },
//     ],
//   },
//   {
//     tokenName: "dai",
//     symbols: [
//       { chainId: 1, symbol: "DAI" },
//       { chainId: 137, symbol: "pbDAI" },
//       { chainId: 441, symbol: "abDAI" },
//       { chainId: 31337, symbol: "hbDAI" },
//       { chainId: 11155111, symbol: "sbDAI" },
//     ],
//   },
//   {
//     tokenName: "allfeat",
//     symbols: [
//       { chainId: 1, symbol: "AFT" },
//       { chainId: 137, symbol: "pbAFT" },
//       { chainId: 441, symbol: "abAFT" },
//       { chainId: 31337, symbol: "hbAFT" },
//       { chainId: 11155111, symbol: "sbAFT" },
//     ],
//   },
// ];

// return symbol for tokenName and chainId
const getTokenSymbol = (tokenName, chainId) => {
  const token = tokenList.filter((token) => token.tokenName === tokenName)[0];
  return token.symbols.filter((symbol) => symbol.chainId === chainId)[0].symbol;
};
// allfeat, test, ethEquivalent
// const usedNetworks = ["allfeat", "hardhat", "sepolia"];

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

// paramsOption format: null | "chainIdFrom,chainIdTo,tokenName,amount(in ethers)"
// simulationOption format: null | "name,chain"
const getOperationParams = (paramsOption, simulationOption) => {
  if (paramsOption) {
    // get params from paramsOption
    let [chainIdFrom, chainIdTo, tokenName, etherAmount, etherFeesAmount] =
      paramsOption.split(",");
    // convert amount from ethers to wei (if ethers '.' is used as decimal point)
    const amount = ethers.utils.parseEther(etherAmount);
    // convert chainIdFrom, chainIdTo to number
    const feesAmount = ethers.utils.parseEther(etherFeesAmount);
    chainIdFrom = Number(chainIdFrom);
    chainIdTo = Number(chainIdTo);
    // const feesAmount = Number(simuParams.feesAmount);

    return { params: [chainIdFrom, chainIdTo, tokenName, amount], feesAmount };
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
  const feesAmount = simuParams.feesAmount; //Number(simuParams.feesAmount);
  return { params, feesAmount };
};

async function main() {
  //get network name
  const network = hre.network.name;
  const nativeSymbol = networkParams[network].nativeSymbol;
  const currentChainId = networkParams[network].chainId;
  // const [userWallet] = await hre.ethers.getSigners(); // attention the one of owner change it !!

  const signerOption = process.env.SIGNER_OPTION; //process.argv[2];
  let userWallet = await getSigner(signerOption, network);

  console.log("User Wallet => ", userWallet.address);
  // console.log("Other wallets ", user1.address, user2.address);

  // void => default simulation
  // scenario name "name", chain
  // params: "chainIdFrom,chainIdTo,tokenName,amount (in ethers not wei)"
  const paramsOption = process.env.PARAMS_OPTION;
  const simulationOption = process.env.SIMULATION_OPTION;

  let operationParamsALL = getOperationParams(paramsOption, simulationOption);
  let operationParams = operationParamsALL.params;
  // contracts
  let bridgeAddress = await readLastDeployedAddress(network, "BridgeBase");
  console.log("Bridge Address", bridgeAddress);
  let bridge = await hre.ethers.getContractAt("BridgeBase", bridgeAddress);

  // let relayerAddress = await readLastDeployedAddress(network, "RelayerBase");
  // let relayer = await hre.ethers.getContractAt("RelayerBase", relayerAddress);
  // DEPOSIT FEES ON ALLFEAT
  // if (network != "allfeat") {
  //   console.log("WRONG NETWORK SHOULD BE ALLFEAT");
  //   process.exit(1);
  // }
  let originNetwork = operationParams[0];
  originNetwork = getNetworkNameByChainId(originNetwork);
  // read nonce from file
  let nonce = await readLastUsedNonce(originNetwork);
  console.log("nonce", nonce);

  console.log(
    "==>USER ACTION ON %s\n----------------------------------------------------------\nDeposit AFT fees \n----------------------------------------------------------",
    network
  );
  // 0.01 ether

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

  console.log("fees sent: ", operationParamsALL.feesAmount);
  console.log("fees sent (string)", operationParamsALL.feesAmount.toString());
  // let tx = await relayer
  //   .connect(userWallet)
  //   .lockDestinationFees(msgHashed, 11155111, { value: amount });
  let tx = await bridge
    .connect(userWallet)
    .depositFees(msgHashed, operationParams[0], operationParams[1], {
      value: operationParamsALL.feesAmount,
    });

  console.log("Relayer lock fees:", tx.hash);
  const receipt = await tx.wait();
  console.log("Bridge Operation Receipt", receipt);
  const txStatus = receipt.status;
  console.log("Transaction Status: ", txStatus == 1 ? "Success" : "Failed");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
