const { expect } = require("chai");
const sinon = require("sinon");

const fs = require("fs");
const path = require("path");
const {
  networkParams,
  getActiveConfig,
  getUsedConfigs,
} = require("../../helpers/configHelper");
const { run } = require("hardhat");

// @todo Place 'TEST' in params values to avoid conflicts with real values
// and to remove them after the tests
// @todo complete the tests

const originalAddressesPath = path.resolve(
  __dirname,
  "../../constants/deployedAddresses.json"
);
const tempAddressesPath = path.resolve(
  __dirname,
  "../../constants/deployedAddresses_temp.json"
);
const originalNoncesPath = path.resolve(
  __dirname,
  "../../constants/nonceRecord.json"
);
const tempNoncesPath = path.resolve(
  __dirname,
  "../../constants/nonceRecord_temp.json"
);

const originalConfigPath = path.resolve(
  __dirname,
  "../../constants/deploymentConfig.json"
);
const tempConfigPath = path.resolve(
  __dirname,
  "../../constants/deploymentConfig_temp.json"
);

// Comment/Uncomment describe.skip/describe.only to run/skip the tests
// describe.only("Reset JSON Task", function () {
describe.skip("Reset JSON Task", function () {
  before(async function () {
    // Before test save the original config file
    fs.copyFileSync(originalAddressesPath, tempAddressesPath);
    fs.copyFileSync(originalNoncesPath, tempNoncesPath);
  });

  after(async function () {
    // After test restore the original config file
    fs.copyFileSync(tempAddressesPath, originalAddressesPath);
    fs.copyFileSync(tempNoncesPath, originalNoncesPath);
    // Delete the temp config file
    fs.unlinkSync(tempAddressesPath);
    fs.unlinkSync(tempNoncesPath);
  });

  describe("reset-config Tasks", function () {
    it("should reset the deployed addresses and nonce records", async function () {
      await run("reset-config");

      const deployedAddresses = require(originalAddressesPath);
      const nonceRecord = require(originalNoncesPath);

      expect(deployedAddresses).to.deep.equal({});
      expect(nonceRecord).to.deep.equal({ originNonces: {} });
    });
  });
});

