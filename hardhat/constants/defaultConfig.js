////////////////////////////////////////////////////////////////
//
//             Networks used for deployments
//
///////////////////////////////////////////////////////////////
const usedNetworks = ["allfeat", "sepolia"];

////////////////////////////////////////////////////////////////
//
//             Native coins and tokens used (as mockedToken for test)
//
///////////////////////////////////////////////////////////////
const usedTokens = ["ethereum", "allfeat", "mockedDai", "mockedUsdc"];

////////////////////////////////////////////////////////////////
//
//             Ports used for forks
//
///////////////////////////////////////////////////////////////
const forkPorts = {
  harmonie: "8540",
  allfeat: "8541",
  sepolia: "8544",
  mainnet: "8545",
  polygonAmoy: "8546",
  polygon: "8547",
  fantomTestnet: "8548",
  fantom: "8549",
};

/**
 * @dev Description of network configuration and deployed tokens
 *
 * order: local, test, main / ethereum then other networks by alphabetical order
 */
const networkParams = {
  localhost: {
    chainId: 31337,
    nativeToken: { name: "ethereum", symbol: "ETH" },
    deployedTokens: [
      { name: "mockedDai", symbol: "DAI" },
      { name: "mockedUsdc", symbol: "USDC" },
    ],
  },
  hardhat: {
    // to complete (used for forks)
    chainId: 31337,
    nativeToken: { name: "ethereum", symbol: "ETH" },
    deployedTokens: [
      { name: "mockedDai", symbol: "DAI" },
      { name: "mockedUsdc", symbol: "USDC" },
    ],
  },
  anvilLocal: {
    chainId: 31337,
    nativeToken: { name: "ethereum", symbol: "ETH" },
    deployedTokens: [
      { name: "mockedDai", symbol: "DAI" },
      { name: "mockedUsdc", symbol: "USDC" },
    ],
  },
  geth: {
    chainId: 1337,
    nativeToken: { name: "ethereum", symbol: "ETH" },
    deployedTokens: [
      { name: "mockedDai", symbol: "DAI" },
      { name: "mockedUsdc", symbol: "USDC" },
    ],
  },
  sepolia: {
    chainId: 11155111,
    nativeToken: { name: "ethereum", symbol: "ETH" },
    deployedTokens: [
      { name: "mockedDai", symbol: "DAI" },
      { name: "mockedUsdc", symbol: "USDC" },
    ],
  },
  ethereum: {
    chainId: 1,
    nativeToken: { name: "ethereum", symbol: "ETH" },
    deployedTokens: [
      { name: "mockedDai", symbol: "DAI" },
      { name: "mockedUsdc", symbol: "USDC" },
    ],
  },
  allfeatLocal: {
    chainId: 440,
    nativeToken: { name: "allfeat", symbol: "AFT" },
    deployedTokens: [],
  },
  // harmonie: {
  //   chainId: 441,
  //   nativeToken: { name: "harmonie", symbol: "HMY" },
  //   deployedTokens: [],
  // },
  allfeat: {
    // current harmonie testnet
    chainId: 441,
    nativeToken: { name: "allfeat", symbol: "AFT" },
    deployedTokens: [],
  },
  arbitrumSepolia: {
    chainId: 421614,
    nativeToken: { name: "ethereum", symbol: "ETH" },
    deployedTokens: [],
  },
  arbitrum: {
    chainId: 42161,
    nativeToken: { name: "ethereum", symbol: "ETH" },
    deployedTokens: [],
  },
  bscTestnet: {
    chainId: 97,
    nativeToken: { name: "binance", symbol: "BNB" },
    deployedTokens: [],
  },
  bsc: {
    chainId: 56,
    nativeToken: { name: "binance", symbol: "BNB" },
    deployedTokens: [],
  },
  fantomTestnet: {
    chainId: 4002,
    nativeToken: { name: "fantom", symbol: "FTM" },
    deployedTokens: [],
  },
  fantom: {
    chainId: 250,
    nativeToken: { name: "fantom", symbol: "FTM" },
    deployedTokens: [],
  },
  optimismSepolia: {
    chainId: 11155420,
    nativeToken: { name: "ethereum", symbol: "ETH" },
    deployedTokens: [],
  },
  optimism: {
    chainId: 10,
    nativeToken: { name: "ethereum", symbol: "ETH" },
    deployedTokens: [],
  },
  polygonAmoy: {
    chainId: 80002,
    nativeToken: { name: "matic", symbol: "MATIC" },
    deployedTokens: [],
  },
  polygon: {
    chainId: 137,
    nativeToken: { name: "matic", symbol: "MATIC" },
    deployedTokens: [],
  },
};

///////////////////////////////////////////////////////////////////////////////
//
//                DESCRIPTION OF TOKENS
//
///////////////////////////////////////////////////////////////////////////////
/**
 * @dev For each token give its description, if it's a native coin and
 * which chain is its origin chain
 */
const tokenParams = {
  ethereum: {
    tokenName: "ethereum",
    tokenSymbol: "ETH",
    originChainId: [1, 1337, 31337, 11155111],
    isNative: true,
  },
  allfeat: {
    tokenName: "allfeat",
    tokenSymbol: "AFT",
    originChainId: [440, 441],
    isNative: true,
  },
  matic: {
    tokenName: "matic",
    tokenSymbol: "MATIC",
    originChainId: [137],
    isNative: true,
  },
  dai: {
    tokenName: "dai",
    tokenSymbol: "DAI",
    originChainId: [1],
    isNative: false,
  },
  mockedDai: {
    tokenName: "mockedDai",
    tokenSymbol: "DAI",
    originChainId: [1337, 31337, 11155111],
    isNative: false,
  },
  mockedUsdc: {
    tokenName: "mockedUsdc",
    tokenSymbol: "USDC",
    originChainId: [1337, 31337, 11155111],
    isNative: false,
  },
  newCoin4: {
    tokenName: "newCoin4",
    tokenSymbol: "NCT",
    originChainId: [31337, 11155111],
    isNative: false,
  },
};

module.exports = {
  usedNetworks,
  usedTokens,
  forkPorts,
  networkParams,
  tokenParams,
};
