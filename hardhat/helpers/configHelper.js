const {
  getConfigParams,
  updateConfigParams,
  getSimulationConfig,
  updateSimulationConfig,
} = require("./fileHelpers");

///////////////////////////////////////////////////////////////////////////////
//
//              CONSTANTS
//
///////////////////////////////////////////////////////////////////////////////
// Hardcoded fees constant (waiting for fees features to be implemented)
const FEES_AMOUNT = 1_000_000_000_000_000n; //0.001

///////////////////////////////////////////////////////////////////////////////
//
//                UTILS
//
///////////////////////////////////////////////////////////////////////////////
/**
 * @description Check if a key exists in an object
 *
 * @param {Object} obj The object to check
 * @param {string} key The key to check
 * @param {boolean} shouldExist Default: true. If the key should exist or not
 * @throws {Error} If the key should exist and does not exist
 * @throws {Error} If the key should not exist and does exist
 */
function checkExistence(obj, key, shouldExist = true) {
  if (shouldExist && !obj[key]) {
    throw new Error(`'${key}' does not exist.`);
  }
  if (!shouldExist && obj[key]) {
    throw new Error(`'${key}' already exists.`);
  }
}

/**
 * @description Ensure that a key exists in an object and set it to a default value if it does not
 *
 * @param {Object} obj The object to check
 * @param {string} key The key to check
 * @param {any} defaultValue The default value to set the key to
 */
function ensureExist(obj, key, defaultValue) {
  if (!obj[key]) {
    obj[key] = defaultValue;
  }
}

/**
 * @description Add an item to a list if it is not already in the list
 *
 * @param {any} item The item to add to the list
 * @param {Array} list The list to add the item to
 */
function addItemToList(item, list) {
  if (!list.includes(item)) {
    list.push(item);
  }
}

/**
 * @description Ensure that a token exists in the registry
 *
 * @param {Object} registry The registry to check (tokenParams)
 * @param {Object} token The token to check
 */
function ensureTokenExists(registry, token) {
  if (!registry[token.name]) {
    registry[token.name] = {
      tokenName: token.name,
      tokenSymbol: token.symbol,
      originChainId: [],
    };
  }
}

/**
 * @description Build a token entry for the networkParams
 *
 * @param {string} tokenName The name of the token
 * @param {string} tokenSymbol The symbol of the token
 * @param {string} tokenAddress The address of the token
 * @returns {Object} The token entry
 * @throws {Error} If the address is not provided for non-mocked tokens
 * @throws {Error} If the address is provided for mocked tokens
 */
function buildTokenEntry(tokenName, tokenSymbol, tokenAddress) {
  const isMocked = tokenName.includes("mocked");
  if (!isMocked && !tokenAddress) {
    throw new Error(
      `The address of the token must be provided for non-mocked tokens.`
    );
  }
  if (isMocked && tokenAddress) {
    throw new Error(
      `The address of the token must not be provided for mocked tokens.`
    );
  }
  const tokenToAdd = {
    name: tokenName,
    symbol: tokenSymbol,
  };
  if (tokenAddress) {
    tokenToAdd.address = tokenAddress;
  }

  return tokenToAdd;
}

///////////////////////////////////////////////////////////////////////////////
//
//                DESCRIPTION OF NETWORKS AND TOKENS:
//
///////////////////////////////////////////////////////////////////////////////

/**
 * @description Get all the config parameters from the config file
 *
 * @dev This function reads the config file and returns the config params
 * @dev structure: { networkParams, usedConfigs, activeConfig }
 *
 * @returns {Object} The config params from the config file
 */
const configParams = getConfigParams();

