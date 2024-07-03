const hre = require("hardhat");
const { readLastDeployedAddress, initContext } = require("./as_utils");


const addTokensToStorage = async (storage, tokens) => {
    
    console.log(`\n⚪️ Add tokens to storage list.`)
    
    for (const token of tokens) {
        console.log(`🔵 Adding ${token} to storage ...`);
        const tx = await storage.addTokenNameToList(token);
        await tx.wait();
    };

    const tokenNameList = await storage.getTokenNamesList();
    console.log(`🟢 Tokens added to storage : ${tokenNameList}`);
}

const getTokenNames = async (storage) => {
    const tokenNameList = await storage.getTokenNamesList();
    console.log(`🟢 Tokens added to storage : ${tokenNameList}`);
}

// 
// MAIN
// 
async function main() {
    const {network} = await initContext();
    const storageAddress = readLastDeployedAddress(network, "Storage");
    const storage = await hre.ethers.getContractAt("Storage", storageAddress);
    await addTokensToStorage(storage, ['ethereum', 'allfeat', 'dai']);
}

main().catch((error) => {console.error(error);});
