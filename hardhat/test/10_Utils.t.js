const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe.only("Utils", function () {
  const zeroAddress = "0x" + "0".repeat(40);
  const toChecksum = (address) => {
    return ethers.getAddress(address);
  };
  const maxAddress20bytes = "0x" + "f".repeat(40);
  const maxAddress = toChecksum(maxAddress20bytes);
  const getRandomAddress = () => {
    return ethers.utils.getAddress(
      ethers.utils.hexlify(ethers.utils.randomBytes(20))
    );
  };

  async function deployContract() {
    const [owner, user] = await ethers.getSigners();

    const Utils = await hre.ethers.deployContract("Utils");
    await Utils.waitForDeployment();
    return { Utils, owner, user };
  }

  it("should return the correct address", async function () {
    const { Utils } = await deployContract();
    expect(await Utils.getAddress()).to.equal(Utils.target);
  });

  it("Should sign a message", async function () {
    const { Utils, owner, user } = await deployContract();
    const types = [
      "address",
      "address",
      "uint",
      "uint",
      "string",
      "uint",
      "uint",
    ];
    const params = [
      owner.address,
      user.address,
      31337,
      441,
      "testToken",
      1_000_000_000_000_000_000n,
      1,
    ];
    const msgHashRef = ethers.solidityPackedKeccak256(types, params);
    const msgHashCompute = await Utils.getMessageToSign(...params);
    console.log("Utils::getMessageToSign::msgHashCompute", msgHashCompute);
    console.log("Utils::getMessageToSign::msgHashRef", msgHashRef);
    expect(msgHashCompute).to.equal(msgHashRef);

    const pmsgHashRef = ethers.solidityPackedKeccak256(
      ["string", "bytes32"],
      ["\x19Ethereum Signed Message:\n32", msgHashRef]
    );
    const pmsgHashCompute = await Utils.getMessageToSignPrefixed(...params);
    console.log(
      "Utils::getMessageToSignPrefixed::pmsgHashCompute",
      pmsgHashCompute
    );
    console.log("Utils::getMessageToSignPrefixed::pmsgHashRef", pmsgHashRef);
    expect(msgHashCompute).to.equal(msgHashRef);

    const signature = await user.signMessage(msgHashCompute);
    console.log("Utils::signMessage::signature", signature);
    const signer = await ethers.verifyMessage(msgHashCompute, signature);
    console.log("Utils::verifyMessage::signer", signer);
    console.log("Utils::verifyMessage::userAddress", user.address);
    expect(signer).to.equal(user.address);

    const utilsSigner = await Utils.recoverSigner(msgHashCompute, signature);
    console.log("Utils::recoverSigner::utilsSigner", utilsSigner);
    expect(utilsSigner).to.equal(user.address);
  });
});
