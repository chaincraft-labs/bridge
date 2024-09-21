require("hardhat-deploy");
require("@nomicfoundation/hardhat-toolbox");
require("solidity-coverage");
require("dotenv").config();

require("./tasks/start-node");
require("./tasks/print-signer");
require("./tasks/call-write");
require("./tasks/call-read");
require("./tasks/func-balanceOf");
require("./tasks/func-mintBridgedToken");
require("./tasks/func-transferMockedToken");
require("./tasks/func-getMsgHash");
require("./tasks/func-getMsgSignature");

const { forkPorts } = require("./constants/deploymentConfig");

// @todo add checks for env var
// @todo check in config to not connect testnet with mainnet
// @todo manage different api infura, alchemy... (if down, switch to another)
const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const etherscanApiKey = process.env.ETHERSCAN_API_KEY || "";

const deployerPvtKey = process.env.DEPLOYER_PRIVATE_KEY || "";
// Create an array of pvtKey from process.env.USERx_PRIVATE_KEY where x 0-10
const userPvtKeys = [];
for (let i = 0; i < 20; i++) {
  const userPvtKey = process.env[`USER${i}_PRIVATE_KEY`];
  if (userPvtKey) {
    userPvtKeys.push(userPvtKey);
  }
}

const gethPrivateKey = process.env.GETH_KEY || "";
const anvil_localPrivateKey = process.env.ANVIL_KEY || "";

// @todo REVIEW ? really needed ?
// Reproduce the default account from the default mnemonic using HD wallet
// to be used in anvil_local & geth networks
const { ethers } = require("ethers");
const HARDHAT_ACCOUNTS = [];
const mnemonic = ethers.Mnemonic.fromPhrase(process.env.MNEMONIC_TEST);
const wallet = ethers.HDNodeWallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0`);
for (let i = 0; i < 20; i++) {
  const childWallet = wallet.deriveChild(i);
  HARDHAT_ACCOUNTS.push(childWallet.privateKey);
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
    localhost: {
      url: "http://localhost:8545",
    },
    hardhat: {
      // FOR METHOD VIA json scripts 'npm run ftm'
      // mining: {
      //   auto: false,
      //   interval: [3000, 6000],
      // },
      // chainId: Number(process.env.CHAIN_ID),
      // forking: {
      //       url: `https://eth-mainnet.alchemyapi.io/v2/${providerApiKey}`,
      //     enabled: process.env.MAINNET_FORKING_ENABLED === "true",
      // },
      // accounts: [
      //   {
      //     balance: "100000000000000000000000000000",
      //     privateKey: process.env.DEPLOYER_PRIVATE_KEY,
      //   },
      // ],
    },
    gethTestnet: {
      url: `http://127.0.0.1:8545`,
      accounts: [deployerPvtKey],
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    sepoliaFork: {
      url: `http://127.0.0.1:${forkPorts["sepolia"]}`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    allfeat_local: {
      url: `http://127.0.0.1:9944`,
      accounts: [deployerPvtKey],
    },
    anvil_local: {
      url: `http://127.0.0.1:8545`,
      accounts: [anvil_localPrivateKey],
    },
    // @todo REVIEW TEST CONFIG
    geth: {
      url: `http://127.0.0.1:8545`,
      accounts: [gethPrivateKey, ...HARDHAT_ACCOUNTS],
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    mainnetFork: {
      url: `http://127.0.0.1:${forkPorts["mainnet"]}`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    allfeatLocal: {
      url: `http://127.0.0.1:9944`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    harmonie: {
      url: `https://harmonie-endpoint-02.allfeat.io`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    allfeat: {
      url: `https://harmonie-endpoint-02.allfeat.io`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    // @todo remove mumbai
    polygonMumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    polygonAmoyFork: {
      url: `http://127.0.0.1:${forkPorts["polygonAmoy"]}`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    polygonAmoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    polygonFork: {
      url: `http://127.0.0.1:${forkPorts["polygon"]}`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    fantomTestnetFork: {
      url: `http://127.0.0.1:${forkPorts["fantomTestnet"]}`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    fantomTestnet: {
      url: `https://fantom-testnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    fantomFork: {
      url: `http://127.0.0.1:${forkPorts["fantom"]}`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    fantom: {
      url: `https://fantom-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    bscTestnet: {
      url: `https://bsc-testnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    bsc: {
      url: `https://bsc-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    // @todo change url!
    arbitrumSepolia: {
      url: `https://arb-goerli.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    arbitrum: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    // @todo change url!
    optimismSepolia: {
      url: `https://opt-goerli.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
    optimism: {
      url: `https://opt-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPvtKey, ...userPvtKeys],
    },
  },
  verify: {
    etherscan: {
      apiKey: `${etherscanApiKey}`,
    },
  },
};
