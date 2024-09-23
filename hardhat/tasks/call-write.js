require("@nomicfoundation/hardhat-toolbox");
const { readLastDeployedAddress } = require("../helpers/fileHelpers");
const { convertParamsStringToArray } = require("../helpers/functionHelpers");
const { getSigner } = require("../utils/util");

/**
 * @description Call any function of any contract that causes a change in state
 *
 * 'args': a string of parameters, separated by spaces.
 *   - It supports both individual arguments and array-like arguments enclosed in square brackets.
 *   - To insert an empty string among the arguments, use two consecutive spaces.
 *   - In array arguments, elements are separated by commas.
 *     - Two consecutive commas (,,) indicate an empty string element between them.
 *   - IMPORTANT: Do not include spaces within array arguments; they must be comma-separated.
 */
task("call-writeFunc", "send a write transaction to the contract")
  .addParam("contract", "The contract to interact with")
  .addParam("func", "The function to call")
  .addParam("args", "The arguments to pass to the function, space separated")
  .addOptionalParam(
    "value",
    "The value to send in wei. Optional - 0 by default"
  )
  .addOptionalParam(
    "signer",
    "Index of the accounts defined in hardhat config\n" +
      "                Optional - default: 0 (deployer/default signer)"
  )
  .setAction(async (taskArgs, hre) => {
    let signer = await getSigner(hre, taskArgs.signer);

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
      contractAddress,
      signer
    );

    // prepare args
    const args = convertParamsStringToArray(taskArgs.args);

    // prepare value
    const option = taskArgs.value ? { value: taskArgs.value } : {};

    // call the function
    try {
      const tx = await contract[taskArgs.func](...args, option);
      console.log("Transaction hash:", tx.hash);
      const receipt = await tx.wait();
      console.log(
        `Transaction status: ${
          receipt.status == 1 ? "✅" : "❌"
        } - Gas used: ${receipt.gasUsed.toString()}`
      );
    } catch (error) {
      console.error("Error:", error);
    }
  });
