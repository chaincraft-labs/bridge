const hre = require("hardhat");
const {
  readLastDeployedAddress,
  logCurrentFileName,
  readFirstValidNonce,
} = require("../helpers/fileHelpers");
const { toStyle, display } = require("../helpers/loggingHelper");
const { getContext } = require("../helpers/contextHelper");
// const { getNetworkNameByChainId } = require("../helpers/configHelper");
const {
  convertToOperationParams,
  getFeesAmount,
} = require("../helpers/functionHelpers");
const { getSigner, getNetworkNameByChainId } = require("../utils/util");

/**
 * @description User fees deposit script
 *
 * This script will:
 * - read the last deployed Bridge contract address
 * - prepare the parameters for the depositFees operation
 *  - get the signer from the environment variable
 *  - read the nonce used on origin from the 'constants/nonceRecord.js' file
 *  - prepare the operation parameters and hash
 *  - get the fees to send with the transaction
 * - send the transaction to the Bridge contract
 *
 * @dev This script should be run on the network where the Bridge contract is deployed
 * @dev It will write the nonce used for the deposit in the 'constants/nonceRecord.js' file
 * @dev command:
 * [SIGNER_OPTION=<0-2>] [PARAMS_OPTION="11155111,441,1.5,0"] [FEES_OPTION=<fees in ethers>]
 *  npx hardhat run scripts/12_userAction_depositFees.js --network <sepolia>
 * - SIGNER_OPTION: 0: deployer, 1: user1, 2: user2 as defined in .env & hardhat.config.js
 * - PARAMS_OPTION:
 *   - Default: "defaultOrigin,sepolia"
 *   - Using simulation params: as the default param, it will use the values from the 'constants/simulationParams.js' file
 *   - Using custom params: "11155111,441,1.5,0" => "chainIdFrom,chainIdTo,amount,tokenName"
 * - FEES_OPTION: the amount in ethers to send with the transaction
 *   - Default: null == FEES_AMOUNT from 'constants/deploymentConfig.js'
 *   - Using custom fees: "0.1" => "0.1 ethers"
 *   - Using simulation fees: format "defaultOrigin,sepolia" to use the values from the 'constants/simulationParams.js' file
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

  display.depositFeesContractToCall(bridgeAddress, context.network);

  console.log(`${toStyle.discrete("Preparing params..")}`);
  // => operation params
  // signer
  const signerOption = process.env.SIGNER_OPTION;
  let userWallet = await getSigner(hre, signerOption);

  // operation
  const paramsOption = process.env.PARAMS_OPTION;
  let operationParams = convertToOperationParams(paramsOption);

  // read nonce from file depending on the network 'chainId from'
  let nonce = await readFirstValidNonce(
    getNetworkNameByChainId(operationParams[0]),
    userWallet.address
  );
  if (!nonce) {
    throw "No valid nonce found!";
  }

  display.depositSignerInfo(userWallet.address, nonce);

  operationParams = [
    userWallet.address,
    userWallet.address,
    ...operationParams,
    nonce,
  ];
  display.depositOperationParams(operationParams);

  // operation hash & signature
  const operationHash = hre.ethers.solidityPackedKeccak256(
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

  display.depositOperationHash(operationHash);

  // fees to send
  const feesToSend = getFeesAmount(process.env.FEES_OPTION);
  display.depositFeesToSend(feesToSend);
  ///////////////////////////////////////////////////////////////////////////////
  //
  //                SEND TRANSACTION
  //
  ///////////////////////////////////////////////////////////////////////////////
  console.log(`${toStyle.discrete("Sending tx..")}`);

  let tx = await bridge
    .connect(userWallet)
    .depositFees(operationHash, operationParams[2], operationParams[3], {
      value: feesToSend,
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
