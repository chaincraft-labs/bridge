const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
const { mocked, fixtures } = require("../helper_fixture");
const { getMaxAddress, getRandomAddress } = require("../../utils/util");

/*
 * IMPORTANT - COVERAGE
 * fees and cancel functions are not tested at the moment
 * as these features are in progress
 */

/*
 * IMPORTANT - SETTINGS
 * (see helper_fixture.js::fixtures::deployVault)
 * bridge operator in Storage contract is mocked with 'owner' address
 * in order to access functions called by bridge
 */

// @todo when implemented test reentrance

// @todo test transfer fail case during deposit

const nativeAddressInStorage = getMaxAddress();

describe("Vault", function () {
  describe("Vault deployment", function () {
    it("Should store the admin at deployment", async function () {
      const { storage, owner } = await loadFixture(fixtures.deployVault);
      expect(await storage.getOperator("admin")).to.equal(owner.address);
    });

    it("Should revert if NON owner tries to deploy Vault", async function () {
      const { storage, otherAccount } = await loadFixture(fixtures.deployVault);

      await expect(
        hre.ethers.deployContract("Vault", [storage.target], otherAccount)
      ).to.be.reverted;
    });
  });

  // bridge operator is mocked with owner address to access function called by bridge
  describe("deposit functions", function () {
    // native coin deposit
    it("Should revert if not authorized address call depositNative", async function () {
      const { vault, owner, otherAccount } = await loadFixture(
        fixtures.deployVault
      );
      await expect(
        vault.connect(otherAccount).depositNative(owner.address, {
          value: ethers.parseEther("1"),
        })
      )
        .to.be.revertedWithCustomError(vault, "Vault__CallerHasNotRole")
        .withArgs("bridge");
    });
    it("Should deposit native coin", async function () {
      const { vault, owner } = await loadFixture(fixtures.deployVault);
      await vault.connect(owner).depositNative(owner.address, {
        value: ethers.parseEther("1"),
      });
      const vaultBalance = await ethers.provider.getBalance(vault.target);

      expect(vaultBalance).to.equal(ethers.parseEther("1"));
    });

    it("Should deposit native coin and update userDeposit balance", async function () {
      const { vault, owner } = await loadFixture(fixtures.deployVault);
      await vault.connect(owner).depositNative(owner.address, {
        value: ethers.parseEther("1"),
      });

      const userDepositBalance = await vault.getTokenUserBalance(
        owner.address,
        nativeAddressInStorage
      );

      expect(userDepositBalance).to.equal(ethers.parseEther("1"));
    });

    // erc20 deposit
    it("Should revert if not authorized address call depositToken", async function () {
      const { vault, mockedToken, owner, otherAccount } = await loadFixture(
        fixtures.deployVault
      );

      await mockedToken.approve(vault.target, mocked.amountToDeposit);
      await vault.depositToken(
        owner.address,
        mockedToken.target,
        mocked.amountToDeposit
      );
      await expect(
        vault
          .connect(otherAccount)
          .depositToken(
            owner.address,
            mockedToken.target,
            mocked.amountToDeposit
          )
      )
        .to.be.revertedWithCustomError(vault, "Vault__CallerHasNotRole")
        .withArgs("bridge");
    });

    it("Should deposit ERC20", async function () {
      const { vault, mockedToken, owner } = await loadFixture(
        fixtures.deployVault
      );

      await mockedToken.approve(vault.target, mocked.amountToDeposit);
      await vault.depositToken(
        owner.address,
        mockedToken.target,
        mocked.amountToDeposit
      );
      const vaultBalance = await mockedToken.balanceOf(vault.target);
      expect(vaultBalance).to.equal(mocked.amountToDeposit);
    });

    it("Should deposit ERC20 and update userDeposit balance", async function () {
      const { vault, mockedToken, owner } = await loadFixture(
        fixtures.deployVault
      );

      await mockedToken.approve(vault.target, mocked.amountToDeposit);
      await vault.depositToken(
        owner.address,
        mockedToken.target,
        mocked.amountToDeposit
      );

      const userDepositBalance = await vault.getTokenUserBalance(
        owner.address,
        mockedToken.target
      );
      expect(userDepositBalance).to.equal(mocked.amountToDeposit);
    });

    // bridged tokens
    it("Should revert if not authorized address call burn", async function () {
      const { vault, mockedToken, owner, otherAccount } = await loadFixture(
        fixtures.deployVault
      );

      const mockedTokenAddress = getRandomAddress();

      await expect(
        vault
          .connect(otherAccount)
          .burn(
            otherAccount.address,
            mockedTokenAddress,
            mocked.amountToDeposit
          )
      )
        .to.be.revertedWithCustomError(vault, "Vault__CallerHasNotRole")
        .withArgs("bridge");
    });

    it("Should deposit and burn bridgedToken", async function () {
      const { vault, bridgedToken, bridgedTokenAddress, otherAccount } =
        await loadFixture(fixtures.deployVaultAndBridgedToken);

      // mint the bridgedToken to otherAccount
      await vault.mint(
        otherAccount.address,
        bridgedTokenAddress,
        mocked.amountToDeposit
      );
      const vaultBalance = await bridgedToken.balanceOf(vault.target);
      const otherAccountBalance = await bridgedToken.balanceOf(
        otherAccount.address
      );
      expect(vaultBalance).to.equal(0);
      expect(otherAccountBalance).to.equal(mocked.amountToDeposit);

      // burn the bridgedToken from otherAccount
      await vault.burn(
        otherAccount.address,
        bridgedTokenAddress,
        mocked.amountToDeposit
      );
      const vaultBalanceAfterBurn = await bridgedToken.balanceOf(vault.target);
      const otherAccountBalanceAfterBurn = await bridgedToken.balanceOf(
        otherAccount.address
      );
      expect(vaultBalanceAfterBurn).to.equal(0);
      expect(otherAccountBalanceAfterBurn).to.equal(0);
    });

    it("Should deposit and burn bridgedToken and update userDeposit balance", async function () {
      const { vault, bridgedToken, bridgedTokenAddress, otherAccount } =
        await loadFixture(fixtures.deployVaultAndBridgedToken);

      await vault.mint(
        otherAccount.address,
        bridgedTokenAddress,
        mocked.amountToDeposit
      );
      const vaultBalance = await bridgedToken.balanceOf(vault.target);
      const otherAccountBalance = await bridgedToken.balanceOf(
        otherAccount.address
      );
      expect(vaultBalance).to.equal(0);
      expect(otherAccountBalance).to.equal(mocked.amountToDeposit);

      // burn the bridgedToken from otherAccount
      await vault.burn(
        otherAccount.address,
        bridgedTokenAddress,
        mocked.amountToDeposit
      );

      const userDepositBalance = await vault.getTokenUserBalance(
        otherAccount.address,
        bridgedTokenAddress
      );
      expect(userDepositBalance).to.equal(mocked.amountToDeposit);
    });
  });

  describe("finalizeDeposit function", function () {
    // native coin deposit
    it("Should revert if not authorized address call finalizeDeposit", async function () {
      const { vault, owner, otherAccount } = await loadFixture(
        fixtures.deployVault
      );

      await expect(
        vault
          .connect(otherAccount)
          .finalizeDeposit(
            owner.address,
            nativeAddressInStorage,
            mocked.amountToDeposit
          )
      )
        .to.be.revertedWithCustomError(vault, "Vault__CallerHasNotRole")
        .withArgs("bridge");
    });

    it("Should update userDeposit and vaultBalance for native coin", async function () {
      const { vault, owner } = await loadFixture(fixtures.deployVault);
      await vault.connect(owner).depositNative(owner.address, {
        value: mocked.amountToDeposit,
      });

      const userDepositBalanceBefore = await vault.getTokenUserBalance(
        owner.address,
        nativeAddressInStorage
      );
      const vaultBalanceBefore = await vault.getVaultBalance(
        nativeAddressInStorage
      );
      expect(userDepositBalanceBefore).to.equal(mocked.amountToDeposit);
      expect(vaultBalanceBefore).to.equal(0);

      await vault
        .connect(owner)
        .finalizeDeposit(
          owner.address,
          nativeAddressInStorage,
          mocked.amountToDeposit
        );

      const vaultBalance = await ethers.provider.getBalance(vault.target);
      expect(vaultBalance).to.equal(mocked.amountToDeposit);

      const userDepositBalanceAfter = await vault.getTokenUserBalance(
        owner.address,
        nativeAddressInStorage
      );
      const vaultBalanceAfter = await vault.getVaultBalance(
        nativeAddressInStorage
      );
      expect(vaultBalanceAfter).to.equal(mocked.amountToDeposit);
      expect(userDepositBalanceAfter).to.equal(0);
    });

    it("Should update userDeposit and vaultBalance for ERC20", async function () {
      const { vault, mockedToken, owner } = await loadFixture(
        fixtures.deployVault
      );

      await mockedToken.approve(vault.target, mocked.amountToDeposit);
      await vault.depositToken(
        owner.address,
        mockedToken.target,
        mocked.amountToDeposit
      );

      const userDepositBalanceBefore = await vault.getTokenUserBalance(
        owner.address,
        mockedToken.target
      );
      const vaultBalanceBefore = await vault.getVaultBalance(
        mockedToken.target
      );
      expect(userDepositBalanceBefore).to.equal(mocked.amountToDeposit);
      expect(vaultBalanceBefore).to.equal(0);

      await vault
        .connect(owner)
        .finalizeDeposit(
          owner.address,
          mockedToken.target,
          mocked.amountToDeposit
        );

      const userDepositBalanceAfter = await vault.getTokenUserBalance(
        owner.address,
        mockedToken.target
      );
      const vaultBalanceAfter = await vault.getVaultBalance(mockedToken.target);
      expect(vaultBalanceAfter).to.equal(mocked.amountToDeposit);
      expect(userDepositBalanceAfter).to.equal(0);
    });

    it("Should update userDeposit for bridgedToken", async function () {
      const { vault, bridgedToken, bridgedTokenAddress, owner, otherAccount } =
        await loadFixture(fixtures.deployVaultAndBridgedToken);

      // mint the bridgedToken to otherAccount
      await vault.mint(
        otherAccount.address,
        bridgedTokenAddress,
        mocked.amountToDeposit
      );
      const vaultBalance = await bridgedToken.balanceOf(vault.target);
      const otherAccountBalance = await bridgedToken.balanceOf(
        otherAccount.address
      );
      expect(vaultBalance).to.equal(0);
      expect(otherAccountBalance).to.equal(mocked.amountToDeposit);

      // burn the bridgedToken from otherAccount
      await vault.burn(
        otherAccount.address,
        bridgedTokenAddress,
        mocked.amountToDeposit
      );

      const userDepositBalanceBefore = await vault.getTokenUserBalance(
        otherAccount.address,
        bridgedTokenAddress
      );
      const vaultBalanceBefore = await vault.getVaultBalance(
        bridgedTokenAddress
      );
      expect(userDepositBalanceBefore).to.equal(mocked.amountToDeposit);
      expect(vaultBalanceBefore).to.equal(0);

      await vault
        .connect(owner)
        .finalizeDeposit(
          otherAccount.address,
          bridgedTokenAddress,
          mocked.amountToDeposit
        );

      const userDepositBalanceAfter = await vault.getTokenUserBalance(
        otherAccount.address,
        bridgedTokenAddress
      );
      const vaultBalanceAfter = await vault.getVaultBalance(
        bridgedTokenAddress
      );
      expect(vaultBalanceAfter).to.equal(0);
      expect(userDepositBalanceAfter).to.equal(0);
    });
  });

  describe("unlock functions", function () {
    // bridged tokens
    it("Should revert if not authorized address call mint", async function () {
      const { vault, otherAccount } = await loadFixture(fixtures.deployVault);

      const mockedTokenAddress = getRandomAddress();

      await expect(
        vault
          .connect(otherAccount)
          .mint(
            otherAccount.address,
            mockedTokenAddress,
            mocked.amountToDeposit
          )
      )
        .to.be.revertedWithCustomError(vault, "Vault__CallerHasNotRole")
        .withArgs("bridge");
    });

    it("Should mint bridgedToken to otherAccount", async function () {
      const { vault, bridgedToken, bridgedTokenAddress, otherAccount } =
        await loadFixture(fixtures.deployVaultAndBridgedToken);

      await vault.mint(
        otherAccount.address,
        bridgedTokenAddress,
        mocked.amountToDeposit
      );
      const vaultBalance = await bridgedToken.balanceOf(vault.target);
      const otherAccountBalance = await bridgedToken.balanceOf(
        otherAccount.address
      );
      expect(vaultBalance).to.equal(0);
      expect(otherAccountBalance).to.equal(mocked.amountToDeposit);
    });

    it("Should revert if not authorized address call unlockNative", async function () {
      const { vault, otherAccount } = await loadFixture(fixtures.deployVault);

      await expect(
        vault
          .connect(otherAccount)
          .unlockNative(otherAccount.address, mocked.amountToDeposit)
      )
        .to.be.revertedWithCustomError(vault, "Vault__CallerHasNotRole")
        .withArgs("bridge");
    });

    it("Should revert if we call unlockNative with more amount than vault balance", async function () {
      const { owner, vault, otherAccount } = await loadFixture(
        fixtures.deployVault
      );

      await expect(
        vault
          .connect(owner)
          .unlockNative(otherAccount.address, mocked.amountToDeposit)
      )
        .to.be.revertedWithCustomError(vault, "Vault__InsufficientBalance")
        .withArgs("Insufficient vault balance");
    });

    it("Should unlockNative and transfer native coin", async function () {
      const { vault, owner } = await loadFixture(fixtures.deployVault);
      const feesAmount = ethers.parseEther("0.01");
      const mockedAmountWithFees = mocked.amountToDeposit + feesAmount;

      // 1. need to have a previous deposit before
      await vault.depositNative(owner.address, {
        value: mockedAmountWithFees,
      });
      // const vaultBalance = await ethers.provider.getBalance(vault.target);
      // expect(vaultBalance).to.equal(mockedAmountWithFees);
      await vault.finalizeDeposit(
        owner.address,
        nativeAddressInStorage,
        mocked.amountToDeposit
      );
      const vaultBalanceInStorage = await vault.getVaultBalance(
        nativeAddressInStorage
      );
      expect(vaultBalanceInStorage).to.equal(mocked.amountToDeposit);

      const ownerAccountBalanceBefore = await ethers.provider.getBalance(
        owner.address
      );

      // 2. unlock & determine gas usage
      let tx = await vault.unlockNative(owner.address, mocked.amountToDeposit);
      let receipt = await tx.wait();
      const gasPrice = receipt.gasPrice;
      const gasSpent = receipt.gasUsed * gasPrice;
      const vaultBalanceAfterUnlock = await ethers.provider.getBalance(
        vault.target
      );
      const ownerAccountBalanceAfter = await ethers.provider.getBalance(
        owner.address
      );

      expect(vaultBalanceAfterUnlock).to.equal(
        mockedAmountWithFees - mocked.amountToDeposit
      );
      expect(ownerAccountBalanceAfter - ownerAccountBalanceBefore).to.equal(
        mocked.amountToDeposit - gasSpent
      );
      const vaultBalanceInStorageAfter = await vault.getVaultBalance(
        nativeAddressInStorage
      );
      expect(vaultBalanceInStorageAfter).to.equal(0);
    });

    it("Should revert if we call unlockToken with more amount than vault balance", async function () {
      const { owner, vault, mockedToken, otherAccount } = await loadFixture(
        fixtures.deployVault
      );

      await expect(
        vault
          .connect(owner)
          .unlockToken(
            otherAccount.address,
            mockedToken.target,
            mocked.amountToDeposit
          )
      )
        .to.be.revertedWithCustomError(vault, "Vault__InsufficientBalance")
        .withArgs("Insufficient vault balance");
    });

    it("Should unlock ERC20 and transfer to otherAccount", async function () {
      const { vault, mockedToken, owner, otherAccount } = await loadFixture(
        fixtures.deployVault
      );
      // 1. need a previous deposit before withdraw (owner has the mockedToken supply)
      await mockedToken
        .connect(owner)
        .approve(vault.target, mocked.amountToDeposit);
      await vault
        .connect(owner)
        .depositToken(owner, mockedToken.target, mocked.amountToDeposit);
      await vault
        .connect(owner)
        .finalizeDeposit(owner, mockedToken.target, mocked.amountToDeposit);
      const vaultBalance = await mockedToken.balanceOf(vault.target);
      expect(vaultBalance).to.equal(mocked.amountToDeposit);
      const vaultBalanceInStorage = await vault.getVaultBalance(
        mockedToken.target
      );
      expect(vaultBalanceInStorage).to.equal(mocked.amountToDeposit);

      // 2. unlock and transfer to otherAccount
      await vault.unlockToken(
        otherAccount.address,
        mockedToken.target,
        mocked.amountToDeposit
      );
      const vaultBalanceAfterUnlock = await mockedToken.balanceOf(vault.target);
      const vaultBalanceInStorageAfterUnlock = await vault.getVaultBalance(
        mockedToken.target
      );
      const otherAccountBalance = await mockedToken.balanceOf(
        otherAccount.address
      );
      expect(vaultBalanceAfterUnlock).to.equal(0);
      expect(vaultBalanceInStorageAfterUnlock).to.equal(0);
      expect(otherAccountBalance).to.equal(mocked.amountToDeposit);
    });
  });
});
