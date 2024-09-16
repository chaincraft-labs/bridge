const { readLastDeployedAddress } = require("../helpers/fileHelpers");

/**
 * @dev caller MUST BE the admin / deployer
 */
task("func-mintBridgedToken", "mint amount of bridged token to user")
  .addParam("to", "The address of the user")
  .addParam("address", "The address of the token to mint")
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
    const token = await await hre.ethers.getContractAt(
      "BridgedToken",
      taskArgs.address
    );

    try {
      const balanceBefore = await token.balanceOf(taskArgs.to);
      // mock the bridge operator to access vault (owner of bridged token)
      const currentBridgeAddress = await storage.getOperator("bridge");
      let tx = await storage.updateOperator("bridge", signer.address);
      tx.wait();
      tx = await vault.mint(taskArgs.to, taskArgs.address, taskArgs.amount);
      tx.wait();
      // restore bridge operator
      tx = await storage.updateOperator("bridge", currentBridgeAddress);
      tx.wait();
      // get the new balance
      const balanceAfter = await token.balanceOf(taskArgs.to);
      const delta = balanceAfter - balanceBefore;
      console.log(
        `${
          delta == taskArgs.amount ? "Success" : "Error"
        }: Minted ${delta} of ${taskArgs.address} to ${taskArgs.to}`
      );
    } catch (error) {
      console.error("Error:", error);
    }
  });
