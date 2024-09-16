const { convertParamsStringToArray } = require("../helpers/functionHelpers");

/**
 * @dev Get the hash of args (operation hash)
 */
task("call-writeFunc", "send a write transaction to the contract")
  .addParam("args", "The arguments to pass to the method, space separated")
  .setAction(async (taskArgs, hre) => {
    const paramsTypes = [
      "address",
      "address",
      "uint256",
      "uint256",
      "string",
      "uint256",
      "uint256",
    ];
    // prepare args
    const args = convertParamsStringToArray(taskArgs.args);

    const hash = hre.ethers.solidityPackedKeccak256(
      [...paramsTypes],
      [...args]
    );

    console.log("Hash of the args: ", hash);
  });
