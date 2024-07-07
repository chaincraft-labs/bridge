const networkParams = {
    localhost: {
      chainId: 31337,
      nativeSymbol: "ETH",
    },
    hardhat: {
      chainId: 31337,
      nativeSymbol: "ETH",
    },
    allfeat: {
      chainId: 441,
      nativeSymbol: "AFT",
    },
    polygon: {
      chainId: 137,
      nativeSymbol: "MATIC",
    },
    sepolia: {
      chainId: 11155111,
      nativeSymbol: "ETH",
    },
    ethereum: {
      chainId: 1,
      nativeSymbol: "ETH",
    },
    allfeat_local: {
      chainId: 440,
      nativeSymbol: "AFT",
    },
    anvil_local: {
      chainId: 31337,
      nativeSymbol: "ETH",
    },
    geth: {
      chainId: 1337,
      nativeSymbol: "ETH",
    },
};

module.exports = {networkParams}