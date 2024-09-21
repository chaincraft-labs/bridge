///////////////////////////////////////////////////////////////////////////////
//
//               SIGNER UTILS
//
///////////////////////////////////////////////////////////////////////////////
// @todo Remove wallet creation in 'else' when hardhat config is set with accounts
/**
 * @description Returns the selected signer
 *
 * @dev This helper is used in tasks.
 * @dev The default value is 0, which corresponds to the deployer/admin account (the first Ethers signer / deployer defined in the .env file).
 * @dev Values 1 and 2 correspond to Ethers signer 1 or 2 for a local environment, or user 2 or user 3 as configured in the .env file.
 * @dev Using .env ensure to have a valid private key for the selected signer
 * in the case of accounts are not defined in the hardhat.config.js
 *
 * @param {*} hre
 * @param {string | number} option optional, possible values [0, 1, 2]
 * @returns a valid signer
 */
const getSignerFromOption = async (hre, option) => {
  let userWallet;
  try {
    if (!option || option == 0) {
      // default signer set in hardhat config
      [userWallet] = await hre.ethers.getSigners();
    } else {
      if (option != 1 && option != 2) {
        throw "Wrong signer value!";
      }
      if (hre.network.name === "localhost") {
        const signers = await hre.ethers.getSigners();
        userWallet = signers[option];
      } else {
        const userLabel =
          option === 1 ? "USER_PRIVATE_KEY_2" : "USER_PRIVATE_KEY_3";
        userWallet = await new ethers.Wallet(
          process.env[userLabel],
          hre.ethers.provider
        );
      }
    }
  } catch (err) {
    throw `Signer can not be defined!\n${err}`;
  }
  return userWallet;
};

// @todo unify the two functions
/**
 * @description Returns the selected signer
 *
 * @dev This helper is used in scripts.
 * @dev The default value is 0, which corresponds to the deployer/admin account (the first Ethers signer / deployer defined in the .env file).
 * @dev Values 1 and 2 correspond to Ethers signer 1 or 2 for a local environment, or user 2 or user 3 as configured in the .env file.
 * @dev Be sure to configure the hardhat.config.js file with the desired accounts array for the network.
 *
 * @param {*} hre
 * @param {string | number} option optional, possible values [0, 1, 2]
 * @returns a valid signer
 */
const getSigner = async (signerOption = 0) => {
  const signersArray = await hre.ethers.getSigners();
  // if (!signerOption) signerOption = 0;
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
