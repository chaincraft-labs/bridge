const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
const { mocked, fixtures } = require("../helper_fixture");
const { getMaxAddress } = require("../../utils/addressUtil");

/*
 * IMPORTANT - COVERAGE
 * fees and cancel functions are not tested at the moment
 * as these features are in progress
 */

/*
 * IMPORTANT - SETTINGS
 * (see helper_fixture.js::fixtures::deployVault)
 * bridge operator in Storage contract is mocked with 'owner' address
 * in order to access functions called by bridge
 */

// @todo when implemented test reentrance

// @todo test transfer fail case during deposit

const nativeAddressInStorage = getMaxAddress();

describe.only("BridgeBase", function () {
  describe("Bridge deployment", function () {
    it("Should store the admin at deployment", async function () {
      const { storage, owner } = await loadFixture(fixtures.deployBridge);
      expect(await storage.getOperator("admin")).to.equal(owner.address);
    });

    it("Should revert if NON owner tries to deploy Bridge", async function () {
      const { storage, otherAccount } = await loadFixture(fixtures.deployVault);

      await expect(
        hre.ethers.deployContract("BridgeBase", [storage.target], otherAccount)
      ).to.be.reverted;
    });
  });
});
