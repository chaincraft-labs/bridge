const { readLastDeployedAddress } = require("../helpers/fileHelpers");
const { convertParamsStringToArray } = require("../helpers/functionHelpers");

/**
 * @description Call any function of any contract that does not cause a change in state
 *
 * The signer is the default signer
 *
 * 'args': a string of parameters, separated by spaces.
 *   - It supports both individual arguments and array-like arguments enclosed in square brackets.
 *   - To insert an empty string among the arguments, use two consecutive spaces.
 *   - In array arguments, elements are separated by commas.
 *     - Two consecutive commas (,,) indicate an empty string element between them.
 *   - IMPORTANT: Do not include spaces within array arguments; they must be comma-separated.
 */
task("call-readFunc", "send a read transaction to the contract")
  .addParam("contract", "The contract to interact with")
  .addParam("func", "The function to call")
  .addParam("args", "The arguments to pass to the function, space separated")
  .setAction(async (taskArgs, hre) => {
    // get network name
    const network = hre.network.name;
    // read contract address from constants/deployedAddresses.js
    const contractAddress = await readLastDeployedAddress(
      network,
      taskArgs.contract
    );
    // get contract instance
    const contract = await hre.ethers.getContractAt(
      taskArgs.contract,
      contractAddress
    );

    // prepare args
    const args = convertParamsStringToArray(taskArgs.args);

    // call the method
    try {
      const result = await contract[taskArgs.func](...args);
      console.log("Transaction result: ", result);
    } catch (error) {
      console.error("Error:", error);
    }
  });
