const getRandomAddress = () => {
  return ethers.Wallet.createRandom().address;
};

const toChecksumAddress = (address) => {
  return ethers.getAddress(address);
};

const getZeroAddress = () => {
  return toChecksumAddress("0x" + "0".repeat(40));
};

const getMaxAddress = () => {
  return toChecksumAddress("0x" + "f".repeat(40));
};

const computeTokenSymbol = (network, symbol) => {
  // nbSSS => n for network, b for bridge, SSS for symbol
  const firstLetter = network.charAt(0).toLowerCase();
  return `${firstLetter}b${symbol}`;
};

module.exports = {
  getRandomAddress,
  toChecksumAddress,
  getZeroAddress,
  getMaxAddress,
  computeTokenSymbol,
};
