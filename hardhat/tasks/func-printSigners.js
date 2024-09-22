require("@nomicfoundation/hardhat-toolbox");
const { networkParams } = require("../helpers/configHelper");
const { toStyle, display } = require("../helpers/loggingHelper");

/**
 * @description Displays the addresses of the configured signers for the specified network
 */
task("func-printSigners", "display the signers").setAction(
  async (taskArgs, hre) => {
    const signers = await hre.ethers.getSigners();
    const networkName = hre.network.name.replace("Fork", "");
    const nativeSymbol = networkParams[networkName].nativeToken.symbol;

    console.log(`Signers on network ${toStyle.bold(hre.network.name)}:`);
    for (let i = 0; i < signers.length; i++) {
      const signer = signers[i];
      const balance = await hre.ethers.provider.getBalance(signer);

      display.signerAndBalance(i, signer.address, balance, nativeSymbol);
    }
  }
);
