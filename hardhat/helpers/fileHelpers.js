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
  if (!fs.existsSync(CONSTANTS_DIR)) {
    fs.mkdirSync(CONSTANTS_DIR);
  }

  if (!fs.existsSync(DEPLOYED_ADDRESSES_FILE_PATH)) {
    fs.writeFileSync(DEPLOYED_ADDRESSES_FILE_PATH, "{}");
  }

  // Get json data from file
  const deployedAddresses = JSON.parse(
    fs.readFileSync(DEPLOYED_ADDRESSES_FILE_PATH)
  );

  // Checks if elements exist in the json data and creates them if they don't. Then push the new address
  if (!deployedAddresses[network]) {
    deployedAddresses[network] = {};
  }

  if (!deployedAddresses[network][contractName]) {
    deployedAddresses[network][contractName] = tokenSymbol ? {} : [];
  }

  if (tokenSymbol && !deployedAddresses[network][contractName][tokenSymbol]) {
    deployedAddresses[network][contractName][tokenSymbol] = [];
  }

  if (!tokenSymbol) {
    deployedAddresses[network][contractName].push(address);
  } else {
    deployedAddresses[network][contractName][tokenSymbol].push(address);
  }

  fs.writeFileSync(
    DEPLOYED_ADDRESSES_FILE_PATH,
    JSON.stringify(deployedAddresses, null, 2)
  );
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
  const deployedAddresses = JSON.parse(
    fs.readFileSync(DEPLOYED_ADDRESSES_FILE_PATH)
  );

  if (!deployedAddresses) {
    return null;
  }
  if (deployedAddresses[network] && deployedAddresses[network][contractName]) {
    if (!tokenSymbol) {
      return deployedAddresses[network][contractName][
        deployedAddresses[network][contractName].length - 1
      ];
    } else {
      if (deployedAddresses[network][contractName][tokenSymbol]) {
        return deployedAddresses[network][contractName][tokenSymbol][
          deployedAddresses[network][contractName][tokenSymbol].length - 1
        ];
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
  // File and path checks
  if (!fs.existsSync(CONSTANTS_DIR)) {
    fs.mkdirSync(CONSTANTS_DIR);
  }

  if (!fs.existsSync(LAST_NONCE_FILE_PATH)) {
    fs.writeFileSync(
      LAST_NONCE_FILE_PATH,
      JSON.stringify({ originNonces: {} }, null, 2)
    );
  }

  let release;
  try {
    release = lockfile.lockSync(LAST_NONCE_FILE_PATH, { stale: 5000 });

    // Get json data from file
    const fileContent = fs.readFileSync(LAST_NONCE_FILE_PATH, "utf8");
    let lastNonce = fileContent
      ? JSON.parse(fileContent)
      : { originNonces: {} };

    // Initialize the network and user array if it doesn't exist
    if (!lastNonce.originNonces[network]) {
      lastNonce.originNonces[network] = {};
    }
    if (!lastNonce.originNonces[network][userAddress]) {
      lastNonce.originNonces[network][userAddress] = [];
    }

    // Add the nonce to the list then write it back to the file
    lastNonce.originNonces[network][userAddress].push(nonce);
    fs.writeFileSync(LAST_NONCE_FILE_PATH, JSON.stringify(lastNonce, null, 2));
  } catch (error) {
    console.error("Error while acquiring lock :", error);
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
    // Lock the file
    release = lockfile.lockSync(LAST_NONCE_FILE_PATH, { stale: 5000 });

    const fileContent = fs.readFileSync(LAST_NONCE_FILE_PATH, "utf8");
    if (!fileContent) {
      console.error("Error while reading last used nonce: file is empty");
      return null;
    }

    let lastNonce;
    try {
      lastNonce = JSON.parse(fileContent);
    } catch (jsonError) {
      console.error(
        "Error while reading last used nonce: file is not a valid JSON",
        jsonError
      );
      return null;
    }
    // Check if the requested network and user have any nonces
    if (
      !lastNonce ||
      !lastNonce.originNonces[network] ||
      !lastNonce.originNonces[network][userAddress]
    ) {
      console.error(
        "Error while reading last used nonce: no nonce found for network"
      );
      return null;
    }

    if (lastNonce.originNonces[network][userAddress].length > 0) {
      // read the first available nonce to process and remove it from the list
      const nonceToProcess =
        lastNonce.originNonces[network][userAddress].shift();
      fs.writeFileSync(
        LAST_NONCE_FILE_PATH,
        JSON.stringify(lastNonce, null, 2)
      );
      return nonceToProcess;
    }
    return null;
  } catch (error) {
    console.error("Error while acquiring lock :", error);
  } finally {
    if (release) {
      release();
    }
  }
};

/**
 * @description Get networks used for previous deployments
 */
const readNetworks = function () {
  const deployedAddresses = JSON.parse(
    fs.readFileSync(DEPLOYED_ADDRESSES_FILE_PATH)
  );
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
};
