const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("EndToEnd behavior", function () {
  const zeroAddress = "0x" + "0".repeat(40);
  const toChecksum = (address) => {
    return ethers.getAddress(address);
  };
  const maxAddress20bytes = "0x" + "f".repeat(40);
  const maxAddress = toChecksum(maxAddress20bytes);
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployAllContracts() {
    // const network = hre.network.name;
    // console.log("Deploying contracts on network: ", network);

    // 1. deploy storage
    // 2. deploy factory
    // 3. deploy vault
    // 4. deploy bridge
    // 5. deploy relayer
    // set addresses in storage
    // deploy BridgeTokenAft via factory and set vault as owner
    // set addresses in bridge

    // 1. deploy storage
    const storage = await hre.ethers.deployContract("Storage", ["ETH"]);
    await storage.waitForDeployment();

    console.log("Storage deployed to:", storage.target);

    // 2. deploy factory
    const factory = await hre.ethers.deployContract("TokenFactory", [
      storage.target,
    ]);
    await factory.waitForDeployment();
    console.log("factory deployed to:", factory.target);

    // 3. deploy vault
    const vault = await hre.ethers.deployContract("Vault", [storage.target]);
    await vault.waitForDeployment();
    console.log("vault deployed to:", vault.target);

    // 5. deploy relayer
    const relayer = await hre.ethers.deployContract("RelayerBase", [
      storage.target,
    ]);
    await relayer.waitForDeployment();
    console.log("Relayer deployed to:", relayer.target);

    // 4. deploy bridge
    const bridge = await hre.ethers.deployContract("BridgeBase", [
      storage.target,
      relayer.target,
    ]);
    await bridge.waitForDeployment();
    console.log("Bridge deployed to:", bridge.target);

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
    console.log("relayer address set in storage");

    // address 0 = 0x
    // const zeroAddress = "0x" + "0".repeat(40);
    // deploy BridgeTokenAft via factory and set vault as owner
    let tx0 = await storage.addChainIdToList(31337);
    await tx0.wait();
    const chainIdBN = 441;
    tx0 = await storage.addChainIdToList(chainIdBN);
    await tx0.wait();
    tx0 = await storage.addTokenNameToList("allfeat token");
    await tx0.wait();
    tx0 = await storage.addTokenNameToList("allfeat token");
    await tx0.wait();

    // test event BridgeTokenCreated
    expect(await factory.createToken("allfeat token", "AFT")).to.emit(
      factory,
      "BridgeTokenCreated"
    );
    // const bridgedTokenAftTx = await factory.createToken(
    //   "BridgedTokenAft",
    //   "AFT",
    //   441,
    //   zeroAddress
    // );
    // const bridgedTokenAftReceipt = await bridgedTokenAftTx.wait();
    // // const bridgedTokenAftAddress = bridgedTokenAftReceipt.args[0];
    // console.log(`BridgedTokenAft deployed to: ${bridgedTokenAftReceipt}`);
    // console.log(bridgedTokenAftReceipt);
    // achtual chain id to bignnumber
    const chainId = await hre.ethers.provider.getNetwork();
    // convert in bignumber
    // const chainIdBN = BigInt(chainId.chainId);

    tx0 = await storage.addTokenNameToList("BridgedEth");
    await tx0.wait();
    // deploy bridgedEth
    const bridgedEthTx = await factory.createToken(
      "BridgedEth",
      "bETH"
      // chainIdBN,
      // zeroAddress
    );
    // const bridgedEthReceipt = await bridgedEthTx.wait();
    // const bridgedEthAddress = bridgedEthReceipt.logs[0].args[0];

    // // set addresses in storage cahinid allfeat: 441
    // tx0 = await storage.addChainIdToList(31337);
    // await tx0.wait();
    // tx0 = await storage.addTokenSymbolToList("bAFT");
    // await tx0.wait();
    // tx0 = await storage.addTokenSymbolToList("AFT");
    // await tx0.wait();
    // tokenName = ["AFT", "bAFT"];
    // chainIds = [441, 31337];
    // tokenAddresses = [zeroAddress, bridgedTokenAftAddress];
    // tx = await storage.batchSetTokenOnChainId(
    //   tokenName,
    //   chainIds,
    //   tokenAddresses
    // );
    // await tx.wait();
    // console.log("AFT token addresses set in storage");

    // set addresses in storage ETH
    // tokenName = ["ETH"];
    // chainIds = [chainIdBN, 1];
    // tokenAddresses = [zeroAddress, bridgedEthAddress];
    // tx = await storage.batchSetTokenOnChainId(
    //   tokenName,
    //   chainIds,
    //   tokenAddresses
    // );
    // await tx.wait();
    // console.log("ETH token addresses set in storage");

    return {
      network,
      storage,
      factory,
      vault,
      bridge,
      relayer,
      // bridgedTokenAftAddress,
      // bridgedEthAddress,
    };
  }

  // fixture : deploy contracts and create operation
  const deployContractAndCreateOperation = async () => {
    const [owner, otherAccount] = await hre.ethers.getSigners();
    const {
      storage,
      factory,
      vault,
      bridge,
      relayer,
      bridgedTokenAftAddress,
      bridgedEthAddress,
    } = await loadFixture(deployAllContracts);
    console.log("owner: ", owner.address);
    console.log("otherAccount: ", otherAccount.address);
    const user = otherAccount.address;
    const userBalance = await hre.ethers.provider.getBalance(user);
    console.log("userBalance: ", userBalance.toString());
    // for the test give user somme AFT
    // non he deposit ether to bridge !!
    //get current nonce
    const etherAmount = 10;
    // convert in wei with bignumber
    // const amount = ethers.utils.parseEther(etherAmount.toString());
    //   const amount = 10 * 10 ** 18n;
    const theamount = 10_000_000_000_000_000_000n;
    // const theamount = ethers.utils.parseEther("10");
    const nonce = await bridge.getNewUserNonce(user);

    await storage.addChainIdToList(31337);
    // await storage.addChainIdToList(11155111);

    await storage.addChainIdToList(441);
    await storage.addTokenNameToList("BridgedEth2");
    // await storage.addTokenSymbolToList("bETH2");
    // const zeroAddress2 = "0x" + "0".repeat(40);
    // await storage.setTokenAddressByChainId(
    //   "BridgedEth2",
    //   11155111,
    //   maxAddress
    // );

    await storage.setTokenAddressByChainId("BridgedEth2", 441, maxAddress);
    await factory.createToken("BridgedEth2", "bETH2");
    const tokenAddres = await factory.getTokenAddress("bETH2");
    console.log("tokenAddres: ", tokenAddres);
    // const tokenInstance = await hre.ethers.getContractAt(
    //   "BridgedToken",
    //   tokenAddres
    // );
    // console.log("tokenInstance: ", tokenInstance);
    // // TESTING
    // await tokenInstance.TESTmint(user, theamount + theamount);

    const tokenContract = await hre.ethers.getContractFactory("BridgedToken");
    const tokenInstance = await tokenContract.attach(tokenAddres);
    console.log("tokenInstance: ", tokenInstance);
    // TESTING
    const testowner = await tokenInstance.getOwner();
    console.log("testowner: ", testowner);
    console.log("user: ", user);
    console.log("theamount: ", theamount);
    await tokenInstance.minttest(user, theamount + theamount);
    await bridge.mintOnlyTEST(user, tokenAddres, theamount + theamount);
    // await storage.batchAddNewTokenAddressByChainId(
    //   ["ETH2", "bETH2"],
    //   [31337, 441],
    //   [zeroAddress2, tokenAddres]
    // );
    // // messgae hash
    // const messageHash = await bridge.getPrefixedMessageHash(
    const messageHash = await bridge.getMessageHash(
      user,
      user,
      31337,
      441,
      "BridgedEth2",
      theamount,
      nonce
    );
    // sign the message
    //   const signature = await owner.signMessage(messageHash);
    //   console.log("signature: ", signature);
    //   console.log("messageHash: ", messageHash);
    //     const typeOfSignature = typeof signature;
    //   const arraymsg = hre.ethers.utils.arrayify(messageHash);
    //   console.log("arraymsg: ", arraymsg);
    //   const sig0 = await owner.signMessage(arraymsg);
    //   console.log("signature: ", sig0);
    //   console.log("typeOfSignature: ", typeof sig0);

    // const hash = await bridge.getMessageHash(
    //   user,
    //   user,
    //   31337,
    //   441,
    //   "BridgedEth2",
    //   theamount,
    //   nonce
    // );
    // console.log("hash: ", hash);
    // console.log("typeOfHash: ", typeof hash);
    //@todo LAST CHANGE Sign2
    // const hash = await bridge.getPrefixedMessageHash(
    const hash = await bridge.getMessageHash(
      user,
      user,
      31337,
      441,
      "BridgedEth2",
      theamount,
      nonce
    );
    console.log("hash: ", hash);
    console.log("typeOfHash: ", typeof hash);

    // need to sign the message and type cast from string to bytes

    //   const signature = await otherAccount.signMessage(
    //     hre.ethers.arrayify(hash)
    //   );
    const signature = await otherAccount.signMessage(hre.ethers.getBytes(hash));
    console.log("hash: ", hash);
    console.log("signature: ", signature);
    console.log("typeOfSignature: ", typeof signature);

    // id of the connected network
    const chainId = await hre.ethers.provider.getNetwork();
    // convert in bignumber
    const chainIdBN = BigInt(chainId.chainId);

    // allowance
    // await tokenInstance

    //   .connect(otherAccount)
    //   .approve(bridge.address, theamount);
    await bridge.connect(otherAccount).createBridgeOperation(
      user,
      user,
      //   31337,
      //   31337,
      31337,
      441,
      "BridgedEth2",
      theamount,
      nonce,
      signature
      // { value: theamount }
    );
    // convert 0 to address(0)
    // const zeroAddress = "0x" + "0".repeat(40);
    //check vault user balance
    const userEthBalance = await vault.getTokenUserBalance(user, tokenAddres); // no question of AFT now
    console.log("userEthBalance: ", userEthBalance);
    console.log("theamount: ", theamount);
    // expect(userEthBalance).to.equal(theamount);

    // check operation is created realyer side

    const detailedOp = await relayer.getDetailedOriginOperation(hash);
    console.log("detailedOp: ", detailedOp);
    const opParams = detailedOp[0];
    const opStatus = detailedOp[1];
    const opBlock = detailedOp[2];
    const opUser = opParams[0];
    const opTokenName = opParams[4];
    const opSignature = opParams[7];
    // expect(opUser).to.equal(user);
    // expect(opTokenName).to.equal("BridgedEth2");
    // expect(opSignature).to.equal(signature);
    return {
      storage,
      factory,
      vault,
      bridge,
      relayer,
      bridgedTokenAftAddress,
      bridgedEthAddress,
      hash,
      detailedOp,
    };
  };

  describe("Deployment", function () {
    it("Should deploy contracts", async function () {
      const [owner, otherAccount] = await hre.ethers.getSigners();
      const { storage, factory } = await loadFixture(deployAllContracts);
      console.log("owner: ", owner.address);
      console.log("otherAccount: ", otherAccount.address);

      //   const accounts = await hre.ethers.getSigners();
      //   console.log("accounts: ", accounts);
      //owner of the 2 contracts should the one who deployed them
      const storageOwner = await storage.getOwner();
      const factoryOwner = await factory.getOwner();

      console.log("storageOwner: ", storageOwner);
      console.log("factoryOwner: ", factoryOwner);
      console.log("owner.address: ", owner.address);
      expect(storageOwner).to.equal(factoryOwner);
      expect(storageOwner).to.equal(owner.address);
    });

    it("Should let user deposit to bridge", async function () {
      // set user eth balance
      const [owner, otherAccount] = await hre.ethers.getSigners();
      const {
        storage,
        factory,
        vault,
        bridge,
        relayer,
        bridgedTokenAftAddress,
        bridgedEthAddress,
      } = await loadFixture(deployAllContracts);
      console.log("owner: ", owner.address);
      console.log("otherAccount: ", otherAccount.address);
      const user = otherAccount.address;
      const userBalance = await hre.ethers.provider.getBalance(user);
      console.log("userBalance: ", userBalance.toString());
      // for the test give user somme AFT
      // non he deposit ether to bridge !!
      //get current nonce
      const etherAmount = 10;
      // convert in wei with bignumber
      // const amount = ethers.utils.parseEther(etherAmount.toString());
      //   const amount = 10 * 10 ** 18n;
      const theamount = 10_000_000_000_000_000_000n;
      // const theamount = ethers.utils.parseEther("10");
      const nonce = await bridge.getNewUserNonce(user);

      await storage.addChainIdToList(31337);
      // await storage.addChainIdToList(11155111);

      await storage.addChainIdToList(441);
      await storage.addTokenNameToList("BridgedEth2");
      // await storage.addTokenSymbolToList("bETH2");
      // const zeroAddress2 = "0x" + "0".repeat(40);
      // await storage.setTokenAddressByChainId(
      //   "BridgedEth2",
      //   11155111,
      //   maxAddress
      // );
      await storage.setTokenAddressByChainId("BridgedEth2", 441, maxAddress);
      await factory.createToken("BridgedEth2", "bETH2");
      const tokenAddres = await factory.getTokenAddress("bETH2");
      console.log("tokenAddres: ", tokenAddres);
      // const tokenInstance = await hre.ethers.getContractAt(
      //   "BridgedToken",
      //   tokenAddres
      // );
      // console.log("tokenInstance: ", tokenInstance);
      // // TESTING
      // await tokenInstance.TESTmint(user, theamount + theamount);

      const tokenContract = await hre.ethers.getContractFactory("BridgedToken");
      const tokenInstance = await tokenContract.attach(tokenAddres);
      console.log("tokenInstance: ", tokenInstance);
      // TESTING
      const testowner = await tokenInstance.getOwner();
      console.log("testowner: ", testowner);
      console.log("user: ", user);
      console.log("theamount: ", theamount);
      await tokenInstance.minttest(user, theamount + theamount);
      await bridge.mintOnlyTEST(user, tokenAddres, theamount + theamount);
      // await storage.batchAddNewTokenAddressByChainId(
      //   ["ETH2", "bETH2"],
      //   [31337, 441],
      //   [zeroAddress2, tokenAddres]
      // );
      // // messgae hash
      const messageHash = await bridge.getMessageHash(
        user,
        user,
        31337,
        441,
        "BridgedEth2",
        theamount,
        nonce
      );
      // sign the message
      //   const signature = await owner.signMessage(messageHash);
      //   console.log("signature: ", signature);
      //   console.log("messageHash: ", messageHash);
      //     const typeOfSignature = typeof signature;
      //   const arraymsg = hre.ethers.utils.arrayify(messageHash);
      //   console.log("arraymsg: ", arraymsg);
      //   const sig0 = await owner.signMessage(arraymsg);
      //   console.log("signature: ", sig0);
      //   console.log("typeOfSignature: ", typeof sig0);

      const hash = await bridge.getMessageHash(
        user,
        user,
        31337,
        441,
        "BridgedEth2",
        theamount,
        nonce
      );
      console.log("hash: ", hash);
      console.log("typeOfHash: ", typeof hash);

      // need to sign the message and type cast from string to bytes

      //   const signature = await otherAccount.signMessage(
      //     hre.ethers.arrayify(hash)
      //   );
      const signature = await otherAccount.signMessage(
        hre.ethers.getBytes(hash)
      );
      console.log("hash: ", hash);
      console.log("signature: ", signature);
      console.log("typeOfSignature: ", typeof signature);

      // id of the connected network
      const chainId = await hre.ethers.provider.getNetwork();
      // convert in bignumber
      const chainIdBN = BigInt(chainId.chainId);

      // allowance
      // await tokenInstance
      //   .connect(otherAccount)
      //   .approve(bridge.address, theamount);
      await bridge.connect(otherAccount).createBridgeOperation(
        user,
        user,
        //   31337,
        //   31337,
        31337,
        441,
        "BridgedEth2",
        theamount,
        nonce,
        signature
        // { value: theamount }
      );
      // convert 0 to address(0)
      // const zeroAddress = "0x" + "0".repeat(40);
      //check vault user balance
      const userEthBalance = await vault.getTokenUserBalance(user, tokenAddres); // no question of AFT now
      console.log("userEthBalance: ", userEthBalance);
      console.log("theamount: ", theamount);
      expect(userEthBalance).to.equal(theamount);

      // check operation is created realyer side

      const detailedOp = await relayer.getDetailedOriginOperation(hash);
      console.log("detailedOp: ", detailedOp);
      const opParams = detailedOp[0];
      const opStatus = detailedOp[1];
      const opBlock = detailedOp[2];
      const opUser = opParams[0];
      const opTokenName = opParams[4];
      const opSignature = opParams[7];
      expect(opUser).to.equal(user);
      expect(opTokenName).to.equal("BridgedEth2");
      expect(opSignature).to.equal(signature);
    });
  });
  it("Should let user deposit to bridge and emit event from relayer", async function () {
    // it.only("Should let user deposit to bridge and emit event from relayer", async function () {
    // set user eth balance
    const [owner, otherAccount] = await hre.ethers.getSigners();
    const {
      storage,
      factory,
      vault,
      bridge,
      relayer,
      bridgedTokenAftAddress,
      bridgedEthAddress,
    } = await loadFixture(deployAllContracts);
    console.log("owner: ", owner.address);
    console.log("otherAccount: ", otherAccount.address);
    const user = otherAccount.address;
    const userBalance = await hre.ethers.provider.getBalance(user);
    console.log("userBalance: ", userBalance.toString());
    // for the test give user somme AFT
    // non he deposit ether to bridge !!
    //get current nonce
    const etherAmount = 10;
    // convert in wei with bignumber
    // const amount = ethers.utils.parseEther(etherAmount.toString());
    //   const amount = 10 * 10 ** 18n;
    const theamount = 10_000_000_000_000_000_000n;
    // const theamount = ethers.utils.parseEther("10");
    const nonce = await bridge.getNewUserNonce(user);

    await storage.addChainIdToList(31337);
    // await storage.addChainIdToList(11155111);

    await storage.addChainIdToList(441);
    await storage.addTokenNameToList("BridgedEth2");
    // await storage.addTokenSymbolToList("bETH2");
    // const zeroAddress2 = "0x" + "0".repeat(40);
    // await storage.setTokenAddressByChainId(
    //   "BridgedEth2",
    //   11155111,
    //   maxAddress
    // );
    await storage.setTokenAddressByChainId("BridgedEth2", 441, maxAddress);
    await factory.createToken("BridgedEth2", "bETH2");
    const tokenAddres = await factory.getTokenAddress("bETH2");
    console.log("tokenAddres: ", tokenAddres);
    // const tokenInstance = await hre.ethers.getContractAt(
    //   "BridgedToken",
    //   tokenAddres
    // );
    // console.log("tokenInstance: ", tokenInstance);
    // // TESTING
    // await tokenInstance.TESTmint(user, theamount + theamount);

    const tokenContract = await hre.ethers.getContractFactory("BridgedToken");
    const tokenInstance = await tokenContract.attach(tokenAddres);
    console.log("tokenInstance: ", tokenInstance);
    // TESTING
    const testowner = await tokenInstance.getOwner();
    console.log("testowner: ", testowner);
    console.log("user: ", user);
    console.log("theamount: ", theamount);
    await tokenInstance.minttest(user, theamount + theamount);
    await bridge.mintOnlyTEST(user, tokenAddres, theamount + theamount);
    // await storage.batchAddNewTokenAddressByChainId(
    //   ["ETH2", "bETH2"],
    //   [31337, 441],
    //   [zeroAddress2, tokenAddres]
    // );
    // // messgae hash
    const messageHash = await bridge.getMessageHash(
      user,
      user,
      31337,
      441,
      "BridgedEth2",
      theamount,
      nonce
    );
    // sign the message
    //   const signature = await owner.signMessage(messageHash);
    //   console.log("signature: ", signature);
    //   console.log("messageHash: ", messageHash);
    //     const typeOfSignature = typeof signature;
    //   const arraymsg = hre.ethers.utils.arrayify(messageHash);
    //   console.log("arraymsg: ", arraymsg);
    //   const sig0 = await owner.signMessage(arraymsg);
    //   console.log("signature: ", sig0);
    //   console.log("typeOfSignature: ", typeof sig0);

    // const hash = await bridge.getPrefixedMessageHash(
    const hash = await bridge.getMessageHash(
      user,
      user,
      31337,
      441,
      "BridgedEth2",
      theamount,
      nonce
    );
    console.log("hash: ", hash);
    console.log("typeOfHash: ", typeof hash);

    // need to sign the message and type cast from string to bytes

    //   const signature = await otherAccount.signMessage(
    //     hre.ethers.arrayify(hash)
    //   );
    // signMessage prefix  with "\x19Ethereum Signed Message:\n"
    //https://medium.com/@kaishinaw/signing-and-verifying-ethereum-messages-f5acd41ca1a8
    const signature = await otherAccount.signMessage(hre.ethers.getBytes(hash));
    //https://docs.ethers.org/v5/api/signer/#Signer-signMessage
    // const signature = await otherAccount.signMessage(hash);
    console.log("hash: ", hash);
    console.log("signature: ", signature);
    console.log("typeOfSignature: ", typeof signature);

    // id of the connected network
    const chainId = await hre.ethers.provider.getNetwork();
    // convert in bignumber
    const chainIdBN = BigInt(chainId.chainId);

    // allowance
    // await tokenInstance
    //   .connect(otherAccount)
    //   .approve(bridge.address, theamount);
    // await bridge.connect(otherAccount).createBridgeOperation(
    //   user,
    //   user,
    //   //   31337,
    //   //   31337,
    //   31337,
    //   441,
    //   "BridgedEth2",
    //   theamount,
    //   nonce,
    //   signature
    //   // { value: theamount }
    // );
    const prepParams = [
      user,
      user,
      31337,
      441,
      "BridgedEth2",
      theamount,
      nonce,
    ];
    const currentblock = await ethers.provider.getBlockNumber();
    // expect realyer emit event when bridge create operation
    expect(
      await bridge
        .connect(otherAccount)
        .createBridgeOperation(
          user,
          user,
          31337,
          441,
          "BridgedEth2",
          theamount,
          nonce,
          signature
        )
    )
      .to.emit(relayer, "OperationCreated")
      .withArgs(hash, prepParams, currentblock);

    // const display = `Event OperationCreated emitted by realyer with args: \n hash: ${hash} \n params: ${prepParams} \n block: ${currentblock} `;
    console.log("ETE / LINE 690 : relayer address : ", relayer.target);
    console.log("ETE / LINE 691 : bridge address : ", bridge.target);
    // console.log(display);
    // convert 0 to address(0)
    // const zeroAddress = "0x" + "0".repeat(40);
    //check vault user balance
    const userEthBalance = await vault.getTokenUserBalance(user, tokenAddres); // no question of AFT now
    console.log("userEthBalance: ", userEthBalance);
    console.log("theamount: ", theamount);
    expect(userEthBalance).to.equal(theamount);

    // check operation is created realyer side
    console.log("ETE / LINE 707 : prepParams : ", prepParams);
    const detailedOp = await relayer.getDetailedOriginOperation(hash);
    console.log("detailedOp: ", detailedOp);
    const opParams = detailedOp[0];
    const opStatus = detailedOp[1];
    const opBlock = detailedOp[2];
    console.log("ETE / LINE 707 : opParams : ", opParams);
    console.log("ETE / LINE 708 : opUser : ", opParams[0]);
    const opUser = opParams[0];
    const opTokenName = opParams[4];
    const opSignature = opParams[7];
    expect(opUser).to.equal(user);
    expect(opTokenName).to.equal("BridgedEth2");
    expect(opSignature).to.equal(signature);
  });

  /// TEST MEME it AVEC TEMPO SUR USER ACTION
  // it("Should let user deposit to bridge and emit event from relayer", async function () {
  //   // set user eth balance
  //   const [owner, otherAccount] = await hre.ethers.getSigners();
  //   const {
  //     storage,
  //     factory,
  //     vault,
  //     bridge,
  //     relayer,
  //     bridgedTokenAftAddress,
  //     bridgedEthAddress,
  //   } = await loadFixture(deployAllContracts);
  //   console.log("owner: ", owner.address);
  //   console.log("otherAccount: ", otherAccount.address);
  //   const user = otherAccount.address;
  //   const userBalance = await hre.ethers.provider.getBalance(user);
  //   console.log("userBalance: ", userBalance.toString());
  //   // for the test give user somme AFT
  //   // non he deposit ether to bridge !!
  //   //get current nonce
  //   const etherAmount = 10;
  //   // convert in wei with bignumber
  //   // const amount = ethers.utils.parseEther(etherAmount.toString());
  //   //   const amount = 10 * 10 ** 18n;
  //   const theamount = 10_000_000_000_000_000_000n;
  //   // const theamount = ethers.utils.parseEther("10");
  //   const nonce = await bridge.getNewUserNonce(user);

  //   await storage.addChainIdToList(31337);
  //   // await storage.addChainIdToList(11155111);

  //   await storage.addChainIdToList(441);
  //   await storage.addTokenNameToList("BridgedEth2");
  //   // await storage.addTokenSymbolToList("bETH2");
  //   // const zeroAddress2 = "0x" + "0".repeat(40);
  //   // await storage.setTokenAddressByChainId(
  //   //   "BridgedEth2",
  //   //   11155111,
  //   //   maxAddress
  //   // );
  //   await storage.setTokenAddressByChainId("BridgedEth2", 441, maxAddress);
  //   await factory.createToken("BridgedEth2", "bETH2");
  //   const tokenAddres = await factory.getTokenAddress("bETH2");
  //   console.log("tokenAddres: ", tokenAddres);
  //   // const tokenInstance = await hre.ethers.getContractAt(
  //   //   "BridgedToken",
  //   //   tokenAddres
  //   // );
  //   // console.log("tokenInstance: ", tokenInstance);
  //   // // TESTING
  //   // await tokenInstance.TESTmint(user, theamount + theamount);

  //   const tokenContract = await hre.ethers.getContractFactory("BridgedToken");
  //   const tokenInstance = await tokenContract.attach(tokenAddres);
  //   console.log("tokenInstance: ", tokenInstance);
  //   // TESTING
  //   const testowner = await tokenInstance.getOwner();
  //   console.log("testowner: ", testowner);
  //   console.log("user: ", user);
  //   console.log("theamount: ", theamount);
  //   await tokenInstance.minttest(user, theamount + theamount);
  //   await bridge.mintOnlyTEST(user, tokenAddres, theamount + theamount);
  //   // await storage.batchAddNewTokenAddressByChainId(
  //   //   ["ETH2", "bETH2"],
  //   //   [31337, 441],
  //   //   [zeroAddress2, tokenAddres]
  //   // );
  //   // // messgae hash
  //   const messageHash = await bridge.getMessageHash(
  //     user,
  //     user,
  //     31337,
  //     441,
  //     "BridgedEth2",
  //     theamount,
  //     nonce
  //   );
  //   // sign the message
  //   //   const signature = await owner.signMessage(messageHash);
  //   //   console.log("signature: ", signature);
  //   //   console.log("messageHash: ", messageHash);
  //   //     const typeOfSignature = typeof signature;
  //   //   const arraymsg = hre.ethers.utils.arrayify(messageHash);
  //   //   console.log("arraymsg: ", arraymsg);
  //   //   const sig0 = await owner.signMessage(arraymsg);
  //   //   console.log("signature: ", sig0);
  //   //   console.log("typeOfSignature: ", typeof sig0);

  //   const hash = await bridge.getMessageHash(
  //     user,
  //     user,
  //     31337,
  //     441,
  //     "BridgedEth2",
  //     theamount,
  //     nonce
  //   );
  //   console.log("hash: ", hash);
  //   console.log("typeOfHash: ", typeof hash);

  //   // need to sign the message and type cast from string to bytes

  //   //   const signature = await otherAccount.signMessage(
  //   //     hre.ethers.arrayify(hash)
  //   //   );
  //   // signMessage prefix  with "\x19Ethereum Signed Message:\n"
  //   //https://medium.com/@kaishinaw/signing-and-verifying-ethereum-messages-f5acd41ca1a8
  //   const signature = await otherAccount.signMessage(hre.ethers.getBytes(hash));
  //   //https://docs.ethers.org/v5/api/signer/#Signer-signMessage
  //   // const signature = await otherAccount.signMessage(hash);
  //   console.log("hash: ", hash);
  //   console.log("signature: ", signature);
  //   console.log("typeOfSignature: ", typeof signature);

  //   // id of the connected network
  //   const chainId = await hre.ethers.provider.getNetwork();
  //   // convert in bignumber
  //   const chainIdBN = BigInt(chainId.chainId);

  //   // allowance
  //   // await tokenInstance
  //   //   .connect(otherAccount)
  //   //   .approve(bridge.address, theamount);
  //   // await bridge.connect(otherAccount).createBridgeOperation(
  //   //   user,
  //   //   user,
  //   //   //   31337,
  //   //   //   31337,
  //   //   31337,
  //   //   441,
  //   //   "BridgedEth2",
  //   //   theamount,
  //   //   nonce,
  //   //   signature
  //   //   // { value: theamount }
  //   // );
  //   const prepParams = [
  //     user,
  //     user,
  //     31337,
  //     441,
  //     "BridgedEth2",
  //     theamount,
  //     nonce,
  //   ];
  //   const currentblock = await ethers.provider.getBlockNumber();
  //   // expect realyer emit event when bridge create operation
  //   const tx = await bridge
  //     .connect(otherAccount)
  //     .createBridgeOperation(
  //       user,
  //       user,
  //       31337,
  //       441,
  //       "BridgedEth2",
  //       theamount,
  //       nonce,
  //       signature
  //     );
  //   //  .to.emit(relayer, "OperationCreated")
  //   //  .withArgs(hash, prepParams, currentblock);
  //   tx.wait(1);

  //   // const display = `Event OperationCreated emitted by realyer with args: \n hash: ${hash} \n params: ${prepParams} \n block: ${currentblock} `;
  //   console.log("ETE / LINE 690 : relayer address : ", relayer.target);
  //   console.log("ETE / LINE 691 : bridge address : ", bridge.target);
  //   // console.log(display);
  //   // convert 0 to address(0)
  //   // const zeroAddress = "0x" + "0".repeat(40);
  //   //check vault user balance
  //   const userEthBalance = await vault.getTokenUserBalance(user, tokenAddres); // no question of AFT now
  //   console.log("userEthBalance: ", userEthBalance);
  //   console.log("theamount: ", theamount);
  //   expect(userEthBalance).to.equal(theamount);

  //   // check operation is created realyer side
  //   console.log("ETE / LINE 707 : prepParams : ", prepParams);
  //   const detailedOp = await relayer.getDetailedOriginOperation(hash);
  //   console.log("detailedOp: ", detailedOp);
  //   const opParams = detailedOp[0];
  //   const opStatus = detailedOp[1];
  //   const opBlock = detailedOp[2];
  //   console.log("ETE / LINE 707 : opParams : ", opParams);
  //   console.log("ETE / LINE 708 : opUser : ", opParams[0]);
  //   const opUser = opParams[0];
  //   const opTokenName = opParams[4];
  //   const opSignature = opParams[7];
  //   expect(opUser).to.equal(user);
  //   expect(opTokenName).to.equal("BridgedEth2");
  //   expect(opSignature).to.equal(signature);
  // });

  it("Should let user deposit to bridge and emit event from relayer with fixture", async function () {
    const { bridge, relayer, hash, detailedOp } = await loadFixture(
      deployContractAndCreateOperation
    );
    console.log("details: ", detailedOp);
    const storedOp = await relayer.getDetailedOriginOperation(hash);
    console.log("storedOp: ", storedOp);
    // get hash from op details
    const opParams = storedOp[0];
    // const recHash = await bridge.getPrefixedMessageHash(
    const recHash = await bridge.getMessageHash(
      opParams[0],
      opParams[1],
      opParams[2],
      opParams[3],
      opParams[4],
      opParams[5],
      opParams[6]
    );
    console.log("recHash: ", recHash);

    //check dest
    const storedOpDST = await relayer.getDetailedDestinationOperation(hash);
    console.log("storedOpDST: ", storedOpDST);
    expect(recHash).to.equal(hash);
  });

  // DEPOSIT OF FEES ON DESTINATION
  it("Should deposit FEES", async function () {
    // set user eth balance
    const [owner, otherAccount] = await hre.ethers.getSigners();
    // Op is created on origin Chain, we're on destination but use
    // same token duplicated by convenience for harhdat test
    const {
      storage,
      factory,
      vault,
      bridge,
      relayer,
      bridgedTokenAftAddress,
      bridgedEthAddress,
      hash,
      detailedOp,
    } = await loadFixture(deployContractAndCreateOperation);
    const user = otherAccount.address;
    // uint256 opFees = 0.001 ether;
    const opFees = ethers.parseEther("0.001");

    //  get eth balance of vault contract before deposit fees
    const vaultBalanceBefore = await hre.ethers.provider.getBalance(
      vault.target
    );
    await bridge.depositFees(hash, 31337, { value: opFees });

    // expect vault balance to be equal to fees  and opFeesBalance(add max) too
    const vaultBalanceAfter = await hre.ethers.provider.getBalance(
      vault.target
    );
    const balanceAfterFtomVault = await vault.getOpFeesBalance(maxAddress);

    expect(vaultBalanceAfter).to.equal(vaultBalanceBefore + opFees);
    expect(balanceAfterFtomVault).to.equal(opFees);
  });

  it("Should deposit FEES and emit event", async function () {
    // set user eth balance
    const [owner, otherAccount] = await hre.ethers.getSigners();
    // Op is created on origin Chain, we're on destination but use
    // same token duplicated by convenience for harhdat test
    const {
      storage,
      factory,
      vault,
      bridge,
      relayer,
      bridgedTokenAftAddress,
      bridgedEthAddress,
      hash,
      detailedOp,
    } = await loadFixture(deployContractAndCreateOperation);
    const user = otherAccount.address;
    // uint256 opFees = 0.001 ether;
    const opFees = ethers.parseEther("0.001");

    //  get eth balance of vault contract before deposit fees
    const vaultBalanceBefore = await hre.ethers.provider.getBalance(
      vault.target
    );
    const chainIdFrom = detailedOp[0][2];
    expect(await bridge.depositFees(hash, 31337, { value: opFees }))
      .to.emit(relayer, "FeesDeposited")
      .withArgs(hash, chainIdFrom);
    // await bridge.depositFees(hash, 31337, { value: opFees });

    // expect vault balance to be equal to fees  and opFeesBalance(add max) too
    const vaultBalanceAfter = await hre.ethers.provider.getBalance(
      vault.target
    );
    const balanceAfterFtomVault = await vault.getOpFeesBalance(maxAddress);

    expect(vaultBalanceAfter).to.equal(vaultBalanceBefore + opFees);
    expect(balanceAfterFtomVault).to.equal(opFees);
  });

  // DESTINATION callback to ping for block confirmation emit event to confirmed fees to origin
  it("Should deposit FEES and emit event", async function () {
    // set user eth balance
    const [owner, otherAccount] = await hre.ethers.getSigners();
    // Op is created on origin Chain, we're on destination but use
    // same token duplicated by convenience for harhdat test
    const {
      storage,
      factory,
      vault,
      bridge,
      relayer,
      bridgedTokenAftAddress,
      bridgedEthAddress,
      hash,
      detailedOp,
    } = await loadFixture(deployContractAndCreateOperation);
    const user = otherAccount.address;
    // uint256 opFees = 0.001 ether;
    const opFees = ethers.parseEther("0.001");

    //  get eth balance of vault contract before deposit fees
    const vaultBalanceBefore = await hre.ethers.provider.getBalance(
      vault.target
    );
    const chainIdFrom = detailedOp[0][2];
    expect(await bridge.depositFees(hash, 31337, { value: opFees }))
      .to.emit(relayer, "FeesDeposited")
      .withArgs(hash, chainIdFrom);
    // await bridge.depositFees(hash, 31337, { value: opFees });

    // expect vault balance to be equal to fees  and opFeesBalance(add max) too
    const vaultBalanceAfter = await hre.ethers.provider.getBalance(
      vault.target
    );
    const balanceAfterFtomVault = await vault.getOpFeesBalance(maxAddress);

    expect(vaultBalanceAfter).to.equal(vaultBalanceBefore + opFees);
    expect(balanceAfterFtomVault).to.equal(opFees);

    await storage.updateOperator("oracle", owner.address);
    const blockNumber = await ethers.provider.getBlockNumber();
    expect(await relayer.sendFeesLockConfirmation(hash))
      .to.emit(relayer, "FeesDepositConfirmed")
      .withArgs(hash, detailedOp[0][2], blockNumber);
  });

  // ORIGIN: server calls rceivesFeesLockConfiramtion
  it("Should receive deositedFees confirmation and emit event", async function () {
    // set user eth balance
    const [owner, otherAccount] = await hre.ethers.getSigners();
    // Op is created on origin Chain, we're on destination but use
    // same token duplicated by convenience for harhdat test
    const {
      storage,
      factory,
      vault,
      bridge,
      relayer,
      bridgedTokenAftAddress,
      bridgedEthAddress,
      hash,
      detailedOp,
    } = await loadFixture(deployContractAndCreateOperation);
    const user = otherAccount.address;
    // uint256 opFees = 0.001 ether;
    //  const opFees = ethers.parseEther("0.001");

    // DESTINATION DEPOSIT FEES
    //  //  get eth balance of vault contract before deposit fees
    //  const vaultBalanceBefore = await hre.ethers.provider.getBalance(
    //    vault.target
    //  );
    //  const chainIdFrom = detailedOp[0][2];
    //  expect(await bridge.depositFees(hash, 31337, { value: opFees }))
    //    .to.emit(relayer, "FeesDeposited")
    //    .withArgs(hash, chainIdFrom);
    //  // await bridge.depositFees(hash, 31337, { value: opFees });

    //  // expect vault balance to be equal to fees  and opFeesBalance(add max) too
    //  const vaultBalanceAfter = await hre.ethers.provider.getBalance(
    //    vault.target
    //  );
    //  const balanceAfterFtomVault = await vault.getOpFeesBalance(maxAddress);

    //  expect(vaultBalanceAfter).to.equal(vaultBalanceBefore + opFees);
    //  expect(balanceAfterFtomVault).to.equal(opFees);
    console.log("operation details: ", detailedOp);
    // ORIGIN RECEIVE FEES CONFIRMATION
    const chainIdTo = detailedOp[0][3];
    const fakeServer = owner.address;
    const blockNumber = await ethers.provider.getBlockNumber();
    await storage.updateOperator("oracle", fakeServer);
    // get opPrarma from relayer, expect == to opDetail.status
    const opParams = await relayer.getDetailedOriginOperation(hash);
    console.log("opParams: ", opParams);
    const statusFixture = detailedOp[1];
    const statusRelayer = opParams[1];
    console.log("statusFixture: ", statusFixture);
    console.log("statusRelayer: ", statusRelayer);
    expect(statusFixture).to.equal(statusRelayer);
    // should emit event FeesLockConfirmed(hash, status, block number)
    expect(
      await relayer.receiveFeesLockConfirmation(hash, chainIdTo, fakeServer)
    )
      .to.emit(relayer, "FeesLockConfirmed")
      .withArgs(hash, 2n, blockNumber);
    // await relayer.receiveFeesLockConfirmation(hash, chainIdTo, fakeServer);
    // operation.status should pass to ORG_FEES_LOCKED (2)
    const opStatus = await relayer.getOriginOperationStatus(hash);
    expect(opStatus).to.equal(4);
  });

  // ORIGIN: server calls rceivesFeesLockConfiramtion
  it("Should emit main event when server call", async function () {
    // set user eth balance
    const [owner, otherAccount] = await hre.ethers.getSigners();
    // Op is created on origin Chain, we're on destination but use
    // same token duplicated by convenience for harhdat test
    const {
      storage,
      factory,
      vault,
      bridge,
      relayer,
      bridgedTokenAftAddress,
      bridgedEthAddress,
      hash,
      detailedOp,
    } = await loadFixture(deployContractAndCreateOperation);
    const user = otherAccount.address;
    // uint256 opFees = 0.001 ether;
    //  const opFees = ethers.parseEther("0.001");

    // DESTINATION DEPOSIT FEES
    //  //  get eth balance of vault contract before deposit fees
    //  const vaultBalanceBefore = await hre.ethers.provider.getBalance(
    //    vault.target
    //  );
    //  const chainIdFrom = detailedOp[0][2];
    //  expect(await bridge.depositFees(hash, 31337, { value: opFees }))
    //    .to.emit(relayer, "FeesDeposited")
    //    .withArgs(hash, chainIdFrom);
    //  // await bridge.depositFees(hash, 31337, { value: opFees });

    //  // expect vault balance to be equal to fees  and opFeesBalance(add max) too
    //  const vaultBalanceAfter = await hre.ethers.provider.getBalance(
    //    vault.target
    //  );
    //  const balanceAfterFtomVault = await vault.getOpFeesBalance(maxAddress);

    //  expect(vaultBalanceAfter).to.equal(vaultBalanceBefore + opFees);
    //  expect(balanceAfterFtomVault).to.equal(opFees);
    console.log("operation details: ", detailedOp);
    // ORIGIN RECEIVE FEES CONFIRMATION
    const chainIdTo = detailedOp[0][3];
    const fakeServer = owner.address;
    const blockNumber = await ethers.provider.getBlockNumber();
    await storage.updateOperator("oracle", fakeServer);
    // get opPrarma from relayer, expect == to opDetail.status
    const opParams = await relayer.getDetailedOriginOperation(hash);
    console.log("opParams: ", opParams);
    const statusFixture = detailedOp[1];
    const statusRelayer = opParams[1];
    console.log("statusFixture: ", statusFixture);
    console.log("statusRelayer: ", statusRelayer);
    expect(statusFixture).to.equal(statusRelayer);
    // should emit event FeesLockConfirmed(hash, status, block number)
    expect(
      await relayer.receiveFeesLockConfirmation(hash, chainIdTo, fakeServer)
    )
      .to.emit(relayer, "FeesLockConfirmed")
      .withArgs(hash, 2n, blockNumber);
    // await relayer.receiveFeesLockConfirmation(hash, chainIdTo, fakeServer);
    // operation.status should pass to ORG_FEES_LOCKED (2)
    const opStatus = await relayer.getOriginOperationStatus(hash);
    expect(opStatus).to.equal(4);

    const creationBlock = detailedOp[2][0];
    // ?? pb detailesOp passe le test devrait être opParams donc detailedOp[0]
    expect(await relayer.confirmFeesLockedAndDepositConfirmed(hash))
      .to.emit(relayer, "FeesLockedAndDepositConfirmed")
      .withArgs(hash, detailedOp[0], creationBlock, blockNumber);

    const testParams = detailedOp[0];
    const testUser = testParams[0];
    const testSignature = testParams[7];
    console.log("testUser: ", testUser);
    console.log("testSignature: ", testSignature);
  });

  // DESTINATION receive main call to complete op from origin
  // in realty
  it("Should deposit FEES and emit event", async function () {
    // set user eth balance
    const [owner, otherAccount] = await hre.ethers.getSigners();
    // Op is created on origin Chain, we're on destination but use
    // same token duplicated by convenience for harhdat test
    const {
      storage,
      factory,
      vault,
      bridge,
      relayer,
      bridgedTokenAftAddress,
      bridgedEthAddress,
      hash,
      detailedOp,
    } = await loadFixture(deployContractAndCreateOperation);
    const user = otherAccount.address;
    // uint256 opFees = 0.001 ether;
    const opFees = ethers.parseEther("0.001");

    //  get eth balance of vault contract before deposit fees
    const vaultBalanceBefore = await hre.ethers.provider.getBalance(
      vault.target
    );
    const chainIdFrom = detailedOp[0][2];

    let otestStatus = await relayer.getOriginOperationStatus(hash);
    console.log("ETE / LINE 1233 : ORIGIN opStatus : ", otestStatus);
    let dtestStatus = await relayer.getDestinationOperationStatus(hash);
    console.log("ETE / LINE 1233 : DESTINATION opStatus : ", dtestStatus);
    expect(await bridge.depositFees(hash, 31337, { value: opFees }))
      .to.emit(relayer, "FeesDeposited")
      .withArgs(hash, chainIdFrom);
    // await bridge.depositFees(hash, 31337, { value: opFees });

    // expect vault balance to be equal to fees  and opFeesBalance(add max) too
    const vaultBalanceAfter = await hre.ethers.provider.getBalance(
      vault.target
    );
    const balanceAfterFtomVault = await vault.getOpFeesBalance(maxAddress);

    expect(vaultBalanceAfter).to.equal(vaultBalanceBefore + opFees);
    expect(balanceAfterFtomVault).to.equal(opFees);

    await storage.updateOperator("oracle", owner.address);
    const blockNumber = await ethers.provider.getBlockNumber();

    otestStatus = await relayer.getOriginOperationStatus(hash);
    console.log("ETE / LINE 1233 : ORIGIN opStatus : ", otestStatus);
    dtestStatus = await relayer.getDestinationOperationStatus(hash);
    console.log("ETE / LINE 1233 : DESTINATION opStatus : ", dtestStatus);
    expect(await relayer.sendFeesLockConfirmation(hash))
      .to.emit(relayer, "FeesDepositConfirmed")
      .withArgs(hash, detailedOp[0][2], blockNumber);

    const userFrom = detailedOp[0][0];
    const userTo = detailedOp[0][1];
    const chainFrom = detailedOp[0][2];
    const chainTo = detailedOp[0][3];
    const tokenName = detailedOp[0][4];
    const amount = detailedOp[0][5];
    const nonce = detailedOp[0][6];
    const signature = detailedOp[0][7];
    console.log("BEFORE TEST OF SIGNATURE userFrom: ", userFrom);
    otestStatus = await relayer.getOriginOperationStatus(hash);
    console.log("ETE / LINE 1233 : ORIGIN opStatus : ", otestStatus);
    dtestStatus = await relayer.getDestinationOperationStatus(hash);
    console.log("ETE / LINE 1233 : DESTINATION opStatus : ", dtestStatus);
    expect(
      await relayer.completeOperation(
        userFrom,
        userTo,
        chainFrom,
        chainTo,
        tokenName,
        amount,
        nonce,
        signature
      )
    )
      .to.emit(relayer, "OperationFinalized")
      .withArgs(hash, detailedOp[0], blockNumber);
  });
});
