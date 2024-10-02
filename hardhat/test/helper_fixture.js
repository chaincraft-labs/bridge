const hre = require("hardhat");
const { getRandomAddress, getMaxAddress } = require("../utils/util");

/*
 * Fixtures for tests
 * Mocked contracts and constants
 */

const mocked = {
  bridgedTokenName: "BridgedToken",
  bridgedTokenSymbol: "BTK",
  mockedTokenName: "MockedToken",
  mockedTokenSymbol: "MCT",
  mockedTokenSupply: 1_000_000_000_000_000_000_000_000n, // 1_000_000 * 10 ** 18 wei
  amountToDeposit: 1_000_000_000_000_000_000n, //.......... 1 * 10 ** 18 wei // 1 ether
  mockedTokenAddress: getRandomAddress(),
};

const constants = {
  hhChainId: 31337,
  hmyChainId: 441,
  sepoliaChainId: 11155111,
  ethNativeTokenName: "ethereum",
  hhNativeTokenName: "ethereum",
  hmyNativeTokenName: "harmonie",
  nativeTokenAddress: getMaxAddress(),
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
    return { mockedToken, owner };
  },

  deployStorage: async function () {
    const [owner, otherAccount] = await ethers.getSigners();
    const storage = await hre.ethers.deployContract("Storage", ["ethereum"]);
    await storage.waitForDeployment();
    return { storage, owner, otherAccount };
  },

  deployBridgedToken: async function () {
    const [owner, otherAccount] = await ethers.getSigners();
    const bridgedToken = await hre.ethers.deployContract("BridgedToken", [
      mocked.bridgedTokenName,
      mocked.bridgedTokenSymbol,
    ]);
    await bridgedToken.waitForDeployment();
    return { bridgedToken, owner, otherAccount };
  },

  deployTokenFactory: async function () {
    const [owner, otherAccount] = await ethers.getSigners();
    const storage = await hre.ethers.deployContract("Storage", ["ethereum"]);
    await storage.waitForDeployment();

    const factory = await hre.ethers.deployContract("TokenFactory", [
      storage.target,
    ]);
    await factory.waitForDeployment();

    await storage.updateOperator("factory", factory.target);

    return { storage, factory, owner, otherAccount };
  },

  deployVault: async function () {
    const [owner, otherAccount] = await ethers.getSigners();
    const storage = await hre.ethers.deployContract("Storage", ["ETH"]);
    await storage.waitForDeployment();

    const factory = await hre.ethers.deployContract("TokenFactory", [
      storage.target,
    ]);
    await factory.waitForDeployment();

    const vault = await hre.ethers.deployContract("Vault", [storage.target]);
    await vault.waitForDeployment();

    await storage.updateOperator("factory", factory.target);
    await storage.updateOperator("vault", vault.target);
    // TESTING PURPOSE: we mock the bridge to be authorized to call the relayer
    await storage.updateOperator("bridge", owner.address);

    const mockedToken = await hre.ethers.deployContract("MockedToken", [
      owner.address,
      mocked.mockedTokenName,
      mocked.mockedTokenSymbol,
    ]);
    await mockedToken.waitForDeployment();

    return { storage, factory, vault, mockedToken, owner, otherAccount };
  },

  deployVaultAndBridgedToken: async function () {
    const [owner, otherAccount] = await ethers.getSigners();
    const storage = await hre.ethers.deployContract("Storage", ["ethereum"]);
    await storage.waitForDeployment();

    const factory = await hre.ethers.deployContract("TokenFactory", [
      storage.target,
    ]);
    await factory.waitForDeployment();

    const vault = await hre.ethers.deployContract("Vault", [storage.target]);
    await vault.waitForDeployment();

    await storage.updateOperator("factory", factory.target);
    await storage.updateOperator("vault", vault.target);
    //TESTING PURPOSE we mock the bridge to be authorized to call the relayer
    await storage.updateOperator("bridge", owner.address);

    const mockedToken = await hre.ethers.deployContract("MockedToken", [
      owner.address,
      mocked.mockedTokenName,
      mocked.mockedTokenSymbol,
    ]);
    await mockedToken.waitForDeployment();

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

  deployAllContracts: async function () {
    const [owner, otherAccount] = await ethers.getSigners();
    const storage = await hre.ethers.deployContract("Storage", ["ethereum"]);
    await storage.waitForDeployment();

    const factory = await hre.ethers.deployContract("TokenFactory", [
      storage.target,
    ]);
    await factory.waitForDeployment();

    const vault = await hre.ethers.deployContract("Vault", [storage.target]);
    await vault.waitForDeployment();

    const bridge = await hre.ethers.deployContract("BridgeBase", [
      storage.target,
    ]);
    await bridge.waitForDeployment();

    const relayer = await hre.ethers.deployContract("RelayerBase", [
      storage.target,
    ]);
    await relayer.waitForDeployment();

    await storage.updateOperator("factory", factory.target);
    await storage.updateOperator("vault", vault.target);
    await storage.updateOperator("bridge", bridge.target);
    await storage.updateOperator("relayer", relayer.target);
    // mock oracle (server) with owner in order to call relayer functions
    await storage.updateOperator("oracle", owner.address);

    await storage.addTokenNameToList(mocked.mockedTokenName);
    const mockedToken = await hre.ethers.deployContract("MockedToken", [
      owner.address,
      mocked.mockedTokenName,
      mocked.mockedTokenSymbol,
    ]);
    await mockedToken.waitForDeployment();
    await storage.addNewTokenAddressByChainId(
      mocked.mockedTokenName,
      31337,
      mockedToken.target
    );
    // IMPORTANT: owner has the total supply of the mockedToken

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

    // mock bridge with owner in order to call vault functions
    // vault is owner of the bridgedToken, so we can mint
    await storage.updateOperator("bridge", owner.address);
    await vault
      .connect(owner)
      .mint(owner.address, bridgedTokenAddress, mocked.amountToDeposit * 10n);
    // restore bridge operator
    await storage.updateOperator("bridge", bridge.target);

    return {
      storage,
      factory,
      vault,
      bridge,
      relayer,
      mockedToken,
      bridgedToken,
      bridgedTokenAddress,
      owner,
      otherAccount,
    };
  },
};

module.exports = { constants, mocked, fixtures };
