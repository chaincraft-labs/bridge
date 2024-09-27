const { task } = require("hardhat/config");
const {
  addUsedConfig,
  setActiveConfig,
  getUsedConfigs,
  addDeployedToken,
  addToConfig,
  removeConfig,
} = require("../helpers/configHelper");
const { resetJsonFiles } = require("../helpers/fileHelpers");
const { toStyle } = require("../helpers/loggingHelper");

//////////////////////// JSON files TASKS ////////////////////////

// Task to reset deployed addresses and nonce records
task(
  "reset-config",
  "Reset the deployed addresses and nonce records"
).setAction(async () => {
  try {
    await resetJsonFiles();
    console.log(
      `${toStyle.bold(
        "Deployed addresses and nonce records"
      )} reset with success !`
    );
  } catch (error) {
    console.error(error.message);
  }
});

//////////////////////// usedConfig TASKS ////////////////////////

// Task to set the activeConfig
task("set-active-config", "Set the activeConfig")
  .addParam("name", "The name of the activeConfig")
  .setAction(async (taskArgs) => {
    try {
      setActiveConfig(taskArgs.name);
      console.log(
        `${toStyle.bold("activeConfig")} changed to '${toStyle.blueItalic(
          taskArgs.name
        )}' with success !`
      );
    } catch (error) {
      console.error(error.message);
    }
  });

// Task to add a new usedConfig
task("add-used-config", "Add a new usedConfig")
  .addParam("name", "The name of the usedConfig")
  .addParam("networks", "The array of networks (separated by commas)")
  .addParam("tokens", "The array of tokens (separated by commas)")
  .setAction(async (taskArgs) => {
    const networksArray = taskArgs.networks
      .split(",")
      .map((item) => item.trim());
    const tokensArray = taskArgs.tokens.split(",").map((item) => item.trim());

    try {
      await addUsedConfig(taskArgs.name, networksArray, tokensArray);
      console.log(
        `${toStyle.bold("New usedConfig")} '${toStyle.blueItalic(
          taskArgs.name
        )}' added with success !`
      );
    } catch (error) {
      console.error(`Error while adding the usedConfig: ${error.message}`);
    }
  });

// Task to list the usedConfigs
task("list-used-configs", "List the usedConfigs").setAction(async () => {
  const usedConfigs = JSON.parse(JSON.stringify(getUsedConfigs()));
  // Format the usedConfigs for a better display
  Object.values(usedConfigs).forEach((usedConfig) => {
    usedConfig.usedNetworks = usedConfig.usedNetworks.join(", ");
    usedConfig.usedTokens = usedConfig.usedTokens.join(", ");
  });

  console.log(
    `${toStyle.bold("Listed usedConfig")}: ${JSON.stringify(
      usedConfigs,
      null,
      2
    )}`
  );
});

// Task to add a network or a token to a usedConfig
task("add-to-config", "Add a network or a token to a usedConfig")
  .addParam("name", "The name of the usedConfig")
  .addParam("type", "The type of the element to add (network or token name)")
  .addParam("element", "The element to add")
  .setAction(async (taskArgs) => {
    try {
      await addToConfig(taskArgs.name, taskArgs.type, taskArgs.element);
      console.log(
        `${toStyle.bold("Element")} '${toStyle.blueItalic(
          taskArgs.element
        )}' added to the usedConfig '${toStyle.blueItalic(
          taskArgs.name
        )}' with success !`
      );
    } catch (error) {
      console.error(`Error while adding the element: ${error.message}`);
    }
  });

// Task to remove a usedConfig
task("remove-used-config", "Remove a usedConfig")
  .addParam("name", "The name of the usedConfig")
  .setAction(async (taskArgs) => {
    try {
      await removeConfig(taskArgs.name);
      console.log(
        `${toStyle.bold("UsedConfig")} '${toStyle.blueItalic(
          taskArgs.name
        )}' removed with success !`
      );
    } catch (error) {
      console.error(`Error while removing the usedConfig: ${error.message}`);
    }
  });

//////////////////////// networkParams TASKS ////////////////////////

// Task to add a deployed token to networkParams
task(
  "add-deployed-token",
  "Add a deployed token to the network in networkParams"
)
  .addParam("networkName", "The network name")
  .addParam(
    "name",
    "The name of the token (should contain 'mocked' if it's a mocked token)"
  )
  .addParam("symbol", "The symbol of the token")
  .addOptionalParam(
    "address",
    "The address of the token (only for non mocked tokens)"
  )
  .setAction(async (taskArgs) => {
    try {
      addDeployedToken(
        taskArgs.networkName,
        taskArgs.name,
        taskArgs.symbol,
        taskArgs.address
      );
      console.log(
        `Token '${taskArgs.name}' added to the deployed tokens list with success !`
      );
    } catch (error) {
      console.error(`Error while adding the token: ${error.message}`);
    }
  });
