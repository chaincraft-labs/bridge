const hre = require("hardhat");
const { 
    getLastContractAddresses, 
    readLastDeployedAddress,
    initContext,
} = require("./as_utils");

const updateStorageOperator = async (storage, contractAddresses) => {
    console.log(`\n⚪️ Update Storage operators`)

    const operators = {
        TokenFactory: 'factory',
        Vault: 'vault',
        BridgeBase: 'bridge',
        RelayerBase: 'relayer',
        Oracle: 'oracle',
    };
    
    for (const contract in contractAddresses.contracts) {
        if (operators.hasOwnProperty(contract)) {
            const operatorName = operators[contract];
            const contractAddress = contractAddresses.contracts[contract];

            console.log(`\n🔵 Setting ${operatorName} with address ${contractAddress} in storage ...`);
            const tx = await storage.updateOperator(operatorName, contractAddress);
            await tx.wait();
            console.log(`🔵 Checking role ${operatorName} : ${await storage.getOperators([operatorName])}`);
            console.log(`🟢 ${operatorName} set with address ${contractAddress} in storage.`);
        }
    }
}

// 
// MAIN
// 
async function main() {   
    const {network} = await initContext();
    const storageAddress = readLastDeployedAddress(network, "Storage");
    const storage = await hre.ethers.getContractAt("Storage", storageAddress);   
    const lastContractAddresses = getLastContractAddresses(network);
    await updateStorageOperator(storage, lastContractAddresses);
}

main().catch((error) => {console.error(error);});
