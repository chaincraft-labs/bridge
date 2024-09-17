const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
const { mocked, fixtures } = require("../helper_fixture");
const { getMaxAddress } = require("../../utils/util");

/*
 * IMPORTANT - COVERAGE
 * fees and cancel functions are not tested at the moment
 * as these features are in progress
 */

// @todo network config to adapt test to different networks

const nativeAddressInStorage = getMaxAddress();
const startNonce = 0;
const secondNonce = 1;
const paramsTypes = [
  "address",
  "address",
  "uint",
  "uint",
  "string",
  "uint",
  "uint",
];

// describe.only("BridgeBase", function () {
describe("BridgeBase", function () {
  describe("Bridge deployment", function () {
    it("Should store the admin at deployment", async function () {
      const { storage, owner } = await loadFixture(fixtures.deployAllContracts);
      expect(await storage.getOperator("admin")).to.equal(owner.address);
    });

    it("Should revert if NON owner tries to deploy Bridge", async function () {
      const { storage, otherAccount } = await loadFixture(fixtures.deployVault);

      await expect(
        hre.ethers.deployContract("BridgeBase", [storage.target], otherAccount)
      ).to.be.reverted;
    });
  });

  describe("getters", function () {
    it("Should get the initial nonce", async function () {
      const { storage, bridge, owner, otherAccount } = await loadFixture(
        fixtures.deployAllContracts
      );

      const initialNonce = await bridge.getNewUserNonce(otherAccount);

      expect(initialNonce).to.equal(startNonce);
    });
  });

  describe("createBridgeOperation function", function () {
    describe("revert cases", function () {
      it("Should revert if from is not msg.sender", async function () {
        const { bridge, owner, otherAccount } = await loadFixture(
          fixtures.deployAllContracts
        );

        const originParams = [
          otherAccount.address,
          otherAccount.address,
          31337,
          441,
          "ethereum",
          mocked.amountToDeposit,
          startNonce,
        ];

        const msgHash = ethers.solidityPackedKeccak256(
          paramsTypes,
          originParams
        );
        const signedMsgHash = await otherAccount.signMessage(
          ethers.getBytes(msgHash)
        );
        await expect(
          bridge
            .connect(owner)
            .createBridgeOperation(...originParams, signedMsgHash)
        )
          .to.be.revertedWithCustomError(
            bridge,
            "BridgeBase__OperationCreationFailed"
          )
          .withArgs("From is not sender");
      });

      it("Should revert if nonce is not correct", async function () {
        const { bridge, otherAccount } = await loadFixture(
          fixtures.deployAllContracts
        );

        const originParams = [
          otherAccount.address,
          otherAccount.address,
          31337,
          441,
          "ethereum",
          mocked.amountToDeposit,
          secondNonce,
        ];

        const msgHash = ethers.solidityPackedKeccak256(
          paramsTypes,
          originParams
        );
        const signedMsgHash = await otherAccount.signMessage(
          ethers.getBytes(msgHash)
        );
        await expect(
          bridge
            .connect(otherAccount)
            .createBridgeOperation(...originParams, signedMsgHash)
        )
          .to.be.revertedWithCustomError(
            bridge,
            "BridgeBase__OperationCreationFailed"
          )
          .withArgs("Wrong nonce");
      });

      it("Should revert if token is not authorized", async function () {
        const { bridge, otherAccount } = await loadFixture(
          fixtures.deployAllContracts
        );

        const notListedToken = "not listed token";

        const originParams = [
          otherAccount.address,
          otherAccount.address,
          31337,
          441,
          notListedToken,
          mocked.amountToDeposit,
          startNonce,
        ];

        const msgHash = ethers.solidityPackedKeccak256(
          paramsTypes,
          originParams
        );
        const signedMsgHash = await otherAccount.signMessage(
          ethers.getBytes(msgHash)
        );
        await expect(
          bridge
            .connect(otherAccount)
            .createBridgeOperation(...originParams, signedMsgHash)
        )
          .to.be.revertedWithCustomError(bridge, "BridgeBase__DepositFailed")
          .withArgs("unauthorized token");
      });

      it("Should revert if deposit native coin with msg.value equal to 0", async function () {
        const { storage, bridge, owner, otherAccount } = await loadFixture(
          fixtures.deployAllContracts
        );

        const originParams = [
          otherAccount.address,
          otherAccount.address,
          31337,
          441,
          "ethereum",
          mocked.amountToDeposit,
          startNonce,
        ];

        const msgHash = ethers.solidityPackedKeccak256(
          paramsTypes,
          originParams
        );
        const signedMsgHash = await otherAccount.signMessage(
          ethers.getBytes(msgHash)
        );
        await expect(
          bridge
            .connect(otherAccount)
            .createBridgeOperation(...originParams, signedMsgHash)
        )
          .to.be.revertedWithCustomError(bridge, "BridgeBase__DepositFailed")
          .withArgs("Native needs non zero value");
      });

      it("Should revert if deposit of token and msg.value superior to 0", async function () {
        const { storage, bridge, mockedToken, owner, otherAccount } =
          await loadFixture(fixtures.deployAllContracts);

        const originParams = [
          owner.address,
          owner.address,
          31337,
          441,
          mocked.mockedTokenName,
          mocked.amountToDeposit,
          startNonce,
        ];

        const msgHash = ethers.solidityPackedKeccak256(
          paramsTypes,
          originParams
        );
        const signedMsgHash = await owner.signMessage(ethers.getBytes(msgHash));
        await expect(
          bridge
            .connect(owner)
            .createBridgeOperation(...originParams, signedMsgHash, {
              value: mocked.amountToDeposit,
            })
        )
          .to.be.revertedWithCustomError(bridge, "BridgeBase__DepositFailed")
          .withArgs("Token needs zero value");
      });
      it("Should revert if deposit of token and amount superior to user balance", async function () {
        const { storage, bridge, mockedToken, owner, otherAccount } =
          await loadFixture(fixtures.deployAllContracts);

        const otherAccountBalance = await mockedToken.balanceOf(
          otherAccount.address
        );
        expect(otherAccountBalance).to.equal(0);

        const originParams = [
          otherAccount.address,
          otherAccount.address,
          31337,
          441,
          mocked.mockedTokenName,
          mocked.amountToDeposit,
          startNonce,
        ];

        const msgHash = ethers.solidityPackedKeccak256(
          paramsTypes,
          originParams
        );
        const signedMsgHash = await owner.signMessage(ethers.getBytes(msgHash));
        await expect(
          bridge
            .connect(otherAccount)
            .createBridgeOperation(...originParams, signedMsgHash)
        )
          .to.be.revertedWithCustomError(bridge, "BridgeBase__DepositFailed")
          .withArgs("Insufficient balance");
      });

      // @todo test revert due to failed approval
    });
    describe("regular cases", function () {
      it("Should increment user nonce after deposit of native coin", async function () {
        const { bridge, otherAccount } = await loadFixture(
          fixtures.deployAllContracts
        );
        const initialNonce = await bridge.getNewUserNonce(otherAccount.address);
        const originParams = [
          otherAccount.address,
          otherAccount.address,
          31337,
          441,
          "ethereum",
          mocked.amountToDeposit,
          initialNonce,
        ];
        expect(initialNonce).to.equal(0);

        const msgHash = ethers.solidityPackedKeccak256(
          paramsTypes,
          originParams
        );
        const signedMsgHash = await otherAccount.signMessage(
          ethers.getBytes(msgHash)
        );
        await bridge
          .connect(otherAccount)
          .createBridgeOperation(...originParams, signedMsgHash, {
            value: mocked.amountToDeposit,
          });

        const newNonce = await bridge.getNewUserNonce(otherAccount.address);
        expect(newNonce).to.equal(initialNonce + 1n);
      });
      it("Should have native coin deposited in Vault", async function () {
        const { vault, bridge, otherAccount } = await loadFixture(
          fixtures.deployAllContracts
        );
        const originParams = [
          otherAccount.address,
          otherAccount.address,
          31337,
          441,
          "ethereum",
          mocked.amountToDeposit,
          startNonce,
        ];

        const msgHash = ethers.solidityPackedKeccak256(
          paramsTypes,
          originParams
        );
        const signedMsgHash = await otherAccount.signMessage(
          ethers.getBytes(msgHash)
        );
        await bridge
          .connect(otherAccount)
          .createBridgeOperation(...originParams, signedMsgHash, {
            value: mocked.amountToDeposit,
          });

        const userDepositBalance = await vault.getTokenUserBalance(
          otherAccount.address,
          nativeAddressInStorage
        );
        const vaultBalance = await ethers.provider.getBalance(vault.target);
        expect(userDepositBalance).to.equal(mocked.amountToDeposit);
        expect(vaultBalance).to.equal(mocked.amountToDeposit);
      });
      it("Should emit relayer event when depositing native coin", async function () {
        const { vault, bridge, relayer, otherAccount } = await loadFixture(
          fixtures.deployAllContracts
        );
        const originParams = [
          otherAccount.address,
          otherAccount.address,
          31337,
          441,
          "ethereum",
          mocked.amountToDeposit,
          startNonce,
        ];

        const msgHash = ethers.solidityPackedKeccak256(
          paramsTypes,
          originParams
        );
        const signedMsgHash = await otherAccount.signMessage(
          ethers.getBytes(msgHash)
        );
        const blockNumber = await ethers.provider.getBlockNumber();
        await expect(
          bridge
            .connect(otherAccount)
            .createBridgeOperation(...originParams, signedMsgHash, {
              value: mocked.amountToDeposit,
            })
        )
          .to.emit(relayer, "OperationCreated")
          .withArgs(msgHash, [...originParams, signedMsgHash], blockNumber + 1);
      });
      it("Should have mocked token deposited in Vault", async function () {
        const { vault, bridge, mockedToken, owner } = await loadFixture(
          fixtures.deployAllContracts
        );
        const originParams = [
          owner.address,
          owner.address,
          31337,
          441,
          mocked.mockedTokenName,
          mocked.amountToDeposit,
          startNonce,
        ];

        const msgHash = ethers.solidityPackedKeccak256(
          paramsTypes,
          originParams
        );
        const signedMsgHash = await owner.signMessage(ethers.getBytes(msgHash));

        await mockedToken.approve(vault.target, mocked.amountToDeposit);
        await bridge
          .connect(owner)
          .createBridgeOperation(...originParams, signedMsgHash);

        const userDepositBalance = await vault.getTokenUserBalance(
          owner.address,
          mockedToken.target
        );
        const vaultBalance = await mockedToken.balanceOf(vault.target);
        expect(userDepositBalance).to.equal(mocked.amountToDeposit);
        expect(vaultBalance).to.equal(mocked.amountToDeposit);
      });
      it("Should emit relayer event when depositing token", async function () {
        const { vault, relayer, bridge, mockedToken, owner } =
          await loadFixture(fixtures.deployAllContracts);
        const originParams = [
          owner.address,
          owner.address,
          31337,
          441,
          mocked.mockedTokenName,
          mocked.amountToDeposit,
          startNonce,
        ];

        const msgHash = ethers.solidityPackedKeccak256(
          paramsTypes,
          originParams
        );
        const signedMsgHash = await owner.signMessage(ethers.getBytes(msgHash));

        await mockedToken.approve(vault.target, mocked.amountToDeposit);
        const blockNumber = await ethers.provider.getBlockNumber();

        await expect(
          bridge
            .connect(owner)
            .createBridgeOperation(...originParams, signedMsgHash)
        )
          .to.emit(relayer, "OperationCreated")
          .withArgs(msgHash, [...originParams, signedMsgHash], blockNumber + 1);
      });

      it("Should burn bridged deposited & decrease user balance", async function () {
        // @todo deposit bridgedToken
      });
    });

    // @todo finalizeDeposit Test

    // @todo depositFees Test when implemented

    // @todo completeBridgeOperation Test

    // @todo cancelBridgeDeposit Test
  });
});
