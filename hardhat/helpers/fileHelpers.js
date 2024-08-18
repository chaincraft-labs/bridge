const fs = require("fs");
const path = require("path");

const CONSTANTS_DIR = "constants";
const DEPLOYED_ADDRESSES_FILE = "deployedAddresses.json";
const DEPLOYED_ADDRESSES_FILE_PATH = path.join(
  CONSTANTS_DIR,
  DEPLOYED_ADDRESSES_FILE
);

// @todo add error if writing flow is not complete
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

//read last deployed address of token according to network
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

//read networks keys of deployedAddress.json
const readNetworks = function () {
  const deployedAddresses = JSON.parse(
    fs.readFileSync(DEPLOYED_ADDRESSES_FILE_PATH)
  );
  return Object.keys(deployedAddresses);
};

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
  readNetworks,
  logCurrentFileName,
};
