const hre = require("hardhat");
const { expect } = require("chai");
const sinon = require("sinon");

// Comment/Uncomment describe.skip/describe.only to run/skip the tests
// describe.only("func-getMsgSignature task", function () {
describe.skip("func-getMsgHash task", function () {
  it("should calculate the correct operation hash signature", async function () {
    const [user] = await hre.ethers.getSigners();

    const args = [
      user.address, //.............................. from
      user.address, //.............................. to
      1, // ........................................ chainIdFrom
      2, // ........................................ chainIdTo
      "TokenName", //................................. tokenName
      1000000000000000000n, //...................... amount (BigInt ending with 'n')
      0, //......................................... user nonce
    ];
    const argsString = `${user.address} ${user.address} 1 2 TokenName 1000000000000000000n 0`;

    const consoleLogSpy = sinon.spy(console, "log");
    try {
      await hre.run("func-getMsgSignature", { args: argsString });
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
      const signedMsgHash = await user.signMessage(ethers.getBytes(hash));

      expect(consoleLogSpy.firstCall.args[0]).to.include(user.address);
      expect(consoleLogSpy.firstCall.args[0]).to.include(hash);
      expect(consoleLogSpy.firstCall.args[0]).to.include(signedMsgHash);
    } finally {
      console.log.restore();
    }
  });
});
