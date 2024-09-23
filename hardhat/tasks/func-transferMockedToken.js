const { display } = require("../helpers/loggingHelper");
/**
 * @description FOR TEST transfer an amount of mocked token to an address
 * @dev caller MUST BE the admin / deployer (as it has the supply of mocked tokens)
 */
task("func-transferMockedToken", "transfer the MockedToken amount to the user")
  .addParam("to", "The user's address")
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
      let receipt = await tx.wait();
      display.tx(tx, receipt);

      const balanceAfter = await tokenInstance.balanceOf(taskArgs.to);
      const delta = balanceAfter - balanceBefore;
      display.transferResult(
        delta,
        taskArgs.amount,
        receipt.status,
        taskArgs.token,
        taskArgs.to
      );
    } catch (error) {
      console.error("Error:", error);
    }
  });
