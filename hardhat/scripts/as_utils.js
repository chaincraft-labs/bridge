const hre = require("hardhat");
const ethers = require("ethers");
const fs = require("fs");
const path = require("path");
const { getTokenSymbol, networkParams } = require("../helpers/configHelper");

const CONSTANT_DIR = "constants";
const DEPLOY_ADDRESSES_FILE = "constants/deployedAddresses.json";
const NONCE_FILE = "nonce.json";

const initNonce = () => {
  const nonceFile = path.join(CONSTANT_DIR, NONCE_FILE);

  try {
    fs.writeFile(nonceFile, JSON.stringify({}, null, 4), (err) => {
      if (err) throw err;
    });
  } catch (err) {
    console.log(err);
  }
};

const setNonce = async (userAddress) => {
  const { chainId } = await initContext();
  const nonceFile = path.join(CONSTANT_DIR, NONCE_FILE);

  try {
    let nonceJson = JSON.parse(fs.readFileSync(nonceFile, "utf8"));

    if (!nonceJson.hasOwnProperty(chainId)) {
      nonceJson[chainId] = {};
    }

    if (nonceJson[chainId].hasOwnProperty(userAddress)) {
      nonceJson[chainId][userAddress]++;
    } else {
      nonceJson[chainId][userAddress] = 0;
    }

    fs.writeFile(nonceFile, JSON.stringify(nonceJson, null, 4), (err) => {
      if (err) throw err;
    });
  } catch (err) {
    console.log(err);
  }
};

const getNonce = async (userAddress) => {
  const { chainId } = await initContext();
  const nonceFile = path.join(CONSTANT_DIR, NONCE_FILE);

  try {
    const nonceJson = JSON.parse(fs.readFileSync(nonceFile, "utf8"));

    if (
      !nonceJson.hasOwnProperty(chainId) ||
      !nonceJson[chainId].hasOwnProperty(userAddress)
    ) {
      setNonce(userAddress);
      return 0;
    }

    return nonceJson[chainId][userAddress];
  } catch (err) {
    console.log(err);
  }
};

const toChecksumAddress = (address) => {
  return ethers.getAddress(address);
};

const getMaxAddress = () => {
  return toChecksumAddress("0x" + "f".repeat(40));
};

const showContext = async () => {
  const { network, owner, chainId, nativeSymbol } = await initContext();

  console.log(`network       : ${network}`);
  console.log(`chain id      : ${chainId}`);
  console.log(`Native symbol : ${nativeSymbol}`);
  console.log(`owner         : ${owner.address}`);
};

const getNetworkParam = (network) => {
  return networkParams[network];
};

const initContext = async () => {
  const network = hre.network.name;
  const [owner] = await hre.ethers.getSigners();
  const networkParam = networkParams[network];
  const chainId = networkParam.chainId;
  const nativeSymbol = networkParam.nativeToken.symbol;

  return { network, owner, networkParam, chainId, nativeSymbol };
};

const getLastContractAddresses = (network) => {
  const deployedAddresses = JSON.parse(fs.readFileSync(DEPLOY_ADDRESSES_FILE));

  if (!deployedAddresses) {
    return null;
  }

  if (deployedAddresses[network]) {
    let lastRecords = {
      contracts: {},
      tokens: {},
    };
    for (const contract in deployedAddresses[network]) {
      const length = deployedAddresses[network][contract].length;
      const addresses = deployedAddresses[network][contract];
      if (Object.prototype.toString.call(addresses) === "[object Array]") {
        lastRecords["contracts"][contract] = addresses[length - 1];
      } else if (
        Object.prototype.toString.call(addresses) === "[object Object]"
      ) {
        lastRecords["tokens"][contract] = {};
        // token struc
        for (const token in deployedAddresses[network][contract]) {
          const length = deployedAddresses[network][contract][token].length;
          const addresses = deployedAddresses[network][contract][token];
          lastRecords["tokens"][contract][token] = addresses[length - 1];
        }
      }
    }
    return lastRecords;
  }
  return null;
};

