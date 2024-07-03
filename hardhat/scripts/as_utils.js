const hre = require("hardhat");
const ethers = require("ethers");
const fs = require("fs");
const path = require("path");

const { getTokenSymbol } = require('../constants/tokens');
const { networkParams } = require('../constants/networks');


const CONSTANT_DIR = "constants";
const DEPLOY_ADDRESSES_FILE = "constants/deployedAddresses.json";
const NONCE_FILE = "nonce.json"

const setNonce = async (userAddress) => {
    const nonceFile = path.join(CONSTANT_DIR, NONCE_FILE);
    
    try {
        const nonceJson = JSON.parse(fs.readFileSync(nonceFile, "utf8"));
        if (nonceJson.hasOwnProperty(userAddress)) {
            nonceJson[userAddress]++;
        } else {
            nonceJson[userAddress] = 0;
        }

        fs.writeFile(nonceFile, JSON.stringify(nonceJson), (err) => {
            if (err) throw err;
            // console.log('File written successfully!');
        });
    }
    catch (err) {
        console.log(err)
    }
}

const getNonce = async (userAddress) => {
    const nonceFile = path.join(CONSTANT_DIR, NONCE_FILE);
    
    try {
        const nonceJson = JSON.parse(fs.readFileSync(nonceFile, "utf8"));
        if (!nonceJson.hasOwnProperty(userAddress)) {
            await setNonce(userAddress);
        }

        console.log(`nonce ${nonceJson[userAddress]} for ${userAddress}`)
        return nonceJson[userAddress];
    }
    catch (err) {
        console.log(err)
    }
}


const toChecksumAddress = (address) => {
    return ethers.getAddress(address);
};

const getMaxAddress = () => {
    return toChecksumAddress("0x" + "f".repeat(40));
};

const showContext = async () => {
    const {network, owner, chainId, nativeSymbol} = await initContext();
    
    console.log(`network       : ${network}`);
    console.log(`chain id      : ${chainId}`);
    console.log(`Native symbol : ${nativeSymbol}`);
    console.log(`owner         : ${owner.address}`);
}

const initContext = async () => {
    const network = hre.network.name;
    const [owner] = await hre.ethers.getSigners();
    const networkParam = networkParams[network];
    const chainId = networkParam.chainId;
    const nativeSymbol = networkParam.nativeSymbol;
    
    return {network, owner, networkParam, chainId, nativeSymbol};
}

const getLastContractAddresses = (network) => {
    const deployedAddresses = JSON.parse(
        fs.readFileSync(DEPLOY_ADDRESSES_FILE)
    );

    if (!deployedAddresses) {
        return null;
    }
      
    if (deployedAddresses[network]) {
        let lastRecords = {
            'contracts': {},
            'tokens': {},
        };
        for (const contract in deployedAddresses[network]) {
            
            const length = deployedAddresses[network][contract].length;
            const addresses = deployedAddresses[network][contract];
            if (Object.prototype.toString.call(addresses) === '[object Array]') {                
                lastRecords['contracts'][contract] = addresses[length -1];

            } else if (Object.prototype.toString.call(addresses) === '[object Object]') {
                lastRecords['tokens'][contract] = {}
                // token struc
                for (const token in deployedAddresses[network][contract]) {
                    const length = deployedAddresses[network][contract][token].length;
                    const addresses = deployedAddresses[network][contract][token];
                    lastRecords['tokens'][contract][token] = addresses[length -1];
                }
            }
        }
        return lastRecords;
    }
    return null;
};

const readLastDeployedAddress = (network, contractName, tokenName = null) => {
    const deployedAddresses = JSON.parse(
      fs.readFileSync(DEPLOY_ADDRESSES_FILE)
    );

    if (!deployedAddresses) {
      return null;
    }
      
    if (deployedAddresses[network] && deployedAddresses[network][contractName]) {
      if (!tokenName) {
        return deployedAddresses[network][contractName][deployedAddresses[network][contractName].length - 1];
      } else {
        if (deployedAddresses[network][contractName][tokenName]) {
          return deployedAddresses[network][contractName][tokenName][deployedAddresses[network][contractName][tokenName].length - 1];
        }
      }
    }
    return null;
};

const writeDeployedAddress = (network, contractName, address, tokenName = null) => { 
    if (!fs.existsSync(CONSTANT_DIR)) {
      fs.mkdirSync(CONSTANT_DIR);
    }

    if (!fs.existsSync(DEPLOY_ADDRESSES_FILE)) {
      fs.writeFileSync(DEPLOY_ADDRESSES_FILE, "{}");
    }
  
    const deployedAddresses = JSON.parse(
      fs.readFileSync(DEPLOY_ADDRESSES_FILE)
    );
  
    if (!deployedAddresses[network]) {
      deployedAddresses[network] = {};
    }
    
    if (!deployedAddresses[network][contractName]) {
      deployedAddresses[network][contractName] = tokenName ? {} : [];
    }
  
    if (tokenName && !deployedAddresses[network][contractName][tokenName]) {
      deployedAddresses[network][contractName][tokenName] = [];
    }
  
    if (!tokenName) {
      deployedAddresses[network][contractName].push(address);
    } else {
      deployedAddresses[network][contractName][tokenName].push(address);
    }
  
    fs.writeFileSync(DEPLOY_ADDRESSES_FILE, JSON.stringify(deployedAddresses, null, 2));
};

