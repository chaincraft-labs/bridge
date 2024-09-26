const hre = require("hardhat");
const { expect } = require("chai");
const sinon = require("sinon");
const { shortenAddress } = require("../../utils/util");

const ETHERS_HH_BALANCE = "10000.0";
const WEI_HH_BALANCE = hre.ethers.parseEther(ETHERS_HH_BALANCE);
const WEI_AMOUNT_TRANSFERED = "1000000";
const AMOUNT_TRANSFERED = hre.ethers.formatEther(WEI_AMOUNT_TRANSFERED);
const TOKEN_NAME = "Test Token";
const TOKEN_SYMBOL = "TT";

// Comment/Uncomment describe.skip/describe.only to run/skip the tests
// describe.only("func-balanceOf task", function () {
describe.skip("func-balanceOf task", function () {
  let owner, user;
  let tokenAddress;
  let tokenContract;

  before(async () => {
    [owner, user] = await hre.ethers.getSigners();

    tokenContract = await hre.ethers.deployContract("MockedToken", [
      owner.address,
      TOKEN_NAME,
      TOKEN_SYMBOL,
    ]);
    await tokenContract.waitForDeployment();

    await tokenContract
      .connect(owner)
      .transfer(user.address, WEI_AMOUNT_TRANSFERED);
    tokenAddress = tokenContract.target;
  });

  it("should get the ETH balance of a user", async function () {
    const shortAddress = shortenAddress(user.address);

    const consoleLogSpy = sinon.spy(console, "log");
    try {
      await hre.run("func-balanceOf", { user: user.address });

      expect(consoleLogSpy.firstCall.args[0]).to.include(shortAddress);
      expect(consoleLogSpy.firstCall.args[0]).to.include(WEI_HH_BALANCE);
      expect(consoleLogSpy.firstCall.args[0]).to.include(ETHERS_HH_BALANCE);
      expect(consoleLogSpy.firstCall.args[0]).to.include("ETH");
    } finally {
      console.log.restore();
    }
  });

  it("should get the ERC20 token balance of a user", async function () {
    const shortAddress = shortenAddress(user.address);

    const consoleLogSpy = sinon.spy(console, "log");
    try {
      await hre.run("func-balanceOf", {
        user: user.address,
        token: tokenAddress,
      });

      expect(consoleLogSpy.firstCall.args[0]).to.include(shortAddress);
      expect(consoleLogSpy.firstCall.args[0]).to.include(WEI_AMOUNT_TRANSFERED);
      expect(consoleLogSpy.firstCall.args[0]).to.include(AMOUNT_TRANSFERED);
      expect(consoleLogSpy.firstCall.args[0]).to.include(tokenAddress);
      expect(consoleLogSpy.firstCall.args[0]).to.include(TOKEN_SYMBOL);
    } finally {
      console.log.restore();
    }
  });
});
