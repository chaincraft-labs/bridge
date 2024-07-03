const hre = require("hardhat");
const { 
    readLastDeployedAddress, 
    createToken,
    initContext,
    deployMockedDaiToken,
} = require("./as_utils");


const handleDAIToken = async (network, storage, tokenFactory, tokenName, chainId) => {
    console.log(`⚪️ Handle ${tokenName.toUpperCase()} token for network ${network}/${chainId}.`)

    if (
        network === "sepolia" || 
        network === "anvil_local" || 
        network === "hardhat" || 
        network === "localhost"
    ) {
        await deployMockedDaiToken(network, storage,  chainId);
    } else {
        await createToken(network, tokenFactory, tokenName, chainId);
    }
}


// 
// MAIN
// 
async function main() {   
    const {network, chainId} = await initContext();
    const storageAddress = readLastDeployedAddress(network, "Storage");
    const tokenFactoryAddress = readLastDeployedAddress(network, "TokenFactory");   
    const storage = await hre.ethers.getContractAt("Storage", storageAddress);   
    const tokenFactory = await hre.ethers.getContractAt("TokenFactory", tokenFactoryAddress);   
    const tokenName = 'dai';
    await handleDAIToken(network, storage, tokenFactory, tokenName, chainId);
}

main().catch((error) => {console.error(error);});
