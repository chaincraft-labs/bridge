const tokenList = [
    {
      tokenName: "ethereum",
      symbols: [
        { chainId: 1, symbol: "ETH" },
        { chainId: 137, symbol: "ETH" },
        { chainId: 441, symbol: "abETH" },
        { chainId: 440, symbol: "abETH" },
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
        { chainId: 440, symbol: "abDAI" },
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
        { chainId: 440, symbol: "MAFT" },
        { chainId: 31337, symbol: "hbAFT" },
        { chainId: 11155111, symbol: "sbAFT" },
      ],
    },
];

// utils 
const getTokenSymbol = (tokenName, chainId) => {
  const token = tokenList.filter((token) => token.tokenName === tokenName)[0];
  return token.symbols.filter((symbol) => symbol.chainId === chainId)[0].symbol;
};

module.exports = {tokenList, getTokenSymbol}