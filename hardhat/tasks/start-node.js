// const { task } = require("hardhat/config");
require("@nomicfoundation/hardhat-toolbox");
const { spawn } = require("child_process");
const { forkPorts } = require("../constants/deploymentConfig");

task("start-node", "Starts a Hardhat node with forking")
  .addParam("networkToFork", "The network to fork")
  .setAction(async (taskArgs, hre) => {
    const networkConfig = hre.config.networks[taskArgs.networkToFork];
    if (!networkConfig || !networkConfig.url) {
      throw new Error(
        `Network ${taskArgs.networkToFork} is not configured correctly.`
      );
    }
    const port = forkPorts[taskArgs.networkToFork];
    console.log("port: ", port);
    const child = spawn(
      "npx",
      ["hardhat", "node", "--fork", networkConfig.url, "--port", port],
      {
        stdio: "inherit", // to redirect stdio to terminal
        shell: true,
      }
    );

    //////// not working
    const stopNode = () => {
      console.log("Stopping Hardhat node...");
      child.kill("SIGINT");
    };

    process.on("SIGINT", stopNode);
    process.on("SIGTERM", stopNode);
    ////////

    child.on("error", (error) => {
      console.error(`Local node: Error: ${error.message}`);
    });

    child.on("exit", (code) => {
      console.log(`Local node: Child process exited with code ${code}`);
    });
  });

//
// get current process ans PIDs:  ps aux | grep hardhat
// kill it: kill -9 <PID>

// npx hardhat start-node --network-to-fork "sepolia"
