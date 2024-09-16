const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const hre = require("hardhat");

const { mocked, fixtures } = require("../helper_fixture");

describe("MockedToken", function () {
  const mockedTokenName = mocked.mockedTokenName;
  const mockedTokenSymbol = mocked.mockedTokenSymbol;
  const mockedTokenSupply = mocked.mockedTokenSupply;

  describe("MockedToken Deployment", function () {
    it(`Should deploy ${mockedTokenName} and mint ${mockedTokenSupply} to owner`, async function () {
      const { mockedToken, owner } = await loadFixture(
        fixtures.deployMockedToken
      );

      const ownerBalance = await mockedToken.balanceOf(owner.address);

      expect(ownerBalance).to.be.equal(mockedTokenSupply);
    });
  });
});
