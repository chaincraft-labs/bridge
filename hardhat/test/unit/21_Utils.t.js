const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
const { fixtures } = require("../helper_fixture");

// describe.only("Utils", function () {
describe("Utils", function () {
  const mockedTypes = [
    "address",
    "address",
    "uint",
    "uint",
    "string",
    "uint",
    "uint",
  ];
  const mockedParams = [
    // owner.address,
    // user.address,
    31337,
    441,
    "testToken",
    1_000_000_000_000_000_000n,
    1,
  ];

  const prefixTypes = ["string", "bytes32"];
  const prefix = "\x19Ethereum Signed Message:\n32";

  it("should return the correct address", async function () {
    const { Utils } = await loadFixture(fixtures.deployUtils);
    expect(await Utils.getAddress()).to.equal(Utils.target);
  });

  it("Should get the hash of a message", async function () {
    const { Utils, owner, user } = await loadFixture(fixtures.deployUtils);
    const preparedParams = [owner.address, user.address, ...mockedParams];

    // ethers
    const msgHashRef = ethers.solidityPackedKeccak256(
      mockedTypes,
      preparedParams
    );
    // contract
    const msgHashComputed = await Utils.getMessageHash(...preparedParams);

    expect(msgHashComputed).to.equal(msgHashRef);
  });

  it("Should get the hash of a prefixed message hash", async function () {
    const { Utils, owner, user } = await loadFixture(fixtures.deployUtils);
    const preparedParams = [owner.address, user.address, ...mockedParams];

    // ethers
    // get hash of the message
    const msgHashRef = ethers.solidityPackedKeccak256(
      mockedTypes,
      preparedParams
    );
    // get hash of the prefixed message hash
    const prefixedMsgHashRef = ethers.solidityPackedKeccak256(prefixTypes, [
      prefix,
      msgHashRef,
    ]);

    // contract
    const prefixedMsgHashComputed = await Utils.getPrefixedMessageHash(
      ...preparedParams
    );

    expect(prefixedMsgHashComputed).to.equal(prefixedMsgHashRef);
  });

  it("Should get the hash of a prefixed message hash in two steps", async function () {
    const { Utils, owner, user } = await loadFixture(fixtures.deployUtils);
    const preparedParams = [owner.address, user.address, ...mockedParams];

    // ethers
    const prefixedMsgHashRef = ethers.solidityPackedKeccak256(prefixTypes, [
      prefix,
      ethers.solidityPackedKeccak256(mockedTypes, preparedParams),
    ]);

    // contract
    const msgHashedComputed = await Utils.getMessageHash(...preparedParams);
    const prefixedMsgHashComputed = await Utils.prefixed(msgHashedComputed);

    expect(prefixedMsgHashComputed).to.equal(prefixedMsgHashRef);
  });

  it("Should recover the signer of the original message", async function () {
    const { Utils, owner, user } = await loadFixture(fixtures.deployUtils);
    const preparedParams = [owner.address, user.address, ...mockedParams];

    // 1. Get the keccak256 hash of the message
    const msgHashRef = ethers.solidityPackedKeccak256(
      mockedTypes,
      preparedParams
    );
    // 2. Sign the message hash
    // - by default signMessage take a string and treat it as a string by converting to UTF-8 bytes
    // - msg is treated as binary data ONLY if msg is Bytes type
    // - here return hash msg is a string so we need to convert it to bytes (uint8 array)
    const signedMsgHashed = await user.signMessage(ethers.getBytes(msgHashRef));

    // - the signature is a 65 bytes array.
    // - SignMessage prefix the msg with \x19Ethereum Signed Message: \n32
    // - so the hash to recover the signer is the hash of prefixed message hash
    const prefixedMsgHashComputed = await Utils.prefixed(msgHashRef);

    // 3. Recover the signer from the signed message and the prefixed message hash
    const recoveredSigner = await Utils.recoverSigner(
      prefixedMsgHashComputed,
      signedMsgHashed
    );

    expect(recoveredSigner).to.equal(user.address);
  });
});
