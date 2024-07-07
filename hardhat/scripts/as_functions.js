const hre = require("hardhat");
const { getNativeToken } = require('../constants/tokens');
const { 
    addNativeToken,
    createBridgeOperation,
    createToken,
    deployMockedDaiToken,
    initContext,
    showContext,
    getLastContractAddresses,
    readLastDeployedAddress,
    storeContractAddresses,
    setTokenAddressToStorage,
    getNetworkParam,
    depoitFees,
} = require("./as_utils");


const showDeployAddresses = async () => {
    console.log(`\n---------------------------------------------------------------------`);
    const {network} = await initContext();
    await showContext();
    console.log(getLastContractAddresses(network));
}

const deployStorage = async () => {
    console.log("\n⚪️ Deploy Storage contract.");

    const {network, chainId} = await initContext();
    const nativeToken = getNativeToken(chainId);  

    console.log(`🔵 Deploying Storage with native token ${nativeToken} ...`);
    const storage = await hre.ethers.deployContract("Storage", [nativeToken]);
    await storage.waitForDeployment();
    console.log("🟢 Storage deployed at:", storage.target);
    
    storeContractAddresses([{network: network, contractName: "Storage", address: storage.target}]);
    return storage;
}

const deployTokenFactory = async () => {
    console.log(`\n⚪️ Deploy TokenFactory contract.`);

    const {network} = await initContext();
    const storageAddress = await readLastDeployedAddress(network, "Storage");
        
    console.log(`🔵 Deploying TokenFactory with Storage address ${storageAddress} ...`);
    const tokenFactory = await hre.ethers.deployContract("TokenFactory", [storageAddress]);
    await tokenFactory.waitForDeployment();
    console.log(`🟢 TokenFactory deployed at ${tokenFactory.target}`);
    
    storeContractAddresses([{network: network, contractName: "TokenFactory", address: tokenFactory.target}]);
    return tokenFactory;
}

const deployVault = async () => {
    const {network} = await initContext();
    
    console.log(`\n⚪️ Deploy Vault contract.`)
    const storageAddress = await readLastDeployedAddress(network, "Storage");
    
    console.log(`🔵 Deploying Vault contract with Storage address ${storageAddress} ...`);
    const vault = await hre.ethers.deployContract("Vault", [storageAddress]);
    await vault.waitForDeployment();
    console.log(`🟢 Vault deployed at ${vault.target}`);
    
    storeContractAddresses([{network: network, contractName: "Vault", address: vault.target}]);
    return vault;
}

const deployRelayerBase = async () => {
    const {network} = await initContext();
    
    console.log(`\n⚪️ Deploy RelayerBase contract.`)
    const storageAddress = await readLastDeployedAddress(network, "Storage");
    
    console.log(`🔵 Deploying RelayerBase contract with Storage address ${storageAddress} ...`);
    const relayerBase = await hre.ethers.deployContract("RelayerBase", [storageAddress]);
    await relayerBase.waitForDeployment();
    console.log(`🟢 RelayerBase deployed at ${relayerBase.target}`);
    
    storeContractAddresses([{network: network, contractName: "RelayerBase", address: relayerBase.target}]);
    return relayerBase;
}

const deployBridgeBase = async () => {
    const {network} = await initContext();

    console.log(`⚪️ Deploy BridgeBase contract.`)
    const storageAddress = await readLastDeployedAddress(network, "Storage");
    const relayerAddress = await readLastDeployedAddress(network, "RelayerBase");
    
    console.log(`🔵 Deploying BridgeBase contract with Storage ${storageAddress} and RelayerBase ${relayerAddress} addresses ...`);
    const bridgeBase = await hre.ethers.deployContract("BridgeBase", [storageAddress, relayerAddress]);
    await bridgeBase.waitForDeployment();
    console.log(`🟢 BridgeBase deployed at ${bridgeBase.target}`);

    storeContractAddresses([{network: network, contractName: "BridgeBase", address: bridgeBase.target}]);
    return bridgeBase;
}

const updateOperator = async () => {
    const {network} = await initContext();
    const storageAddress = readLastDeployedAddress(network, "Storage");
    const storage = await hre.ethers.getContractAt("Storage", storageAddress);   
    const contractAddresses = getLastContractAddresses(network);
    
    console.log(`\n⚪️ Update Storage operators.`)
    const operators = {
        TokenFactory: 'factory',
        Vault: 'vault',
        BridgeBase: 'bridge',
        RelayerBase: 'relayer',
        Oracle: 'oracle',
    };
    
    for (const contract in contractAddresses.contracts) {
        if (operators.hasOwnProperty(contract)) {
            const operatorName = operators[contract];
            const contractAddress = contractAddresses.contracts[contract];            

            console.log(`🔵 Setting ${operatorName} with address ${contractAddress} ...`);
            const tx = await storage.updateOperator(operatorName, contractAddress);
            await tx.wait();
            console.log(`🟢 ${operatorName} set with address ${contractAddress}.`);
        }
    }

    // Oracle
    const operatorName = 'oracle';
    const contractAddress = process.env.OPERATOR_ADDRESS;
    console.log(`🔵 Setting ${operatorName} with address ${contractAddress} ...`);
    const tx = await storage.updateOperator(operatorName, contractAddress);
    await tx.wait();
    console.log(`🟢 ${operatorName} set with address ${contractAddress}.`);
}

