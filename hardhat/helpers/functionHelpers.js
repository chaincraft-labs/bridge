const { toStyle, display } = require("./loggingHelper");
const {
  networkParams,
  FEES_AMOUNT,
  getSimulationParams,
} = require("./configHelper");
const { writeDeployedAddress } = require("./fileHelpers");
///////////////////////////////////////////////////////////////////////////////
//
//                CHECKS FOR DEPLOYMENT SCRIPTS
//
///////////////////////////////////////////////////////////////////////////////
/**
 * @description Check the deploymentConfig.js file for errors
 * @dev Used in deployment scripts
 */
const deploymentCheck = {
  /**
   * @description Check if "localhost" and "hardhat" are not used at the same time
   * @param {Array} usedNetworks
   */
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
  /**
   * @description Check if there are no duplicate chains in usedNetworks
   * @param {Array} usedNetworks
   */
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

  /**
   * @description Check if the current network is included in usedNetworks
   *
   * @param {Array} usedNetworks
   * @param {string} currentNetwork
   */
  deploymentOnUsedNetworks: (usedNetworks, currentNetwork) => {
    if (!usedNetworks.includes(currentNetwork)) {
      throw `${toStyle.error(
        "Error: "
      )}Trying to deploy to a network not included in ${toStyle.yellowItalic(
        "constants/deploymentConfig.js"
      )}!`;
    }
  },
  /**
   * @description Check if usedNetworks are included in networkParams
   *
   * @param {Array} usedNetworks
   */
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
  /**
   * @description Check the deploymentConfig.js file for errors
   *
   * @param {Array} usedNetworks
   * @param {string} currentNetwork
   */
  validateNetworks: function (usedNetworks, currentNetwork) {
    deploymentCheck.noLocalChainDuplicate(usedNetworks);
    deploymentCheck.deploymentOnUsedNetworks(usedNetworks, currentNetwork);
    deploymentCheck.usedNetworksSetInConfig(usedNetworks);
  },
};

///////////////////////////////////////////////////////////////////////////////
//
//                DEPLOYMENT FUNCTIONS
//
///////////////////////////////////////////////////////////////////////////////
/**
 * @description Deploy a contract and stored its address in constants folder
 *
 * @dev 'params' is the array of constructor inputs, empty array if none
 * @dev In case of mocked/bridged token the symbol is used to store the address
 *
 * @param {string} network
 * @param {string} contractName
 * @param {Array} params
 * @returns
 */
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
//                OPERATION PARAMS HELPERS
//
///////////////////////////////////////////////////////////////////////////////
/**
 * @description From option return the array of operation params
 *
 * @dev args can be 2 formats (the number of ',' will select the format):
 * 1. "chainIdFrom,chainIdTo,tokenName,amount"
 * 2. "name,chain"
 *
 * 1. will take this value as params.
 * Amount SHOULD be in ethers, not in wei.,'.' is used as decimal point
 * 2. will take the value from constants/simulationParams to use default predefined values
 * 3. null option will use default value: "defaultOrigin,sepolia" from simulationParams
 *
 * @param {string} paramsOption
 * @returns
 */
const convertToOperationParams = (paramsOption = "defaultOrigin,sepolia") => {
  if (!paramsOption) {
    paramsOption = "";
  }
  // count the number of ',' in paramsOption
  const count = (paramsOption.match(/,/g) || []).length;
  if (count !== 3 && count !== 1 && count !== 0) {
    throw "Wrong option format, can not extract operation params!";
  }

  if (count === 3) {
    let [chainIdFrom, chainIdTo, tokenName, etherAmount] =
      paramsOption.split(",");
    // convert amount from ethers to wei (if ethers '.' is used as decimal point)
    const amount = ethers.parseEther(etherAmount);
    chainIdFrom = Number(chainIdFrom);
    chainIdTo = Number(chainIdTo);

    return [chainIdFrom, chainIdTo, tokenName, amount];
  }
  const [simName, simOriginChain] = paramsOption.split(",");
  const simParams = getSimulationParams(simName, simOriginChain);

  if (!simParams || Object.keys(simParams).length === 0) {
    throw "Simulation Params not found!";
  }
  const params = [
    simParams.chainIdFrom,
    simParams.chainIdTo,
    simParams.tokenName,
    BigInt(simParams.amount),
  ];
  return params;
};

/**
 * @description From option return the fees amount
 *
 * @dev If paramsOption is null, return the default FEES_AMOUNT
 * @dev If not null, fetch the feesAmount from simulationParams
 *
 * @param {string | null } feesOption
 * @returns
 */
const getFeesAmount = (feesOption) => {
  if (!feesOption) {
    return FEES_AMOUNT;
  }
  // test if it's number or float ('.' decimal point)
  if (!isNaN(feesOption)) {
    return ethers.parseEther(feesOption);
  }

  // count the number of ',' in paramsOption
  const count = (feesOption.match(/,/g) || []).length;
  if (count !== 1) {
    throw "Wrong option format, can not extract fees params!";
  }

  const [simName, simOriginChain] = feesOption.split(",");
  const simParams = simulationParams[simName][simOriginChain];

  if (!simParams || Object.keys(simParams).length === 0) {
    throw "Simulation Params not found!";
  }
  return BigInt(simParams.feesAmount);
};

