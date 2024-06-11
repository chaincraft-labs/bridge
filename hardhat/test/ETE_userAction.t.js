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
      const messageHash = await bridge.getMessageToSign(
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

      const hash = await bridge.getMessageToSign(
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
    });
    // it("Should set the right owner", async function () {
    //   const { lock, owner } = await loadFixture(deployOneYearLockFixture);

    //   expect(await lock.owner()).to.equal(owner.address);
    // });

    // it("Should receive and store the funds to lock", async function () {
    //   const { lock, lockedAmount } = await loadFixture(
    //     deployOneYearLockFixture
    //   );

    //   expect(await ethers.provider.getBalance(lock.target)).to.equal(
    //     lockedAmount
    //   );
    // });

    // it("Should fail if the unlockTime is not in the future", async function () {
    //   // We don't use the fixture here because we want a different deployment
    //   const latestTime = await time.latest();
    //   const Lock = await ethers.getContractFactory("Lock");
    //   await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
    //     "Unlock time should be in the future"
    //   );
    // });
  });

  //   describe("Withdrawals", function () {
  //     describe("Validations", function () {
  //       it("Should revert with the right error if called too soon", async function () {
  //         const { lock } = await loadFixture(deployOneYearLockFixture);

  //         await expect(lock.withdraw()).to.be.revertedWith(
  //           "You can't withdraw yet"
  //         );
  //       });

  //       it("Should revert with the right error if called from another account", async function () {
  //         const { lock, unlockTime, otherAccount } = await loadFixture(
  //           deployOneYearLockFixture
  //         );

  //         // We can increase the time in Hardhat Network
  //         await time.increaseTo(unlockTime);

  //         // We use lock.connect() to send a transaction from another account
  //         await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
  //           "You aren't the owner"
  //         );
  //       });

  //       it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
  //         const { lock, unlockTime } = await loadFixture(
  //           deployOneYearLockFixture
  //         );

  //         // Transactions are sent using the first signer by default
  //         await time.increaseTo(unlockTime);

  //         await expect(lock.withdraw()).not.to.be.reverted;
  //       });
  //     });

  //     describe("Events", function () {
  //       it("Should emit an event on withdrawals", async function () {
  //         const { lock, unlockTime, lockedAmount } = await loadFixture(
  //           deployOneYearLockFixture
  //         );

  //         await time.increaseTo(unlockTime);

  //         await expect(lock.withdraw())
  //           .to.emit(lock, "Withdrawal")
  //           .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
  //       });
  //     });

  //     describe("Transfers", function () {
  //       it("Should transfer the funds to the owner", async function () {
  //         const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
  //           deployOneYearLockFixture
  //         );

  //         await time.increaseTo(unlockTime);

  //         await expect(lock.withdraw()).to.changeEtherBalances(
  //           [owner, lock],
  //           [lockedAmount, -lockedAmount]
  //         );
  //       });
  //     });
  //   });
});
