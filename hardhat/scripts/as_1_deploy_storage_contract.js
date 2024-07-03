const hre = require("hardhat");
const { storeContractAddresses, initContext } = require("./as_utils");

const deployStorage = async (network, nativeSymbol) => {
    console.log("\n🔵 Deploying Storage contract ...")
    const storage = await hre.ethers.deployContract("Storage", [nativeSymbol]);
    console.log("🔵 Awaiting for Storage deployment ...")
    await storage.waitForDeployment();
    console.log("🟢 Storage deployed at:", storage.target);

    storeContractAddresses([{
        network: network, 
        contractName: "Storage", 
        address: storage.target
    }]);

    return storage;
}

// 
// MAIN
// 
async function main() {
    const {network, nativeSymbol} = await initContext();
    await deployStorage(network, nativeSymbol);
}

main().catch((error) => {console.error(error);});
