const { task } = require("hardhat/config");
const { spawn } = require("child_process");
const { forkPorts } = require("../constants/deploymentConfig");
const { readLastDeployedAddress } = require("../helpers/fileHelpers");
const { convertParamsStringToArray } = require("../helpers/functionHelpers");

task("call-writeFunc", "send a write transaction to the contract")
  .addParam("contract", "The contract to interact with")
  .addParam("method", "The method to call")
  .addParam("args", "The arguments to pass to the method, comma separated")
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

    // prepare args (if number, convert to number, else keep as string)
    // prepare args
    const args = convertParamsStringToArray(taskArgs.args);

    // call the method
    try {
      const tx = await contract[taskArgs.method](...args);
      // console.log("Transaction sent to:", contract.target);
      console.log("Transaction hash:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed in block:", receipt.blockNumber);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Transaction status:", receipt.status);
    } catch (error) {
      console.error("Error:", error);
    }
  });

//
// get current process ans PIDs:  ps aux | grep hardhat
// kill it: kill -9 <PID>

// npx hardhat start-node --network-to-fork "sepolia"

// npx hardhat call-writeFunc --contract "BridgeBase" --method "createBridgeOperation" --args "0xbfae728Cf6D20DFba443c5A297dC9b344108de90,0xbfae728Cf6D20DFba443c5A297dC9b344108de90,11155111,441,ethereum,10000000000000000n,2,0x77b8f24e3f8b594f12312f4eaffddd0db3ab411da930be97feb683a80d206cb3" --network sepolia
// npx hardhat call-writeFunc --contract "Storage" --method "addChainIdToList" --args "702" --network sepolia
