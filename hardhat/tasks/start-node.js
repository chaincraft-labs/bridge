require("@nomicfoundation/hardhat-toolbox");
const { spawn } = require("child_process");
const { forkPorts } = require("../constants/deploymentConfig");

/**
 * @description Launch a node forking the specified network
 * @dev see constants/deploymentConfig::forkPorts for config of ports associated with networks
 */
task("start-node", "Starts a Hardhat node with forking")
  .addParam("networkToFork", "The network to fork") // "forking"
  .setAction(async (taskArgs, hre) => {
    const networkConfig = hre.config.networks[taskArgs.networkToFork];
    if (!networkConfig || !networkConfig.url) {
      throw new Error(
        `Network ${taskArgs.networkToFork} is not configured correctly.`
      );
    }
    const port = forkPorts[taskArgs.networkToFork];
    console.log(`For network ${taskArgs.networkToFork}, using port ${port}...`);
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
