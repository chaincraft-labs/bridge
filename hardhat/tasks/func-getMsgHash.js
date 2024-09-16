const { convertParamsStringToArray } = require("../helpers/functionHelpers");

/**
 * @dev Get the hash of args (operation hash)
 */
task("func-getMsgHash", "Get the operation hash (hash of the args")
  .addParam("args", "The arguments to pass to the function, space separated")
  .setAction(async (taskArgs, hre) => {
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

    const hash = hre.ethers.solidityPackedKeccak256(
      paramsTypes, // [...paramsTypes],
      args //  [...args]
    );

    console.log("Hash of the args: ", hash);
  });