const readLastDeployedAddress = (network, contractName, tokenName = null) => {
  const deployedAddresses = JSON.parse(fs.readFileSync(DEPLOY_ADDRESSES_FILE));

  if (!deployedAddresses) {
    return null;
  }

  if (deployedAddresses[network] && deployedAddresses[network][contractName]) {
    if (!tokenName) {
      return deployedAddresses[network][contractName][
        deployedAddresses[network][contractName].length - 1
      ];
    } else {
      if (deployedAddresses[network][contractName][tokenName]) {
        return deployedAddresses[network][contractName][tokenName][
          deployedAddresses[network][contractName][tokenName].length - 1
        ];
      }
    }
  }
  return null;
};

const writeDeployedAddress = (
  network,
  contractName,
  address,
  tokenName = null
) => {
  if (!fs.existsSync(CONSTANT_DIR)) {
    fs.mkdirSync(CONSTANT_DIR);
  }

  if (!fs.existsSync(DEPLOY_ADDRESSES_FILE)) {
    fs.writeFileSync(DEPLOY_ADDRESSES_FILE, "{}");
  }

  const deployedAddresses = JSON.parse(fs.readFileSync(DEPLOY_ADDRESSES_FILE));

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

  fs.writeFileSync(
    DEPLOY_ADDRESSES_FILE,
    JSON.stringify(deployedAddresses, null, 2)
  );
};

const storeContractAddresses = (params) => {
  // console.log(`\n⚪️ Store contract addresses to db.`)
  params.map((param) => {
    console.log(
      `🔵 Storing ${param.address} address for network ${param.network} ...`
    );
    writeDeployedAddress(
      param.network,
      param.contractName,
      param.address,
      param?.tokenName
    );
  });
};

const setTokenAddressToStorage = async (storage, tokenName, chainId) => {
  const tokenSymbol = getTokenSymbol(tokenName, chainId);

  console.log(
    `🔵 Setting token ${tokenName}/${tokenSymbol} for chainId ${chainId} at ${getMaxAddress()} ...`
  );
  try {
    const tx = await storage.setTokenAddressByChainId(
      tokenName,
      chainId,
      getMaxAddress()
    );
    await tx.wait();
    console.log(`🟢 Token set!`);
  } catch (err) {
    console.log(err.message);
  }
};

const deployBridgedToken = async (
  network,
  tokenFactory,
  vault,
  tokenName,
  chainId
) => {
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
    const contract = await hre.ethers.deployContract(contractName, [
      tokenName,
      tokenSymbol,
    ]);
    await contract.waitForDeployment();

    const tx1 = await contract.updateAdmin(vault.target);
    await tx1.wait();

    const tx2 = await tokenFactory.helperHCK(
      tokenName,
      tokenSymbol,
      contract.target
    );
    await tx2.wait();

    const tokenAddress = await tokenFactory.getTokenAddress(tokenSymbol);
    console.log(`🟢 Token deployed at ${tokenAddress}`);

    storeContractAddresses([
      {
        network: network,
        contractName: contractName,
        address: tokenAddress,
        tokenName: tokenSymbol,
      },
    ]);
  } catch (err) {
    if (
      err.message.includes("VM Exception while processing transaction: revert")
    ) {
      console.log(`🟠 Token ${tokenName}/${tokenSymbol} already created`);
    } else {
      console.log(`🔴 Unknown error : ${err}`);
    }
  }
};

const addNativeToken = async (storage, tokenName, chainId) => {
  try {
    const tx = await storage.addNativeTokenByChainId(tokenName, chainId);
    await tx.wait();
  } catch (err) {
    console.log(`🔴 Unknown error : ${err}`);
  }
};

const createToken = async (network, tokenFactory, tokenName, chainId) => {
  const tokenSymbol = getTokenSymbol(tokenName, chainId);

  try {
    const tx = await tokenFactory.createToken(tokenName, tokenSymbol);
    await tx.wait();

    const tokenAddress = await tokenFactory.getTokenAddress(tokenSymbol);

    storeContractAddresses([
      {
        network: network,
        contractName: "BridgedToken",
        address: tokenAddress,
        tokenName: tokenSymbol,
      },
    ]);
  } catch (err) {
    if (err.message.includes("token symbol already exists")) {
      console.log(`🟠 Token ${tokenName}/${tokenSymbol} already created`);
    } else {
      console.log(`🔴 Unknown error : ${err}`);
    }
  }
};

