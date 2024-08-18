const fse = require("fs-extra");
const path = require("path");
const { execSync, spawn } = require("child_process");
// const yargs = require("yargs/yargs");
// const { hideBin } = require("yargs/helpers");
// const colors = require("colors");
const { performance } = require("perf_hooks");

const scriptFolder = "./scripts/";
const scriptFileNames = [
  "01_deployAllContracts_refactor.js",
  "01_setTokens_refactor.js",
];
// const scriptFileName2 = "01_setTokens_refactor.js";

const networksToDeploy = ["sepolia", "allfeat"];
const commandHeader = "npx hardhat run ";
const commandNetwork = "--network";

const buildCommand = (script, network) => {
  return `${commandHeader} ${scriptFolder}${script} ${commandNetwork} ${network}`;
};

async function runCommand(command) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, { shell: true });

    // execSync output when finished ... waiting
    // spawn: pb displaying output due to empty new line between
    process.stdout.on("data", (data) => {
      // console.log this way add an empty line before output
      // console.log(`output: ${data.toString()}`);
      process.stdout.write(`output: ${data.toString()}`);
    });

    process.stderr.on("data", (data) => {
      // console.error(`error: ${data.toString()}`);
      process.stderr.write(`error: ${data.toString()}`);
    });

    process.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code: ${code}`));
      } else {
        resolve();
      }
    });
  });
}

// async function main() {
//   const commandTotalCount = networksToDeploy.length * scriptFileNames.length;
//   let commandCounter = 0;

//   scriptFileNames.forEach((scriptFile) => {
//     networksToDeploy.forEach((networkToDeploy) => {
//       const command = buildCommand(scriptFile, networkToDeploy);
//       console.log(
//         `Running command ${++commandCounter}/${commandTotalCount}: "${command}"...`
//       );
//       try {
//         // execSync returns only when the child_process closed
//         const output = execSync(command, { stdio: "pipe" }).toString();
//         console.log(`output...\n${output}`);
//       } catch (error) {
//         console.log(`error...\n${error}`);
//       }
//     });
//   });
// }

async function main() {
  const commandTotalCount = networksToDeploy.length * scriptFileNames.length;
  let commandCounter = 0;

  for (const scriptFile of scriptFileNames) {
    for (const networkToDeploy of networksToDeploy) {
      const command = buildCommand(scriptFile, networkToDeploy);
      console.log(
        `Running command ${++commandCounter}/${commandTotalCount}: "${command}"...`
      );
      try {
        await runCommand(command); // Attendre que la commande se termine
      } catch (error) {
        console.error(`Error while executing command: ${error.message}`);
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
