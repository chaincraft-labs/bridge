const hre = require("hardhat");

const mocked = {
  bridgedTokenName: "BridgedToken",
  bridgedTokenSymbol: "BTK",
  mockedTokenName: "MockedToken",
  mockedTokenSymbol: "MCT",
  mockedTokenSupply: 1_000_000_000_000_000_000_000_000n, // 1_000_000 * 10 ** 18
};

const fixtures = {
  deployUtils: async function () {
    const [owner, user] = await ethers.getSigners();

    const Utils = await hre.ethers.deployContract("Utils");
    await Utils.waitForDeployment();
    return { Utils, owner, user };
  },

  deployMockedToken: async function () {
    const [owner] = await ethers.getSigners();
    const mockedToken = await hre.ethers.deployContract("MockedToken", [
      owner.address,
      mocked.mockedTokenName,
      mocked.mockedTokenSymbol,
    ]);
    await mockedToken.waitForDeployment();
    // console.log("mockedToken deployed to:", mockedToken.target);
    return { mockedToken, owner };
  },

  deployStorage: async function () {
    const [owner, otherAccount] = await ethers.getSigners();
    const storage = await hre.ethers.deployContract("Storage", ["ethereum"]);
    await storage.waitForDeployment();
    // console.log("Storage deployed to:", storage.target);
    return { storage, owner, otherAccount };
  },

  deployBridgedToken: async function () {
    const [owner, otherAccount] = await ethers.getSigners();
    const bridgedToken = await hre.ethers.deployContract("BridgedToken", [
      mocked.bridgedTokenName,
      mocked.bridgedTokenSymbol,
    ]);
    await bridgedToken.waitForDeployment();
    // console.log("bridgedToken deployed to:", bridgedToken.target);
    return { bridgedToken, owner, otherAccount };
  },

  deployTokenFactory: async function () {
    const [owner, otherAccount] = await ethers.getSigners();
    const storage = await hre.ethers.deployContract("Storage", ["ethereum"]);
    await storage.waitForDeployment();
    // console.log("Storage deployed to:", storage.target);
    const factory = await hre.ethers.deployContract("TokenFactory", [
      storage.target,
    ]);
    await factory.waitForDeployment();
    // console.log("factory deployed to:", factory.target);
    await storage.updateOperator("factory", factory.target);

    return { storage, factory, owner, otherAccount };
  },
};

module.exports = { mocked, fixtures };
