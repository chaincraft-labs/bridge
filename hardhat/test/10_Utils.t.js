const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

// describe.only("Utils", function () {
describe("Utils", function () {
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
    // message without prefix
    console.log("TEST MESSAGE WITHOUT PREFIX-------------------");
    const msgHashRef = ethers.solidityPackedKeccak256(types, params);
    const msgHashCompute = await Utils.getMessageHash(...params);
    console.log("Utils::getMessageHash::msgHashCompute", msgHashCompute);
    console.log("Utils::getMessageHash::msgHashRef", msgHashRef);
    expect(msgHashCompute).to.equal(msgHashRef);

    const signature = await user.signMessage(msgHashCompute);
    console.log("Utils::signMessage::signature", signature);
    const signer = await ethers.verifyMessage(msgHashCompute, signature);
    console.log("---ethers methods---");
    console.log("==>Utils::verifyMessage::signer", signer);
    console.log("==>Utils::verifyMessage::userAddress", user.address);
    console.log("Utils::verifyMessage::address this", await Utils.getAddress());
    console.log("Utils::verifyMessage::address owner %s \n", owner.address);

    expect(signer).to.equal(user.address);

    const utilsSigner = await Utils.recoverSigner(msgHashCompute, signature);
    console.log("---contract methods---");
    console.log("==>Utils::recoverSigner::utilsSigner %s \n", utilsSigner);
    // expect(utilsSigner).to.equal(user.address);

    console.log("TEST MESSAGE WITH PREFIX-------------------");
    const pmsgHashRef = ethers.solidityPackedKeccak256(
      ["string", "bytes32"],
      ["\x19Ethereum Signed Message:\n32", msgHashRef]
    );
    const pmsgHashCompute = await Utils.getPrefixedMessageHash(...params);
    console.log(
      "Utils::getPrefixedMessageHash::pmsgHashCompute",
      pmsgHashCompute
    );
    console.log("Utils::getPrefixedMessageHash::pmsgHashRef", pmsgHashRef);
    expect(pmsgHashCompute).to.equal(pmsgHashRef);

    const psignature = await user.signMessage(pmsgHashCompute);
    console.log("Utils::signMessage::signature", psignature);
    const psigner = await ethers.verifyMessage(pmsgHashCompute, psignature);
    console.log("---ethers methods---");
    console.log("==>Utils::verifyMessage::signer", psigner);
    console.log("==>Utils::verifyMessage::userAddress %s \n", user.address);
    expect(psigner).to.equal(user.address);

    const putilsSigner = await Utils.recoverSigner(pmsgHashCompute, psignature);
    console.log("---contract methods---");
    console.log("==>Utils::recoverSigner::putilsSigner %s \n", putilsSigner);
    // expect(putilsSigner).to.equal(user.address);

    const psignature2 = await user.signMessage(msgHashCompute);
    console.log("Utils::signMessage::signature", psignature2);
    const putilsSigner2 = await Utils.recoverSigner(
      pmsgHashCompute,
      psignature2
    );
    console.log("---contract methods---");
    console.log("==>Utils::recoverSigner::putilsSigner %s \n", putilsSigner2);
    // expect(putilsSigner2).to.equal(user.address);

    // STEP SMC METHOD
    const messageHash = await Utils.getMessageHash(...params);
    console.log("Utils / SMC / Message Hash", messageHash);
    const signedMessage = await user.signMessage(messageHash);
    console.log("Utils / SMC / Signed Message", signedMessage);

    const ethsignedMessage = await Utils.getPrefixedMessageHash(...params);
    console.log("Utils / SMC / ETH Signed Message", ethsignedMessage);
    const smcSigner = await Utils.recoverSigner(
      ethsignedMessage,
      signedMessage
    );
    console.log("---contract methods---");
    console.log("==>Utils / SMC /  Signer %s \n", smcSigner);
    //   expect(smcSigner).to.equal(user.address);

    // STEP SMC METHOD2 BONNE METHODE
    // 1. get the keccak256 hash of the message
    const msgHashed = await Utils.getMessageHash(
      params[0],
      params[1],
      params[2],
      params[3],
      params[4],
      params[5],
      params[6]
    );
    console.log("Utils / SMC / Message Hash", msgHashed);
    // 2. get the keccak256 hash of the msg hash with prefix
    const prefixedMsgHashed = await Utils.prefixed(msgHashed);
    console.log("Utils / SMC / Prefixed Message Hash", prefixedMsgHashed);
    // 3. sign the message hash (not prefixed) as array of uint8
    // cause by defaut signMessage take a string and treat it as a string
    // by converting to UTF-8 bytes
    // msg is treated as binary data ONLY if msg is Bytes type
    // here retunr hash msg is a string so we need to convert it to bytes (uint8 array)
    const signedMsgHased = await user.signMessage(ethers.getBytes(msgHashed));
    // the signature is a 65 bytes array. SignMessage prefix the msg with \x19Ethereum Signed Message:\n32
    console.log("Utils / SMC / Signed Message", signedMsgHased);
    // 4. recover the signer from the signed message and the message hash with prefix
    const recoveredSigner = await Utils.recoverSigner(
      prefixedMsgHashed,
      signedMsgHased
    );
    console.log("---contract methods---");
    console.log("==>Utils / SMC /  Signer %s \n", recoveredSigner);
    expect(recoveredSigner).to.equal(user.address);
  });
});
