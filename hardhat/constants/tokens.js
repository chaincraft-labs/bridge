const tokenList = [
    {
      tokenName: "ethereum",
      symbols: [
        { chainId: 1, symbol: "ETH" },
        { chainId: 137, symbol: "ETH" },
        { chainId: 441, symbol: "abETH" },
        { chainId: 440, symbol: "abETH" },
        { chainId: 31337, symbol: "ETH" },
        { chainId: 1337, symbol: "ETH" },
        { chainId: 11155111, symbol: "ETH" },
      ],
    },
    {
      tokenName: "dai",
      symbols: [
        { chainId: 1, symbol: "DAI" },
        { chainId: 137, symbol: "DAI" },
        { chainId: 441, symbol: "abDAI" },
        { chainId: 440, symbol: "abDAI" },
        { chainId: 31337, symbol: "DAI" },
        { chainId: 1337, symbol: "DAI" },
        { chainId: 11155111, symbol: "DAI" },
      ],
    },
    {
      tokenName: "allfeat",
      symbols: [
        { chainId: 1, symbol: "ebAFT" },
        { chainId: 137, symbol: "pbAFT" },
        { chainId: 441, symbol: "AFT" },
        { chainId: 440, symbol: "MAFT" },
        { chainId: 31337, symbol: "hbAFT" },
        { chainId: 1337, symbol: "hbAFT" },
        { chainId: 11155111, symbol: "sbAFT" },
      ],
    },
];

const nativeTokens = {
  31337: 'ethereum',
  1337: 'ethereum',
  440: 'allfeat',
  11155111: 'ethereum',
  441: 'allfeat',
};

const getNativeToken = (chainId) => {
  try {
    return nativeTokens[chainId];
  }
  catch (err) {throw('Invalid chainId!')}
}

// utils 
const getTokenSymbol = (tokenName, chainId) => {
  const token = tokenList.filter((token) => token.tokenName === tokenName)[0];
  return token.symbols.filter((symbol) => symbol.chainId === chainId)[0].symbol;
};

module.exports = {
  tokenList,
  nativeTokens,
  getTokenSymbol,
  getNativeToken,
}