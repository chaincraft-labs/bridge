const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
const { mocked, fixtures } = require("../helper_fixture");
const { getMaxAddress } = require("../../utils/addressUtil");

/*
 * IMPORTANT - COVERAGE
 * fees and cancel functions are not tested at the moment
 * as these features are in progress
 */
/*
 * IMPORTANT - SETTINGS
 * (see helper_fixture.js::fixtures::deployAllContracts)
 * oracle operator in Storage contract is mocked with 'owner' address
 * in order to access functions called by oracle (server)
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

// describe.only("RelayerBase", function () {
describe("RelayerBase", function () {
  describe("Relayer deployment", function () {
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

  describe("createOperation function", function () {
    it("Should revert if operation status is not NONE", async function () {
      const { storage, bridge, relayer, owner } = await loadFixture(
        fixtures.deployAllContracts
      );
      const initialNonce = await bridge.getNewUserNonce(owner.address);
      const originParams = [
        owner.address,
        owner.address,
        31337,
        441,
        "ethereum",
        mocked.amountToDeposit,
        initialNonce,
      ];
      expect(initialNonce).to.equal(0);

      const msgHash = ethers.solidityPackedKeccak256(paramsTypes, originParams);
      const signedMsgHash = await owner.signMessage(ethers.getBytes(msgHash));
      await bridge
        .connect(owner)
        .createBridgeOperation(...originParams, signedMsgHash, {
          value: mocked.amountToDeposit,
        });

      // mock bridge role to access relayer function
      await storage.updateOperator("bridge", owner.address);
      await expect(
        relayer.connect(owner).createOperation(...originParams, signedMsgHash)
      ).to.be.revertedWithCustomError(
        relayer,
        "RelayerBase__OperationAlreadyExists"
      );
    });
    it("Should revert if NON bridge tries to call", async function () {
      const { storage, bridge, relayer, owner } = await loadFixture(
        fixtures.deployAllContracts
      );
      const initialNonce = await bridge.getNewUserNonce(owner.address);
      const originParams = [
        owner.address,
        owner.address,
        31337,
        441,
        "ethereum",
        mocked.amountToDeposit,
        initialNonce,
      ];
      expect(initialNonce).to.equal(0);

      const msgHash = ethers.solidityPackedKeccak256(paramsTypes, originParams);
      const signedMsgHash = await owner.signMessage(ethers.getBytes(msgHash));

      await expect(
        relayer.connect(owner).createOperation(...originParams, signedMsgHash)
      )
        .to.be.revertedWithCustomError(relayer, "RelayerBase__CallerHasNotRole")
        .withArgs("bridge");
    });
    it("Should set the new operation params in originOperations mapping", async function () {
      const { storage, bridge, relayer, owner } = await loadFixture(
        fixtures.deployAllContracts
      );
      const initialNonce = await bridge.getNewUserNonce(owner.address);
      const originParams = [
        owner.address,
        owner.address,
        31337,
        441,
        "ethereum",
        mocked.amountToDeposit,
        initialNonce,
      ];
      expect(initialNonce).to.equal(0);

      const msgHash = ethers.solidityPackedKeccak256(paramsTypes, originParams);
      const signedMsgHash = await owner.signMessage(ethers.getBytes(msgHash));

      // mock bridge role to access relayer function
      await storage.updateOperator("bridge", owner.address);
      const blockNumber = await ethers.provider.getBlockNumber();

      await relayer
        .connect(owner)
        .createOperation(...originParams, signedMsgHash);

      const operation = await relayer.getDetailedOriginOperation(msgHash);
      //   console.log(operation);
      expect(operation[0][0]).to.equal(owner.address);
      expect(operation[0][1]).to.equal(owner.address);
      expect(operation[0][2]).to.equal(31337n);
      expect(operation[0][3]).to.equal(441n);
      expect(operation[0][4]).to.equal("ethereum");
      expect(operation[0][5]).to.equal(mocked.amountToDeposit);
      expect(operation[0][6].toString()).to.equal(initialNonce.toString());
      expect(operation[0][7].toString()).to.equal(signedMsgHash);
      expect(operation[1]).to.equal(1n); // status step 1
      expect(operation[2][0].toString()).to.equal((blockNumber + 1).toString());
      expect(operation[2][1]).to.equal(0n);
      expect(operation[2][2]).to.equal(0n);
    });
    it("Should add current operation to the list of user operation in progress", async function () {
      const { storage, bridge, relayer, owner } = await loadFixture(
        fixtures.deployAllContracts
      );
      const initialNonce = await bridge.getNewUserNonce(owner.address);
      const originParams = [
        owner.address,
        owner.address,
        31337,
        441,
        "ethereum",
        mocked.amountToDeposit,
        initialNonce,
      ];
      expect(initialNonce).to.equal(0);

      const msgHash = ethers.solidityPackedKeccak256(paramsTypes, originParams);
      const signedMsgHash = await owner.signMessage(ethers.getBytes(msgHash));

      // mock bridge role to access relayer function
      await storage.updateOperator("bridge", owner.address);
      const blockNumber = await ethers.provider.getBlockNumber();

      await relayer
        .connect(owner)
        .createOperation(...originParams, signedMsgHash);

      const operationList = await relayer.getUserOperations(owner);
      //   console.log(operationList);
      expect(operationList.length).to.equal(1);
      expect(operationList[0]).to.equal(msgHash);
    });
  });
  describe("receiveFeesLockConfirmation function", function () {
    it("Should revert if NON bridge tries to call", async function () {
      const { bridge, relayer, owner, otherAccount } = await loadFixture(
        fixtures.deployAllContracts
      );
      const initialNonce = await bridge.getNewUserNonce(owner.address);
      const originParams = [
        owner.address,
        owner.address,
        31337,
        441,
        "ethereum",
        mocked.amountToDeposit,
        initialNonce,
      ];

      const msgHash = ethers.solidityPackedKeccak256(paramsTypes, originParams);
      const signedMsgHash = await owner.signMessage(ethers.getBytes(msgHash));
      const blockNumber = await ethers.provider.getBlockNumber();
      await expect(
        relayer
          .connect(otherAccount)
          .receiveFeesLockConfirmation(
            msgHash,
            [...originParams, signedMsgHash],
            blockNumber
          )
      )
        .to.be.revertedWithCustomError(relayer, "RelayerBase__CallerHasNotRole")
        .withArgs("oracle");
    });
    it("Should revert if operation status is not ORG_OP_CREATED (1)", async function () {
      const { bridge, relayer, owner, otherAccount } = await loadFixture(
        fixtures.deployAllContracts
      );
      const initialNonce = await bridge.getNewUserNonce(owner.address);
      const originParams = [
        owner.address,
        owner.address,
        31337,
        441,
        "ethereum",
        mocked.amountToDeposit,
        initialNonce,
      ];

      const msgHash = ethers.solidityPackedKeccak256(paramsTypes, originParams);
      const signedMsgHash = await owner.signMessage(ethers.getBytes(msgHash));
      const blockNumber = await ethers.provider.getBlockNumber();
      await expect(
        relayer
          .connect(owner)
          .receiveFeesLockConfirmation(
            msgHash,
            [...originParams, signedMsgHash],
            blockNumber
          )
      ).to.be.revertedWithCustomError(
        relayer,
        "RelayerBase__InvalidOperationStatus"
      );
    });
    it("Should set operation status is not ORG_FEES_LOCKED (4)", async function () {
      const { storage, bridge, relayer, owner, otherAccount } =
        await loadFixture(fixtures.deployAllContracts);
      const initialNonce = await bridge.getNewUserNonce(owner.address);
      const originParams = [
        owner.address,
        owner.address,
        31337,
        441,
        "ethereum",
        mocked.amountToDeposit,
        initialNonce,
      ];

      const msgHash = ethers.solidityPackedKeccak256(paramsTypes, originParams);
      const signedMsgHash = await owner.signMessage(ethers.getBytes(msgHash));
      const blockNumber = await ethers.provider.getBlockNumber();
      // mock bridge role to access relayer function
      await storage.updateOperator("bridge", owner.address);
      let tx = await relayer
        .connect(owner)
        .createOperation(...originParams, signedMsgHash);
      tx.wait();
      expect(await ethers.provider.getBlockNumber()).to.equal(blockNumber + 2);
      tx = await relayer
        .connect(owner)
        .receiveFeesLockConfirmation(
          msgHash,
          [...originParams, signedMsgHash],
          blockNumber + 2
        );
      tx.wait();

      const status = await relayer.getOriginOperationStatus(msgHash);
      expect(status).to.equal(4n);
    });
  });
});
