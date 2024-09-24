const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { mocked, fixtures } = require("../helper_fixture");

describe("BridgedToken", function () {
  const mockedTokenName = mocked.bridgedTokenName;
  const mockedTokenSymbol = mocked.bridgedTokenSymbol;
  const mockedAmount = 10000;

  describe("BridgedToken Deployment", function () {
    it(`Should have ${mockedTokenName} as name and ${mockedTokenSymbol} as symbol`, async function () {
      const { bridgedToken } = await loadFixture(fixtures.deployBridgedToken);
      expect(await bridgedToken.name()).to.equal(mockedTokenName);
      expect(await bridgedToken.symbol()).to.equal(mockedTokenSymbol);
    });

    // @todo rename deployer, admin, owner... unify across contracts
    it("Should have admin as owner", async function () {
      const { bridgedToken, owner } = await loadFixture(
        fixtures.deployBridgedToken
      );

      expect(await bridgedToken.getOwner()).to.equal(owner.address);
    });
    it("Should transfer ownership to otherAccount", async function () {
      const { bridgedToken, otherAccount } = await loadFixture(
        fixtures.deployBridgedToken
      );
      expect(await bridgedToken.getOwner()).to.not.equal(otherAccount.address);

      await bridgedToken.updateAdmin(otherAccount.address);
      expect(await bridgedToken.getOwner()).to.equal(otherAccount.address);
    });
    it("Should emit OwnershipTransferred event", async function () {
      const { bridgedToken, otherAccount } = await loadFixture(
        fixtures.deployBridgedToken
      );
      expect(await bridgedToken.getOwner()).to.not.equal(otherAccount.address);

      await expect(await bridgedToken.updateAdmin(otherAccount.address))
        .to.emit(bridgedToken, "OwnerUpdated")
        .withArgs(bridgedToken.name(), otherAccount.address);
    });
  });
  describe("BridgedToken minting and burning", function () {
    it(`Should mint ${mockedAmount} tokens to otherAccount`, async function () {
      const { bridgedToken, owner, otherAccount } = await loadFixture(
        fixtures.deployBridgedToken
      );

      expect(await bridgedToken.balanceOf(otherAccount.address)).to.equal(0);

      await bridgedToken
        .connect(owner)
        .mint(otherAccount.address, mockedAmount);
      expect(await bridgedToken.balanceOf(otherAccount.address)).to.equal(
        mockedAmount
      );
    });
    it(`Should burn ${mockedAmount} tokens from otherAccount`, async function () {
      const { bridgedToken, owner, otherAccount } = await loadFixture(
        fixtures.deployBridgedToken
      );

      await bridgedToken
        .connect(owner)
        .mint(otherAccount.address, mockedAmount);
      expect(await bridgedToken.balanceOf(otherAccount.address)).to.equal(
        mockedAmount
      );

      await bridgedToken
        .connect(owner)
        .burn(otherAccount.address, mockedAmount);
      expect(await bridgedToken.balanceOf(otherAccount.address)).to.equal(0);
    });
    it("Should revert when minter is not the owner", async function () {
      const { bridgedToken, otherAccount } = await loadFixture(
        fixtures.deployBridgedToken
      );
      await expect(
        bridgedToken
          .connect(otherAccount)
          .mint(otherAccount.address, mockedAmount)
      ).to.be.revertedWithCustomError(
        bridgedToken,
        "BridgedToken__CallerNotOwner"
      );
    });
    it("Should revert when burner is not the owner", async function () {
      const { bridgedToken, otherAccount } = await loadFixture(
        fixtures.deployBridgedToken
      );
      await expect(
        bridgedToken.connect(otherAccount).burn(otherAccount.address, 1000)
      ).to.be.revertedWithCustomError(
        bridgedToken,
        "BridgedToken__CallerNotOwner"
      );
    });
    it("Should revert when burner has not enough tokens", async function () {
      const { bridgedToken, owner, otherAccount } = await loadFixture(
        fixtures.deployBridgedToken
      );
      const otherAccountBalance = await bridgedToken.balanceOf(
        otherAccount.address
      );
      await expect(
        bridgedToken.connect(owner).burn(otherAccount.address, mockedAmount)
      )
        .to.be.revertedWithCustomError(bridgedToken, "ERC20InsufficientBalance")
        .withArgs(otherAccount.address, otherAccountBalance, mockedAmount);
    });
  });
});