/**
 * @description Get networkParams, tokenParams from configParams
 *
 * @dev This function reads the networkParams and create tokenParams
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
const getNetworkAndTokenParams = () => {
  checkExistence(configParams, "networkParams");

  const networkParams = configParams.networkParams;
  const tokenParams = {};

  // Loop through the networkParams to get the deployedTokens and nativeToken
  for (const networkName in networkParams) {
    // Add the native token to the tokenParams
    const nativeToken = networkParams[networkName].nativeToken;

    ensureTokenExists(tokenParams, nativeToken);
    addItemToList(
      networkParams[networkName].chainId,
      tokenParams[nativeToken.name].originChainId
    );
    tokenParams[nativeToken.name].isNative = true;

    // Loop through the deployedTokens to get the tokenParams
    const deployedTokens = networkParams[networkName].deployedTokens;
    deployedTokens.forEach((token) => {
      ensureTokenExists(tokenParams, token);
      addItemToList(
        networkParams[networkName].chainId,
        tokenParams[token.name].originChainId
      );
    });
  }
  return {
    networkParams,
    tokenParams,
  };
};

/**
 * @description Description of networks and tokens configuration
 *
 * @dev networkParams: for each network give its chainId, native token name and symbol, and deployed tokens
 * @dev format: { networkName: { chainId, nativeToken: { name, symbol }, deployedTokens: [] } }
 *
 * @dev tokenParams: for each token give its description, if it's a native coin and which chain is its origin chain
 * @dev format: { tokenName: { tokenName, tokenSymbol, originChainId: [], isNative } }
 * @returns { networkParams, tokenParams } object
 */
const { networkParams, tokenParams } = getNetworkAndTokenParams();

/**
 * @description Add a token to the networkParams deployedTokens
 *
 * @param {string} networkName The name of the network
 * @param {string} tokenName The name of the token
 * @param {string} tokenSymbol The symbol of the token
 * @param {string} tokenAddress The address of the token
 * @throws {Error} If the network does not exist in networkParams
 * @throws {Error} If the token already exists in the network
 * @throws {Error} If the address is not provided for non-mocked tokens
 * @throws {Error} If the address is provided for mocked tokens
 */
function addDeployedToken(networkName, tokenName, tokenSymbol, tokenAddress) {
  if (!configParams.networkParams || !configParams.networkParams[networkName]) {
    throw new Error(
      `The network '${networkName}' does not exist in the networkParams.`
    );
  }

  const network = configParams.networkParams[networkName];
  if (network.deployedTokens.find((token) => token.name === tokenName)) {
    throw new Error(
      `The token '${tokenName}' already exists in the network '${networkName}'.`
    );
  }

  const tokenToAdd = buildTokenEntry(tokenName, tokenSymbol, tokenAddress);
  network.deployedTokens.push(tokenToAdd);

  updateConfigParams(configParams);
}

///////////////////////////////////////////////////////////////////////////////
//
//                USED CONFIGS
//
///////////////////////////////////////////////////////////////////////////////

/**
 * @description Get the active config from config files
 *
 * @dev activeConfig: the name of the usedConfigs to use for the deployment and scripts
 */
function getActiveConfig() {
  checkExistence(configParams, "activeConfig");
  return configParams.activeConfig;
}

/**
 * @description Get the usedConfigs from config files
 */
function getUsedConfigs() {
  checkExistence(configParams, "usedConfigs");
  return configParams.usedConfigs;
}

/**
 * @description Set the active config to switch between usedConfigs used
 */
function setActiveConfig(name) {
  checkExistence(configParams.usedConfigs, name);

  configParams.activeConfig = name;
  updateConfigParams(configParams);
}

/**
 * @description Add a usedConfig to the config files
 *
 * @dev add a config with its usedNetworks and usedTokens
 * @param {string} name The name of the usedConfig
 * @param {Array} networks The used networks
 * @param {Array} tokens The used tokens
 */
function addUsedConfig(name, networks, tokens) {
  try {
    checkExistence(configParams.usedConfigs, name, false);

    configParams.usedConfigs[name] = {
      usedNetworks: networks,
      usedTokens: tokens,
    };
    updateConfigParams(configParams);
  } catch (error) {
    console.error(`Error while adding the usedConfig: ${error.message}`);
    throw error;
  }
}

/**
 * @description Add a network or a token to a usedConfig
 *
 * @param {string} config The name of the usedConfig
 * @param {string} label The label of the list to add to (usedNetworks or usedTokens)
 * @param {string} value The value to add to the list
 */
