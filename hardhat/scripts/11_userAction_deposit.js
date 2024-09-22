const hre = require("hardhat");
const {
  readLastDeployedAddress,
  writeLastUsedNonce,
  logCurrentFileName,
} = require("../helpers/fileHelpers");
const { toStyle, display } = require("../helpers/loggingHelper");
const { getContext } = require("../helpers/contextHelper");
const { networkParams } = require("../helpers/configHelper");
const { convertToOperationParams } = require("../helpers/functionHelpers");
const { getSigner } = require("../utils/util");

/**
 * @description User deposit script
 *
 * This script will:
 * - read the last deployed Bridge contract address
 * - prepare the parameters for the deposit operation
 *   - get the signer from the environment variable
 *   - get the nonce for the user from the Bridge contract
 *   - prepare the operation parameters, hash and signature
 *   - get the value to send with the transaction
 * - send the transaction to the Bridge contract
 *
 * @dev This script should be run on the network where the Bridge contract is deployed
 * @dev It will write the nonce used for the deposit in the 'constants/nonceRecord.js' file
 * @dev command:
 * [SIGNER_OPTION=<0-2>] [PARAMS_OPTION="11155111,441,1.5,0"]
 * npx hardhat run scripts/11_userAction_deposit.js --network <sepolia>
 * - SIGNER_OPTION: 0: deployer, 1: user1, 2: user2 as defined in .env & hardhat.config.js
 * - PARAMS_OPTION:
 *  - Default: "defaultOrigin,sepolia"
 *  - Using simulation params: as the default param, it will use the values from the 'constants/simulationParams.js' file
 *  - Using custom params: "11155111,441,1.5,0" => "chainIdFrom,chainIdTo,amount,tokenName"
 */
async function main() {
  ///////////////////////////////////////////////////////////////////////////////
  //
  //                CONTEXT LOADING
  //
  ///////////////////////////////////////////////////////////////////////////////
  const context = await getContext();
  display.h1(`Script: ${logCurrentFileName()}...`);

  ///////////////////////////////////////////////////////////////////////////////
  //
  //                PREPARE PARAMETERS
  //
  ///////////////////////////////////////////////////////////////////////////////
  // => contract to call
  let bridgeAddress = await readLastDeployedAddress(
    context.network,
    "BridgeBase"
  );
  let bridge = await hre.ethers.getContractAt("BridgeBase", bridgeAddress);

  display.depositContractToCall(bridgeAddress, context.network);

  console.log(`${toStyle.discrete("Preparing params..")}`);
  // => operation params
  // signer
  const signerOption = process.env.SIGNER_OPTION;
  let userWallet = await getSigner(signerOption, context.network);
  // get signer nonce and write it in constants/nonceRecord.js to be used for fees deposit
  let nonce = await bridge.getNewUserNonce(userWallet.address);
  nonce = Number(nonce);
  writeLastUsedNonce(context.network, nonce); /// context.

  display.depositSignerInfo(userWallet.address, nonce);

  // operation, operation hash & signature
  const paramsOption = process.env.PARAMS_OPTION;
  let operationParams = convertToOperationParams(paramsOption);
  // adding user address & nonce to operationParams
  operationParams = [
    userWallet.address,
    userWallet.address,
    ...operationParams,
    nonce,
  ];

  display.depositOperationParams(operationParams);

  // const msgHashed = await bridge.getMessageHash(...operationParams);
  const msgHashed = hre.ethers.solidityPackedKeccak256(
    [
      "address", // from
      "address", // to
      "uint256", // chainId from
      "uint256", // chainId to
      "string", //. token name
      "uint256", // amount
      "uint256", // nonce
    ],
    [...operationParams]
  );
  const signedMsgHashed = await userWallet.signMessage(
    ethers.getBytes(msgHashed)
  );

  display.depositOperationHashAndSignature(msgHashed, signedMsgHashed);

  // value to send with tx
  let valueToSend = 0;
  const tokenName = operationParams[4];
  const isTokenNative =
    tokenName === networkParams[context.network].nativeToken.name;
  if (isTokenNative) {
    valueToSend = operationParams[5];
  }

  display.depositValueToSend(isTokenNative, valueToSend);

  ///////////////////////////////////////////////////////////////////////////////
  //
  //                SEND TRANSACTION
  //
  ///////////////////////////////////////////////////////////////////////////////
  console.log(`${toStyle.discrete("Sending tx..")}`);

  const tx = await bridge
    .connect(userWallet)
    .createBridgeOperation(...operationParams, signedMsgHashed, {
      value: valueToSend,
    });
  display.txInfo(tx);

  const receipt = await tx.wait();
  display.txReceiptInfo(receipt);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
