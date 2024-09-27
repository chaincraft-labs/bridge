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
      // Check before reset that the files are not empty
      const deployedAddressesBefore = JSON.parse(
        fs.readFileSync(tempAddressesPath, "utf8")
      );
      const nonceRecordBefore = JSON.parse(
        fs.readFileSync(tempNoncesPath, "utf8")
      );
      expect(deployedAddressesBefore).to.not.deep.equal({});
      expect(nonceRecordBefore).to.not.deep.equal({ originNonces: {} });

      await run("reset-config");
      // wait 0.01 sec / wait for the file to be written
      // await new Promise((resolve) => setTimeout(resolve, 10));

      const deployedAddresses = JSON.parse(
        fs.readFileSync(originalAddressesPath, "utf8")
      );
      const nonceRecord = JSON.parse(
        fs.readFileSync(originalNoncesPath, "utf8")
      );
      expect(deployedAddresses).to.deep.equal({});
      expect(nonceRecord).to.deep.equal({ originNonces: {} });
    });
  });
});

// Comment/Uncomment describe.skip/describe.only to run/skip the tests
describe.only("Config Tasks", function () {
  // describe.skip("Config Tasks", function () {
  const mockedConfigName = "mockedConfig";
  const mockedConfig = {
    usedNetworks: ["allfeat", "sepolia"],
    usedTokens: ["ogToken", "songToken"],
  };
  const mockedNewConfigName = "mockedNewConfig";
  const mockedNewConfig = {
    usedNetworks: ["rinkeby", "kovan"],
    usedTokens: ["ogToken", "moonToken"],
  };
  before(async function () {
    // Before test save the original config file
    fs.copyFileSync(originalConfigPath, tempConfigPath);

    // Add a test config
    await run("add-used-config", {
      name: mockedConfigName,
      networks: mockedConfig.usedNetworks.join(","),
      tokens: mockedConfig.usedTokens.join(","),
    });
    const preparedParams = JSON.parse(
      fs.readFileSync(originalConfigPath, "utf8")
    );
    const preparedConfigs = preparedParams.usedConfigs;
    expect(preparedConfigs[mockedConfigName]).to.exist;
  });

  after(async function () {
    // After test restore the original config file
    fs.copyFileSync(tempConfigPath, originalConfigPath);
    // Delete the temp config file
    fs.unlinkSync(tempConfigPath);
  });

  describe("set-active-config task", function () {
    it("should set the active config", async function () {
      await run("set-active-config", { name: mockedConfigName });

      const activeConfig = getActiveConfig();
      expect(activeConfig).to.equal(mockedConfigName);
    });
    it("should throw setting an active config not existing", async function () {
      expect(await run("set-active-config", { name: "noname" })).to.throw;
    });
  });
  describe("add-used-config task", function () {
    it("should add a new used config", async function () {
      await run("add-used-config", {
        name: mockedNewConfigName,
        networks: mockedNewConfig.usedNetworks.join(","),
        tokens: mockedNewConfig.usedTokens.join(","),
      });

      // 0.01 sec / wait for the file to be written
      //   await new Promise((resolve) => setTimeout(resolve, 10));
      const usedConfigs = getUsedConfigs();
      const result = usedConfigs[mockedNewConfigName];

      expect(result).to.exist;
      expect(result.usedNetworks).to.deep.equal(mockedNewConfig.usedNetworks);
      expect(result.usedTokens).to.deep.equal(mockedNewConfig.usedTokens);
    });
    it("should throw adding a new used config if it already exists", async function () {
      await run("add-used-config", {
        name: mockedNewConfigName,
        networks: mockedNewConfig.usedNetworks.join(","),
        tokens: mockedNewConfig.usedTokens.join(","),
      });
      // 0.01 sec / wait for the file to be written
      //   await new Promise((resolve) => setTimeout(resolve, 10));
      expect(
        await run("add-used-config", {
          name: mockedNewConfigName,
          networks: mockedConfig.usedNetworks.join(","),
          tokens: mockedConfig.usedTokens.join(","),
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

      const expectedOutput = JSON.parse(JSON.stringify(getUsedConfigs()));
      Object.values(expectedOutput).forEach((usedConfig) => {
        usedConfig.usedNetworks = usedConfig.usedNetworks.join(", ");
        usedConfig.usedTokens = usedConfig.usedTokens.join(", ");
      });

      expect(consoleLogSpy.firstCall.args[0]).to.include("Listed usedConfig");
      expect(consoleLogSpy.firstCall.args[0]).to.include(
        JSON.stringify(expectedOutput, null, 2)
      );

      consoleLogSpy.restore();
    });
  });
  describe("add-deployedToken task", function () {
    const mockedNonMockedToken = "nonMockedToken";
    const mockedTokenName = "mockedToken";
    const mockedTokenSymbol = "MTK";
    const mockedAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    it("should add a mocked token in the config file", async function () {
      // Check localhost exist in the networkParams
      const existingNetwork = "localhost";
      expect(networkParams[existingNetwork]).to.exist;

      await run("add-deployed-token", {
        networkName: existingNetwork,
        name: mockedTokenName,
        symbol: mockedTokenSymbol,
      });

      const result = networkParams[existingNetwork].deployedTokens.find(
        (element) => element.name === mockedTokenName
      );

      expect(result).to.exist;
      expect(result.symbol).to.equal(mockedTokenSymbol);
    });
    it("should add a token with its address in the config file", async function () {
      // Check sepolia exist in the networkParams
      const existingNetwork = "sepolia";
      expect(networkParams[existingNetwork]).to.exist;

      await run("add-deployed-token", {
        networkName: existingNetwork,
        name: mockedNonMockedToken,
        symbol: mockedTokenSymbol,
        address: mockedAddress,
      });

      const result = networkParams[existingNetwork].deployedTokens.find(
        (element) => element.name === mockedNonMockedToken
      );

      expect(result).to.exist;
      expect(result.symbol).to.equal(mockedTokenSymbol);
      expect(result.address).to.equal(mockedAddress);
    });
    it("should throw when adding mocked token with an address", async function () {
      const existingNetwork = "localhost";
      expect(networkParams[existingNetwork]).to.exist;
      expect(
        await run("add-deployed-token", {
          networkName: existingNetwork,
          name: mockedTokenName,
          symbol: mockedTokenName,
          address: mockedAddress,
        })
      ).to.throw;
    });
    it("should throw when adding token without an address", async function () {
      const existingNetwork = "localhost";
      expect(networkParams[existingNetwork]).to.exist;
      expect(
        await run("add-deployed-token", {
          networkName: existingNetwork,
          name: mockedNonMockedToken,
          symbol: mockedTokenSymbol,
        })
      ).to.throw;
    });
    it("should throw when adding a token that already exists", async function () {
      const existingNetwork = "localhost";
      expect(networkParams[existingNetwork]).to.exist;
      await run("add-deployed-token", {
        networkName: existingNetwork,
        name: mockedTokenName,
        symbol: mockedTokenSymbol,
      });
      expect(
        await run("add-deployed-token", {
          networkName: existingNetwork,
          name: mockedTokenName,
          symbol: mockedTokenSymbol,
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
      const resultBefore = [
        ...usedConfigsBefore[mockedConfigName].usedNetworks,
      ];
      const mockedNewNetworkName = "rinkeby";

      await run("add-to-config", {
        name: mockedConfigName,
        type: "usedNetworks",
        element: mockedNewNetworkName,
      });

      const newConfigParams = JSON.parse(fs.readFileSync(paramsPath, "utf8"));
      const usedConfigs = newConfigParams.usedConfigs;
      const result = usedConfigs[mockedConfigName];

      expect(result).to.exist;
      expect(result.usedNetworks).to.deep.equal([
        ...resultBefore,
        mockedNewNetworkName,
      ]);
    });
    it("should add a token to a usedConfig", async function () {
      const usedConfigsBefore = getUsedConfigs();
      const resultBefore = [...usedConfigsBefore[mockedConfigName].usedTokens];
      const mockedNewTokenName = "newToken";

      await run("add-to-config", {
        name: mockedConfigName,
        type: "usedTokens",
        element: mockedNewTokenName,
      });

      const newConfigParams = JSON.parse(fs.readFileSync(paramsPath, "utf8"));
      const usedConfigs = newConfigParams.usedConfigs;
      const result = usedConfigs[mockedConfigName];

      expect(result).to.exist;
      expect(result.usedTokens).to.deep.equal([
        ...resultBefore,
        mockedNewTokenName,
      ]);
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
        name: mockedConfigName,
        networks: mockedConfig.usedNetworks.join(","),
        tokens: mockedConfig.usedTokens.join(","),
      });
      const usedConfigsBefore = getUsedConfigs();
      const resultBefore = usedConfigsBefore[mockedConfigName];
      expect(resultBefore).to.exist;

      await run("remove-used-config", { name: mockedConfigName });

      const usedConfigs = getUsedConfigs();
      const result = usedConfigs[mockedConfigName];
      expect(result).to.not.exist;
    });
    it("should throw removing a usedConfig not existing", async function () {
      expect(await run("remove-used-config", { name: "noname" })).to.throw;
    });
  });
});