///////////////////////////////////////////////////////////////////////////////
//
//                TASKS HELPERS
//
///////////////////////////////////////////////////////////////////////////////
/**
 * @description Converts a parameter string into an array of arguments.
 *
 * This function takes a string of parameters, separated by spaces, and converts it into an array of arguments.
 * It supports both individual arguments and array-like arguments enclosed in square brackets.
 *
 * @dev Example usage:
 *   - Input: "1 2 3 [abc,,fg,1,2,3] [] 0xabd 4 5 h i  k"
 *   - Output: [1, 2, 3, ["abc", "", "fg", 1, 2, 3], [], "0xabd", 4, 5, "h", "i", "","k"]
 *
 * @dev Rules for formatting:
 *   - Arguments are separated by a single space.
 *   - To insert an empty string among the arguments, use two consecutive spaces.
 *   - In array arguments, elements are separated by commas.
 *     - Two consecutive commas (,,) indicate an empty string element between them.
 *   - IMPORTANT: Do not include spaces within array arguments; they must be comma-separated.
 *
 * @param {string} argsString - The parameter string to be converted.
 * @returns {Array} - An array of converted arguments based on the provided string.
 */
const convertParamsStringToArray = (argsString) => {
  // Split the parameters by spaces and map each argument
  let args = argsString.split(" ").map((arg) => {
    // Trim unnecessary spaces
    arg = arg.trim();

    if (arg == "[]") return [];
    // Check if the argument is a list (starts with '[' and ends with ']')
    if (arg.startsWith("[") && arg.endsWith("]")) {
      // Remove the brackets and split by comma
      const arrayElements = arg
        .slice(1, -1)
        .split(",")
        .map((el) => el.trim());

      // Process each element in the array
      return arrayElements
        .map((element) => {
          // Handle empty strings as empty elements
          if (element === "") return ""; // Treat empty string as a valid element

          // Process the element like before
          if (element.startsWith("0x")) return element;
          if (/^\d+n$/.test(element)) return BigInt(element.slice(0, -1));
          if (/^\d+$/.test(element)) return parseInt(element, 10);
          if (element === "true") return true;
          if (element === "false") return false;
          const num = parseFloat(element);
          if (!isNaN(num)) return num;
          return element; // Return the argument as is if none of the above conditions are met
        })
        .filter((el) => el !== null); // Filter out nulls to avoid adding them to the array
    }

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
    if (arg === "") return ""; //null;

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

///////////////////////////////////////////////////////////////////////////////
//
//                URL / PORT HELPERS
//
///////////////////////////////////////////////////////////////////////////////
/**
 * @description Check if network name is an exception for convention (geth)
 *
 * @param { string } networkName
 * @returns { boolean } true if networkName is an exception
 */
function isConventionException(networkName) {
  const exceptionNetworks = ["geth"];
  return exceptionNetworks.includes(networkName);
}

/**
 * @description Check network name convention for local custom networks
 *
 * @dev Only for Fork and Local networks
 * @dev networkName = [networkName]Fork | [networkName]Local | geth
 * @param { string } networkName
 * @throws if networkName is not a local custom network
 */
function assertIsLocalNetwork(networkName) {
  const isException = isConventionException(networkName);
  const hasSuffix = networkName.match(/(Fork|Local)$/);
  if (!isException && !hasSuffix) {
    throw new Error(
      `Network name ${networkName} is not a valid local custom network!`
    );
  }
}

/**
 * @description Format network suffix
 *
 * @dev convert Fork | Local to _Fork | _Local, only if suffix is present
 * @param { string } networkName
 * @returns { string } formatted network name
 */
function formatNetworkSuffix(networkName) {
  assertIsLocalNetwork(networkName);

  if (!isConventionException(networkName)) {
    return networkName.replace(/(Fork|Local)/g, "_$1");
  }
  return networkName;
}

/**
 * @description Converts fork | local network name to port .env variable
 *
 * @dev Naming convention:
 *  forkNetworkName = [networkName]Fork
 *  localNetworkName = [networkName]Local
 * @param { string } networkName
 * @returns the port
 */
function networkNameToPortName(networkName) {
  return `PORT_${formatNetworkSuffix(networkName).toUpperCase()}`;
}

/**
 * @description Get the rpc url for a forked or local network
 *
 * @dev Naming convention:
 *  forkNetworkName = [networkName]Fork
 *  localNetworkName = [networkName]Local | geth
 * @param { string } networkName
 * @returns the rpc url
 */
function buildLocalRpcUrl(networkName) {
  // insert '_' before exact words: Fork or Local and convert to uppercase
  const envName = networkNameToPortName(networkName);
  const port = process.env[envName];
  if (!port) {
    throw new Error(`No port specified for ${networkName}`);
  }
  return `http://127.0.0.1:${port}`;
}

module.exports = {
  deploymentCheck,
  deployAndSaveAddress,
  convertParamsStringToArray,
  convertToOperationParams,
  getFeesAmount,
  networkNameToPortName,
  buildLocalRpcUrl,
};
