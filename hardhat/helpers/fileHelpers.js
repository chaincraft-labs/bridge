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
  if (fs.existsSync(DEPLOYED_ADDRESSES_FILE_PATH)) {
    fs.writeFileSync(DEPLOYED_ADDRESSES_FILE_PATH, "{}");
  }

  if (fs.existsSync(LAST_NONCE_FILE_PATH))
    fs.writeFileSync(
      LAST_NONCE_FILE_PATH,
      JSON.stringify({ originNonces: {} })
    );
};

///////////////////////////////////////////////////////////////////////////////
//
//                CONFIG FILES HELPERS
//
///////////////////////////////////////////////////////////////////////////////
/**
 * @description Get forkPorts from config files
 * @returns {Object} The forkPorts from the config file
 */
const getForkPorts = function () {
  const configParams = JSON.parse(fs.readFileSync(CONFIG_PARAMS_FILE_PATH));
  if (!configParams.forkPorts) {
    throw new Error("Fork ports not found in config file!");
  }
  return configParams.forkPorts;
};

// @todo refactor inside loop
/**
 * @description Get networkParams, tokenParams from config files
 *
 * @dev This function reads the networkParams from the config files and create tokenParams
 * @dev It is used to get the parameters for the operations & deployments in the scripts
 *
 * @dev networkParams: for each network give its chainId, native token name and symbol, and deployed tokens
 * @dev format: { networkName: { chainId, nativeToken: { name, symbol }, deployedTokens: [] } }
 *
 * @dev tokenParams: for each token give its description, if it's a native coin and which chain is its origin chain
 * @dev format: { tokenName: { tokenName, tokenSymbol, originChainId: [], isNative } }
 *
 * @returns {Object} The networkParams and tokenParams from the config file
 */
const getConfigParams = function () {
  const configParams = JSON.parse(fs.readFileSync(CONFIG_PARAMS_FILE_PATH));
  // Test if networkParams and tokenParams are present in the config file
  if (!configParams.networkParams) {
    throw new Error("Network params not found in config file!");
  }

  const networkParams = configParams.networkParams;
  const tokenParams = {};

  // Loop through the networkParams to get the deployedTokens and nativeToken
  for (const networkName in networkParams) {
    // Add the native token to the tokenParams
    const nativeToken = networkParams[networkName].nativeToken;
    if (!tokenParams[nativeToken.name]) {
      tokenParams[nativeToken.name] = {
        tokenName: nativeToken.name,
        tokenSymbol: nativeToken.symbol,
        originChainId: [],
      };
    }
    tokenParams[nativeToken.name].originChainId.push(
      networkParams[networkName].chainId
    );
    tokenParams[nativeToken.name].isNative = true;

    // Loop through the deployedTokens to get the tokenParams
    const deployedTokens = networkParams[networkName].deployedTokens;
    deployedTokens.forEach((token) => {
      if (!tokenParams[token.name]) {
        tokenParams[token.name] = {
          tokenName: token.name,
          tokenSymbol: token.symbol,
          originChainId: [networkParams[networkName].chainId],
        };
      } else {
        if (
          !tokenParams[token.name].originChainId.includes(
            networkParams[networkName].chainId
          )
        ) {
          tokenParams[token.name].originChainId.push(
            networkParams[networkName].chainId
          );
        }
      }
    });
  }
  return {
    networkParams,
    tokenParams,
  };
};

/**
 * @description Get usedNetworks and usedTokens from config files
 *
 * @dev usedNetworks: list of networks to use for the deployment and scripts
 * @dev usedTokens: list of tokens to use for the deployment and scripts
 * @dev Theses lists are used to restrict the deployment and operations
 * @dev And to automate the deployment of tokens and contracts
 * @returns {Object} The usedNetworks and usedTokens from the config file
 */
const getUsedNetworksAndTokens = function () {
  const configParams = JSON.parse(fs.readFileSync(CONFIG_PARAMS_FILE_PATH));
  // Test if usedNetworks and usedTokens are present in the config file
  if (!configParams.activeConfig) {
    throw new Error("No active config found!");
  }
  // Test if usedNetworks and usedTokens are present in the config file
  if (!configParams.usedConfigs) {
    throw new Error("Used configs not found in config file!");
  }
  if (!configParams.usedConfigs[configParams.activeConfig]) {
    throw new Error("Used config not found for this active config!");
  }
  if (
    !configParams.usedConfigs[configParams.activeConfig].usedNetworks ||
    !configParams.usedConfigs[configParams.activeConfig].usedTokens
  ) {
    throw new Error(
      `Used Networks or Tokens not found for the config ${configParams.activeConfig}!`
    );
  }

  return {
    usedNetworks:
      configParams.usedConfigs[configParams.activeConfig].usedNetworks,
    usedTokens: configParams.usedConfigs[configParams.activeConfig].usedTokens,
  };
};

