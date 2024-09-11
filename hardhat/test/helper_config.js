const hre = require("hardhat");

// get a random bytes32
const getRandomBytes32 = () => {
  return ethers.utils.formatBytes32String(Math.random().toString());
};

module.exports = {
  getRandomBytes32,
};
