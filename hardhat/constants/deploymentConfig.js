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

module.exports = {
  usedNetworks,
  usedTokens,
  forkPorts,
};
