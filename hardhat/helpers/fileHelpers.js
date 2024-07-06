const fs = require("fs");
const path = require("path");

const CONSTANTS_DIR = "constants";
const DEPLOYED_ADDRESSES_FILE = "deployedAddresses.json";
const DEPLOYED_ADDRESSES_FILE_PATH = path.join(
  CONSTANTS_DIR,
  DEPLOYED_ADDRESSES_FILE
);

const writeDeployedAddress = function (
  network,
  contractName,
  address,
  tokenName = null
) {
  // console.log(
  //   `Writing deployed address of ${
  //     tokenName ? tokenName : contractName
  //   } to deployedAddresses.json...`
  // );

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
    deployedAddresses[network][contractName] = tokenName ? {} : [];
  }

  if (tokenName && !deployedAddresses[network][contractName][tokenName]) {
    deployedAddresses[network][contractName][tokenName] = [];
  }

  if (!tokenName) {
    deployedAddresses[network][contractName].push(address);
  } else {
    deployedAddresses[network][contractName][tokenName].push(address);
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
  tokenName = null
) {
  const deployedAddresses = JSON.parse(
    fs.readFileSync(DEPLOYED_ADDRESSES_FILE_PATH)
  );

  if (!deployedAddresses) {
    // console.log("READING... null object");
    return null;
  }
  // console.log("READING... network ", deployedAddresses[network]);
  if (deployedAddresses[network] && deployedAddresses[network][contractName]) {
    // console.log(
    //   "READING... first step ",
    //   deployedAddresses[network][contractName]
    // );
    if (!tokenName) {
      // console.log(
      //   "READING...",
      //   deployedAddresses[network][contractName][
      //     deployedAddresses[network][contractName].length - 1
      //   ]
      // );
      return deployedAddresses[network][contractName][
        deployedAddresses[network][contractName].length - 1
      ];
    } else {
      if (deployedAddresses[network][contractName][tokenName]) {
        // console.log(
        //   "READING...",
        //   deployedAddresses[network][contractName][
        //     deployedAddresses[network][contractName].length - 1
        //   ]
        // );
        return deployedAddresses[network][contractName][tokenName][
          deployedAddresses[network][contractName][tokenName].length - 1
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
module.exports = {
  writeDeployedAddress,
  readLastDeployedAddress,
  readNetworks,
};