const addChainIds = async (chainIds) => {
<<<<<<< HEAD
    // e.g. chainIds = [11155111, 31337, 440, 441]
=======
    // chainIds = [11155111, 31337, 440, 441]
>>>>>>> origin/dev
    const {network} = await initContext();
    const storageAddress = readLastDeployedAddress(network, "Storage");
    const storage = await hre.ethers.getContractAt("Storage", storageAddress);
    
    console.log(`\n⚪️ Add chainIds to storage list.`)
    
    for (const chainId of chainIds) {
        console.log(`🔵 Adding ${chainId} ...`);
        const tx = await storage.addChainIdToList(chainId);
        await tx.wait();
    };

    const chainIdList = await storage.getChainIdsList();
    console.log(`🟢 chainIds added to storage : ${chainIdList}`);
}

const addTokens = async (tokens) => {
<<<<<<< HEAD
    // e.g. tokens = ['ethereum', 'allfeat', 'dai']
=======
    // tokens = ['ethereum', 'allfeat', 'dai']
>>>>>>> origin/dev
    const {network} = await initContext();
    const storageAddress = readLastDeployedAddress(network, "Storage");
    const storage = await hre.ethers.getContractAt("Storage", storageAddress);
    
    console.log(`\n⚪️ Add tokens to storage list.`);
    
    for (const token of tokens) {
        console.log(`🔵 Adding ${token} ...`);
        const tx = await storage.addTokenNameToList(token);
        await tx.wait();
    };

    const tokenNameList = await storage.getTokenNamesList();
    console.log(`🟢 Tokens added to storage : ${tokenNameList}`);
}

const addEth = async (networkEth) => {
    console.log(`\n⚪️ Add ETH token.`);

    const tokenName = 'ethereum';
    const {network, chainId} = await initContext();
    const storageAddress = readLastDeployedAddress(network, "Storage");
    const tokenFactoryAddress = readLastDeployedAddress(network, "TokenFactory");   
    const storage = await hre.ethers.getContractAt("Storage", storageAddress);
    const tokenFactory = await hre.ethers.getContractAt("TokenFactory", tokenFactoryAddress);

    if (
<<<<<<< HEAD
        network === "geth" || 
=======
>>>>>>> origin/dev
        network === "sepolia" || 
        network === "hardhat" || 
        network === "anvil_local" || 
        network === "localhost"
    ) {
        await addNativeToken(storage, tokenName, chainId)
    } else if (
        network === "allfeat" || 
        network === "allfeat_local"
    ) {
        await createToken(network, tokenFactory, tokenName, chainId);
    }

    const chainIdEth = getNetworkParam(networkEth).chainId;
    await setTokenAddressToStorage(storage, tokenName, chainIdEth);
}

const addAft = async (networkAft) => {
    console.log(`\n⚪️ Add AFT token.`);

    const tokenName = 'allfeat';
    const {network, chainId} = await initContext();
    const storageAddress = readLastDeployedAddress(network, "Storage");
    const tokenFactoryAddress = readLastDeployedAddress(network, "TokenFactory");
    const storage = await hre.ethers.getContractAt("Storage", storageAddress);   
    const tokenFactory = await hre.ethers.getContractAt("TokenFactory", tokenFactoryAddress);   

    if (
<<<<<<< HEAD
        network === "geth" || 
=======
>>>>>>> origin/dev
        network === "sepolia" || 
        network === "hardhat" || 
        network === "anvil_local" || 
        network === "localhost"
    ) {
        await createToken(network, tokenFactory, tokenName, chainId);
    }
    
    const chainIdAft = getNetworkParam(networkAft).chainId;
    await setTokenAddressToStorage(storage, tokenName, chainIdAft);
}

const addDai = async () => {
    console.log(`\n⚪️ Add DAI token.`);

    const tokenName = 'dai';
    const {network, chainId} = await initContext();
    const storageAddress = readLastDeployedAddress(network, "Storage");
    const tokenFactoryAddress = readLastDeployedAddress(network, "TokenFactory");
    const storage = await hre.ethers.getContractAt("Storage", storageAddress);   
    const tokenFactory = await hre.ethers.getContractAt("TokenFactory", tokenFactoryAddress);   

    if (
<<<<<<< HEAD
        network === "geth" || 
=======
>>>>>>> origin/dev
        network === "sepolia" || 
        network === "hardhat" || 
        network === "anvil_local" || 
        network === "localhost"
    ) {
        await deployMockedDaiToken(network, storage,  chainId);
    } else {
        await createToken(network, tokenFactory, tokenName, chainId);
    }
}


const userDepositToken = async (userName, amount, chainIdFrom, chainIdTo, tokenName) => {
    console.log(`\n⚪️ Deposit token.`);

    const {network} = await initContext();
    await createBridgeOperation(network, userName, amount, chainIdFrom, chainIdTo, tokenName);
}

const userDepositFees = async (userName, amount, chainIdFrom, chainIdTo, tokenName) => {
    console.log(`\n⚪️ Deposit fees.`);

    const {network} = await initContext();
    await depoitFees(network, userName, amount, chainIdFrom, chainIdTo, tokenName);
}

module.exports = {
    deployStorage,
    deployTokenFactory,
    deployVault,
    deployRelayerBase,
    deployBridgeBase,
    updateOperator,
    addChainIds,
    addTokens,
    addEth,
    addAft,
    addDai,
    userDepositToken,
    userDepositFees,
    showDeployAddresses,
}