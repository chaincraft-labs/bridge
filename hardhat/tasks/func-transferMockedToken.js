const { readLastDeployedAddress } = require("../helpers/fileHelpers");

/**
 * @dev caller MUST BE the admin / deployer (as it has the supply of mocked tokens)
 */
task("func-transferMockedToken", "transfer amount of mocked token to user")
  .addParam("to", "The address of the user")
  .addParam("token", "The address of the token to transfer")
  .addParam("amount", "The amount to transfer")
  .setAction(async (taskArgs, hre) => {
    // get contract instance
    const tokenInstance = await await hre.ethers.getContractAt(
      "MockedToken",
      taskArgs.token
    );

    try {
      const balanceBefore = await tokenInstance.balanceOf(taskArgs.to);
      let tx = await tokenInstance.transfer(taskArgs.to, taskArgs.amount);
      tx.wait();

      const balanceAfter = await tokenInstance.balanceOf(taskArgs.to);
      const delta = balanceAfter - balanceBefore;
      console.log(
        `${delta == taskArgs.amount ? "✅" : "❌"}: Transfer ${delta} of ${
          taskArgs.token
        } to ${taskArgs.to}`
      );
    } catch (error) {
      console.error("Error:", error);
    }
  });
