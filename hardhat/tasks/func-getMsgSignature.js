const { convertParamsStringToArray } = require("../helpers/functionHelpers");
const { getSignerFromOption } = require("../utils/util");
/**
 * @dev Get the signature of the hash of args (operation hash)
 */
task("func-getMsgSignature", "Get the signature of operation hash.")
  .addParam("args", "The arguments to pass to the function, space separated")
  .addOptionalParam(
    "signer",
    "The signer of the hash. MUST be equal to 'from' arg. [deployer=0, user2=1, user3=2] as defined in .env (localhost uses signer 0, 1, 2 given by hardhat). Default is deployer/admin"
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
