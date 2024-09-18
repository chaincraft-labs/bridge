const hre = require("hardhat");
const { networkParams } = require('../constants/networks');
const { tokenList } = require('../constants/tokens');
const {
  writeDeployedAddress,
} = require("./util");

const {
  getMaxAddress,
} = require("./as_utils");


const getTokenSymbol = (tokenName, chainId) => {
  const token = tokenList.filter((token) => token.tokenName === tokenName)[0];
  return token.symbols.filter((symbol) => symbol.chainId === chainId)[0].symbol;
};
// allfeat, test, ethEquivalent
const usedNetworks = ["allfeat", "hardhat", "sepolia"];

// TO MOVE IN ENV
operatorAdress = "0xe4192bf486aea10422ee097bc2cf8c28597b9f11";
//@todo LE TOKEN NATIF N EST PAS A AJOUTER SUR LA CHAINE
// car le storage deployment set déjà cette valeur !!!!!


async function main() {
  //get network name
  const network = hre.network.name;
  const nativeSymbol = networkParams[network].nativeSymbol;
  const currentChainId = networkParams[network].chainId;

  console.log(
    "==>01_DEPLOYALLCONTRACTS\n----------------------------------------------------------\nDeploying contracts on network: %s \n----------------------------------------------------------",
    network
  );
  console.log("nativeSymbol: %s", nativeSymbol);
  const [owner] = await hre.ethers.getSigners();

  console.log("--> owner address: %s ", owner.address);
  // 1. deploy storage
  let nativeName = network == "allfeat" ? "allfeat" : "ethereum";
  console.log("nativeName", nativeName);
  const storage = await hre.ethers.deployContract("Storage", [nativeSymbol]);

  await storage.waitForDeployment();
  console.log("==> Storage deployed to:", storage.target);

  // 2. deploy factory
  const factory = await hre.ethers.deployContract("TokenFactory", [
    storage.target,
  ]);
  await factory.waitForDeployment();
  console.log("==> TokenFactory deployed to:", factory.target);

  // 3. deploy vault
  const vault = await hre.ethers.deployContract("Vault", [storage.target]);
  await vault.waitForDeployment();
  console.log("==> Vault deployed to:", vault.target);

  // 5. deploy relayer
  const relayer = await hre.ethers.deployContract("RelayerBase", [
    storage.target,
  ]);
  await relayer.waitForDeployment();
  console.log("==> Relayer deployed to:", relayer.target);

  // 4. deploy bridge
  const bridge = await hre.ethers.deployContract("BridgeBase", [
    storage.target,
    relayer.target,
  ]);
  await bridge.waitForDeployment();
  console.log("==> Bridge deployed to:", bridge.target);

  // @todo ADD SERVER ADDRESS

  console.log(
    "writing deployed addresses in /constants/deployedAddresses.json ...\n"
  );
  writeDeployedAddress(network, "Storage", storage.target);
  writeDeployedAddress(network, "TokenFactory", factory.target);
  writeDeployedAddress(network, "Vault", vault.target);
  writeDeployedAddress(network, "RelayerBase", relayer.target);
  writeDeployedAddress(network, "BridgeBase", bridge.target);

  // set addresses in storage
  let tx = await storage.updateOperator("factory", factory.target);
  await tx.wait();
  console.log("factory address set in storage");
  tx = await storage.updateOperator("vault", vault.target);
  await tx.wait();
  console.log("vault address set in storage");
  tx = await storage.updateOperator("bridge", bridge.target);
  await tx.wait();
  console.log("bridge address set in storage");
  tx = await storage.updateOperator("relayer", relayer.target);
  await tx.wait();
  console.log("relayer address set in storage\n");
  tx = await storage.updateOperator("oracle", operatorAdress);
  await tx.wait();
  console.log("oracle address set in storage\n");

  console.log(
    "----------------------------------------------------------\nDeploying tokens contracts \n----------------------------------------------------------"
  );

  await storage.addChainIdToList(31337);
  await storage.addChainIdToList(440);
  // await storage.addChainIdToList(441);
  // await storage.addChainIdToList(137);
  // await storage.addChainIdToList(11155111);
  // await storage.addChainIdToList(1);

  // pb 31337 is 3 times instead of 2
  const chainIdList = await storage.getChainIdsList();
  console.log("chainId added to chainIdList: %s\n", chainIdList);

  await storage.addTokenNameToList("ethereum");
  await storage.addTokenNameToList("allfeat");
  await storage.addTokenNameToList("dai");

  const tokenNameList = await storage.getTokenNamesList();
  console.log("tokenName added to tokenNameList: %s\n", tokenNameList);

  let bridgedEthAddress,
    bridgedAftAddress,
    bridgedDaiAddress,
    mockedDaiAddress,
    bridgedAft,
    bridgedEth,
    bridgedDai,
    mockedDai;

  if (network == "sepolia" || network == "hardhat" || network == "localhost" || network == "anvil_local") {
    let ehtNativeChainId = networkParams.sepolia.chainId;

    // set data for native token
    tx = await storage.addNativeTokenByChainId("ethereum", ehtNativeChainId);
    await tx.wait();
    console.log(
      "native token %s set in storage at  %s for chainId %s",
      nativeSymbol,
      getMaxAddress(),
      ehtNativeChainId
    );

    tx = await storage.setTokenAddressByChainId(
      "ethereum",
      // "11155111",
      "31337",
      "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF"
    );
    await tx.wait();
    console.log(
      "native token %s set in storage at  %s for chainId %s",
      nativeSymbol,
      getMaxAddress(),
      ehtNativeChainId
    );
    // AFT TOKEN
    let aftNativeChainId = networkParams.allfeat.chainId;
    if (network == "allfeat") {
    } else {
      let tokenSymbol = getTokenSymbol("allfeat", currentChainId);
      tx = await factory.createToken("allfeat", tokenSymbol);
      await tx.wait();
      bridgedAftAddress = await factory.getTokenAddress(tokenSymbol);
      console.log(
        "==> BridgedAft (%s) deployed to: %s",
        tokenSymbol,
        bridgedAftAddress
      );
      writeDeployedAddress(
        network,
        "BridgedToken",
        bridgedAftAddress,
        tokenSymbol
      );
      console.log(
        "writing deployed address in /constants/deployedAddresses.json ...\n"
      );
    }
    
    tx = await storage.setTokenAddressByChainId(
      "allfeat",
      // "441",
      "440",
      "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF"
    );
    await tx.wait();
    console.log(
      "native token %s set in storage at  %s for chainId %s",
      nativeSymbol,
      getMaxAddress(),
      aftNativeChainId
    );
    // DAI TOKEN
    if (network != "allfeat") {
      mockedDai = await hre.ethers.deployContract("MockedDai");
      await mockedDai.waitForDeployment();
      mockedDaiAddress = mockedDai.target;
      tx = await storage.addNewTokenAddressByChainId(
        "dai",
        networkParams[network].chainId,
        mockedDaiAddress
      );
      await tx.wait();
      console.log("==> MockedDai deployed to:", mockedDaiAddress);
      writeDeployedAddress(network, "MockedDai", mockedDaiAddress);
      console.log(
        "writing deployed address in /constants/deployedAddresses.json ...\n"
      );
    } else {
      let tokenSymbol = getTokenSymbol("dai", currentChainId);
      tx = await factory.createToken("dai", tokenSymbol);
      await tx.wait();
      bridgedDaiAddress = await factory.getTokenAddress(tokenSymbol);
      console.log(
        "==> bridgedDai (%s) deployed to: %s",
        tokenSymbol,
        bridgedDaiAddress
      );
      writeDeployedAddress(
        network,
        "BridgedToken",
        bridgedDaiAddress,
        tokenSymbol
      );
      console.log(
        "writing deployed address in /constants/deployedAddresses.json ...\n"
      );
    }
  }

  if (network == "allfeat") {
    let ehtNativeChainId = networkParams.sepolia.chainId;
    let tokenSymbol = getTokenSymbol("ethereum", currentChainId);
    let BridgedEth = await hre.ethers.deployContract("BridgedToken", [
      "ethereum",
      tokenSymbol,
    ]);
    await BridgedEth.waitForDeployment();

    tx = await BridgedEth.updateAdmin(vault.target);
    tx = await factory.helperHCK("ethereum", tokenSymbol, BridgedEth.target);
    await tx.wait();

    bridgedEthAddress = await factory.getTokenAddress(tokenSymbol);
    console.log(
      "==> bridgedEth (%s) deployed to: %s",
      tokenSymbol,
      bridgedEthAddress
    );
    writeDeployedAddress(
      network,
      "BridgedToken",
      bridgedEthAddress,
      tokenSymbol
    );
    console.log(
      "writing deployed address in /constants/deployedAddresses.json ...\n"
    );
    
    tx = await storage.setTokenAddressByChainId(
      "ethereum",
      // "11155111",
      "31337",
      "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF"
    );
    await tx.wait();
    console.log(
      "native token %s set in storage at  %s for chainId %s",
      nativeSymbol,
      getMaxAddress(),
      ehtNativeChainId
    );
    // AFT TOKEN
    let aftNativeChainId = networkParams.allfeat.chainId;
    
    tx = await storage.setTokenAddressByChainId(
      "allfeat",
      // "441",
      "440",
      "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF"
    );
    await tx.wait();
    console.log(
      "native token %s set in storage at  %s for chainId %s",
      nativeSymbol,
      getMaxAddress(),
      aftNativeChainId
    );
    // DAI TOKEN
    if (network === "allfeat" || network === "allfeat_local") {
      let tokenSymbol = getTokenSymbol("dai", currentChainId);
      let BridgedDai = await hre.ethers.deployContract("BridgedToken", [
        "dai",
        tokenSymbol,
      ]);
      await BridgedDai.waitForDeployment();
      tx = await BridgedDai.updateAdmin(vault.target);
      tx = await factory.helperHCK("dai", tokenSymbol, BridgedDai.target);
      await tx.wait();

      const BridgedDaiAddress = await factory.getTokenAddress(tokenSymbol);
      console.log(
        "==> bridgedDai (%s) deployed to: %s",
        tokenSymbol,
        BridgedDaiAddress
      );

      writeDeployedAddress(
        network,
        "BridgedToken",
        BridgedDaiAddress,
        tokenSymbol
      );
      console.log(
        "writing deployed address in /constants/deployedAddresses.json ...\n"
      );
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
