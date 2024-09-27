const fs = require("fs");
const path = require("path");
const lockfile = require("proper-lockfile");

const CONSTANTS_DIR = "constants";
const DEPLOYED_ADDRESSES_FILE = "deployedAddresses.json";
const DEPLOYED_ADDRESSES_FILE_PATH = path.join(
  CONSTANTS_DIR,
  DEPLOYED_ADDRESSES_FILE
);
const LAST_NONCE_FILE = "nonceRecord.json";
const LAST_NONCE_FILE_PATH = path.join(CONSTANTS_DIR, LAST_NONCE_FILE);
const CONFIG_PARAMS_FILE = "deploymentConfig.json";
const CONFIG_PARAMS_FILE_PATH = path.join(CONSTANTS_DIR, CONFIG_PARAMS_FILE);

///////////////////////////////////////////////////////////////////////////////
//
//                UTILS
//
///////////////////////////////////////////////////////////////////////////////
/**
 * @description Ensure that a path exists, creating it if it does not.
 *
 * @param {string} path The path to ensure exists.
 */
function ensurePathExists(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
}

/**
 * @description Ensure that a file exists, creating it with initial content if it does not.
 *
 * @param {string} filePath The path to the file to ensure exists.
 * @param {Object} initialContent The initial content to write to the file if it does not exist.
 */
function ensureFileExists(filePath, initialContent = {}) {
  if (!fs.existsSync(filePath)) {
    writeFile(filePath, initialContent);
  }
}

/**
 * @description Ensure that a key exists in an object, creating it with a default value if it does not.
 *
 * @param {Object} object The object to ensure the key exists in.
 * @param {string} key The key to ensure exists in the object.
 * @param {any} defaultValue The default value to assign to the key if it does not exist.
 */
function ensureExists(object, key, defaultValue = {}) {
  if (!object[key]) {
    object[key] = defaultValue;
  }
}

/**
 * @description Write data to a file.
 *
 * @param {string} filePath
 * @param {Object} data
 * @throws {Error} If an error occurs while writing the file.
 */
const writeFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing file:", error);
    throw error;
  }
};

/**
 * @description Read data from a file.
 *
 * @param {string} filePath
 * @returns {Object} The data read from the file.
 * @throws {Error} If an error occurs while reading the file.
 */
const readFile = (filePath) => {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Error reading file:", error);
    throw error;
  }
};

/**
 * @description Read data from a file while locking it to prevent concurrent writes.
 *
 * @param {string} filePath
 * @returns {Object} The data read from the file and a release function to unlock the file.
 * @throws {Error} If an error occurs while reading the file.
 * @throws {Error} If an error occurs while locking the file.
 */
const readLockedFile = (filePath) => {
  let release;
  try {
    release = lockfile.lockSync(filePath, { stale: 5000 });
    const data = readFile(filePath); // Utilisation de readFile
    return { data, release };
  } catch (error) {
    console.error("Error reading locked file:", error);
    throw error;
  }
};

///////////////////////////////////////////////////////////////////////////////
//
//                RESET JSON FILES (DEPLOYED ADDRESSES & NONCE RECORD)
//
///////////////////////////////////////////////////////////////////////////////
/**
 * @description Reset the deployed addresses and nonce record JSON files.
 *
 * @dev This function will overwrite the existing files with empty objects.
 * @dev It is used to clear the data from the files when needed.
 */
const resetJsonFiles = function () {
  ensureFileExists(DEPLOYED_ADDRESSES_FILE_PATH);
  writeFile(DEPLOYED_ADDRESSES_FILE_PATH, {});

  ensureFileExists(LAST_NONCE_FILE_PATH, { originNonces: {} });
  writeFile(LAST_NONCE_FILE_PATH, { originNonces: {} });
};

///////////////////////////////////////////////////////////////////////////////
//
//                CONFIG FILES HELPERS
//
///////////////////////////////////////////////////////////////////////////////
/**
 * @description Get config params from config files
 *
 * @dev Composed of networkParams, usedConfigs, activeConfig, forkPorts
 * @returns {Object} The config params from the config file
 */
const getConfigParams = function () {
  const configParams = readFile(CONFIG_PARAMS_FILE_PATH);
  return configParams;
};

/**
 * @description Update config params in config files
 *
 * @param {Object} configParams The new config params to write to the file.
 */
function updateConfigParams(configParams) {
  writeFile(CONFIG_PARAMS_FILE_PATH, configParams);
}

///////////////////////////////////////////////////////////////////////////////
//
//                WRITE / READ LAST DEPLOYED ADDRESSES
//
///////////////////////////////////////////////////////////////////////////////
/**
 * @description - Logs in constants/... .json addresses of deployed contracts
 * @description - Format:
 * {
 *  "networkName": {
 *      "ContractName": [addresses],
 *      "MockedToken" | "BridgedToken":{
 *          "tokenSymbol": [addresses]
 *       },
 *   },
 * }
 * @param { string } network The network to read.
 * @param { string } contractName The name of the contract to get the address
 * @param { string } tokenSymbol Optional. If Contract is a token specify its symbol
 */
const writeDeployedAddress = function (
  network,
  contractName,
  address,
  tokenSymbol = null
) {
  // file and path checks
  ensurePathExists(CONSTANTS_DIR);
  ensureFileExists(DEPLOYED_ADDRESSES_FILE_PATH);

  // Get json data from file
  const deployedAddresses = readFile(DEPLOYED_ADDRESSES_FILE_PATH);

  ensureExists(deployedAddresses, network);
  ensureExists(deployedAddresses[network], contractName, tokenSymbol ? {} : []);

  if (tokenSymbol) {
    ensureExists(deployedAddresses[network][contractName], tokenSymbol, []);
    deployedAddresses[network][contractName][tokenSymbol].push(address);
  } else {
    deployedAddresses[network][contractName].push(address);
  }

  writeFile(DEPLOYED_ADDRESSES_FILE_PATH, deployedAddresses);
};

