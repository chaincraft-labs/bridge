const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("Vault", function () {
  const zeroAddress = "0x" + "0".repeat(40);
  const toChecksum = (address) => {
    return ethers.getAddress(address);
  };
  const maxAddress20bytes = "0x" + "f".repeat(40);
  const maxAddress = toChecksum(maxAddress20bytes);
  const getRandomAddress = () => {
    return ethers.Wallet.createRandom().address;
  };
  // deployment fixture :
  async function deployVaultFixture() {
    const [owner, otherAccount] = await ethers.getSigners();
    const storage = await hre.ethers.deployContract("Storage", ["ETH"]);
    await storage.waitForDeployment();
    console.log("Storage deployed to:", storage.target);

    // owner address:
    console.log("owner address:", owner.address);
    // get admin address in storage:
    console.log(
      "admin address in storage:",
      await storage.getOperator("admin")
    );

    const factory = await hre.ethers.deployContract("TokenFactory", [
      storage.target,
    ]);
    await factory.waitForDeployment();
    console.log("factory deployed to:", factory.target);

    const vault = await hre.ethers.deployContract("Vault", [storage.target]);
    await vault.waitForDeployment();

    console.log("vault deployed to:", vault.target);

    // const BridgeBase = await ethers.getContractFactory("BridgeBase");
    // const bridge = await BridgeBase.deploy(storage.target, vault.target);
    // await bridge.deployed();
    // console.log("Bridge deployed to:", bridge.target);
    await storage.updateOperator("factory", factory.target);
    await storage.updateOperator("vault", vault.target);

    //TESTING PURPOSE
    await storage.updateOperator("bridge", owner.address);
    // await storage.updateOperator("bridge", bridge.target);
    return { storage, factory, vault, owner, otherAccount };
  }

  it("Should store the admin at deployment", async function () {
    const { storage, owner, otherAccount } = await loadFixture(
      deployVaultFixture
    );
    expect(await storage.getOperator("admin")).to.equal(owner.address);
  });

  //   it("Should add a new operator", async function () {
  //     const { storage, owner, otherAccount } = await loadFixture(
  //       deployVaultFixture
  //     );
  //     await storage.updateOperator("vault", otherAccount.address);
  //     expect(await storage.getOperator("vault")).to.equal(otherAccount.address);
  //   });
  it("Should deposit ETH", async function () {
    const { storage, vault, owner, otherAccount } = await loadFixture(
      deployVaultFixture
    );

    // const amountInwei = ethers.parseEther("1");
    // expect(amountInwei).to.equal(1_000_000_000_000_000_000n);
    // const vaultBalance = await ethers.provider.getBalance(vault.target);
    // expect(vaultBalance).to.equal(0n);

    await vault.depositNative(owner.address, {
      value: ethers.parseEther("1"),
    });
    const vaultBalance = await ethers.provider.getBalance(vault.target);

    expect(vaultBalance).to.equal(ethers.parseEther("1"));
  });

  it("Should deposit ERC20", async function () {
    const { storage, vault, owner, otherAccount } = await loadFixture(
      deployVaultFixture
    );
    const mockedDai = await hre.ethers.deployContract("MockedDai");
    await mockedDai.waitForDeployment();
    console.log("MockedDai deployed to:", mockedDai.target);
    const amountInwei = ethers.parseEther("1");
    // expect(amountInwei).to.equal(1_000_000_000_000_000_000n);
    // const vaultBalance = await ethers.provider.getBalance(vault.target);
    // expect(vaultBalance).to.equal(0n);
    await mockedDai.approve(vault.target, amountInwei);
    await vault.depositToken(owner.address, mockedDai.target, amountInwei);
    const vaultBalance = await mockedDai.balanceOf(vault.target);
    expect(vaultBalance).to.equal(amountInwei);
  });

  it("Should mint bridgedToken", async function () {
    const { storage, factory, vault, owner, otherAccount } = await loadFixture(
      deployVaultFixture
    );
    // const mockedDai = await hre.ethers.deployContract("MockedDai");
    // await mockedDai.waitForDeployment();
    // console.log("MockedDai deployed to:", mockedDai.target);
    // deploy bDai bridgedToken
    const fakeCheckSumAddress20bytes =
      "0xbcE0B5F6E3f3F2F8f3F2f3f2F3F2f3f2F3F2F3F2";
    let tx0 = await storage.addTokenNameToList("Dai token");
    await tx0.wait();
    tx0 = await storage.addChainIdToList(441);
    await tx0.wait();
    const bridgedToken = await factory.createToken(
      "Dai token",
      "bDAI"
      //   441,
      //   fakeCheckSumAddress20bytes
    );
    console.log("bridgedToken deployed to:", bridgedToken.target);
    const bTokenAddress = await factory.getTokenAddress("bDAI");
    console.log("bTokenAddress:", bTokenAddress);
    const amountInwei = ethers.parseEther("1");
    const bToken = await ethers.getContractAt("BridgedToken", bTokenAddress);
    // expect(amountInwei).to.equal(1_000_000_000_000_000_000n);
    // const vaultBalance = await ethers.provider.getBalance(vault.target);
    // expect(vaultBalance).to.equal(0n);
    await vault.mint(bTokenAddress, otherAccount.address, amountInwei);
    const vaultBalance = await bToken.balanceOf(vault.target);
    const otherAccountBalance = await bToken.balanceOf(otherAccount.address);
    expect(vaultBalance).to.equal(0);
    expect(otherAccountBalance).to.equal(amountInwei);
  });

  it("Should burn bridgedToken", async function () {
    const { storage, factory, vault, owner, otherAccount } = await loadFixture(
      deployVaultFixture
    );
    // const mockedDai = await hre.ethers.deployContract("MockedDai");
    // await mockedDai.waitForDeployment();
    // console.log("MockedDai deployed to:", mockedDai.target);
    // deploy bDai bridgedToken
    const fakeCheckSumAddress20bytes =
      "0xbcE0B5F6E3f3F2F8f3F2f3f2F3F2f3f2F3F2F3F2";
    let tx0 = await storage.addTokenNameToList("Dai token");
    await tx0.wait();
    tx0 = await storage.addChainIdToList(441);
    await tx0.wait();
    const bridgedToken = await factory.createToken(
      "Dai token",
      "bDAI"
      //   441,
      //   fakeCheckSumAddress20bytes
    );
    console.log("bridgedToken deployed to:", bridgedToken.target);
    const bTokenAddress = await factory.getTokenAddress("bDAI");
    console.log("bTokenAddress:", bTokenAddress);
    const amountInwei = ethers.parseEther("1");
    const bToken = await ethers.getContractAt("BridgedToken", bTokenAddress);
    // expect(amountInwei).to.equal(1_000_000_000_000_000_000n);
    // const vaultBalance = await ethers.provider.getBalance(vault.target);
    // expect(vaultBalance).to.equal(0n);
    await vault.mint(bTokenAddress, otherAccount.address, amountInwei);
    const vaultBalance = await bToken.balanceOf(vault.target);
    const otherAccountBalance = await bToken.balanceOf(otherAccount.address);
    expect(vaultBalance).to.equal(0);
    expect(otherAccountBalance).to.equal(amountInwei);
    await vault.burn(bTokenAddress, otherAccount.address, amountInwei);
    const vaultBalanceAfterBurn = await bToken.balanceOf(vault.target);
    const otherAccountBalanceAfterBurn = await bToken.balanceOf(
      otherAccount.address
    );
    expect(vaultBalanceAfterBurn).to.equal(0);
    expect(otherAccountBalanceAfterBurn).to.equal(0);
  });

  it("Should return token addresses", async function () {
    const { storage, factory, vault, owner, otherAccount } = await loadFixture(
      deployVaultFixture
    );
    const add1 = getRandomAddress();
    const add2 = getRandomAddress();
    await storage.addTokenNameToList("Dai token");
    await storage.addChainIdToList(441);
    const chainId = hre.network.config.chainId;
    await storage.addChainIdToList(chainId);
    await storage.setTokenAddressByChainId("Dai token", 441, add1);
    await storage.setTokenAddressByChainId("Dai token", chainId, add2);
    const [add1_, add2_] = await storage.getTokenAddressesBychainIds(
      "Dai token",
      441,
      chainId
    );
    expect(add1).to.equal(add1_);
    expect(add2).to.equal(add2_);

    // deploy bridge
    const bridge = await hre.ethers.deployContract("BridgeBase", [
      storage.target,
      vault.target,
    ]);
    await bridge.waitForDeployment();
    const [add1__, add2__] = await bridge.getTokenAddresses(
      "Dai token",
      441,
      chainId
    );
    console.log("add1", add1);
    console.log("add2", add2);
    console.log("add1__", add1__);
    console.log("add2__", add2__);

    expect(add1).to.equal(add1__);
    expect(add2).to.equal(add2__);
  });

  it("Should unlockNative and tranfsfer to otherAccount", async function () {
    const { storage, factory, vault, owner, otherAccount } = await loadFixture(
      deployVaultFixture
    );
    const amountInwei = ethers.parseEther("1");
    const amountInweiWithFees = ethers.parseEther("1.5");
    console.log(
      "owner balance before deposit",
      await ethers.provider.getBalance(owner.address)
    );
    await vault.depositNative(owner.address, {
      value: amountInweiWithFees,
    });
    const vaultBalance = await ethers.provider.getBalance(vault.target);
    expect(vaultBalance).to.equal(amountInweiWithFees);
    console.log(
      "owner balance after deposit",
      await ethers.provider.getBalance(owner.address)
    );

    // const zeroAddress = "0x0000000000000000000000000000000000000000";
    await vault.finalizeDeposit(owner.address, maxAddress, amountInwei);
    const ownerAccountBalanceBefore = await ethers.provider.getBalance(
      owner.address
    );
    let tx = await vault.unlockNative(owner.address, amountInwei);
    let receipt = await tx.wait();
    console.log(receipt);
    const gasPrice = receipt.gasPrice;
    const gasSpent = receipt.gasUsed * gasPrice;
    const vaultBalanceAfterUnlock = await ethers.provider.getBalance(
      vault.target
    );
    const ownerAccountBalanceAfter = await ethers.provider.getBalance(
      owner.address
    );
    console.log(
      "owner balance after unlock",
      await ethers.provider.getBalance(owner.address)
    );

    expect(vaultBalanceAfterUnlock).to.equal(amountInweiWithFees - amountInwei);
    expect(ownerAccountBalanceAfter - ownerAccountBalanceBefore).to.equal(
      amountInwei - gasSpent
    );
    //   expect(() =>
    //     contract.connect(owner).withdrawAllETH()
    //   ).to.changeEtherBalance(owner, parseEther(10));
  });
  it("Should unlock token and tranfsfer to otherAccount", async function () {
    const { storage, factory, vault, owner, otherAccount } = await loadFixture(
      deployVaultFixture
    );
    const mockedDai = await hre.ethers.deployContract("MockedDai");
    await mockedDai.waitForDeployment();
    console.log("MockedDai deployed to:", mockedDai.target);
    const amountInwei = ethers.parseEther("1");
    await mockedDai.approve(vault.target, amountInwei);
    await vault.depositToken(owner.address, mockedDai.target, amountInwei);
    await vault.finalizeDeposit(owner.address, mockedDai.target, amountInwei);

    const vaultBalance = await mockedDai.balanceOf(vault.target);
    expect(vaultBalance).to.equal(amountInwei);
    await vault.unlockToken(
      otherAccount.address,
      mockedDai.target,
      amountInwei
    );
    const vaultBalanceAfterUnlock = await mockedDai.balanceOf(vault.target);
    const otherAccountBalance = await mockedDai.balanceOf(otherAccount.address);
    expect(vaultBalanceAfterUnlock).to.equal(0);
    expect(otherAccountBalance).to.equal(amountInwei);
  });
});