const storeContractAddresses = (params) => {
    console.log(`\n⚪️ Store contract addresses to db.`)
    params.map((param) => {
        console.log(`🔵 Storing ${param.address} address for network ${param.network} ...`);
        writeDeployedAddress(
            param.network, 
            param.contractName, 
            param.address,
            param?.tokenName
        );
    });
}

const setTokenAddressToStorage = async (storage, tokenName, chainId) => {
    const tokenSymbol = getTokenSymbol(tokenName, chainId);
    
    console.log(`🔵 Setting token ${tokenName}/${tokenSymbol} in storage at ${getMaxAddress()} for chainId ${chainId} ...`);
    try {
        const tx = await storage.setTokenAddressByChainId(tokenName, chainId, getMaxAddress());
        await tx.wait();
        console.log(`🟢 Token ${tokenName}/${tokenSymbol} set in storage at ${getMaxAddress()} for chainId ${chainId}`);
    } 
    catch (err) {
        console.log(err.message)
    }
}

const deployBridgedToken = async (network, tokenFactory, vault, tokenName, chainId) => {
    /**
     * Create a ERC20 Token.
     * 
     * Deploy a BridgedToken contract to deploy the token.
     * Transfer ownership to vault contract.
     * 
     * Use the helper to solve an estimation gas issue on Allfeat chain.
     */

    const contractName = "BridgedToken";
    const tokenSymbol = getTokenSymbol(tokenName, chainId);
    
    console.log(`🔵 Deploying token ${tokenName}/${tokenSymbol} ... `);
    try {
        const contract = await hre.ethers.deployContract(contractName, [tokenName, tokenSymbol,]);
        await contract.waitForDeployment();
        
        const tx1 = await contract.updateAdmin(vault.target);
        await tx1.wait();

        const tx2 = await tokenFactory.helperHCK(tokenName, tokenSymbol, contract.target);
        await tx2.wait();
        
        const tokenAddress = await tokenFactory.getTokenAddress(tokenSymbol);
        console.log(`🟢 Token ${tokenName}/${tokenSymbol} deployed at ${tokenAddress}`);
        
        storeContractAddresses([{
            network: network,
            contractName: contractName,
            address: tokenAddress,
            tokenName: tokenSymbol
        }]);
    }
    catch (err) {
        if (err.message.includes("VM Exception while processing transaction: revert")) {
            console.log(`🟠 Token ${tokenName}/${tokenSymbol} already created`);
        } else {
            console.log(`🔴 Unknown error : ${err}`);
        }
    }
}

const addNativeToken = async (storage, tokenName, chainId) => {
    console.log(`🔵 Adding token ${tokenName} ${getMaxAddress()} ...`);
    
    try {
        const tx = await storage.addNativeTokenByChainId(tokenName, chainId);
        await tx.wait();
        console.log(`🟢 Token ${tokenName} added!`);
    }
    catch (err) {
        console.log(`🔴 Unknown error : ${err}`);
    }
}

const createToken = async (network, tokenFactory, tokenName, chainId) => {
    const tokenSymbol = getTokenSymbol(tokenName, chainId);    
    console.log(`🔵 Creating the token ${tokenName}/${tokenSymbol} ... `);
    
    try {
        const tx = await tokenFactory.createToken(tokenName, tokenSymbol);
        await tx.wait();
        
        const tokenAddress = await tokenFactory.getTokenAddress(tokenSymbol);
        console.log(`🟢 Token ${tokenName}/${tokenSymbol} created at ${tokenAddress}`);
        
        storeContractAddresses([{
            network: network,
            contractName: "BridgedToken",
            address: tokenAddress,
            tokenName: tokenSymbol
        }]);
    }
    catch (err) {
        if (err.message.includes("reverted with reason string 'TokenFactory: token symbol already exists")) {
            console.log(`🟠 Token ${tokenName}/${tokenSymbol} already created`);
        } else {
            console.log(`🔴 Unknown error : ${err}`);
        }
    }
}

const deployMockedDaiToken = async (network, storage, chainId) => {
    /**
     * Create a mocked DAI Token.
     * 
     */
    const contractName = "MockedDai";
    const tokenName = 'dai';

    console.log(`🔵 Deploying token ${tokenName} ... `);
    try {
        const contract = await hre.ethers.deployContract(contractName);
        await contract.waitForDeployment();
        
        tx = await storage.addNewTokenAddressByChainId(tokenName, chainId, contract.target);
        await tx.wait();
            
        console.log(`🟢 Token ${tokenName} deployed at ${contract.target}`);
        
        storeContractAddresses([{
            network: network,
            contractName: contractName,
            address: contract.target,
        }]);
    }
    catch (err) {
        if (err.message.includes("reverted with custom error 'storage_token_already_set")) {
            console.log(`🟠 Token ${tokenName} already created`);
        } else {
            console.log(`🔴 Unknown error : ${err}`);
        }
    }
}

module.exports = {
    storeContractAddresses,
    readLastDeployedAddress,
    getLastContractAddresses,
    setTokenAddressToStorage,
    deployBridgedToken,
    addNativeToken,
    createToken,
    showContext,
    initContext,
    getMaxAddress,
    toChecksumAddress,
    deployMockedDaiToken,
    setNonce,
    getNonce,
};