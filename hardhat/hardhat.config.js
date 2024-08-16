require("hardhat-deploy");
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// @todo add checks for env var
const providerApiKey = process.env.ALCHEMY_API_KEY || "";
// If not set, it uses the hardhat account 0 private key.
const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY || "";
const etherscanApiKey = process.env.ETHERSCAN_API_KEY || "";

// test and manage different api infura, alchemy...

// update networks => goerli !!! no!

// @todo add checks for provider (ping and rate limit)
module.exports = {
  // const config = {
  solidity: "0.8.20",
  // defaultNetwork: "localhost",
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: {
      // By default, it will take the first Hardhat account as the deployer
      default: 0,
    },
  },
  networks: {
    // View the networks that are pre-configured.
    // If the network you are looking for is not here you can add new network settings
    localhost: {
      url: "http://localhost:8545",
      // accounts: [deployerPrivateKey],
    },
    hardhat: {
      // mining: {
      //   auto: false,
      //   interval: [3000, 6000],
      // },
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${providerApiKey}`,
        enabled: process.env.MAINNET_FORKING_ENABLED === "true",
      },
      // accounts: [deployerPrivateKey],
    },
    gethTestnet: {
      url: `http://127.0.0.1:8545`,
      accounts: [deployerPrivateKey],
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    // @todo remove goerli
    // goerli: {
    //   url: `https://eth-goerli.alchemyapi.io/v2/${providerApiKey}`,
    //   accounts: [deployerPrivateKey],
    // },
    allfeatLocal: {
      url: `http://127.0.0.1:9944`,
      accounts: [deployerPrivateKey],
    },
    harmonie: {
      url: `https://harmonie-endpoint-02.allfeat.io`,
      accounts: [deployerPrivateKey],
    },
    allfeat: {
      url: `https://harmonie-endpoint-02.allfeat.io`,
      accounts: [deployerPrivateKey],
    },
    // @todo remove mumbai
    polygonMumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    polygonAmoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    fantomTestnet: {
      url: `https://fantom-testnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    fantom: {
      url: `https://fantom-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    bscTestnet: {
      url: `https://bsc-testnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    bsc: {
      url: `https://bsc-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    // @todo change url!
    arbitrumSepolia: {
      url: `https://arb-goerli.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    arbitrum: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    // @todo change url!
    optimismSepolia: {
      url: `https://opt-goerli.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    optimism: {
      url: `https://opt-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
  },
  verify: {
    etherscan: {
      apiKey: `${etherscanApiKey}`,
    },
  },
};

// export default config;