const deployMockedDaiToken = async (network, storage, chainId) => {
  /**
   * Create a mocked DAI Token.
   *
   */
  const contractName = "MockedDai";
  const tokenName = "dai";

  console.log(`🔵 Deploying token ${tokenName} ... `);
  try {
    const contract = await hre.ethers.deployContract(contractName);
    await contract.waitForDeployment();

    tx = await storage.addNewTokenAddressByChainId(
      tokenName,
      chainId,
      contract.target
    );
    await tx.wait();

    console.log(`🟢 Token deployed at ${contract.target}`);

    storeContractAddresses([
      {
        network: network,
        contractName: contractName,
        address: contract.target,
      },
    ]);
  } catch (err) {
    if (
      err.message.includes(
        "reverted with custom error 'storage_token_already_set"
      )
    ) {
      console.log(`🟠 Token ${tokenName} already created`);
    } else {
      console.log(`🔴 Unknown error : ${err}`);
    }
  }
};

const getUser = async (userName) => {
  try {
    return new ethers.Wallet(
      process.env[userName.toUpperCase()],
      hre.ethers.provider
    );
  } catch (err) {
    throw `User '${userName}' does not exist!`;
  }
};

const createBridgeOperation = async (
  network,
  userName,
  amount,
  chainIdFrom,
  chainIdTo,
  tokenName
) => {
  const userWallet = await getUser(userName);
  const userAddress = userWallet.address;
  const nonce = await getNonce(userAddress);

  console.log(`🔵 Depositing token by user ${userAddress} ...`);
  const bridgeAddress = await readLastDeployedAddress(network, "BridgeBase");
  const bridge = await hre.ethers.getContractAt("BridgeBase", bridgeAddress);

  console.log(`\nuserAddress : ${userAddress}`);
  console.log(`chainIdFrom : ${chainIdFrom}`);
  console.log(`chainIdTo   : ${chainIdTo}`);
  console.log(`tokenName   : ${tokenName}`);
  console.log(`amount      : ${amount}`);
  console.log(`nonce       : ${nonce}\n`);

  const msgHashed = await bridge.getMessageHash(
    userAddress,
    userAddress,
    chainIdFrom,
    chainIdTo,
    tokenName,
    amount,
    nonce
  );

  console.log(`🔵 Signing message ...`);
  const signedMsgHased = await userWallet.signMessage(
    ethers.getBytes(msgHashed)
  );
  console.log(`🟢 Message signed.`);

  console.log(`🔵 Creating bridge operation ...`);
  const tx = await bridge
    .connect(userWallet)
    .createBridgeOperation(
      userAddress,
      userAddress,
      chainIdFrom,
      chainIdTo,
      tokenName,
      amount,
      nonce,
      signedMsgHased,
      { value: amount }
    );
  await tx.wait();

  await setNonce(userAddress);
  console.log(`🟢 Token desposited.`);
};

const depoitFees = async (
  network,
  userName,
  amount,
  chainIdFrom,
  chainIdTo,
  tokenName
) => {
  const userWallet = await getUser(userName);
  const userAddress = userWallet.address;
  const nonce = await getNonce(userAddress);
  const bridgeAddress = await readLastDeployedAddress(network, "BridgeBase");
  const bridge = await hre.ethers.getContractAt("BridgeBase", bridgeAddress);

  console.log(`\nuserAddress : ${userAddress}`);
  console.log(`chainIdFrom : ${chainIdFrom}`);
  console.log(`chainIdTo   : ${chainIdTo}`);
  console.log(`tokenName   : ${tokenName}`);
  console.log(`amount      : ${amount}`);
  console.log(`nonce       : ${nonce}\n`);

  console.log(`🔵 Depositing fees by user ${userAddress}...`);

  const msgHashed = await bridge.getMessageHash(
    userAddress,
    userAddress,
    chainIdFrom,
    chainIdTo,
    tokenName,
    amount,
    nonce
  );

  const tx = await bridge
    .connect(userWallet)
    .depositFees(msgHashed, chainIdFrom, chainIdTo, { value: amount });
  await tx.wait();
  console.log(`tx hash : ${tx.hash}`);
  console.log(`tx data : ${tx.data}`);
  console.log(`tx chainId : ${tx.chainId}`);
  console.log(`tx nonce : ${tx.nonce}`);
  // console.log(tx);

  await setNonce(userAddress);
  console.log(`🟢 Fees desposited.`);
};

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
  initNonce,
  createBridgeOperation,
  getNetworkParam,
  depoitFees,
};
