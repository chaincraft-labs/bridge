const hre = require("hardhat");

const fixtures = {
  deployUtils: async function () {
    const [owner, user] = await ethers.getSigners();

    const Utils = await hre.ethers.deployContract("Utils");
    await Utils.waitForDeployment();
    return { Utils, owner, user };
  },
  deployStorage: async function () {
    const [owner, otherAccount] = await ethers.getSigners();
    const storage = await hre.ethers.deployContract("Storage", ["ethereum"]);
    await storage.waitForDeployment();
    console.log("Storage deployed to:", storage.target);
    return { storage, owner, otherAccount };
  },

  deployBridgedToken: async function () {
    const { storage, factory, vault, owner, otherAccount } = await loadFixture(
      deployOtherContractsFixture
    );
    const bridgedToken = await hre.ethers.deployContract("BridgedToken", [
      "BridgedToken",
      "BTK",
    ]);
    await bridgedToken.waitForDeployment();
    console.log("bridgedToken deployed to:", bridgedToken.target);
    return { storage, factory, vault, owner, otherAccount, bridgedToken };
  },
};

module.exports = { fixtures };
