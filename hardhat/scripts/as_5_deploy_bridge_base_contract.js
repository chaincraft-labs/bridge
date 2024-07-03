const hre = require("hardhat");
const { 
    storeContractAddresses, 
    readLastDeployedAddress,
    initContext,
} = require("./as_utils");

const deployBridgeBase = async (network, storageAddress, relayerAddress) => {
    console.log(`\n🔵 Deploying BridgeBase contract to storage ${storageAddress} and relayer ${relayerAddress} ...`)
    const bridgeBase = await hre.ethers.deployContract("BridgeBase", [storageAddress, relayerAddress]);
    console.log("🔵 Awaiting for BridgeBase deployment ...")
    await bridgeBase.waitForDeployment();
    console.log(`🟢 BridgeBase deployed at ${bridgeBase.target} for storage ${storageAddress} and relayer ${relayerAddress}`);
    
    storeContractAddresses([{
        network: network, 
        contractName: "BridgeBase", 
        address: bridgeBase.target
    }]);

    return bridgeBase;
}

// 
// MAIN
// 
async function main() {
    const {network} = await initContext();
    const storageAddress = await readLastDeployedAddress(network, "Storage");
    const relayerAddress = await readLastDeployedAddress(network, "RelayerBase");
    await deployBridgeBase(network, storageAddress, relayerAddress);
}

main().catch((error) => {console.error(error);});
