const hre = require("hardhat");
const { expect } = require("chai");
const sinon = require("sinon");

const args = [
  "0xABcdEFABcdEFabcdEfAbCdefabcdeFABcDEFabCD", // from
  "0xABcdEFABcdEFabcdEfAbCdefabcdeFABcDEFabCD", // to
  1, // ........................................ chainIdFrom
  2, // ........................................ chainIdTo
  "TokenName", //................................. tokenName
  1000000000000000000n, //...................... amount (BigInt ending with 'n')
  0, //......................................... user nonce
];
const argsString =
  "0xABcdEFABcdEFabcdEfAbCdefabcdeFABcDEFabCD 0xABcdEFABcdEFabcdEfAbCdefabcdeFABcDEFabCD 1 2 TokenName 1000000000000000000n 0";

// Comment/Uncomment describe.skip/describe.only to run/skip the tests
describe("func-getMsgHash task", function () {
  // describe.skip("func-getMsgHash task", function () {
  it("should calculate the correct operation hash", async function () {
    const consoleLogSpy = sinon.spy(console, "log");
    try {
      await hre.run("func-getMsgHash", { args: argsString });
      // 0.01 sec / wait for the file to be written
      await new Promise((resolve) => setTimeout(resolve, 10));

      const paramsTypes = [
        "address",
        "address",
        "uint256",
        "uint256",
        "string",
        "uint256",
        "uint256",
      ];
      const hash = hre.ethers.solidityPackedKeccak256(paramsTypes, args);

      expect(consoleLogSpy.firstCall.args[0]).to.include("Hash of the args: ");
      expect(consoleLogSpy.firstCall.args[1]).to.include(hash);
    } finally {
      console.log.restore();
    }
  });
  it("should calculate the correct operation hash", async function () {
    const consoleLogSpy = sinon.spy(console, "log");
    try {
      await hre.run("func-getMsgHash", { args: argsString });
      // 0.01 sec / wait for the file to be written
      await new Promise((resolve) => setTimeout(resolve, 10));

      const paramsTypes = [
        "address",
        "address",
        "uint256",
        "uint256",
        "string",
        "uint256",
        "uint256",
      ];
      const hash = hre.ethers.solidityPackedKeccak256(paramsTypes, args);

      expect(consoleLogSpy.firstCall.args[0]).to.include("Hash of the args: ");
      expect(consoleLogSpy.firstCall.args[1]).to.include(hash);
    } finally {
      console.log.restore();
    }
  });
});
