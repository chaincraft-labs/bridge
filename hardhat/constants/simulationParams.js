const simulationParams = {
  defaultOrigin: {
    sepolia: {
      chainIdFrom: 11155111,
      chainIdTo: 441,
      tokenName: "ethereum",
      amount: 10_000_000_000_000_000n, //0.01
      feesAmount: 1_000_000_000_000_000n, //0.001
    },
    allfeat: {
      chainIdFrom: 441,
      chainIdTo: 11155111,
      tokenName: "allfeat",
      amount: 10_000_000_000_000_000n, //0.01
      feesAmount: 1_000_000_000_000_000n, //0.001
    },
  },
};

module.exports = {
  simulationParams,
};
