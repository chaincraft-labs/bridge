const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("Storage", function () {
  // deployment fixture :
  async function deployStorageFixture() {
    const [owner, otherAccount] = await ethers.getSigners();
    const storage = await hre.ethers.deployContract("Storage", ["ethereum"]);
    await storage.waitForDeployment();
    console.log("Storage deployed to:", storage.target);
    return { storage, owner, otherAccount };
  }

  it("should store the admin at deployment", async function () {
    const { storage, owner, otherAccount } = await loadFixture(
      deployStorageFixture
    );
    expect(await storage.getOperator("admin")).to.equal(owner.address);
  });

  it("Should add a new operator", async function () {
    const { storage, owner, otherAccount } = await loadFixture(
      deployStorageFixture
    );
    await storage.updateOperator("vault", otherAccount.address);
    expect(await storage.getOperator("vault")).to.equal(otherAccount.address);
  });
  it("Should add new token name to list", async function () {
    const { storage, owner, otherAccount } = await loadFixture(
      deployStorageFixture
    );
    await storage.addTokenNameToList("DAI token");
    expect(await storage.getTokenNamesList()).to.include("DAI token");
  });
  it("Should add new chain to list", async function () {
    const { storage, owner, otherAccount } = await loadFixture(
      deployStorageFixture
    );
    await storage.addChainIdToList(441);
    expect(await storage.getChainIdsList()).to.include(441n);
  });
  // it("Should authorized name for chainId", async function () {
  //   const { storage, owner, otherAccount } = await loadFixture(
  //     deployStorageFixture
  //   );
  //   await storage.addToAuthorizedTokenNamesListByChainId("DAI token", 441);

  //   expect(await storage.getAuthorizedTokenNamesListByChainId(441)).to.include(
  //     "DAI token"
  //   );
  // });

  // @todo => symbol will change to name
  // data fetched will be packed => name-address
  it("Should set new token address", async function () {
    const { storage, owner, otherAccount } = await loadFixture(
      deployStorageFixture
    );
    let tx = await storage.addTokenNameToList("DAI token");
    // tx.wait();
    tx = await storage.addChainIdToList(441);
    // tx.wait();
    const fakeAddress20bytes = "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1";
    tx = await storage.addNewTokenAddressByChainId(
      "DAI token",
      441,
      fakeAddress20bytes
    );
    tx.wait();
    expect(await storage.getTokenAddressByChainId("DAI token", 441)).to.equal(
      fakeAddress20bytes
    );
  });

  it("Should revert adding new address address if token exists", async function () {
    const { storage, owner, otherAccount } = await loadFixture(
      deployStorageFixture
    );
    let tx = await storage.addTokenNameToList("DAI token");
    // tx.wait();
    tx = await storage.addChainIdToList(441);
    // tx.wait();
    const fakeAddress20bytes = "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1";
    tx = await storage.addNewTokenAddressByChainId(
      "DAI token",
      441,
      fakeAddress20bytes
    );
    tx.wait();
    const fakeAddress20bytes2 = "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF";
    await expect(
      storage.addNewTokenAddressByChainId("DAI token", 441, fakeAddress20bytes2)
    ).to.be.revertedWithCustomError(storage, "Storage__TokenAddressAlreadySet");
  });

  it("Should update token address", async function () {
    const { storage, owner, otherAccount } = await loadFixture(
      deployStorageFixture
    );
    let tx = await storage.addTokenNameToList("DAI token");
    // tx.wait();
    tx = await storage.addChainIdToList(441);
    // tx.wait();
    const fakeAddress20bytes = "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1";
    tx = await storage.addNewTokenAddressByChainId(
      "DAI token",
      441,
      fakeAddress20bytes
    );
    tx.wait();
    expect(await storage.getTokenAddressByChainId("DAI token", 441)).to.equal(
      fakeAddress20bytes
    );
    const fakeAddress20bytes2 = "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF";
    tx = await storage.updateTokenAddressByChainId(
      "DAI token",
      441,
      fakeAddress20bytes2
    );
    tx.wait();
    expect(await storage.getTokenAddressByChainId("DAI token", 441)).to.equal(
      fakeAddress20bytes2
    );
  });

  it("Should revert updating address if token does not exist", async function () {
    const { storage, owner, otherAccount } = await loadFixture(
      deployStorageFixture
    );
    let tx = await storage.addTokenNameToList("DAI token");
    // tx.wait();
    tx = await storage.addChainIdToList(441);
    // tx.wait();
    const fakeAddress20bytes = "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1";

    await expect(
      storage.updateTokenAddressByChainId("DAI token", 441, fakeAddress20bytes)
    )
      .to.be.revertedWithCustomError(storage, "Storage__TokenAddressNotSet")
      .withArgs("DAI token", 441);
  });

  it("Should set new tokens addresses", async function () {
    const { storage, owner, otherAccount } = await loadFixture(
      deployStorageFixture
    );
    let tx = await storage.addTokenNameToList("DAI token");
    // tx.wait();
    tx = await storage.addChainIdToList(441);
    //    tx = await storage.addTokenNameToList("bDAI token");
    // tx.wait();
    tx = await storage.addChainIdToList(11155111);
    // tx.wait();
    const fakeAddress20bytes = "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1";
    tx = await storage.batchAddNewTokensAddressesByChainId(
      ["DAI token", "DAI token"],
      [441, 11155111],
      [fakeAddress20bytes, fakeAddress20bytes]
    );
    tx.wait();

    const [add1, add2] = await storage.getTokenAddressesByChainIds(
      "DAI token",
      441,
      11155111
    );
    console.log("add1", add1);
    console.log("add2", add2);

    expect(add1).to.equal(fakeAddress20bytes);
    expect(add2).to.equal(fakeAddress20bytes);
  });
});
