const { convertParamsStringToArray } = require("../helpers/functionHelpers");
const { getSignerFromOption } = require("../utils/util");
/**
 * @dev Get the signature of the hash of args (operation hash)
 */
task("func-getMsgSignature", "Get the signature of operation hash.")
  .addParam("args", "The arguments to pass to the function, space separated")
  .addOptionalParam(
    "signer",
    "The signer of the hash. MUST be equal to 'from' arg.\n" +
      "                Index of accounts defined in hardhat config\n" +
      "                Optional - default: 0 (deployer/default signer)."
  )
  .setAction(async (taskArgs, hre) => {
    let userWallet = await getSignerFromOption(hre, taskArgs.signer);

    const paramsTypes = [
      "address", // from
      "address", // to
      "uint256", // chainIdFrom
      "uint256", // chainIdTo
      "string", //. tokenName
      "uint256", // amount (BigInt ending with 'n')
      "uint256", // user nonce
    ];
    // prepare args
    const args = convertParamsStringToArray(taskArgs.args);

    if (userWallet.address != args[0]) {
      throw `Signer MUST be equal to 'from' arg!`;
    }
    const hash = hre.ethers.solidityPackedKeccak256(
      [...paramsTypes],
      [...args]
    );

    const signedMsgHash = await userWallet.signMessage(ethers.getBytes(hash));

    console.log(
      `Signer: ${userWallet.address}\nHash of the args: ${hash}\nSignature: ${signedMsgHash}`
    );
  });
