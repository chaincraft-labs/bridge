// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

const owner = "0xbfae728Cf6D20DFba443c5A297dC9b344108de90";
const recipient = "0x58DD4570b7eaA48509Ce7b94da404123CF701843";

// this script will transfer 100 aDai from the owner to the recipient
async function main() {
  const aDai = await hre.ethers.getContractAt(
    "ADai",
    "0x0eC2E1906d7294EF8f25A73e3206a1e7adDac842"
  );

  let ownerBalance = await aDai.balanceOf(owner);
  let recipientBalance = await aDai.balanceOf(recipient);
  console.log("Owner balance: ", ownerBalance.toString());
  console.log("Recipient balance: ", recipientBalance.toString());

  const amount = hre.ethers.parseEther("100");
  const tx = await aDai.transfer(recipient, amount);
  await tx.wait();

  ownerBalance = await aDai.balanceOf(owner);
  recipientBalance = await aDai.balanceOf(recipient);
  console.log("Transfer complete ✅");
  console.log("Owner balance: ", ownerBalance.toString());
  console.log("Recipient balance: ", recipientBalance.toString());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
