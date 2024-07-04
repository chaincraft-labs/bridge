const fs = require("fs");

const writeDeployedAddress = function (
  network,
  contractName,
  address,
  tokenName = null
) {
  console.log(
    `Writing deployed address of ${
      tokenName ? tokenName : contractName
    } to deployedAddresses.json...`
  );

  // file and path checks
  if (!fs.existsSync("constants")) {
    fs.mkdirSync("constants");
  }
  if (!fs.existsSync("constants/deployedAddresses.json")) {
    fs.writeFileSync("constants/deployedAddresses.json", "{}");
  }

  // Get json data from file
  const deployedAddresses = JSON.parse(
    fs.readFileSync("constants/deployedAddresses.json")
  );

  // Checks if elements exist in the json data and creates them if they don't. Then push the new address
  if (!deployedAddresses[network]) {
    deployedAddresses[network] = {};
  }
  //   if (!tokenName) {
  if (!deployedAddresses[network][contractName]) {
    deployedAddresses[network][contractName] = tokenName ? {} : [];
  }
  // deployedAddresses[network][contractName].push(address);
  //   } else {
  // if (!deployedAddresses[network][contractName]) {
  //   deployedAddresses[network][contractName] = {};
  // }
  if (tokenName && !deployedAddresses[network][contractName][tokenName]) {
    deployedAddresses[network][contractName][tokenName] = [];
  }
  // deployedAddresses[network][contractName][tokenName].push(address);

  if (!tokenName) {
    deployedAddresses[network][contractName].push(address);
  } else {
    deployedAddresses[network][contractName][tokenName].push(address);
  }
  //   }
  fs.writeFileSync(
    "constants/deployedAddresses.json",
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
    fs.readFileSync("constants/deployedAddresses.json")
  );
  console.log("TYPE OF OBJECT FILE", typeof deployedAddresses);
  // is object null
  if (!deployedAddresses) {
    console.log("READING... null object");
    return null;
  }
  console.log("READING... network ", deployedAddresses[network]);
  if (deployedAddresses[network] && deployedAddresses[network][contractName]) {
    console.log(
      "READING... first step ",
      deployedAddresses[network][contractName]
    );
    if (!tokenName) {
      console.log(
        "READING...",
        deployedAddresses[network][contractName][
          deployedAddresses[network][contractName].length - 1
        ]
      );
      return deployedAddresses[network][contractName][
        deployedAddresses[network][contractName].length - 1
      ];
    } else {
      if (deployedAddresses[network][contractName][tokenName]) {
        console.log(
          "READING...",
          deployedAddresses[network][contractName][
            deployedAddresses[network][contractName].length - 1
          ]
        );
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
    fs.readFileSync("constants/deployedAddresses.json")
  );
  return Object.keys(deployedAddresses);
};
module.exports = {
  writeDeployedAddress,
  readLastDeployedAddress,
  readNetworks,
};
