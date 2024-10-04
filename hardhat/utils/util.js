const { networkParams } = require("../helpers/configHelper");

///////////////////////////////////////////////////////////////////////////////
//
//                NETWORK HELPERS
//
///////////////////////////////////////////////////////////////////////////////

const getChainIdByNetworkName = (name) => {
  return networkParams[name].chainId;
};

const getNetworkNameByChainId = (chainId) => {
  const networkEntry = Object.entries(networkParams).find(
    ([network, params]) => params.chainId === chainId
  );
  return networkEntry ? networkEntry[0] : null;
};

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
/**
 * @description Get a random address
 * 
 * @dev old: ethers.getAddress(ethers.hexlify(ethers.utils.randomBytes(20)))

 * @returns a random address
 */
const getRandomAddress = () => {
  return ethers.Wallet.createRandom().address;
};

/**
 * @description Get the checksum address of an address
 *
 * @param {string} address
 * @returns the checksum address
 */
const toChecksumAddress = (address) => {
  return ethers.getAddress(address);
};

/**
 * @description Get the zero address
 *
 * @return the zero address
 */
const getZeroAddress = () => {
  return toChecksumAddress("0x" + "0".repeat(40));
};

/**
 * @description Get the max address
 *
 * @return the max address
 */
const getMaxAddress = () => {
  return toChecksumAddress("0x" + "f".repeat(40));
};

/**
 * @description Shorten address to format: 0x1234...5678
 *
 * @return a string: the address shortened
 **/
const shortenAddress = (address) => {
  return address.slice(0, 6) + "..." + address.slice(-4);
};
///////////////////////////////////////////////////////////////////////////////
//
//               SYMBOL 'COMPUTATION'
//
///////////////////////////////////////////////////////////////////////////////
/**
 * @description Compute the symbol of a bridged token from its original symbol
 *
 * format:  nbSSS => n for network, b for bridge, SSS for symbol
 *
 * @param {string} network
 * @param {string} symbol
 * @returns
 */
const computeTokenSymbol = (network, symbol) => {
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

/**
 * @description Convert a number to hex
 * @param {string} hexString
 * @returns a hex string
 */
const numToHex = (num) => {
  return "0x" + num.toString(16);
};

/**
 * @description Convert a hex string to number
 * @param {string} hexString
 * @returns a number
 */
const hexToNum = (hexString) => {
  return parseInt(hexString, 16);
};

/**
 * @description Convert a uint256 string in bytes32
 * @param {string} uint256
 * @returns a bytes32 string
 */
const uint256ToBytes32 = (uint256) => {
  if (!Number.isInteger(uint256) || uint256 < 0) {
    throw new Error("Invalid uint256");
  }

  return ethers.zeroPadValue(ethers.toBeHex(uint256), 32);
};

/**
 * @description Convert an address in bytes32
 * @param {string} address
 * @returns a bytes32 address
 */
const addressToBytes32 = (address) => {
  if (!ethers.isAddress(address)) {
    throw new Error("Invalid address");
  }
  return ethers.zeroPadValue(address, 32);
};

/**
 * @description Convert a string to bytes32
 * @param {string} str
 * @returns a bytes32 string
 */
const stringToBytes32 = (str) => {
  const bytes = ethers.toUtf8Bytes(str);

  if (bytes.length > 32) {
    throw new Error("String is too long to be converted to bytes32");
  }
  return ethers.encodeBytes32String(str);
};

/**
 * @description Encode bytes32 inputs using keccak256
 *
 * @dev inputs should be an array of bytes32 strings
 * @param {string[]} inputs
 * @returns a keccak256 hash
 */
function keccak256EncodeBytes32(inputs) {
  return ethers.solidityPackedKeccak256(
    inputs.map(() => "bytes32"),
    inputs
  );
}

module.exports = {
  getChainIdByNetworkName,
  getNetworkNameByChainId,
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
  uint256ToBytes32,
  addressToBytes32,
  stringToBytes32,
  keccak256EncodeBytes32,
};
