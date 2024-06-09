const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

// Test of the bridge token
// Fixtures used : deployment of storage, factory and vault
// Vault is the owner of the bridge token at the end of the deployment
// classic ERC20 tests + minting and burning and ownership transfer
describe("BridgedToken", function () {
  // deployment fixture :
  async function deployOtherContractsFixture() {
    const [owner, otherAccount] = await ethers.getSigners();
    const storage = await hre.ethers.deployContract("Storage");
    await storage.waitForDeployment();
    console.log("Storage deployed to:", storage.target);

    const factory = await hre.ethers.deployContract("TokenFactory", [
      storage.target,
    ]);
    await factory.waitForDeployment();
    console.log("factory deployed to:", factory.target);

    const vault = await hre.ethers.deployContract("Vault", [storage.target]);
    await vault.waitForDeployment();

    console.log("vault deployed to:", vault.target);

    // const BridgeBase = await ethers.getContractFactory("BridgeBase");
    // const bridge = await BridgeBase.deploy(storage.target, vault.target);
    // await bridge.deployed();
    // console.log("Bridge deployed to:", bridge.target);
    await storage.updateOperator("factory", factory.target);
    await storage.updateOperator("vault", vault.target);
    // await storage.updateOperator("bridge", bridge.target);
    return { storage, factory, vault, owner, otherAccount };
  }

  async function deployBridgedTokenFixture() {
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
  }

  describe("BridgedToken Deployment", function () {
    it("Should have BridgedToken as name and BTK as symbol", async function () {
      const { storage, factory, vault, owner, otherAccount, bridgedToken } =
        await loadFixture(deployBridgedTokenFixture);

      expect(await bridgedToken.name()).to.equal("BridgedToken");
      expect(await bridgedToken.symbol()).to.equal("BTK");
    });
    it("Should have admin as owner", async function () {
      const { storage, factory, vault, owner, otherAccount, bridgedToken } =
        await loadFixture(deployBridgedTokenFixture);

      expect(await bridgedToken.getOwner()).to.equal(owner.address);
    });
    it("Should transfer ownership to vault", async function () {
      const { storage, factory, vault, owner, otherAccount, bridgedToken } =
        await loadFixture(deployBridgedTokenFixture);
      await bridgedToken.updateAdmin(vault.target);
      expect(await bridgedToken.getOwner()).to.equal(vault.target);
    });
    it("Should emit OwnershipTransferred event", async function () {
      const { storage, factory, vault, owner, otherAccount, bridgedToken } =
        await loadFixture(deployBridgedTokenFixture);
      await expect(bridgedToken.updateAdmin(vault.target))
        .to.emit(bridgedToken, "OwnerUpdated")
        .withArgs(bridgedToken.name(), vault.target);
    });
  });
  describe("BridgedToken minting and burning", function () {
    it("Should mint 1000 tokens to owner", async function () {
      const { storage, factory, vault, owner, otherAccount, bridgedToken } =
        await loadFixture(deployBridgedTokenFixture);

      await bridgedToken.connect(owner).mint(otherAccount.address, 1000);
      expect(await bridgedToken.balanceOf(otherAccount.address)).to.equal(1000);
    });
    it("Should burn 1000 tokens from owner", async function () {
      const { storage, factory, vault, owner, otherAccount, bridgedToken } =
        await loadFixture(deployBridgedTokenFixture);

      await bridgedToken.connect(owner).mint(otherAccount.address, 1000);
      await bridgedToken.connect(owner).burn(otherAccount.address, 1000);
      expect(await bridgedToken.balanceOf(otherAccount.address)).to.equal(0);
    });
    it("Should revert when minter is not the owner", async function () {
      const { storage, factory, vault, owner, otherAccount, bridgedToken } =
        await loadFixture(deployBridgedTokenFixture);
      await expect(
        bridgedToken.connect(otherAccount).mint(otherAccount.address, 1000)
      ).to.be.revertedWith("only admin owner");
    });
    it("Should revert when burner is not the owner", async function () {
      const { storage, factory, vault, owner, otherAccount, bridgedToken } =
        await loadFixture(deployBridgedTokenFixture);
      await expect(
        bridgedToken.connect(otherAccount).burn(otherAccount.address, 1000)
      ).to.be.revertedWith("only admin owner");
    });
    it("Should revert when burner has not enough tokens", async function () {
      const { storage, factory, vault, owner, otherAccount, bridgedToken } =
        await loadFixture(deployBridgedTokenFixture);
      const otherAccountBalance = await bridgedToken.balanceOf(
        otherAccount.address
      );
      await expect(bridgedToken.connect(owner).burn(otherAccount.address, 1000))
        .to.be.revertedWithCustomError(bridgedToken, "ERC20InsufficientBalance")
        .withArgs(otherAccount.address, otherAccountBalance, 1000);
    });
  });
  // TODO classic ERC20 tests
});
