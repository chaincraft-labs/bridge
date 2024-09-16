const { readLastDeployedAddress } = require("../helpers/fileHelpers");

/**
 * @dev caller MUST BE the admin / deployer (as it has the supply of mocked tokens)
 */
task("func-transferMockedToken", "transfer amount of mocked token to user")
  .addParam("to", "The address of the user")
  .addParam("address", "The address of the token to transfer")
  .addParam("amount", "The amount to transfer")
  .setAction(async (taskArgs, hre) => {
    // get network name
    const network = hre.network.name;

    // get contract instance
    const token = await await hre.ethers.getContractAt(
      "MockedToken",
      taskArgs.address
    );

    try {
      const balanceBefore = await token.balanceOf(taskArgs.to);
      let tx = await token.transfer(taskArgs.to, taskArgs.amount);
      tx.wait();

      const balanceAfter = await token.balanceOf(taskArgs.to);
      const delta = balanceAfter - balanceBefore;
      console.log(
        `${delta == taskArgs.amount ? "✅" : "❌"}: Transfer ${delta} of ${
          taskArgs.address
        } to ${taskArgs.to}`
      );
    } catch (error) {
      console.error("Error:", error);
    }
  });
