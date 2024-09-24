const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
const { constants, mocked, fixtures } = require("../helper_fixture");
const {
  getRandomAddress,
  getZeroAddress,
  getRandomBytes,
} = require("../../utils/util");

describe("Storage", function () {
  describe("Storage deployment", function () {
    it("should store the admin at deployment", async function () {
      const { storage, owner } = await loadFixture(fixtures.deployStorage);
      expect(await storage.getOperator("admin")).to.equal(owner.address);
    });

    it("should have a default value for a non init key->address", async function () {
      const { storage } = await loadFixture(fixtures.deployStorage);
      const key = await storage["getKey(string)"]("test");
      const result = await storage.getAddr(key);
      expect(result).to.equal(getZeroAddress());
    });
    it("should have a default value for a non init key->uint", async function () {
      const { storage } = await loadFixture(fixtures.deployStorage);
      const key = await storage["getKey(string)"]("test");
      const result = await storage.getUint(key);
      expect(result).to.equal(0);
    });
  });

  describe("Access - only admin", function () {
    it("should revert if NON admin tries to call setAddress", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(
        storage
          .connect(otherAccount)
          .setAddress(getRandomBytes(), otherAccount.address)
      ).to.be.revertedWithCustomError(storage, "Storage__NotAdmin");
    });

    it("should revert if NON admin tries to call setUint", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(
        storage.connect(otherAccount).setUint(getRandomBytes(), 0)
      ).to.be.revertedWithCustomError(storage, "Storage__NotAdmin");
    });

    it("should revert if NON admin tries to call setBool", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(
        storage.connect(otherAccount).setBool(getRandomBytes(), false)
      ).to.be.revertedWithCustomError(storage, "Storage__NotAdmin");
    });
    it("should revert if NON admin tries to call setString", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(
        storage.connect(otherAccount).setString(getRandomBytes(), "test")
      ).to.be.revertedWithCustomError(storage, "Storage__NotAdmin");
    });

    it("should revert if NON admin tries to call setBytes", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(
        storage
          .connect(otherAccount)
          .setBytes(getRandomBytes(), getRandomBytes(20))
      ).to.be.revertedWithCustomError(storage, "Storage__NotAdmin");
    });

    it("should revert if NON admin tries to call setBytes32", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(
        storage
          .connect(otherAccount)
          .setBytes32(getRandomBytes(), getRandomBytes(32))
      ).to.be.revertedWithCustomError(storage, "Storage__NotAdmin");
    });

    it("should revert if NON admin tries to call setUintArray", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(
        storage.connect(otherAccount).setUintArray(getRandomBytes(), [0])
      ).to.be.revertedWithCustomError(storage, "Storage__NotAdmin");
    });

    it("should revert if NON admin tries to call setAddressArray", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(
        storage
          .connect(otherAccount)
          .setAddressArray(getRandomBytes(), [otherAccount.address])
      ).to.be.revertedWithCustomError(storage, "Storage__NotAdmin");
    });

    it("should revert if NON admin tries to call setStringArray", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(
        storage.connect(otherAccount).setStringArray(getRandomBytes(), ["test"])
      ).to.be.revertedWithCustomError(storage, "Storage__NotAdmin");
    });

    it("should revert if NON admin tries to call addToUintArray", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(
        storage.connect(otherAccount).addToUintArray(getRandomBytes(), 0)
      ).to.be.revertedWithCustomError(storage, "Storage__NotAdmin");
    });

    it("should revert if NON admin tries to call addToAddressArray", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(
        storage
          .connect(otherAccount)
          .addToAddressArray(getRandomBytes(), otherAccount.address)
      ).to.be.revertedWithCustomError(storage, "Storage__NotAdmin");
    });

    it("should revert if NON admin tries to call addToStringArray", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(
        storage.connect(otherAccount).addToStringArray(getRandomBytes(), "test")
      ).to.be.revertedWithCustomError(storage, "Storage__NotAdmin");
    });

    it("should revert if NON admin tries to call updateUintArray", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await storage.addToUintArray(getRandomBytes(), 0);
      await expect(
        storage.connect(otherAccount).updateUintArray(getRandomBytes(), 0, 0)
      ).to.be.revertedWithCustomError(storage, "Storage__NotAdmin");
    });

    it("should revert if NON admin tries to call updateAddressArray", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await storage.addToAddressArray(getRandomBytes(), otherAccount.address);
      await expect(
        storage
          .connect(otherAccount)
          .updateAddressArray(getRandomBytes(), 0, otherAccount.address)
      ).to.be.revertedWithCustomError(storage, "Storage__NotAdmin");
    });

    it("should revert if NON admin tries to call updateStringArray", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await storage.addToStringArray(getRandomBytes(), "test");
      await expect(
        storage
          .connect(otherAccount)
          .updateStringArray(getRandomBytes(), 0, "test")
      ).to.be.revertedWithCustomError(storage, "Storage__NotAdmin");
    });

    it("should revert if NON admin tries to call updateOperator", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(
        storage
          .connect(otherAccount)
          .updateOperator("vault", otherAccount.address)
      ).to.be.revertedWithCustomError(storage, "Storage__NotAdmin");
    });

    it("should revert if NON admin tries to call batchUpdateOperators", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(
        storage
          .connect(otherAccount)
          .batchUpdateOperators(["vault"], [otherAccount.address])
      ).to.be.revertedWithCustomError(storage, "Storage__NotAdmin");
    });

    it("should revert if NON admin tries to call addTokenNameToList", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(storage.connect(otherAccount).addTokenNameToList("test")).to
        .be.reverted;
    });

    it("should revert if NON admin tries to call addChainIdToList", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(storage.connect(otherAccount).addChainIdToList(1)).to.be
        .reverted;
    });

    it("should revert if NON admin tries to call batchAddTokenNamesToList", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(
        storage.connect(otherAccount).batchAddTokenNamesToList(["test"])
      ).to.be.reverted;
    });

    it("should revert if NON admin tries to call addChainIdToList", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(storage.connect(otherAccount).addChainIdToList(1)).to.be
        .reverted;
    });

    it("should revert if NON admin tries to call batchAddChainIdsToList", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(storage.connect(otherAccount).batchAddChainIdsToList([1])).to
        .be.reverted;
    });

    it("should revert if NON admin tries to call addNewTokenAddressByChainId", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(
        storage
          .connect(otherAccount)
          .addNewTokenAddressByChainId("test", 1, getRandomAddress())
      ).to.be.reverted;
    });

    it("should revert if NON admin tries to call updateTokenAddressByChainId", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(
        storage
          .connect(otherAccount)
          .updateTokenAddressByChainId("test", 1, getRandomAddress())
      ).to.be.reverted;
    });

    it("should revert if NON admin tries to call batchAddNewTokensAddressesByChainId", async function () {
      const { storage, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await expect(
        storage
          .connect(otherAccount)
          .batchAddNewTokensAddressesByChainId(
            ["test"],
            [1],
            [getRandomAddress()]
          )
      ).to.be.reverted;
    });
  });

  describe("Key generator", function () {
    it("should generate a key from a string", async function () {
      const { storage } = await loadFixture(fixtures.deployStorage);
      const key = await storage.getKey("test");

      const ethersKey = ethers.solidityPackedKeccak256(["string"], ["test"]);

      expect(key).to.equal(ethersKey);
    });

    it("should generate a key from a string & an address", async function () {
      const { storage } = await loadFixture(fixtures.deployStorage);
      const preparedAddress = getRandomAddress();

      const key = await storage["getKey(string,address)"](
        "test",
        preparedAddress
      );

      const ethersKey = ethers.solidityPackedKeccak256(
        ["string", "address"],
        ["test", preparedAddress]
      );

      expect(key).to.equal(ethersKey);
    });

    it("should generate a key from a string & a number", async function () {
      const { storage } = await loadFixture(fixtures.deployStorage);
      const preparedNumber = 1;

      const key = await storage["getKey(string,uint256)"](
        "test",
        preparedNumber
      );

      const ethersKey = ethers.solidityPackedKeccak256(
        ["string", "uint"],
        ["test", preparedNumber]
      );

      expect(key).to.equal(ethersKey);
    });
  });

  // @todo => add basic setters tests
  describe("Basic setters", function () {
    it("should set a new address", async function () {
      const { storage, owner } = await loadFixture(fixtures.deployStorage);
      const preparedAddress = getRandomAddress();
      const preparedKey = ethers.solidityPackedKeccak256(
        ["string"],
        ["testKey"]
      );

      // THIS CAUSE CONFLICT with ethers 'getAddress()'
      // const result = await storage.getAddress(preparedKey);
      const resultBeforeSet = await storage.getAddr(
        ethers.getBytes(preparedKey)
      );
      expect(resultBeforeSet).to.equal(getZeroAddress());

      const tx = await storage.setAddress(preparedKey, preparedAddress);
      tx.wait();
      const resultAfterSet = await storage.getAddr(preparedKey);

      expect(resultAfterSet).to.equal(preparedAddress);
    });

    it("should emit DataChanged event when setting a new address", async function () {
      const { storage, owner } = await loadFixture(fixtures.deployStorage);
      const preparedAddress = getRandomAddress();
      const preparedKey = getRandomBytes();
      await expect(
        storage.connect(owner).setAddress(preparedKey, preparedAddress)
      )
        .to.emit(storage, "Storage__AddressDataChanged")
        .withArgs(preparedKey, preparedAddress);
    });

    it("should set a new uint", async function () {
      const { storage, owner } = await loadFixture(fixtures.deployStorage);
      const preparedUint = 1;
      const preparedKey = getRandomBytes();
      const prevState = await storage.getUint(preparedKey);
      expect(prevState).to.equal(0);
      await storage.connect(owner).setUint(preparedKey, preparedUint);
      const result = await storage.getUint(preparedKey);
      expect(result).to.equal(preparedUint);
    });

    it("should emit DataChanged event when setting a new uint", async function () {
      const { storage, owner } = await loadFixture(fixtures.deployStorage);
      const preparedUint = 1;
      const preparedKey = getRandomBytes();
      await expect(storage.connect(owner).setUint(preparedKey, preparedUint))
        .to.emit(storage, "Storage__UintDataChanged")
        .withArgs(preparedKey, preparedUint);
    });
  });

  // @todo => add basic getters tests

  describe("Operator/Role management", function () {
    it("should add a new operator", async function () {
      const { storage, owner, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      await storage.updateOperator("vault", otherAccount.address);
      expect(await storage.getOperator("vault")).to.equal(otherAccount.address);
    });

    // @todo => complete operator tests
  });

  describe("Authorized token name & chain id lists", function () {
    it("should add new token name to list", async function () {
      const { storage } = await loadFixture(fixtures.deployStorage);
      await storage.addTokenNameToList(mocked.mockedTokenName);
      expect(await storage.getTokenNamesList()).to.include(
        mocked.mockedTokenName
      );
    });

    // @todo => complete token name tests

    it("should add new chain to list to authorize it", async function () {
      const { storage } = await loadFixture(fixtures.deployStorage);
      await storage.addChainIdToList(constants.aftChainId);
      expect(await storage.getChainIdsList()).to.include(
        BigInt(constants.aftChainId)
      );
    });

    // @todo => complete chainId tests
  });

  describe("Token address management", function () {
    it("should get the token address of the native token", async function () {
      const { storage } = await loadFixture(fixtures.deployStorage);
      expect(
        await storage.getTokenAddressByChainId(
          constants.ethNativeTokenName,
          constants.hhChainId
        )
      ).to.equal(constants.nativeTokenAddress);
    });

    it("should set new token address", async function () {
      const { storage } = await loadFixture(fixtures.deployStorage);
      let tx = await storage.addTokenNameToList(mocked.mockedTokenName);
      await tx.wait();
      tx = await storage.addChainIdToList(constants.aftChainId);
      await tx.wait();
      tx = await storage.addNewTokenAddressByChainId(
        mocked.mockedTokenName,
        constants.aftChainId,
        mocked.mockedTokenAddress
      );
      await tx.wait();
      expect(
        await storage.getTokenAddressByChainId(
          mocked.mockedTokenName,
          BigInt(constants.aftChainId)
        )
      ).to.equal(mocked.mockedTokenAddress);
    });

    it("should revert adding new address address if token exists", async function () {
      const { storage } = await loadFixture(fixtures.deployStorage);
      const preparedTokenAddress = getRandomAddress();

      let tx = await storage.addTokenNameToList(mocked.mockedTokenName);
      await tx.wait();
      tx = await storage.addChainIdToList(BigInt(constants.aftChainId));
      await tx.wait();
      tx = await storage.addNewTokenAddressByChainId(
        mocked.mockedTokenName,
        constants.aftChainId,
        mocked.mockedTokenAddress
      );
      await tx.wait();

      expect(mocked.mockedTokenAddress).to.not.equal(preparedTokenAddress);
      await expect(
        storage.addNewTokenAddressByChainId(
          mocked.mockedTokenName,
          constants.aftChainId,
          preparedTokenAddress
        )
      ).to.be.revertedWithCustomError(
        storage,
        "Storage__TokenAddressAlreadySet"
      );
    });

    it("should update token address", async function () {
      const { storage } = await loadFixture(fixtures.deployStorage);
      const preparedTokenAddress = getRandomAddress();

      let tx = await storage.addTokenNameToList(mocked.mockedTokenName);
      await tx.wait();
      tx = await storage.addChainIdToList(constants.aftChainId);
      await tx.wait();
      tx = await storage.addNewTokenAddressByChainId(
        mocked.mockedTokenName,
        constants.aftChainId,
        mocked.mockedTokenAddress
      );
      tx.wait();

      expect(mocked.mockedTokenAddress).to.not.equal(preparedTokenAddress);
      expect(
        await storage.getTokenAddressByChainId(
          mocked.mockedTokenName,
          constants.aftChainId
        )
      ).to.equal(mocked.mockedTokenAddress);

      tx = await storage.updateTokenAddressByChainId(
        mocked.mockedTokenName,
        constants.aftChainId,
        preparedTokenAddress
      );
      tx.wait();
      expect(
        await storage.getTokenAddressByChainId(
          mocked.mockedTokenName,
          constants.aftChainId
        )
      ).to.equal(preparedTokenAddress);
    });

    it("should revert updating address if token does not exist", async function () {
      const { storage, owner, otherAccount } = await loadFixture(
        fixtures.deployStorage
      );
      const preparedTokenAddress = getRandomAddress();

      let tx = await storage.addTokenNameToList(mocked.mockedTokenName);
      await tx.wait();
      tx = await storage.addChainIdToList(constants.aftChainId);
      await tx.wait();

      await expect(
        storage.updateTokenAddressByChainId(
          mocked.mockedTokenName,
          constants.aftChainId,
          mocked.mockedTokenAddress
        )
      )
        .to.be.revertedWithCustomError(storage, "Storage__TokenAddressNotSet")
        .withArgs(mocked.mockedTokenName, constants.aftChainId);
    });

    it("should set new tokens addresses", async function () {
      const { storage } = await loadFixture(fixtures.deployStorage);
      const mockedTokenAddress2 = getRandomAddress();

      let tx = await storage.addTokenNameToList(mocked.mockedTokenName);
      await tx.wait();
      tx = await storage.addChainIdToList(constants.aftChainId);
      await tx.wait();
      tx = await storage.addChainIdToList(constants.sepoliaChainId);
      await tx.wait();
      tx = await storage.batchAddNewTokensAddressesByChainId(
        [mocked.mockedTokenName, mocked.mockedTokenName],
        [constants.aftChainId, constants.sepoliaChainId],
        [mocked.mockedTokenAddress, mockedTokenAddress2]
      );
      tx.wait();

      const add1 = await storage.getTokenAddressByChainId(
        mocked.mockedTokenName,
        constants.aftChainId
      );
      const add2 = await storage.getTokenAddressByChainId(
        mocked.mockedTokenName,
        constants.sepoliaChainId
      );

      expect(add1).to.equal(mocked.mockedTokenAddress);
      expect(add2).to.equal(mockedTokenAddress2);
    });

    it("should revert setting new tokens addresses if arrays length mismatch", async function () {
      const { storage } = await loadFixture(fixtures.deployStorage);

      let tx = await storage.addTokenNameToList(mocked.mockedTokenName);
      await tx.wait();
      tx = await storage.addChainIdToList(constants.aftChainId);
      await tx.wait();
      tx = await storage.addChainIdToList(constants.sepoliaChainId);
      await tx.wait();

      await expect(
        storage.batchAddNewTokensAddressesByChainId(
          [mocked.mockedTokenName, mocked.mockedTokenName],
          [constants.aftChainId, constants.sepoliaChainId],
          [mocked.mockedTokenAddress]
        )
      ).to.be.revertedWithCustomError(
        storage,
        "Storage__InvalidArrayLengthInParams"
      );
    });

    it("should revert setting new tokens addresses if token already exists", async function () {
      const { storage } = await loadFixture(fixtures.deployStorage);
      const mockedTokenAddress2 = getRandomAddress();

      let tx = await storage.addTokenNameToList(mocked.mockedTokenName);
      await tx.wait();
      tx = await storage.addChainIdToList(constants.aftChainId);
      await tx.wait();
      tx = await storage.addChainIdToList(constants.sepoliaChainId);
      await tx.wait();
      tx = await storage.addNewTokenAddressByChainId(
        mocked.mockedTokenName,
        constants.aftChainId,
        mocked.mockedTokenAddress
      );
      tx.wait();

      await expect(
        storage.batchAddNewTokensAddressesByChainId(
          [mocked.mockedTokenName, mocked.mockedTokenName],
          [constants.aftChainId, constants.sepoliaChainId],
          [mocked.mockedTokenAddress, mockedTokenAddress2]
        )
      ).to.be.revertedWithCustomError(
        storage,
        "Storage__TokenAddressAlreadySet"
      );
    });

    it("should revert setting new tokens addresses if chainId is not authorized", async function () {
      const { storage } = await loadFixture(fixtures.deployStorage);
      const mockedTokenAddress2 = getRandomAddress();

      let tx = await storage.addTokenNameToList(mocked.mockedTokenName);
      await tx.wait();
      tx = await storage.addChainIdToList(constants.aftChainId);
      await tx.wait();

      await expect(
        storage.batchAddNewTokensAddressesByChainId(
          [mocked.mockedTokenName, mocked.mockedTokenName],
          [constants.aftChainId, constants.sepoliaChainId],
          [mocked.mockedTokenAddress, mockedTokenAddress2]
        )
      ).to.be.revertedWithCustomError(storage, "Storage__ChainIdNotInList");
    });
    it("should revert setting new tokens addresses if token name is not authorized", async function () {
      const { storage } = await loadFixture(fixtures.deployStorage);
      const mockedTokenAddress2 = getRandomAddress();

      let tx = await storage.addTokenNameToList(mocked.mockedTokenName);
      await tx.wait();
      tx = await storage.addChainIdToList(constants.aftChainId);
      await tx.wait();

      await expect(
        storage.batchAddNewTokensAddressesByChainId(
          [mocked.mockedTokenName, "Unknown token"],
          [constants.aftChainId, constants.sepoliaChainId],
          [mocked.mockedTokenAddress, mockedTokenAddress2]
        )
      ).to.be.revertedWithCustomError(storage, "Storage__TokenNotInList");
    });

    it("should get token addresses by chainIds", async function () {
      const { storage } = await loadFixture(fixtures.deployStorage);
      const mockedTokenAddress2 = getRandomAddress();

      let tx = await storage.addTokenNameToList(mocked.mockedTokenName);
      await tx.wait();
      tx = await storage.addChainIdToList(constants.aftChainId);
      await tx.wait();
      tx = await storage.addChainIdToList(constants.sepoliaChainId);
      await tx.wait();
      tx = await storage.batchAddNewTokensAddressesByChainId(
        [mocked.mockedTokenName, mocked.mockedTokenName],
        [constants.aftChainId, constants.sepoliaChainId],
        [mocked.mockedTokenAddress, mockedTokenAddress2]
      );
      tx.wait();

      const [add1, add2] = await storage.getTokenAddressesByChainIds(
        mocked.mockedTokenName,
        constants.aftChainId,
        constants.sepoliaChainId
      );

      expect(add1).to.equal(mocked.mockedTokenAddress);
      expect(add2).to.equal(mockedTokenAddress2);
    });
  });
});