// Comment/Uncomment describe.skip/describe.only to run/skip the tests
describe.only("Config Tasks", function () {
  // describe.skip("Config Tasks", function () {
  before(async function () {
    // Before test save the original config file
    fs.copyFileSync(originalConfigPath, tempConfigPath);

    // Add a test config
    await run("add-used-config", {
      name: "TESTConfig",
      networks: "localhost,sepolia",
      tokens: "ogToken,moonToken",
    });
    const preparedParams = JSON.parse(
      fs.readFileSync(originalConfigPath, "utf8")
    );
    const preparedConfigs = preparedParams.usedConfigs;
    expect(preparedConfigs["TESTConfig"]).to.exist;
  });

  after(async function () {
    // After test restore the original config file
    fs.copyFileSync(tempConfigPath, originalConfigPath);
    // Delete the temp config file
    fs.unlinkSync(tempConfigPath);
  });

  describe("set-active-config task", function () {
    it("should set the active config", async function () {
      await run("set-active-config", { name: "TESTConfig" });

      const activeConfig = getActiveConfig();
      expect(activeConfig).to.equal("TESTConfig");
    });
    it("should throw setting an active config not existing", async function () {
      expect(await run("set-active-config", { name: "noname" })).to.throw;
    });
  });
  describe("add-used-config task", function () {
    it("should add a new used config", async function () {
      await run("add-used-config", {
        name: "TESTConfig2",
        networks: "localhost,sepolia",
        tokens: "myToken,myNewToken",
      });

      // 0.01 sec / wait for the file to be written
      //   await new Promise((resolve) => setTimeout(resolve, 10));
      const usedConfigs = getUsedConfigs();
      const result = usedConfigs["TESTConfig2"];

      expect(result).to.exist;
      expect(result.usedNetworks).to.deep.equal(["localhost", "sepolia"]);
      expect(result.usedTokens).to.deep.equal(["myToken", "myNewToken"]);
    });
    it("should throw adding a new used config if it already exists", async function () {
      await run("add-used-config", {
        name: "TESTConfig3",
        networks: "localhost,sepolia",
        tokens: "myToken,myNewToken",
      });
      // 0.01 sec / wait for the file to be written
      //   await new Promise((resolve) => setTimeout(resolve, 10));
      expect(
        await run("add-used-config", {
          name: "TESTConfig3",
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
        networkName: "localhost",
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
        networkName: "sepolia",
        name: "myNewToken2",
        symbol: "MNT",
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      });

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
          networkName: "localhost",
          name: "mockedToken",
          symbol: "MTK",
          address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        })
      ).to.throw;
    });
    it("should throw when adding token without an address", async function () {
      expect(
        await run("add-deployed-token", {
          networkName: "localhost",
          name: "myToken",
          symbol: "MTK",
        })
      ).to.throw;
    });
    it("should throw when adding a token that already exists", async function () {
      expect(
        await run("add-deployed-token", {
          networkName: "localhost",
          name: "mockedToken",
          symbol: "MTK",
        })
      ).to.throw;
    });
  });
  describe("add-to-config task", function () {
    const paramsPath = path.resolve(
      __dirname,
      "../../constants/deploymentConfig.json"
    );
    it("should add a network to a usedConfig", async function () {
      const usedConfigsBefore = getUsedConfigs();
      const resultBefore = [...usedConfigsBefore["TESTConfig"].usedNetworks];
      const networkName = "rinkeby";

      await run("add-to-config", {
        name: "TESTConfig",
        type: "usedNetworks",
        element: networkName,
      });

      const newConfigParams = JSON.parse(fs.readFileSync(paramsPath, "utf8"));
      const usedConfigs = newConfigParams.usedConfigs;
      const result = usedConfigs["TESTConfig"];

      expect(result).to.exist;
      expect(result.usedNetworks).to.deep.equal([...resultBefore, networkName]);
    });
    it("should add a token to a usedConfig", async function () {
      const usedConfigsBefore = getUsedConfigs();
      const resultBefore = [...usedConfigsBefore["TESTConfig"].usedTokens];
      const tokenName = "newToken";

      await run("add-to-config", {
        name: "TESTConfig",
        type: "usedTokens",
        element: tokenName,
      });

      const newConfigParams = JSON.parse(fs.readFileSync(paramsPath, "utf8"));
      const usedConfigs = newConfigParams.usedConfigs;
      const result = usedConfigs["TESTConfig"];

      expect(result).to.exist;
      expect(result.usedTokens).to.deep.equal([...resultBefore, tokenName]);
    });
    it("should throw adding a network to a usedConfig not existing", async function () {
      expect(
        await run("add-to-config", {
          name: "noname",
          type: "usedNetworks",
          element: "rinkeby",
        })
      ).to.throw;
    });
    it("should throw adding a token to a usedConfig not existing", async function () {
      expect(
        await run("add-to-config", {
          name: "noname",
          type: "usedTokens",
          element: "myToken",
        })
      ).to.throw;
    });
  });
  describe("remove-used-config task", function () {
    it("should remove a usedConfig", async function () {
      // Add a usedConfig to remove
      await run("add-used-config", {
        name: "TESTConfigToRemove",
        networks: "localhost,sepolia",
        tokens: "myToken,myNewToken",
      });
      const usedConfigsBefore = getUsedConfigs();
      const resultBefore = usedConfigsBefore["TESTConfigToRemove"];
      expect(resultBefore).to.exist;

      await run("remove-used-config", { name: "TESTConfigToRemove" });

      const usedConfigs = getUsedConfigs();
      const result = usedConfigs["TESTConfigToRemove"];

      expect(result).to.not.exist;
    });
    it("should throw removing a usedConfig not existing", async function () {
      expect(await run("remove-used-config", { name: "noname" })).to.throw;
    });
  });
});
