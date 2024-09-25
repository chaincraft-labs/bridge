const { getConfigParams, getUsedNetworksAndTokens } = require("./fileHelpers");

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
const { networkParams, tokenParams } = getConfigParams();

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

const computeTokenSymbol = (network, symbol) => {
  // nbSSS => n for network, b for bridge, SSS for symbol
  const firstLetter = network.charAt(0).toLowerCase();
  return `${firstLetter}b${symbol}`;
};

////////////////////////////////////////////////////////////////
//
//             AS_CLI HELPERS
//
///////////////////////////////////////////////////////////////
// moved from constants/token.js to reduce files numbers
const nativeTokens = {
  31337: "ethereum",
  1337: "ethereum",
  440: "allfeat",
  11155111: "ethereum",
  441: "allfeat",
};

const getNativeToken = (chainId) => {
  try {
    return nativeTokens[chainId];
  } catch (err) {
    throw "Invalid chainId!";
  }
};

module.exports = {
  networkParams,
  getChainIdByNetworkName,
  getNetworkNameByChainId,
  computeTokenSymbol,
  tokenParams,
  FEES_AMOUNT,
  getNativeToken,
  usedNetworks,
  usedTokens,
};
