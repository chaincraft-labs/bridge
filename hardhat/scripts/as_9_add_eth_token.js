const hre = require("hardhat");
const { 
    readLastDeployedAddress, 
    setTokenAddressToStorage,
    deployBridgedToken,
    createToken,
    addNativeToken,
    initContext,
} = require("./as_utils");


const handleETHToken = async (
    network, storage, tokenFactory, vault, tokenName, chainId
) => {
    console.log(`⚪️ Handle ${tokenName.toUpperCase()} token for network ${network}/${chainId}.`)

    if (
        network === "sepolia" || 
        network === "anvil_local" || 
        network === "hardhat" || 
        network === "localhost"
    ) {
        await addNativeToken(storage, tokenName, chainId)
    } else if (
        network === "allfeat" || 
        network === "allfeat_local"
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
    const vaultAddress = readLastDeployedAddress(network, "Vault");
    
    const storage = await hre.ethers.getContractAt("Storage", storageAddress);
    const tokenFactory = await hre.ethers.getContractAt("TokenFactory", tokenFactoryAddress);
    const vault = await hre.ethers.getContractAt("Vault", vaultAddress);
    
    const tokenName = 'ethereum';
    await handleETHToken(network, storage, tokenFactory, vault, tokenName, chainId);
}

main().catch((error) => {console.error(error);});
