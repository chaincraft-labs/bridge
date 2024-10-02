const { ethers } = require("hardhat");

async function main() {
  const paramTypes =
    "[address,address,uint256,uint256,string,uint256,uint256,bytes]";
  const functionSignatures = [
    // origin
    `receiveFeesLockConfirmation(bytes32,${paramTypes},uint256)`,
    `confirmFeesLockedAndDepositConfirmed(bytes32,${paramTypes},uint256)`,
    `receivedFinalizedOperation(bytes32,${paramTypes},uint256)`,
    `receiveCancelOperation(bytes32,${paramTypes},uint256)`,
    // destination
    `sendFeesLockConfirmation(bytes32,${paramTypes},uint256)`,
    `completeOperation(bytes32,${paramTypes},uint256)`,
    "emitCancelOperation(bytes32,uint256,uint256)",
  ];

  functionSignatures.forEach((signature) => {
    const functionSelector = ethers.id(signature).slice(0, 10);
    console.log(`Function: ${signature}, Selector: ${functionSelector}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
