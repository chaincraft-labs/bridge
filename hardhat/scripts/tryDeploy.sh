# const fse = require("fs-extra");
# const path = require("path");
# const { execSync } = require("child_process");
# // const yargs = require("yargs/yargs");
# // const { hideBin } = require("yargs/helpers");
# // const colors = require("colors");
# const { performance } = require("perf_hooks");
# // const { log } = require("console");

# async function main() {
  local networkToDeploy = "--network hardhat"
  cd ..
  npx hardhat run ./scripts/01_deployAllContracts_refactor.js ${networkToDeploy}

  # console.log(`Running script for  ${networkToDeploy}...`);
  # # try {
  #   const output = execSync(command, { stdio: "pipe" }).toString();

  #   //check if output contains "No tests match the provided pattern"

  #   console.log(`output...\n${output}`);
  # # } catch (error) {
  #   console.log(`error...\n${error}`);
  # }
# }

# main().catch((error) => {
#   console.error(error);
#   process.exitCode = 1;
# });
