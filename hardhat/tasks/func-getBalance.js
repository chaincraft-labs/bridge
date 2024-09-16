const { readLastDeployedAddress } = require("../helpers/fileHelpers");
const { convertParamsStringToArray } = require("../helpers/functionHelpers");

// @todo
// task("func-getBalance", "get token balance of a user")
//   .addParam("user", "The address of the user")
//   .addParam("token", "The address of the token")
//   .setAction(async (taskArgs, hre) => {
//     // get network name
//     const network = hre.network.name;
//     // read contract address from constants/deployedAddresses.js
//     const contractAddress = await readLastDeployedAddress(
//       network,
//       taskArgs.contract
//     );
//     // get contract instance
//     const contract = await hre.ethers.getContractAt(
//       taskArgs.contract,
//       contractAddress
//     );

//     // prepare args
//     const args = convertParamsStringToArray(taskArgs.args);

//     // call the method
//     try {
//       const result = await contract[taskArgs.method](...args);
//       console.log("Transaction result: ", result);
//     } catch (error) {
//       console.error("Error:", error);
//     }
//   });
