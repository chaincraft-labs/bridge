const { readLastDeployedAddress } = require("../helpers/fileHelpers");
const { display } = require("../helpers/loggingHelper");

/**
 * @dev caller MUST BE the admin / deployer
 */
task("func-mintBridgedToken", "mint amount of bridged token to user")
  .addParam("to", "The user's address")
  .addParam("token", "The address of the token to mint")
  .addParam("amount", "The amount to mint")
  .setAction(async (taskArgs, hre) => {
    const [signer] = await hre.ethers.getSigners();
    // get network name
    const network = hre.network.name;
    // read contract address from constants/deployedAddresses.js
    const storageAddress = await readLastDeployedAddress(network, "Storage");
    const vaultAddress = await readLastDeployedAddress(network, "Vault");
    // get contract instance
    const storage = await hre.ethers.getContractAt("Storage", storageAddress);
    const vault = await hre.ethers.getContractAt("Vault", vaultAddress);
    const tokenInstance = await hre.ethers.getContractAt(
      "BridgedToken",
      taskArgs.token
    );

    try {
      const balanceBefore = await tokenInstance.balanceOf(taskArgs.to);
      // mock the bridge operator to access vault (owner of bridged token)
      const currentBridgeAddress = await storage.getOperator("bridge");
      let tx = await storage.updateOperator("bridge", signer.address);
      tx.wait();
      tx = await vault.mint(taskArgs.to, taskArgs.token, taskArgs.amount);
      let receipt = await tx.wait();
      display.tx(tx, receipt);

      // restore bridge operator
      tx = await storage.updateOperator("bridge", currentBridgeAddress);
      tx.wait();
      // get the new balance
      const balanceAfter = await tokenInstance.balanceOf(taskArgs.to);
      const delta = balanceAfter - balanceBefore;
      display.mintResult(
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