/**
 * @description read last deployed address of token according to network
 * @description - Format:
 * {
 *  "networkName": {
 *      "ContractName": [addresses],
 *      "MockedToken" | "BridgedToken":{
 *          "tokenSymbol": [addresses]
 *       },
 *   },
 * }
 * @param { string } network The network to read.
 * @param { string } contractName The name of the contract to get the address
 * @param { string } tokenSymbol Optional. If Contract is a token specify its symbol
 */
const readLastDeployedAddress = function (
  network,
  contractName,
  tokenSymbol = null
) {
  const deployedAddresses = readFile(DEPLOYED_ADDRESSES_FILE_PATH);

  if (!deployedAddresses) {
    return null;
  }
  if (deployedAddresses[network] && deployedAddresses[network][contractName]) {
    const addresses = deployedAddresses[network][contractName];
    if (!tokenSymbol) {
      return addresses[addresses.length - 1];
    } else {
      if (addresses[tokenSymbol]) {
        return addresses[tokenSymbol][addresses[tokenSymbol].length - 1];
      }
    }
  }
  return null;
};

///////////////////////////////////////////////////////////////////////////////
//
//                WRITE / READ NONCE USED ON NETWORKS
//
///////////////////////////////////////////////////////////////////////////////

/**
 * @description Write the last used nonce for a specific user a specific network to a JSON file.
 *
 * @dev This function creates the necessary directory and file if they do not exist.
 * @dev The nonce is added to the existing list for the specified network.
 * @dev This function uses file locking to prevent concurrent writes to the nonce file.
 * @dev It ensures that only one process can write to the file at a time, preventing data corruption.
 *
 * @param {string} network - The network for which the nonce is being written.
 * @param {number} nonce - The nonce value to add to the list.
 * @param {string} userAddress - The address of the user for which the nonce is being written.
 */
const writeLastUsedNonce = function (network, nonce, userAddress) {
  ensurePathExists(CONSTANTS_DIR);
  ensureFileExists(LAST_NONCE_FILE_PATH, { originNonces: {} });

  let release;
  try {
    // Lock then read file and get json data
    const { data: lastNonce, release: rel } =
      readLockedFile(LAST_NONCE_FILE_PATH);
    release = rel;

    ensureExists(lastNonce.originNonces, network);
    ensureExists(lastNonce.originNonces[network], userAddress, []);

    // Add the nonce to the list then write it back to the file
    lastNonce.originNonces[network][userAddress].push(nonce);
    writeFile(LAST_NONCE_FILE_PATH, lastNonce);
  } catch (error) {
    console.error("Error writing nonce while acquiring lock :", error);
  } finally {
    if (release) {
      // Unlock the file
      release();
    }
  }
};

/**
 * @description Read the first valid nonce for a specific user a specific network and remove it from the list.
 *
 * @dev This function locks the file to ensure thread safety while reading the nonce.
 * @dev It prevents race conditions by ensuring that only one process can read the file at a time.
 * @dev If the file is empty or not valid JSON, appropriate error messages are logged.
 *
 * @param {string} network - The network for which the nonce is being read.
 * @param {string} userAddress - The address of the user for which the nonce is being read.
 * @returns {number|null} The first available nonce or null if none exists or if an error occurs.
 */
const readFirstValidNonce = function (network, userAddress) {
  let release;
  try {
    // Lock then read file and get json data
    const { data: lastNonce, release: rel } =
      readLockedFile(LAST_NONCE_FILE_PATH);
    release = rel;

    if (!lastNonce) return null;
    const nonces = lastNonce.originNonces[network]?.[userAddress];
    if (!nonces || nonces.length === 0) {
      console.error("Error: No nonce found for network or user.");
      return null;
    }

    // Read and remove the first available nonce
    const nonceToProcess = nonces.shift();
    // Update the file with the remaining nonce list
    writeFile(LAST_NONCE_FILE_PATH, lastNonce);
    return nonceToProcess;
  } catch (error) {
    console.error("Error reading nonce while acquiring lock :", error);
  } finally {
    if (release) {
      release();
    }
  }
};

///////////////////////////////////////////////////////////////////////////////
//
//               OTHER FILE HELPERS
//
///////////////////////////////////////////////////////////////////////////////

/**
 * @description Get networks used for previous deployments
 */
const readNetworks = function () {
  const deployedAddresses = readFile(DEPLOYED_ADDRESSES_FILE_PATH);
  return Object.keys(deployedAddresses);
};

/**
 * @description Get current file executing a call
 */
function logCurrentFileName() {
  const stack = new Error().stack;
  // extract the name of the file
  const callerFileName = stack.split("\n")[2].trim().split("/").pop();
  // remove line info at the end
  const fileNameWithoutLineInfo = callerFileName.split(":")[0];
  // console.log(`Name of the file currently processed : ${fileNameWithoutLineInfo}`);
  return fileNameWithoutLineInfo;
}

module.exports = {
  writeDeployedAddress,
  readLastDeployedAddress,
  writeLastUsedNonce,
  readFirstValidNonce,
  readNetworks,
  logCurrentFileName,
  resetJsonFiles,
  getConfigParams,
  updateConfigParams,
};
