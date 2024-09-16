///////////////////////////////////////////////////////////////////////////////
//
//               ADDRESS UTILS
//
///////////////////////////////////////////////////////////////////////////////
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

///////////////////////////////////////////////////////////////////////////////
//
//               SYMBOL 'COMPUTATION'
//
///////////////////////////////////////////////////////////////////////////////
const computeTokenSymbol = (network, symbol) => {
  // nbSSS => n for network, b for bridge, SSS for symbol
  const firstLetter = network.charAt(0).toLowerCase();
  return `${firstLetter}b${symbol}`;
};

///////////////////////////////////////////////////////////////////////////////
//
//               BYTES/HEX/NUM.. GETTERS & CONVERSION
//
///////////////////////////////////////////////////////////////////////////////

/**
 * @description Get a random bytes value
 *
 * @dev default return is bytes32
 *
 * @param {number} length optional
 * @returns
 */
const getRandomBytes = (length = 32) => {
  // return ethers.formatBytes32String(Math.random().toString());
  return ethers.zeroPadValue(
    ethers.toUtf8Bytes(Math.random().toString()),
    length
  );
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
