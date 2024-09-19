const { readLastDeployedAddress } = require("../helpers/fileHelpers");
const { convertParamsStringToArray } = require("../helpers/functionHelpers");

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
      const result = await contract[taskArgs.method](...args);
      console.log("Transaction result: ", result);
    } catch (error) {
      console.error("Error:", error);
    }
  });
