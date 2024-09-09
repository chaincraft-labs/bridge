const hre = require("hardhat");

/**
 * @description Get context info
 * @returns { Object } format:
 * { network, chainId, nativeTokenName, nativeTokenSymbol, accounts }
 */
const getContext = async () => {
  const network = hre.network.name;
  return {
    network,
    chainId: networkParams[network].chainId,
    nativeTokenName: networkParams[network].nativeToken.name,
    nativeTokenSymbol: networkParams[network].nativeToken.symbol,
    accounts: await hre.ethers.getSigners(),
  };
};

module.exports = {
  getContext,
};
