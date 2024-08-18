// const hre = require("hardhat");
// require("dotenv").config();

// // import { writeDeployedAddress } from "./util";
// const {
//   writeDeployedAddress,
//   readLastDeployedAddress,
//   readNetworks,
//   getMaxAddress,
//   computeTokenSymbol,
// } = require("./util");

// const providerApiKey = process.env.ALCHEMY_API_KEY;
// async function main() {
//   //get network name
//   const network = hre.network.name;
//   //   const nativeSymbol = networkParams[network].nativeSymbol;
//   //   const currentChainId = networkParams[network].chainId;

//   await hre.network.provider.request({
//     method: "hardhat_reset",
//     params: [
//       {
//         forking: {
//           url: `https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`,
//           blockNumber: 14768690,
//         },
//       },
//     ],
//   });

//   console.log("network", network);
// }

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
