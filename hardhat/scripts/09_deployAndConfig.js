const { execSync, spawn } = require("child_process");
const { usedNetworks } = require("../constants/deploymentConfig");
const scriptFolder = "./scripts/";
const scriptFileNames = ["01_deployAllContracts.js", "02_setTokens.js"];

const commandHeader = "npx hardhat run ";
const commandNetwork = "--network";

const buildCommand = (script, network) => {
  return `${commandHeader} ${scriptFolder}${script} ${commandNetwork} ${network}`;
};

/**
 * @description Run all deployment scripts on all networks defined in 'usedNetworks'
 *
 * This script will run all the deployment scripts defined in 'scriptFileNames'
 * on all the networks defined in 'usedNetworks'.
 */
async function main() {
  const commandTotalCount = usedNetworks.length * scriptFileNames.length;
  let commandCounter = 0;

  scriptFileNames.forEach((scriptFile) => {
    usedNetworks.forEach((networkToDeploy) => {
      const command = buildCommand(scriptFile, networkToDeploy);
      console.log(
        `Running command ${++commandCounter}/${commandTotalCount}: "${command}"...`
      );
      try {
        // execSync returns only when the child_process closed => waiting
        const output = execSync(command, { stdio: "pipe" }).toString();
        console.log(`output...\n${output}`);
      } catch (error) {
        console.log(`error...\n${error}`);
      }
    });
  });
}

// Other implementation having output issues
// @todo fix empty line between outputs
// The following code give more fluid output
// but it add empty lines between outputs so broke the output readability

// async function runCommand(command) {
//   return new Promise((resolve, reject) => {
//     const process = spawn(command, { shell: true });

//     // execSync output when finished ... waiting
//     // spawn: pb displaying output due to empty new line between
//     process.stdout.on("data", (data) => {
//       // console.log this way add an empty line before output
//       // console.log(`output: ${data.toString()}`);
//       process.stdout.write(`output: ${data.toString()}`);
//     });

//     process.stderr.on("data", (data) => {
//       // console.error(`error: ${data.toString()}`);
//       process.stderr.write(`error: ${data.toString()}`);
//     });

//     process.on("close", (code) => {
//       if (code !== 0) {
//         reject(new Error(`Process exited with code: ${code}`));
//       } else {
//         resolve();
//       }
//     });
//   });
// }

// async function main() {
//   const commandTotalCount = usedNetworks.length * scriptFileNames.length;
//   let commandCounter = 0;

//   for (const scriptFile of scriptFileNames) {
//     for (const networkToDeploy of usedNetworks) {
//       const command = buildCommand(scriptFile, networkToDeploy);
//       console.log(
//         `Running command ${++commandCounter}/${commandTotalCount}: "${command}"...`
//       );
//       try {
//         await runCommand(command);
//       } catch (error) {
//         console.error(`Error while executing command: ${error.message}`);
//       }
//     }
//   }
// }

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
