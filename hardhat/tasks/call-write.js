require("@nomicfoundation/hardhat-toolbox");
const { readLastDeployedAddress } = require("../helpers/fileHelpers");
const { convertParamsStringToArray } = require("../helpers/functionHelpers");

task("call-writeFunc", "send a write transaction to the contract")
  .addParam("contract", "The contract to interact with")
  .addParam("func", "The function to call")
  .addParam("args", "The arguments to pass to the method, comma separated")
  .addOptionalParam(
    "value",
    "The value to send in wei (optional - 0 by default)"
  )
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

    // prepare value
    const option = taskArgs.value ? { value: taskArgs.value } : {};

    // call the method
    try {
      const tx = await contract[taskArgs.method](...args, option);
      console.log("Transaction hash:", tx.hash);
      const receipt = await tx.wait();
      console.log(
        `Transaction status: ${
          receipt.status
        } - Gas used: ${receipt.gasUsed.toString()}`
      );
    } catch (error) {
      console.error("Error:", error);
    }
  });
