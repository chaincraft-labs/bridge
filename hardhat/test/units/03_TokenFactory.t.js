const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
const { mocked, fixtures } = require("../helper_fixture");

describe("TokenFactory", function () {
  const mockedTokenName = mocked.bridgedTokenName;
  const mockedTokenSymbol = mocked.bridgedTokenSymbol;
  const mockedAmount = 10000;

  describe("TokenFactory Deployment", function () {
    it("Should revert and not be deployed by NON owner", async function () {
      const [owner, otherAccount] = await ethers.getSigners();
      const storage = await hre.ethers.deployContract(
        "Storage",
        ["ethereum"],
        owner
      );
      await storage.waitForDeployment();

      await expect(
        hre.ethers.deployContract(
          "TokenFactory",
          [storage.target],
          otherAccount
        )
      ).to.be.revertedWith("TokenFactory: caller is not the admin");
    });

    it("Should have Storage address set", async function () {
      const { storage, factory } = await loadFixture(
        fixtures.deployTokenFactory
      );
      expect(await factory.getStorageAddress()).to.equal(storage.target);
    });

    it("Should have factory as operator in storage", async function () {
      const { storage, factory } = await loadFixture(
        fixtures.deployTokenFactory
      );
      expect(await storage.getOperator("factory")).to.equal(factory.target);
    });
  });

  describe("CreateToken function", function () {
    it(`Should create ${mockedTokenName} and set its symbol in list`, async function () {
      const { storage, factory, owner } = await loadFixture(
        fixtures.deployTokenFactory
      );
      // Vault is the regular owner of bridged token
      // mocking owner as Vault in Storage in order to do tests with Factory
      // await storage.updateOperator("vault", owner.address);
      // expect(await storage.getOperator("vault")).to.equal(owner.address);

      let tx = await storage.addTokenNameToList(mockedTokenName);
      await tx.wait();
      tx = await factory.createToken(mockedTokenName, mockedTokenSymbol);
      await tx.wait();

      const tokenList = await factory.getTokenList();
      const isInList = tokenList.includes(mockedTokenSymbol);
      expect(isInList).to.be.true;
    });

    it(`Should create ${mockedTokenName} and set its address`, async function () {
      const { storage, factory, owner } = await loadFixture(
        fixtures.deployTokenFactory
      );
      // Vault is the regular owner of bridged token
      // mocking owner as Vault in Storage in order to do tests with Factory
      // await storage.updateOperator("vault", owner.address);
      // expect(await storage.getOperator("vault")).to.equal(owner.address);

      let tx = await storage.addTokenNameToList(mockedTokenName);
      await tx.wait();
      tx = await factory.createToken(mockedTokenName, mockedTokenSymbol);

      const tokenList = await factory.getTokenList();
      expect(tokenList.length).to.be.equal(1);

      const lastAddressCreated = await factory.getTokenAddress(tokenList[0]);
      const tokenAddress = await factory.getTokenAddress(mockedTokenSymbol);
      expect(tokenAddress).to.equal(lastAddressCreated);
    });

    it(`Should create ${mockedTokenName} and let owner mint`, async function () {
      const { storage, factory, owner } = await loadFixture(
        fixtures.deployTokenFactory
      );
      // Vault is the regular owner of bridged token
      // mocking owner as Vault in Storage in order to do tests with Factory
      await storage.updateOperator("vault", owner.address);
      expect(await storage.getOperator("vault")).to.equal(owner.address);

      let tx = await storage.addTokenNameToList(mockedTokenName);
      await tx.wait();
      tx = await factory.createToken(mockedTokenName, mockedTokenSymbol);

      const tokenList = await factory.getTokenList();
      const tokenAddress = await factory.getTokenAddress(tokenList[0]);
      const bridgedToken = await hre.ethers.getContractAt(
        "BridgedToken",
        tokenAddress
      );

      const ownerBalanceBefore = await bridgedToken.balanceOf(owner.address);
      expect(ownerBalanceBefore).to.be.equal(0);

      await bridgedToken.connect(owner).mint(owner.address, mockedAmount);
      const ownerBalanceAfter = await bridgedToken.balanceOf(owner.address);

      expect(ownerBalanceAfter).to.be.equal(mockedAmount);
    });

    it("Should revert if token already exist", async function () {
      const { storage, factory, owner } = await loadFixture(
        fixtures.deployTokenFactory
      );

      let tx = await storage.addTokenNameToList(mockedTokenName);
      await tx.wait();
      tx = await factory.createToken(mockedTokenName, mockedTokenSymbol);
      await tx.wait();

      await expect(factory.createToken(mockedTokenName, mockedTokenSymbol))
        .to.be.revertedWithCustomError(
          factory,
          "TokenFactory__TokenCreationFailed"
        )
        .withArgs("Token symbol already exists");
    });

    it(`Should add ${mockedTokenName} address in Storage contract`, async function () {
      const { storage, factory, owner } = await loadFixture(
        fixtures.deployTokenFactory
      );
      const chainId = hre.network.config.chainId;
      let tx = await storage.addTokenNameToList(mockedTokenName);
      await tx.wait();
      tx = await factory.createToken(mockedTokenName, mockedTokenSymbol);
      await tx.wait();

      const tokenAddressInFactory = await factory.getTokenAddress(
        mockedTokenSymbol
      );
      const tokenAddressInStorage = await storage.getTokenAddressByChainId(
        mockedTokenName,
        chainId
      );
      expect(tokenAddressInFactory).to.be.equal(tokenAddressInStorage);

      const isAuthorized = await storage.isAuthorizedTokenByChainId(
        mockedTokenName,
        chainId
      );
      expect(isAuthorized).to.be.true;
    });
  });

  describe("getters", function () {
    it(`Should add ${mockedTokenName} address in Storage contract`, async function () {
      const { storage, factory, owner } = await loadFixture(
        fixtures.deployTokenFactory
      );

      let tx = await storage.addTokenNameToList(mockedTokenName);
      await tx.wait();
      tx = await factory.createToken(mockedTokenName, mockedTokenSymbol);
      await tx.wait();
      const tokenAddress = await factory.getTokenAddress(mockedTokenSymbol);
      const result = await factory.isBridgedToken(tokenAddress);

      expect(result).to.be.true;
    });
  });

  // it("Should create MockedDai BridgedToken", async function () {
  //   const { storage, factory, vault, owner, otherAccount, bridgedToken } =
  //     await loadFixture(deployTokenFactoryFixture);
  //   const { mockedDai } = await loadFixture(deployMockedDaiFixture);
  //   const chainId = hre.network.config.chainId;
  //   let tx0 = await storage.addTokenNameToList("MockedDai BridgedToken");
  //   await tx0.wait();
  //   tx0 = await storage.addChainIdToList(11155111);
  //   await tx0.wait();
  //   const tx = await factory.createToken(
  //     "MockedDai BridgedToken",
  //     "bDai"
  //     // 11155111,
  //     // mockedDai.target
  //   );

  //   await tx.wait();
  //   const tokenList = await factory.getTokenList();
  //   console.log("tokenList", tokenList);
  //   const bDaiAddress = await factory.getTokenAddress(tokenList[0]);
  //   console.log("bDaiAddress", bDaiAddress);
  //   const tokenAddress = await factory.getTokenAddress("bDai");
  //   console.log("tokenAddress", tokenAddress);
  //   expect(tokenAddress).to.equal(bDaiAddress);

  //   // from storage
  //   const bDaiAddress2 = await storage.getTokenAddressByChainId(
  //     "MockedDai BridgedToken",
  //     chainId
  //   );
  //   console.log("bDaiAddress2", bDaiAddress2);
  //   expect(bDaiAddress2).to.equal(bDaiAddress);
  // });
  // it("Should add token to tokenlist in storage", async function () {
  //   const { storage, factory, vault, owner, otherAccount, bridgedToken } =
  //     await loadFixture(deployTokenFactoryFixture);
  //   const chainId = hre.network.config.chainId;
  //   const zeroAddress = ethers.ZeroAddress;
  //   const tx0 = await storage.addTokenNameToList("ETH BridgedToken");
  //   await tx0.wait();
  //   const tx = await factory.createToken(
  //     "ETH BridgedToken",
  //     "bETH"
  //     // chainId,
  //     // zeroAddress
  //   );
  //   await tx.wait();
  //   const tokenList = await storage.getTokenNamesList();
  //   console.log("tokenList", tokenList);
  //   expect(tokenList.length).to.equal(2); // ETH native first
  //   expect(tokenList[1]).to.equal("ETH BridgedToken");
  //   const bEthAddress = await storage.getTokenAddressByChainId(
  //     "ETH BridgedToken",
  //     chainId
  //   );
  //   const tokenAddress = await factory.getTokenAddress("bETH");
  //   console.log("tokenAddress", tokenAddress);
  //   expect(tokenAddress).to.equal(bEthAddress);
  // });
});
