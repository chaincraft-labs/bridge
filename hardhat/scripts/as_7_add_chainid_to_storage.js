const hre = require("hardhat");
const { 
    readLastDeployedAddress,
    initContext,
} = require("./as_utils");


const addChainIdToStorage = async (storage, chainIds) => {
    console.log(`\n⚪️ Add chainIds to storage list.`)
    for (const chainId of chainIds) {
        console.log(`🔵 Adding ${chainId} to storage ...`);
        const tx = await storage.addChainIdToList(chainId);
        await tx.wait();
    };

    const chainIdList = await storage.getChainIdsList();
    console.log(`🟢 chainIds added to storage : ${chainIdList}`);
}

// const getChainIds = async (storage) => {
//     const chainIdList = await storage.getChainIdsList();
//     console.log(`🟢 chainIds added to storage : ${chainIdList}`);
// }


// 
// MAIN
// 
async function main() {   
    const {network} = await initContext();
    const storageAddress = readLastDeployedAddress(network, "Storage");
    const storage = await hre.ethers.getContractAt("Storage", storageAddress);   
    await addChainIdToStorage(storage, [11155111, 31337, 440, 441]);     
}

main().catch((error) => {console.error(error);});