function setActiveConfig(name) {
  const configParams = JSON.parse(fs.readFileSync(CONFIG_PARAMS_FILE_PATH));
  if (configParams.usedConfigs[name]) {
    configParams.activeConfig = name;
    fs.writeFileSync(
      DEPLOYED_ADDRESSES_FILE_PATH,
      JSON.stringify(configParams, null, 2)
    );
  } else {
    throw new Error(`Le label '${name}' n'existe pas dans usedConfigs.`);
  }
}

function getActiveConfig() {
  const configParams = JSON.parse(fs.readFileSync(CONFIG_PARAMS_FILE_PATH));
  return configParams.activeConfig;
}

function getUsedConfigs() {
  const configParams = JSON.parse(fs.readFileSync(CONFIG_PARAMS_FILE_PATH));
  return configParams.usedConfigs;
}

async function addUsedConfig(name, networks, tokens) {
  try {
    const data = fs.readFileSync(CONFIG_PARAMS_FILE_PATH, "utf8");
    const configParams = JSON.parse(data);
    if (configParams.usedConfigs[name]) {
      throw new Error(`usedConfig '${name}' already exists.`);
    }
    configParams.usedConfigs[name] = {
      usedNetworks: networks,
      usedTokens: tokens,
    };
    fs.writeFileSync(
      CONFIG_PARAMS_FILE_PATH,
      JSON.stringify(configParams, null, 2)
    );
  } catch (error) {
    console.error(`Erreur lors de l'ajout du usedConfig : ${error.message}`);
    throw error; // Rejeter l'erreur pour la gestion dans la tâche
  }
}

// Fonction pour ajouter un token déployé à un réseau
function addDeployedToken(networkName, tokenName, tokenSymbol, tokenAddress) {
  const data = fs.readFileSync(CONFIG_PARAMS_FILE_PATH, "utf8");
  const configParams = JSON.parse(data);

  // Vérifier si le réseau existe
  if (!configParams.networkParams || !configParams.networkParams[networkName]) {
    throw new Error(
      `Le réseau '${networkName}' n'existe pas dans networkParams.`
    );
  }

  const network = configParams.networkParams[networkName];

  // Checks if 'mocked' in name: no address else throw error
  if (tokenName.includes("mocked") && tokenAddress) {
    throw new Error(
      `L'adresse du token ne doit pas être fournie pour les tokens mockés.`
    );
  }
  if (!tokenName.includes("mocked") && !tokenAddress) {
    throw new Error(
      `L'adresse du token  doit  être fournie pour les vrais tokens .`
    );
  }

  // Vérifier les conditions pour l'ajout du token
  if (tokenName.includes("mocked")) {
    // Ajouter le token directement avec son nom et symbole
    network.deployedTokens.push({ name: tokenName, symbol: tokenSymbol });
  } else {
    // Vérifier les conditions pour les forks
    // if (!networkName.includes("Fork")) {
    //   throw new Error(
    //     `Le réseau '${networkName}' ne permet pas l'ajout de tokens non mockés.`
    //   );
    // }

    if (!tokenAddress) {
      throw new Error(
        `L'adresse du token doit être fournie pour les tokens non mockés.`
      );
    }

    // Ajouter le token avec l'adresse
    network.deployedTokens.push({
      name: tokenName,
      symbol: tokenSymbol,
      address: tokenAddress,
    });
  }

  // Écrire le fichier JSON mis à jour
  fs.writeFileSync(
    CONFIG_PARAMS_FILE_PATH,
    JSON.stringify(configParams, null, 2)
  );
  // console.log(
  //   `Le token '${tokenName}' a été ajouté au réseau '${networkName}'.`
  // );
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

///////////////////////////////////////////////////////////////////////////////
//
//               OTHER FILE HELPERS
//
///////////////////////////////////////////////////////////////////////////////

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
  resetJsonFiles,
  getConfigParams,
  getUsedNetworksAndTokens,
  setActiveConfig,
  getUsedConfigs,
  addUsedConfig,
  addDeployedToken,
  getForkPorts,
  getActiveConfig,
};
