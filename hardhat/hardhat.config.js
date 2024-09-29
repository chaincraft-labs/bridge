require("hardhat-deploy");
require("@nomicfoundation/hardhat-toolbox");
require("solidity-coverage");
require("dotenv").config();

require("./tasks/start-node");
require("./tasks/config-tasks");
require("./tasks/call-write");
require("./tasks/call-read");
require("./tasks/func-printSigners");
require("./tasks/func-balanceOf");
require("./tasks/func-mintBridgedToken");
require("./tasks/func-transferMockedToken");
require("./tasks/func-getMsgHash");
require("./tasks/func-getMsgSignature");

const { ethers } = require("ethers");
const { buildRpcUrl } = require("./helpers/functionHelpers");

// number of users to make accounts for (excluding deployer)
const USER_COUNT = 19;

const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const etherscanApiKey = process.env.ETHERSCAN_API_KEY || "";

// Accounts array will have: [0]: deployer/default signer [1-USER_COUNT]: other signers
// Real accounts:
const deployerPvtKey = process.env.DEPLOYER_PRIVATE_KEY || "";
const usersPvtKeys = [];
for (let i = 1; i <= USER_COUNT; i++) {
  const userPvtKey = process.env[`USER${i}_PRIVATE_KEY`];
  if (userPvtKey) {
    usersPvtKeys.push(userPvtKey);
  }
}
// Hardhat/Local accounts: (reproduce default hh accounts)
const defaultDerivationPath = ethers.defaultPath.slice(0, -2);
const hardhatPvtKeys = [];
const hhMnemonic = ethers.Mnemonic.fromPhrase(process.env.MNEMONIC_TEST);
const hhWallet = ethers.HDNodeWallet.fromMnemonic(
  hhMnemonic,
  defaultDerivationPath //`m/44'/60'/0'/0`
);
for (let i = 0; i <= USER_COUNT; i++) {
  const childWallet = hhWallet.deriveChild(i);
  hardhatPvtKeys.push(childWallet.privateKey);
}

module.exports = {
  solidity: "0.8.20",
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: {
      // By default, it will take the first Hardhat account as the deployer
      default: 0,
    },
  },
  networks: {
    // order: local, test+fork, main+fork / ethereum then other networks by alphabetical order
    localhost: {
      url: "http://localhost:8545",
    },
    hardhat: {
      // forking: {
      //       url: `https://eth-mainnet.alchemyapi.io/v2/${providerApiKey}`,
      //     enabled: process.env.MAINNET_FORKING_ENABLED === "true",
      // },
    },
    anvilLocal: {
      url: buildRpcUrl("anvilLocal"),
      accounts: hardhatPvtKeys,
    },
    geth: {
      url: buildRpcUrl("geth"),
      accounts: hardhatPvtKeys,
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
    sepoliaFork: {
      url: buildRpcUrl("sepoliaFork"),
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
    mainnetFork: {
      url: buildRpcUrl("mainnetFork"),
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
    allfeatLocal: {
      url: buildRpcUrl("allfeatLocal"),
      accounts: hardhatPvtKeys,
    },
    harmonie: {
      url: `https://harmonie-endpoint-02.allfeat.io`,
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
    allfeat: {
      url: `https://harmonie-endpoint-02.allfeat.io`,
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
    arbitrumSepolia: {
      url: `https://arb-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
    arbitrum: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
    bscTestnet: {
      url: `https://bsc-testnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
    bsc: {
      url: `https://bsc-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
    fantomTestnet: {
      url: `https://fantom-testnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
    fantomTestnetFork: {
      url: buildRpcUrl("fantomTestnetFork"),
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
    fantom: {
      url: `https://fantom-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
    fantomFork: {
      url: buildRpcUrl("fantomFork"),
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
    optimismSepolia: {
      url: `https://opt-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
    optimism: {
      url: `https://opt-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
    polygonAmoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
    polygonAmoyFork: {
      url: buildRpcUrl("polygonAmoyFork"),
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
    polygonFork: {
      url: buildRpcUrl("polygonFork"),
      accounts: [deployerPvtKey, ...usersPvtKeys],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
  },
  verify: {
    etherscan: {
      apiKey: `${etherscanApiKey}`,
    },
  },
};
