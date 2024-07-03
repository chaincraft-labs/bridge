const hre = require("hardhat");
const { 
    storeContractAddresses, 
    readLastDeployedAddress,
    initContext,
} = require("./as_utils");

const deployRelayerBase = async (network, storageAddress) => {
    console.log(`\n🔵 Deploying RelayerBase contract to storage ${storageAddress} ...`)
    const relayerBase = await hre.ethers.deployContract("RelayerBase", [storageAddress]);
    console.log("🔵 Awaiting for RelayerBase deployment ...")
    await relayerBase.waitForDeployment();
    console.log(`🟢 RelayerBase deployed at ${relayerBase.target} for storage ${storageAddress}`);
    
    storeContractAddresses([{
        network: network, 
        contractName: "RelayerBase", 
        address: relayerBase.target
    }]);

    return relayerBase;
}

// 
// MAIN
// 
async function main() {
    const {network} = await initContext();
    const storageAddress = await readLastDeployedAddress(network, "Storage");
    await deployRelayerBase(network, storageAddress);
}

main().catch((error) => {console.error(error);});
