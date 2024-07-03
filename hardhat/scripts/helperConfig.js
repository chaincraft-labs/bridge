const networkParams = {
  localhost: {
    chainId: 31337,
    nativeToken: { name: "ethereum", symbol: "ETH" },
    deployedTokens: [{ name: "mockedDai", symbol: "DAI" }],
  },
  hardhat: {
    chainId: 31337,
    nativeToken: { name: "ethereum", symbol: "ETH" },
    deployedTokens: [{ name: "mockedDai", symbol: "DAI" }],
  },
  allfeat: {
    chainId: 441,
    nativeToken: { name: "allfeat", symbol: "AFT" },
    deployedTokens: [],
  },
  polygon: {
    chainId: 137,
    nativeToken: { name: "matic", symbol: "MATIC" },
    deployedTokens: [],
  },
  sepolia: {
    chainId: 11155111,
    nativeToken: { name: "ethereum", symbol: "ETH" },
    deployedTokens: [{ name: "mockedDai", symbol: "DAI" }],
  },
  ethereum: {
    chainId: 1,
    nativeToken: { name: "ethereum", symbol: "ETH" },
    deployedTokens: [{ name: "dai", symbol: "DAI" }],
  },
};
// to complete
const tokenSymbols = {
  ethereum: "ETH",
  allfeat: "AFT",
  dai: "DAI",
};

const tokenList = [
  {
    tokenName: "ethereum",
    symbols: [
      { chainId: 1, symbol: "ETH" },
      { chainId: 137, symbol: "ETH" },
      { chainId: 441, symbol: "abETH" },
      { chainId: 31337, symbol: "ETH" },
      { chainId: 11155111, symbol: "ETH" },
    ],
  },
  {
    tokenName: "dai",
    symbols: [
      { chainId: 1, symbol: "DAI" },
      { chainId: 137, symbol: "DAI" },
      { chainId: 441, symbol: "abDAI" },
      { chainId: 31337, symbol: "DAI" },
      { chainId: 11155111, symbol: "DAI" },
    ],
  },
  {
    tokenName: "allfeat",
    symbols: [
      { chainId: 1, symbol: "ebAFT" },
      { chainId: 137, symbol: "pbAFT" },
      { chainId: 441, symbol: "AFT" },
      { chainId: 31337, symbol: "hbAFT" },
      { chainId: 11155111, symbol: "sbAFT" },
    ],
  },
];

const usedNetworks = ["allfeat", "hardhat", "sepolia", "localhost"];

const usedTokens = ["ethereum", "allfeat", "mockedDai"];

const getChainIdByNetworkName = (name) => {
  return networkParams[name].chainId;
};

const getNetworkNameByChainId = (chainId) => {
  const networkEntry = Object.entries(networkParams).find(
    ([network, params]) => params.chainId === chainId
  );
  return networkEntry ? networkEntry[0] : null;
};

const computeTokenSymbol = (network, symbol) => {
  // nbSSS => n for network, b for bridge, SSS for symbol
  const firstLetter = network.charAt(0).toLowerCase();
  return `${firstLetter}b${symbol}`;
};

module.exports = {
  networkParams,
  tokenList,
  getChainIdByNetworkName,
  getNetworkNameByChainId,
  computeTokenSymbol,
  usedNetworks,
  usedTokens,
  tokenSymbols,
};
