const hre = require("hardhat");
const { 
    storeContractAddresses, 
    readLastDeployedAddress,
    initContext,
} = require("./as_utils");


const deployVault = async (network, storageAddress) => {
    console.log(`\n🔵 Deploying Vault contract to storage ${storageAddress} ...`)
    const vault = await hre.ethers.deployContract("Vault", [storageAddress]);
    console.log("🔵 Awaiting for Vault deployment ...")
    await vault.waitForDeployment();
    console.log(`🟢 Vault deployed at ${vault.target} for storage ${storageAddress}`);
    
    storeContractAddresses([{
        network: network, 
        contractName: "Vault", 
        address: vault.target
    }]);

    return vault;
}

// 
// MAIN
// 
async function main() {
    const {network} = await initContext();
    const storageAddress = await readLastDeployedAddress(network, "Storage");
    await deployVault(network, storageAddress);
}

main().catch((error) => {console.error(error);});
