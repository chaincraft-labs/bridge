///////////////////////////////////////////////////////////////////////////////
//
//               SIGNER UTILS
//
///////////////////////////////////////////////////////////////////////////////
/**
 * @description Returns the selected signer
 *
 * @dev Index of accounts defined in hardhat config
 * @dev Default: 0 (deployer / admin / default signer)
 * @dev Hre is given in input to avoid import problem at initialization using this file
 * @dev This function is there for future additional check on signer
 *
 * @param {*} hre
 * @param {string | number} option optional, possible values [0, 1, 2]
 * @returns a valid signer
 */
const getSigner = async (hre, signerOption = 0) => {
  const signersArray = await hre.ethers.getSigners();

  if (signerOption >= signersArray.length)
    throw "Signer index out of bound of accounts arrays defined in hardhat.config";

  return signersArray[signerOption];
};
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

/**
 * @description Shorten address to format: 0x1234...5678
 **/
const shortenAddress = (address) => {
  return address.slice(0, 6) + "..." + address.slice(-4);
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
  getSignerFromOption,
  getSigner,
  getRandomAddress,
  toChecksumAddress,
  getZeroAddress,
  getMaxAddress,
  computeTokenSymbol,
  numToHex,
  hexToNum,
  getRandomBytes,
  shortenAddress,
};
