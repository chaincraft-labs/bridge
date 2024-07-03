const hre = require("hardhat");
const { 
    addNativeToken,
    createToken,
    deployMockedDaiToken,
    initContext,
    showContext,
    getLastContractAddresses,
    readLastDeployedAddress,
    storeContractAddresses,
    setTokenAddressToStorage,
} = require("./as_utils");


const showDeployAddresses = async () => {
    const {network} = await initContext();
    await showContext();
    console.log(getLastContractAddresses(network));
}


const deployStorage = async () => {
    const {network} = await initContext();
    console.log("⚪️ Deploying Storage contract ...")
    const storage = await hre.ethers.deployContract("Storage", [""]);
    console.log("🔵 Awaiting for Storage deployment ...")
    await storage.waitForDeployment();
    console.log("🟢 Storage deployed at:", storage.target);
    storeContractAddresses([{network: network, contractName: "Storage", address: storage.target}]);
    return storage;
}

const deployTokenFactory = async () => {
    const {network} = await initContext();
    const storageAddress = await readLastDeployedAddress(network, "Storage");
    console.log(`⚪️ Deploying TokenFactory contract to storage ${storageAddress} ...`)
    const tokenFactory = await hre.ethers.deployContract("TokenFactory", [storageAddress]);
    console.log("🔵 Awaiting for TokenFactory deployment ...")
    await tokenFactory.waitForDeployment();
    console.log(`🟢 TokenFactory deployed at ${tokenFactory.target} for storage ${storageAddress}`);
    storeContractAddresses([{network: network, contractName: "TokenFactory", address: tokenFactory.target}]);
    return tokenFactory;
}

const deployVault = async () => {
    const {network} = await initContext();
    const storageAddress = await readLastDeployedAddress(network, "Storage");
    console.log(`⚪️ Deploying Vault contract to storage ${storageAddress} ...`)
    const vault = await hre.ethers.deployContract("Vault", [storageAddress]);
    console.log("🔵 Awaiting for Vault deployment ...")
    await vault.waitForDeployment();
    console.log(`🟢 Vault deployed at ${vault.target} for storage ${storageAddress}`);
    storeContractAddresses([{network: network, contractName: "Vault", address: vault.target}]);
    return vault;
}

const deployRelayerBase = async () => {
    const {network} = await initContext();
    const storageAddress = await readLastDeployedAddress(network, "Storage");
    console.log(`⚪️ Deploying RelayerBase contract to storage ${storageAddress} ...`)
    const relayerBase = await hre.ethers.deployContract("RelayerBase", [storageAddress]);
    console.log("🔵 Awaiting for RelayerBase deployment ...")
    await relayerBase.waitForDeployment();
    console.log(`🟢 RelayerBase deployed at ${relayerBase.target} for storage ${storageAddress}`);
    storeContractAddresses([{network: network, contractName: "RelayerBase", address: relayerBase.target}]);
    return relayerBase;
}

const deployBridgeBase = async () => {
    const {network} = await initContext();
    const storageAddress = await readLastDeployedAddress(network, "Storage");
    const relayerAddress = await readLastDeployedAddress(network, "RelayerBase");
    console.log(`⚪️ Deploying BridgeBase contract to storage ${storageAddress} and relayer ${relayerAddress} ...`)
    const bridgeBase = await hre.ethers.deployContract("BridgeBase", [storageAddress, relayerAddress]);
    console.log("🔵 Awaiting for BridgeBase deployment ...")
    await bridgeBase.waitForDeployment();
    console.log(`🟢 BridgeBase deployed at ${bridgeBase.target} for storage ${storageAddress} and relayer ${relayerAddress}`);
    storeContractAddresses([{network: network, contractName: "BridgeBase", address: bridgeBase.target}]);
    return bridgeBase;
}

