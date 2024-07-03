const hre = require("hardhat");
const { 
    storeContractAddresses, 
    readLastDeployedAddress,
    initContext, 
} = require("./as_utils");


const deployTokenFactory = async (network, storageAddress) => {
    console.log(`\n🔵 Deploying TokenFactory contract to storage ${storageAddress} ...`)
    const tokenFactory = await hre.ethers.deployContract("TokenFactory", [storageAddress]);
    console.log("🔵 Awaiting for TokenFactory deployment ...")
    await tokenFactory.waitForDeployment();
    console.log(`🟢 TokenFactory deployed at ${tokenFactory.target} for storage ${storageAddress}`);
    
    storeContractAddresses([{
        network: network, 
        contractName: "TokenFactory", 
        address: tokenFactory.target
    }]);

    return tokenFactory;
}


// 
// MAIN
// 
async function main() {
    const {network} = await initContext();
    const storageAddress = await readLastDeployedAddress(network, "Storage");
    await deployTokenFactory(network, storageAddress);

}

main().catch((error) => {console.error(error);});
