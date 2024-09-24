const fs = require("fs");
const path = require("path");

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
 * @description Update nonce used on network to used on destination
 *
 * @dev Format: "lastOriginNonce": { "sepolia": 0, "allfeat": 0 }
 * @dev Used by deposit scripts
 *
 * @param { string } network The network to read.
 * @param { number } nonce The current nonce used.
 */
const writeLastUsedNonce = function (network, nonce) {
  // file and path checks
  if (!fs.existsSync(CONSTANTS_DIR)) {
    fs.mkdirSync(CONSTANTS_DIR);
  }

  if (!fs.existsSync(LAST_NONCE_FILE_PATH)) {
    fs.writeFileSync(LAST_NONCE_FILE_PATH, "{}");
  }

  // Get json data from file
  const lastNonce = JSON.parse(fs.readFileSync(LAST_NONCE_FILE_PATH));

  // Checks if elements exist in the json data and creates them if they don't. Then push the new address
  if (!lastNonce["lastOriginNonce"]) {
    lastNonce["lastOriginNonce"] = {};
  }

  lastNonce["lastOriginNonce"][network] = nonce;

  fs.writeFileSync(LAST_NONCE_FILE_PATH, JSON.stringify(lastNonce, null, 2));
};

/**
 * @description Read nonce used on origin network to used on destination
 *
 * @dev Format: "lastOriginNonce": { "sepolia": 0, "allfeat": 0 }
 * @dev Used by depositFees scripts
 *
 * @param { string } network The network to read.
 * @returns The last nonce used on origin.
 */
const readLastUsedNonce = function (network) {
  const lastNonce = JSON.parse(fs.readFileSync(LAST_NONCE_FILE_PATH));

  if (!lastNonce) {
    return null;
  }

  if (
    lastNonce["lastOriginNonce"] &&
    lastNonce["lastOriginNonce"][network] != null
  ) {
    return lastNonce["lastOriginNonce"][network];
  }
  return null;
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
  readLastUsedNonce,
  readNetworks,
  logCurrentFileName,
};
