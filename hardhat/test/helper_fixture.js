const hre = require("hardhat");

const mocked = {
  bridgedTokenName: "BridgedToken",
  bridgedTokenSymbol: "BTK",
  mockedTokenName: "MockedToken",
  mockedTokenSymbol: "MCT",
  mockedTokenSupply: 1_000_000_000_000_000_000_000_000n, // 1_000_000 * 10 ** 18 wei
  amountToDeposit: 1_000_000_000_000_000_000n, // 1 * 10 ** 18 wei // 1 ether
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

  deployVault: async function () {
    const [owner, otherAccount] = await ethers.getSigners();
    const storage = await hre.ethers.deployContract("Storage", ["ETH"]);
    await storage.waitForDeployment();
    // console.log("Storage deployed to:", storage.target);

    const factory = await hre.ethers.deployContract("TokenFactory", [
      storage.target,
    ]);
    await factory.waitForDeployment();
    // console.log("factory deployed to:", factory.target);

    const vault = await hre.ethers.deployContract("Vault", [storage.target]);
    await vault.waitForDeployment();
    // console.log("vault deployed to:", vault.target);

    await storage.updateOperator("factory", factory.target);
    await storage.updateOperator("vault", vault.target);
    //TESTING PURPOSE
    await storage.updateOperator("bridge", owner.address);

    const mockedToken = await hre.ethers.deployContract("MockedToken", [
      owner.address,
      mocked.mockedTokenName,
      mocked.mockedTokenSymbol,
    ]);
    await mockedToken.waitForDeployment();
    // console.log("mockedToken deployed to:", mockedToken.target);

    return { storage, factory, vault, mockedToken, owner, otherAccount };
  },

  deployVaultAndBridgedToken: async function () {
    const [owner, otherAccount] = await ethers.getSigners();
    const storage = await hre.ethers.deployContract("Storage", ["ETH"]);
    await storage.waitForDeployment();
    // console.log("Storage deployed to:", storage.target);

    const factory = await hre.ethers.deployContract("TokenFactory", [
      storage.target,
    ]);
    await factory.waitForDeployment();
    // console.log("factory deployed to:", factory.target);

    const vault = await hre.ethers.deployContract("Vault", [storage.target]);
    await vault.waitForDeployment();
    // console.log("vault deployed to:", vault.target);

    await storage.updateOperator("factory", factory.target);
    await storage.updateOperator("vault", vault.target);
    //TESTING PURPOSE
    await storage.updateOperator("bridge", owner.address);

    const mockedToken = await hre.ethers.deployContract("MockedToken", [
      owner.address,
      mocked.mockedTokenName,
      mocked.mockedTokenSymbol,
    ]);
    await mockedToken.waitForDeployment();
    // console.log("mockedToken deployed to:", mockedToken.target);

    await storage.addTokenNameToList(mocked.bridgedTokenName);
    await factory.createToken(
      mocked.bridgedTokenName,
      mocked.bridgedTokenSymbol
    );
    const bridgedTokenAddress = await factory.getTokenAddress(
      mocked.bridgedTokenSymbol
    );
    const bridgedTokenContract = await hre.ethers.getContractFactory(
      "BridgedToken"
    );
    const bridgedToken = await bridgedTokenContract.attach(bridgedTokenAddress);
    return {
      storage,
      factory,
      vault,
      mockedToken,
      bridgedToken,
      bridgedTokenAddress,
      owner,
      otherAccount,
    };
  },

  deployBridge: async function () {
    const [owner, otherAccount] = await ethers.getSigners();
    const storage = await hre.ethers.deployContract("Storage", ["ETH"]);
    await storage.waitForDeployment();
    // console.log("Storage deployed to:", storage.target);

    const factory = await hre.ethers.deployContract("TokenFactory", [
      storage.target,
    ]);
    await factory.waitForDeployment();
    // console.log("factory deployed to:", factory.target);

    const vault = await hre.ethers.deployContract("Vault", [storage.target]);
    await vault.waitForDeployment();
    // console.log("vault deployed to:", vault.target);

    const bridge = await hre.ethers.deployContract("BridgeBase", [
      storage.target,
    ]);
    await bridge.waitForDeployment();
    // console.log("bridge deployed to:", bridge.target);

    await storage.updateOperator("factory", factory.target);
    await storage.updateOperator("vault", vault.target);
    await storage.updateOperator("bridge", bridge.target);

    const mockedToken = await hre.ethers.deployContract("MockedToken", [
      owner.address,
      mocked.mockedTokenName,
      mocked.mockedTokenSymbol,
    ]);
    await mockedToken.waitForDeployment();
    // console.log("mockedToken deployed to:", mockedToken.target);

    await storage.addTokenNameToList(mocked.bridgedTokenName);
    await factory.createToken(
      mocked.bridgedTokenName,
      mocked.bridgedTokenSymbol
    );
    const bridgedTokenAddress = await factory.getTokenAddress(
      mocked.bridgedTokenSymbol
    );
    const bridgedTokenContract = await hre.ethers.getContractFactory(
      "BridgedToken"
    );
    const bridgedToken = await bridgedTokenContract.attach(bridgedTokenAddress);
    return {
      storage,
      factory,
      vault,
      bridge,
      mockedToken,
      bridgedToken,
      bridgedTokenAddress,
      owner,
      otherAccount,
    };
  },
};

module.exports = { mocked, fixtures };
