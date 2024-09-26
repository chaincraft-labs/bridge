const {
  getConfigParams,
  updateConfigParams,
  // getUsedNetworksAndTokens,
  // getForkPorts,
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
//                DESCRIPTION OF NETWORKS AND TOKENS:
//
///////////////////////////////////////////////////////////////////////////////
const configParams = getConfigParams();

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
const getNetworkAndTokenParams = () => {
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

// Fonction pour ajouter un token déployé à un réseau
function addDeployedToken(networkName, tokenName, tokenSymbol, tokenAddress) {
  // const data = fs.readFileSync(CONFIG_PARAMS_FILE_PATH, "utf8");
  // const configParams = JSON.parse(data);

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

  // Checks if token already exists in the network
  if (network.deployedTokens.find((element) => element.name === tokenName)) {
    throw new Error(
      `The token '${tokenName}' already exists in the network '${networkName}'.`
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

///////// CONGIG: ACTIVE CONFIG AND USED CONFIGS /////////////

function getActiveConfig() {
  if (!configParams.activeConfig) {
    throw new Error("Active config not found in config file!");
  }
  return configParams.activeConfig;
}

function getUsedConfigs() {
  if (!configParams.usedConfigs) {
    throw new Error("Used configs not found in config file!");
  }
  return configParams.usedConfigs;
}

function setActiveConfig(name) {
  if (configParams.usedConfigs[name]) {
    configParams.activeConfig = name;
    updateConfigParams(configParams);
  } else {
    throw new Error(`The used config ${name} does not exist!`);
  }
}

function addUsedConfig(name, networks, tokens) {
  try {
    if (configParams.usedConfigs[name]) {
      throw new Error(`usedConfig '${name}' already exists.`);
    }

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

function addToConfig(config, label, value) {
  try {
    if (label !== "usedNetworks" && label !== "usedTokens") {
      throw new Error(`Label '${label}' not recognized.`);
    }
    if (!configParams.usedConfigs[config]) {
      throw new Error(`Config '${config}' not found in config file.`);
    }
    if (!configParams.usedConfigs[config][label]) {
      configParams.usedConfigs[config][label] = [];
    }
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

async function removeConfig(config) {
  try {
    if (!configParams.usedConfigs[config]) {
      throw new Error(`Config '${config}' not found in config file.`);
    }
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

//////////////////////// FORK PORTS ////////////////////////
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

/**
 * @description Get forkPorts from config files
 * @returns {Object} The forkPorts from the config file
 */
const getForkPorts = function () {
  if (!configParams.forkPorts) {
    throw new Error("Fork ports not found in config file!");
  }
  return configParams.forkPorts;
};

/**
 * @description Description of the ports used for forking
 *
 * @dev forkPorts: read in the 'deploymentConfig.json' file
 * @dev format: forkPorts: { network: port }
 * @dev used to launch nodes and task on the desired network
 */
const forkPorts = getForkPorts();

///////////////////////////////////////////////////////////////////////////////
//
//                NETWORK HELPERS
//
///////////////////////////////////////////////////////////////////////////////

const getChainIdByNetworkName = (name) => {
  return networkParams[name].chainId;
};

const getNetworkNameByChainId = (chainId) => {
  const networkEntry = Object.entries(networkParams).find(
    ([network, params]) => params.chainId === chainId
  );
  return networkEntry ? networkEntry[0] : null;
};

///////////////////////////////////////////////////////////////////////////////
//
//                SYMBOL HELPERS
//
///////////////////////////////////////////////////////////////////////////////

// const computeTokenSymbol = (network, symbol) => {
//   // nbSSS => n for network, b for bridge, SSS for symbol
//   const firstLetter = network.charAt(0).toLowerCase();
//   return `${firstLetter}b${symbol}`;
// };

////////////////////////////////////////////////////////////////
//
//             AS_CLI HELPERS
//
///////////////////////////////////////////////////////////////
// moved from constants/token.js to reduce files numbers
// const nativeTokens = {
//   31337: "ethereum",
//   1337: "ethereum",
//   440: "allfeat",
//   11155111: "ethereum",
//   441: "allfeat",
// };

// const getNativeToken = (chainId) => {
//   try {
//     return nativeTokens[chainId];
//   } catch (err) {
//     throw "Invalid chainId!";
//   }
// };

// module.exports = {
//   networkParams,
//   getChainIdByNetworkName,
//   getNetworkNameByChainId,
//   computeTokenSymbol,
//   tokenParams,
//   FEES_AMOUNT,
//   usedNetworks,
//   usedTokens,
//   forkPorts,
// };
module.exports = {
  getChainIdByNetworkName,
  getNetworkNameByChainId,
  // computeTokenSymbol,
  FEES_AMOUNT,
  forkPorts,
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
};
