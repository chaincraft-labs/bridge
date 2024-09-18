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
  it("Should authorized name for chainId", async function () {
    const { storage, owner, otherAccount } = await loadFixture(
      deployStorageFixture
    );
    await storage.addToAuthorizedTokenNamesListByChainId("DAI token", 441);

    expect(await storage.getAuthorizedTokenNamesListByChainId(441)).to.include(
      "DAI token"
    );
  });

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
    tx = await storage.setTokenAddressByChainId(
      "DAI token",
      441,
      fakeAddress20bytes
    );
    tx.wait();
    expect(await storage.getTokenAddressByChainId("DAI token", 441)).to.equal(
      fakeAddress20bytes
    );
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
    tx = await storage.addChainIdToList(31337);
    // tx.wait();
    const fakeAddress20bytes = "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1";
    tx = await storage.setTokenAddressByChainId(
      "DAI token",
      441,
      fakeAddress20bytes
    );
    tx.wait();
    tx = await storage.setTokenAddressByChainId(
      "DAI token",
      31337,
      fakeAddress20bytes
    );
    tx.wait();

    const [add1, add2] = await storage.getTokenAddressesBychainIds(
      "DAI token",
      441,
      31337
    );
    console.log("add1", add1);
    console.log("add2", add2);

    expect(add1).to.equal(fakeAddress20bytes);
    expect(add2).to.equal(fakeAddress20bytes);
  });
});
