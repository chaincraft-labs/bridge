const hre = require("hardhat");
const { expect } = require("chai");
const sinon = require("sinon");

// Comment/Uncomment describe.skip/describe.only to run/skip the tests
describe("func-getMsgSignature task", function () {
  // describe.skip("func-printSigners task", function () {
  it("should display the available signers", async function () {
    const signers = await hre.ethers.getSigners();

    const consoleLogSpy = sinon.spy(console, "log");
    try {
      await hre.run("func-printSigners");

      const logCalls = consoleLogSpy.getCalls();
      const loggedMessages = logCalls.map((call) => call.args[0]);

      loggedMessages.forEach((message, index) => {
        if (index === 0) {
          expect(message).to.include("Signers on network");
        } else {
          expect(message).to.include(`Signer ${index - 1}:`);
          expect(message).to.include(`${signers[index - 1].address}`);
          expect(message).to.include(`10000.0`);
          expect(message).to.include(`ETH`);
        }
      });
    } finally {
      console.log.restore();
    }
  });
});
