const getRandomAddress = () => {
  return ethers.Wallet.createRandom().address;
};
// const getRandomAddress = () => {
//   return ethers.utils.getAddress(
//     ethers.utils.hexlify(ethers.utils.randomBytes(20))
//   );
// };

const toChecksumAddress = (address) => {
  return ethers.getAddress(address);
};

const getZeroAddress = () => {
  return toChecksumAddress("0x" + "0".repeat(40));
};

const getMaxAddress = () => {
  return toChecksumAddress("0x" + "f".repeat(40));
};

// get a random bytes32
const getRandomBytes = (length = 32) => {
  // return ethers.formatBytes32String(Math.random().toString());
  return ethers.zeroPadValue(
    ethers.toUtf8Bytes(Math.random().toString()),
    length
  );
};

// const amount = ethers.BigNumber.from(1);
// ethers.utils.hexZeroPad(amount.toHexString(), 32);

// ethers.utils.hexZeroPad(ethers.utils.toUtf8Bytes("hello"), 32);

const computeTokenSymbol = (network, symbol) => {
  // nbSSS => n for network, b for bridge, SSS for symbol
  const firstLetter = network.charAt(0).toLowerCase();
  return `${firstLetter}b${symbol}`;
};

const numToHex = (num) => {
  return "0x" + num.toString(16);
};

const hexToNum = (hexString) => {
  return parseInt(hexString, 16);
};

module.exports = {
  getRandomAddress,
  toChecksumAddress,
  getZeroAddress,
  getMaxAddress,
  computeTokenSymbol,
  numToHex,
  hexToNum,
  getRandomBytes,
};