function addToConfig(config, label, value) {
  try {
    if (label !== "usedNetworks" && label !== "usedTokens") {
      throw new Error(`Label '${label}' not recognized.`);
    }

    checkExistence(configParams.usedConfigs, config);
    ensureExist(configParams.usedConfigs[config], label, []);
    // Check if the value is already in the list
    if (configParams.usedConfigs[config][label].includes(value)) {
      throw new Error(`Value '${value}' already in the list.`);
    }

    configParams.usedConfigs[config][label].push(value);
    updateConfigParams(configParams);
  } catch (error) {
    console.error(`Error while adding to config: ${error.message}`);
    throw error;
  }
}

/**
 * @description Remove a config from the usedConfigs
 *
 * @param {string} config The name of the usedConfig
 * @throws {Error} If the config does not exist
 */
function removeConfig(config) {
  try {
    checkExistence(configParams.usedConfigs, config, true);
    delete configParams.usedConfigs[config];
    updateConfigParams(configParams);
  } catch (error) {
    console.error(`Error while removing config: ${error.message}`);
    throw error;
  }
}

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
  const activeConfig = getActiveConfig();
  const usedConfigs = getUsedConfigs();

  // Test if usedNetworks and usedTokens are present in the config file
  if (!activeConfig) {
    throw new Error("No active config found!");
  }
  // Test if usedNetworks and usedTokens are present in the config file
  if (!usedConfigs) {
    throw new Error("Used configs not found in config file!");
  }
  if (!usedConfigs[activeConfig]) {
    throw new Error("Used config not found for this active config!");
  }
  if (
    !usedConfigs[activeConfig].usedNetworks ||
    !usedConfigs[activeConfig].usedTokens
  ) {
    throw new Error(
      `Used Networks or Tokens not found for the config ${activeConfig}!`
    );
  }

  return {
    usedNetworks: usedConfigs[activeConfig].usedNetworks,
    usedTokens: usedConfigs[activeConfig].usedTokens,
  };
};

/**
 * @description Get the desired networks and tokens to be used
 *
 * @dev This function reads the 'usedNetworks' and 'usedTokens' from the 'deploymentConfig.json' file
 * @dev format: { usedNetworks: [], usedTokens: [] }
 * @dev Theses arrays are used to filter the networks and tokens to be used in the deployment
 * @dev automation and scripts
 * @returns { usedNetworks, usedTokens } object
 */
const { usedNetworks, usedTokens } = getUsedNetworksAndTokens();

///////////////////////////////////////////////////////////////////////////////
//
//                SIMULATION PARAMS HELPERS
//
///////////////////////////////////////////////////////////////////////////////
/**
 * @description All the simulation parameters from the config file
 */
const simulationParams = getSimulationConfig();

/**
 * @description Get params for a specific scenario & network
 *
 * @param {string} scenario The scenario to get the params for
 * @param {string} network The network to get the params for
 * @returns {Object} The params for the scenario and network
 */
function getSimulationParams(scenario, network) {
  checkExistence(simulationParams, scenario);
  checkExistence(simulationParams[scenario], network);
  return simulationParams[scenario][network];
}

/**
 * @description Update the simulation params for a specific scenario & network
 *
 *  @param {string} scenario The scenario to update the params for
 * @param {string} network The network to update the params for
 * @param {Object} params The new params for the scenario and network
 */
function updateSimulationParams(scenario, network, params) {
  checkExistence(simulationParams, scenario);
  simulationParams[scenario][network] = params;
  updateSimulationConfig(simulationParams);
}

///////////////////////////////////////////////////////////////////////////////
//
//                NETWORK HELPERS
//
///////////////////////////////////////////////////////////////////////////////

/**
 * @description Get the chainId of a network by its name
 */
const getChainIdByNetworkName = (name) => {
  return networkParams[name].chainId;
};

/**
 * @description Get the network name by its chainId
 */
const getNetworkNameByChainId = (chainId) => {
  const networkEntry = Object.entries(networkParams).find(
    ([network, params]) => params.chainId === chainId
  );
  return networkEntry ? networkEntry[0] : null;
};

module.exports = {
  getChainIdByNetworkName,
  getNetworkNameByChainId,
  FEES_AMOUNT,
  networkParams,
  tokenParams,
  addDeployedToken,
  getActiveConfig,
  getUsedConfigs,
  setActiveConfig,
  getUsedNetworksAndTokens,
  usedNetworks,
  usedTokens,
  addUsedConfig,
  addToConfig,
  removeConfig,
  simulationParams,
  getSimulationParams,
};
