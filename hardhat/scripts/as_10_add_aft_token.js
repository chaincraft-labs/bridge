const hre = require("hardhat");
const { 
    readLastDeployedAddress, 
    setTokenAddressToStorage,
    createToken,
    initContext,
} = require("./as_utils");


const handleAFTToken = async (network, storage, tokenFactory, tokenName, chainId) => {
    console.log(`⚪️ Handle ${tokenName.toUpperCase()} token for network ${network}/${chainId}.`)

    if (
        network === "sepolia" || 
        network === "anvil_local" || 
        network === "hardhat" || 
        network === "localhost"
    ) {
        await createToken(network, tokenFactory, tokenName, chainId);
    }
    
    await setTokenAddressToStorage(storage, tokenName, chainId);    
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
    
    const tokenName = 'allfeat';
    await handleAFTToken(network, storage, tokenFactory, tokenName, chainId);
}

main().catch((error) => {console.error(error);});
