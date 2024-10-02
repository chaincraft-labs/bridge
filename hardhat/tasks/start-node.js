require("@nomicfoundation/hardhat-toolbox");
const { spawn } = require("child_process");
const { networkNameToPortName } = require("../helpers/functionHelpers");

/**
 * @description Launch a node forking the specified network
 *
 * @dev This task is used to fork a network and run a local node with the forked state.
 * @dev Network & network'Fork' should be configured in hardhat.config.js
 * @dev The port used for forking should be set in .env file
 */
task("start-node", "Starts a Hardhat node with forking")
  .addParam("networkToFork", "The network to fork") // "forking"
  .setAction(async (taskArgs, hre) => {
    const forkName = taskArgs.networkToFork + "Fork";
    const networkConfig = hre.config.networks[taskArgs.networkToFork];
    if (!networkConfig?.url) {
      throw new Error(
        `Network ${taskArgs.networkToFork} is not configured correctly.`
      );
    }
    const forkNetworkConfig = hre.config.networks[forkName];
    if (!forkNetworkConfig?.url) {
      throw new Error(
        `Fork network ${
          taskArgs.networkToFork + "Fork"
        } is not configured correctly.`
      );
    }
    const port = process.env[networkNameToPortName(forkName)];
    if (!port) {
      throw new Error(`No port specified for ${networkName}`);
    }
    console.log(
      `Forking network ${taskArgs.networkToFork}, using port ${port}...`
    );
    const child = spawn(
      "npx",
      ["hardhat", "node", "--fork", networkConfig.url, "--port", port],
      {
        stdio: "inherit", // to redirect stdio to terminal
        shell: true,
      }
    );

    child.on("error", (error) => {
      console.error(`Local node: Error: ${error.message}`);
    });

    child.on("exit", (code) => {
      console.log(`Local node: Child process exited with code ${code}`);
    });
  });
