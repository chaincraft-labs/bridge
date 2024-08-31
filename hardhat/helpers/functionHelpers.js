const { toStyle, display } = require("./loggingHelper");
const { networkParams } = require("./configHelper");
const { writeDeployedAddress } = require("../helpers/fileHelpers");

///////////////////////////////////////////////////////////////////////////////
//
//                CHECKS FOR DEPLOYMENT SCRIPTS
//
///////////////////////////////////////////////////////////////////////////////
const deploymentCheck = {
  // @todo remove and replace with next one
  // Check we don't have localhost AND hardhat in network used (same id)
  noLocalChainDuplicate: (usedNetworks) => {
    if (
      usedNetworks.includes("localhost") &&
      usedNetworks.includes("hardhat")
    ) {
      throw `${toStyle.error("Error: ")}${toStyle.yellowItalic(
        "usedNetworks"
      )} should NOT include "localhost" and "hardhat" at the same time in${toStyle.yellowItalic(
        "constants/deploymentConfig.js"
      )}!\n`;
    }
  },
  // to be removed as L2s share the same coin
  // Check we don't have duplicate chains used (same chainID or native token)
  noDuplicateChains: (usedNetworks) => {
    const seenChains = {};

    usedNetworks.forEach((network) => {
      const { chainId, nativeToken } = networkParams[network];

      if (seenChains[chainId]) {
        throw `${toStyle.error("Error: ")}${toStyle.yellowItalic(
          "usedNetworks"
        )} should NOT include multiple networks with the same chainId (${toStyle.yellowItalic(
          chainId
        )}) in ${toStyle.yellowItalic("constants/deploymentConfig.js")}!\n`;
      }
      seenChains[chainId] = true;

      if (Object.keys(seenChains).includes(nativeToken.name)) {
        throw `${toStyle.error("Error: ")}${toStyle.yellowItalic(
          "usedNetworks"
        )} should NOT include multiple networks with the same native token name (${toStyle.yellowItalic(
          nativeToken.name
        )}) in ${toStyle.yellowItalic("constants/deploymentConfig.js")}!\n`;
      }
      seenChains[nativeToken.name] = true;
    });
  },

  // Check if we deploy to a network from the deploymentConfig (deployment security)
  deploymentOnUsedNetworks: (usedNetworks, currentNetwork) => {
    if (!usedNetworks.includes(currentNetwork)) {
      throw `${toStyle.error(
        "Error: "
      )}Trying to deploy to a network not included in ${toStyle.yellowItalic(
        "constants/deploymentConfig.js"
      )}!`;
    }
  },

  // Check if the networks in deploymentConfig are amongst networkParams (to have their data)
  usedNetworksSetInConfig: (usedNetworks) => {
    const networkKeys = Object.keys(networkParams);
    usedNetworks.forEach((usedNetwork) => {
      if (!networkKeys.includes(usedNetwork)) {
        throw `${toStyle.error("Error: ")}Used network: ${toStyle.yellowItalic(
          usedNetwork
        )} is not included in the networkParams!!`;
      }
    });
  },

  validateNetworks: function (usedNetworks, currentNetwork) {
    deploymentCheck.noLocalChainDuplicate(usedNetworks);
    // deploymentCheck.noDuplicateChains(usedNetworks);
    deploymentCheck.deploymentOnUsedNetworks(usedNetworks, currentNetwork);
    deploymentCheck.usedNetworksSetInConfig(usedNetworks);
  },
};

///////////////////////////////////////////////////////////////////////////////
//
//                DEPLOYMENT FUNCTIONS
//
///////////////////////////////////////////////////////////////////////////////
const deployAndSaveAddress = async (network, contractName, params) => {
  let tokenSymbol;
  const instance = await hre.ethers.deployContract(contractName, params);
  await instance.waitForDeployment();
  display.deployContract(contractName, instance.target);

  const writeParams = [network, contractName, instance.target];
  if (contractName == "BridgedToken" || contractName == "MockedToken") {
    // we add token symbol for bridged & mocked token (last elements of 'params')
    tokenSymbol = params[params.length - 1];
    writeParams.push(tokenSymbol);
  }
  writeDeployedAddress(...writeParams);
  display.writingAddress(contractName, tokenSymbol);

  return instance;
};

///////////////////////////////////////////////////////////////////////////////
//
//                GENERIC FUNCTIONS
//
///////////////////////////////////////////////////////////////////////////////

//setter != getter!!
// parallel exec (don't use this if sequential call needed)
// executes batch call of funcName on instance
// each element of the array are params of one call
// ex: batchWriteFunc(storage, "addChainIdsToLis", ["ethereum", "allfeat"])
const batchWriteFunc = async (instance, funcName, params) => {
  await Promise.all(
    params.map(async (param) => {
      const tx = await instance[funcName](param);
      await tx.wait();
      console.log(`executed func ${funcName} with param: ${param}`);
    })
  ).catch((err) => {
    console.log(
      `${toStyle.error("Error: ")} calling func ${funcName} on ${
        instance.target
      } with params: ${params}\n${err}`
    );
  });
};

/**
 * Converts a parameter string into an array of arguments.
 *
 * @param {string} argsString - The parameter string, separated by commas.
 * @returns {Array} - An array of converted arguments.
 */
const convertParamsStringToArray = (argsString) => {
  // Split the parameters by commas and map each argument
  let args = argsString.split(",").map((arg) => {
    // Trim unnecessary spaces
    arg = arg.trim();

    // Return the argument as is if it starts with "0x"
    if (arg.startsWith("0x")) return arg;

    // Return BigInt if the argument is a BigInt (only digits followed by 'n')
    if (/^\d+n$/.test(arg)) return BigInt(arg.slice(0, -1));

    // Return integer if the argument is an integer
    if (/^\d+$/.test(arg)) return parseInt(arg, 10);

    // Return boolean if the argument is a boolean string
    if (arg === "true") return true;
    if (arg === "false") return false;

    // Return number if the argument can be converted to a number
    const num = parseFloat(arg);
    if (!isNaN(num)) return num;

    // Return null if the argument is an empty string
    if (arg === "") return null;

    // Return the argument as is if none of the above conditions are met
    return arg;
  });

  // If the arguments array is empty or contains only null, return empty
  if (args.length === 1 && args[0] === null) {
    console.log("Args is empty");
    return [];
  }

  return args;
};

module.exports = {
  deploymentCheck,
  deployAndSaveAddress,
  convertParamsStringToArray,
};
