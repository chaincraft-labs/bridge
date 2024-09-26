const { expect } = require("chai");
const sinon = require("sinon");

const fs = require("fs");
const path = require("path");
const { networkParams } = require("../../helpers/configHelper");
const {
  getActiveConfig,
  getUsedConfigs,
} = require("../../helpers/fileHelpers");
const { run } = require("hardhat");

// @todo Place 'TEST' in params values to avoid conflicts with real values
// and to remove them after the tests
// @todo complete the tests

const originalConfigPath = path.resolve(
  __dirname,
  "../../constants/deploymentConfig.js"
);
const tempConfigPath = path.resolve(
  __dirname,
  "../../constants/deploymentConfig_temp.js"
);

// Comment/Uncomment describe.skip/describe.only to run/skip the tests
// describe.only("Config Tasks", function () {
describe.skip("Config Tasks", function () {
  before(async function () {
    // Before test save the original config file
    fs.copyFileSync(originalConfigPath, tempConfigPath);
  });

  after(async function () {
    // After test restore the original config file
    fs.copyFileSync(tempConfigPath, originalConfigPath);
    // Delete the temp config file
    fs.unlinkSync(tempConfigPath);
  });

  describe("set-active-config task", function () {
    it("should set the active config", async function () {
      await run("set-active-config", { name: "testnet" });

      const activeConfig = getActiveConfig();
      expect(activeConfig).to.equal("testnet");
    });
    it("should throw setting an active config not existing", async function () {
      expect(await run("set-active-config", { name: "noname" })).to.throw;
    });
  });
  describe("add-used-config task", function () {
    it("should add a new used config", async function () {
      await run("add-used-config", {
        name: "newUsedConfig",
        networks: "localhost,sepolia",
        tokens: "myToken,myNewToken",
      });

      // 0.01 sec / wait for the file to be written
      await new Promise((resolve) => setTimeout(resolve, 10));
      const usedConfigs = getUsedConfigs();
      const result = usedConfigs["newUsedConfig"];

      expect(result).to.exist;
      expect(result.usedNetworks).to.deep.equal(["localhost", "sepolia"]);
      expect(result.usedTokens).to.deep.equal(["myToken", "myNewToken"]);
    });
    it("should throw adding a new used config if it already exists", async function () {
      expect(
        await run("add-used-config", {
          name: "newUsedConfig",
          networks: "localhost,sepolia",
          tokens: "myToken,myNewToken",
        })
      ).to.throw;
    });
  });
  describe("list-used-configs", function () {
    it("should display the used configs", async function () {
      // Spy  console.log
      const consoleLogSpy = sinon.spy(console, "log");

      await run("list-used-configs");
      // 0.01 sec / wait for the file to be written
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleLogSpy.calledOnce).to.be.true;

      const expectedOutput = JSON.stringify(getUsedConfigs(), null, 2);
      expect(consoleLogSpy.firstCall.args[0]).to.include("Listed usedConfig");
      expect(consoleLogSpy.firstCall.args[0]).to.include(expectedOutput);

      consoleLogSpy.restore();
    });
  });
  describe("add-deployedToken task", function () {
    it("should add a mocked token in the config file", async function () {
      await run("add-deployed-token", {
        net: "localhost",
        name: "mockedToken",
        symbol: "MTK",
      });

      const result = networkParams["localhost"].deployedTokens.find(
        (element) => element.name === "mockedToken"
      );

      expect(result).to.exist;
      expect(result.symbol).to.equal("MTK");
    });
    it("should add a token with its address in the config file", async function () {
      await run("add-deployed-token", {
        net: "sepolia",
        name: "myNewToken2",
        symbol: "MNT",
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      });
      // 0.01 sec / wait for the file to be written
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = networkParams["sepolia"].deployedTokens.find(
        (element) => element.name === "myNewToken2"
      );

      expect(result).to.exist;
      expect(result.symbol).to.equal("MNT");
      expect(result.address).to.equal(
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
      );
    });
    it("should throw when adding mocked token with an address", async function () {
      expect(
        await run("add-deployed-token", {
          net: "localhost",
          name: "mockedToken",
          symbol: "MTK",
          address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        })
      ).to.throw;
    });
    it("should throw when adding token without an address", async function () {
      expect(
        await run("add-deployed-token", {
          net: "localhost",
          name: "myToken",
          symbol: "MTK",
        })
      ).to.throw;
    });
  });
});
