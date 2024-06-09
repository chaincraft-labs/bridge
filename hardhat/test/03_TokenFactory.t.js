const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
const { BigInt } = require("ethers");

describe("TokenFactory", function () {
  // deployment fixture :
  async function deployOtherContractsFixture() {
    const [owner, otherAccount] = await ethers.getSigners();
    const storage = await hre.ethers.deployContract("Storage");
    await storage.waitForDeployment();
    console.log("Storage deployed to:", storage.target);

    // const factory = await hre.ethers.deployContract("TokenFactory", [
    //   storage.target,
    // ]);
    // await factory.waitForDeployment();
    // console.log("factory deployed to:", factory.target);

    const vault = await hre.ethers.deployContract("Vault", [storage.target]);
    await vault.waitForDeployment();

    console.log("vault deployed to:", vault.target);

    // const BridgeBase = await ethers.getContractFactory("BridgeBase");
    // const bridge = await BridgeBase.deploy(storage.target, vault.target);
    // await bridge.deployed();
    // console.log("Bridge deployed to:", bridge.target);
    // await storage.updateOperator("factory", factory.target);
    await storage.updateOperator("vault", vault.target);
    // await storage.updateOperator("bridge", bridge.target);
    return { storage, vault, owner, otherAccount };
  }

  async function deployBridgedTokenFixture() {
    const { storage, vault, owner, otherAccount } = await loadFixture(
      deployOtherContractsFixture
    );
    const bridgedToken = await hre.ethers.deployContract("BridgedToken", [
      "BridgedToken",
      "BTK",
    ]);
    await bridgedToken.waitForDeployment();
    console.log("bridgedToken deployed to:", bridgedToken.target);
    return { storage, vault, owner, otherAccount, bridgedToken };
  }

  async function deployTokenFactoryFixture() {
    const { storage, vault, owner, otherAccount, bridgedToken } =
      await loadFixture(deployBridgedTokenFixture);
    const factory = await hre.ethers.deployContract("TokenFactory", [
      storage.target,
    ]);
    await factory.waitForDeployment();
    console.log("factory deployed to:", factory.target);
    await storage.updateOperator("factory", factory.target);
    return { storage, factory, vault, owner, otherAccount, bridgedToken };
  }

  // fixture to deploy MockedDai
  async function deployMockedDaiFixture() {
    const [owner, otherAccount] = await ethers.getSigners();
    const mockedDai = await hre.ethers.deployContract("MockedDai");
    await mockedDai.waitForDeployment();
    console.log("MockedDai deployed to:", mockedDai.target);
    return { mockedDai, owner, otherAccount };
  }

  describe("TokenFactory Deployment", function () {
    it("Should have factory as operator in storage", async function () {
      const { storage, factory, vault, owner, otherAccount } =
        await loadFixture(deployTokenFactoryFixture);
      expect(await storage.getOperator("factory")).to.equal(factory.target);
    });

    it("Should have owner as TokenFactory owner", async function () {
      const { storage, factory, vault, owner, otherAccount } =
        await loadFixture(deployTokenFactoryFixture);
      expect(await factory.getOwner()).to.equal(owner.address);
    });
    // it("Should get TokenFactory owner", async function () {
    //   const { storage, factory, vault, owner, otherAccount } =
    //     await loadFixture(deployTokenFactoryFixture);
    //   expect(await factory.getOwner()).to.equal(owner.address);
    // });
    // it("Should revert if not owner try to deploy factory", async function () {
    //   const [owner, otherAccount] = await ethers.getSigners();
    //   const storage = await hre.ethers.deployContract("Storage");
    //   await storage.waitForDeployment();
    //   console.log("Storage deployed to:", storage.target);

    //   await expect(
    //     hre.ethers.deployContract("TokenFactory", [storage.target], {
    //       from: otherAccount,
    //     })
    //   ).to.be.revertedWith("TokenFactory: caller is not the admin");
    // });
  });
  describe("CreateToken function", function () {
    it("Should create ETH BridgedToken", async function () {
      const { storage, factory, vault, owner, otherAccount, bridgedToken } =
        await loadFixture(deployTokenFactoryFixture);
      // get current chainId and convert to bignumber :
      const networkName = hre.network.name;
      const chainId = hre.network.config.chainId;
      const chainIdHex = await network.provider.send("eth_chainId");
      // const chainId = await hre.ethers.provider.getNetwork();

      console.log("chainId", chainId);
      console.log("chainIdHex", chainIdHex);

      // const chainIdBN = BigInt.from(chainId);
      // get add(0)
      const zeroAddress = ethers.ZeroAddress;
      const tx = await factory.createToken(
        "ETH BridgedToken",
        "bETH",
        chainId,
        zeroAddress
      );
      await tx.wait();
      // console.log("tx", tx);
      // const bEthAddress = tx.events[0].args[0];
      const tokenList = await factory.getTokenList();
      console.log("tokenList", tokenList);
      const bEthAddress = tokenList[0];
      console.log("bEthAddress", bEthAddress);
      const tokenAddress = await factory.getTokenAddress("bETH");
      console.log("tokenAddress", tokenAddress);
      expect(tokenAddress).to.equal(bEthAddress);
    });
    it("Should revert if token already exist", async function () {
      const { storage, factory, vault, owner, otherAccount, bridgedToken } =
        await loadFixture(deployTokenFactoryFixture);
      const chainId = hre.network.config.chainId;
      const zeroAddress = ethers.ZeroAddress;

      const tx = await factory.createToken(
        "ETH BridgedToken",
        "bETH",
        chainId,
        zeroAddress
      );
      await tx.wait();
      await expect(
        factory.createToken("ETH BridgedToken", "bETH", chainId, zeroAddress)
      ).to.be.revertedWith("TokenFactory: token name already exists");
    });
  });
  it("Should create MockedDai BridgedToken", async function () {
    const { storage, factory, vault, owner, otherAccount, bridgedToken } =
      await loadFixture(deployTokenFactoryFixture);
    const { mockedDai } = await loadFixture(deployMockedDaiFixture);
    const chainId = hre.network.config.chainId;
    const tx = await factory.createToken(
      "MockedDai BridgedToken",
      "bDai",
      chainId,
      mockedDai.target
    );
    await tx.wait();
    const tokenList = await factory.getTokenList();
    console.log("tokenList", tokenList);
    const bDaiAddress = tokenList[0];
    console.log("bDaiAddress", bDaiAddress);
    const tokenAddress = await factory.getTokenAddress("bDai");
    console.log("tokenAddress", tokenAddress);
    expect(tokenAddress).to.equal(bDaiAddress);
  });
  it("Should add token to tokenlist in storage", async function () {
    const { storage, factory, vault, owner, otherAccount, bridgedToken } =
      await loadFixture(deployTokenFactoryFixture);
    const chainId = hre.network.config.chainId;
    const zeroAddress = ethers.ZeroAddress;
    const tx = await factory.createToken(
      "ETH BridgedToken",
      "bETH",
      chainId,
      zeroAddress
    );
    await tx.wait();
    const tokenList = await storage.getTokenList();
    console.log("tokenList", tokenList);
    expect(tokenList.length).to.equal(1);
    const bEthAddress = tokenList[0];
    const tokenAddress = await factory.getTokenAddress("bETH");
    console.log("tokenAddress", tokenAddress);
    expect(tokenAddress).to.equal(bEthAddress);
  });
});