const updateOperator = async () => {
    const {network} = await initContext();
    const storageAddress = readLastDeployedAddress(network, "Storage");
    const storage = await hre.ethers.getContractAt("Storage", storageAddress);   
    const contractAddresses = getLastContractAddresses(network);
    console.log(`⚪️ Updating Storage operators ...`)
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

            console.log(`🔵 Setting ${operatorName} with address ${contractAddress} in storage ...`);
            const tx = await storage.updateOperator(operatorName, contractAddress);
            await tx.wait();
            console.log(`🟢 ${operatorName} set with address ${contractAddress} in storage.`);
        }
    }
}

const addChainIds = async (chainIds) => {
    // const chainIds = [11155111, 31337, 440, 441]
    const {network} = await initContext();
    const storageAddress = readLastDeployedAddress(network, "Storage");
    const storage = await hre.ethers.getContractAt("Storage", storageAddress);
    console.log(`⚪️ Adding chainIds to storage list.`)
    for (const chainId of chainIds) {
        console.log(`🔵 ${chainId}`);
        const tx = await storage.addChainIdToList(chainId);
        await tx.wait();
    };

    const chainIdList = await storage.getChainIdsList();
    console.log(`🟢 chainIds added to storage : ${chainIdList}`);
}

const addTokens = async (tokens) => {
    // const tokens = ['ethereum', 'allfeat', 'dai']
    const {network} = await initContext();
    const storageAddress = readLastDeployedAddress(network, "Storage");
    const storage = await hre.ethers.getContractAt("Storage", storageAddress);
    
    console.log(`⚪️ Adding tokens to storage list.`)
    
    for (const token of tokens) {
        console.log(`🔵 ${token}`);
        const tx = await storage.addTokenNameToList(token);
        await tx.wait();
    };

    const tokenNameList = await storage.getTokenNamesList();
    console.log(`🟢 Tokens added to storage : ${tokenNameList}`);
}

const addEth = async () => {
    const tokenName = 'ethereum';
    const {network, chainId} = await initContext();
    const storageAddress = readLastDeployedAddress(network, "Storage");
    const tokenFactoryAddress = readLastDeployedAddress(network, "TokenFactory");   
    const storage = await hre.ethers.getContractAt("Storage", storageAddress);
    const tokenFactory = await hre.ethers.getContractAt("TokenFactory", tokenFactoryAddress);

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

const addAft = async () => {
    const tokenName = 'allfeat';
    const {network, chainId} = await initContext();
    const storageAddress = readLastDeployedAddress(network, "Storage");
    const tokenFactoryAddress = readLastDeployedAddress(network, "TokenFactory");
    const storage = await hre.ethers.getContractAt("Storage", storageAddress);   
    const tokenFactory = await hre.ethers.getContractAt("TokenFactory", tokenFactoryAddress);   

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

const addDai = async () => {
    const tokenName = 'dai';
    const {network, chainId} = await initContext();
    const storageAddress = readLastDeployedAddress(network, "Storage");
    const tokenFactoryAddress = readLastDeployedAddress(network, "TokenFactory");
    const storage = await hre.ethers.getContractAt("Storage", storageAddress);   
    const tokenFactory = await hre.ethers.getContractAt("TokenFactory", tokenFactoryAddress);   

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

const userDepositToken = async (userAddress, amount) => {
    const {network, chainId} = await initContext();

    console.log(`⚪️ Depositing token for user '' ...`);
    const bridgeAddress = await readLastDeployedAddress(network, "BridgeBase");
    const bridge = await hre.ethers.getContractAt("BridgeBase", bridgeAddress);
    nonce = "";
    
    const msgHashed = await bridge.getMessageHash(
        userWallet.address,
        userWallet.address,
        11155111,
        441,
        "ethereum",
        amount,
        nonce
      );
    console.log(`🟢 Token desposited for user.`);
}

const userDepositFee = async () => {
    console.log(`⚪️ Depositing fees for user '' ...`);
    console.log(`🟢 Fees desposited for user.`);
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
    userDepositFee,
    showDeployAddresses,
}