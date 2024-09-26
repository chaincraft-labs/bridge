// const hre = require("hardhat");
// const { expect } = require("chai");
// const sinon = require("sinon");
// const { readLastDeployedAddress } = require("../../helpers/fileHelpers");
// const { display } = require("../../helpers/loggingHelper");

// @todo FIX the test
// // COMMENTED CODE CAUSES ERROR
// // discovering and trying to use stub

// const mockReadLastDeployedAddress = sinon.stub();
// const mockDisplay = {
//   tx: sinon.spy(),
//   mintResult: sinon.spy(),
// };

// // Comment/Uncomment describe.skip/describe.only to run/skip the tests
// describe.only("func-mintBridgedToken task", function () {
//   // describe.skip("func-mintBridgedToken task", function () {
//   let signer, user, storage, vault, tokenInstance;

//   before(async () => {
//     [signer, user] = await hre.ethers.getSigners();

//     // Créer des mocks pour les contrats
//     const storageAddress = "0xStorageAddress";
//     const vaultAddress = "0xVaultAddress";
//     const tokenAddress = "0xTokenAddress";

//     // Stub de la fonction pour renvoyer des adresses fictives
//     sinon
//       .stub(readLastDeployedAddress, "readLastDeployedAddress")
//       .withArgs(hre.network.name, "Storage")
//       .returns(storageAddress)
//       .withArgs(hre.network.name, "Vault")
//       .returns(vaultAddress);

//     // Simule
//     storage = {
//       getOperator: sinon.stub().returns("0xOldBridgeAddress"),
//       updateOperator: sinon.stub().returns({
//         wait: async () => {
//           return {};
//         }, // simule tx ok
//       }),
//     };

//     vault = {
//       mint: sinon.stub().returns({
//         wait: async () => ({ status: 1 }),
//       }),
//     };

//     tokenInstance = {
//       balanceOf: sinon.stub().returns(100),
//     };

//     // Stub de display
//     sinon.replace(display, "tx", mockDisplay.tx);
//     sinon.replace(display, "mintResult", mockDisplay.mintResult);
//   });

//   afterEach(() => {
//     sinon.restore();
//   });

//   it("should mint tokens to the user", async function () {
//     const amountToMint = 50;

//     await hre.run("func-mintBridgedToken", {
//       to: user.address,
//       token: tokenAddress,
//       amount: amountToMint,
//     });

//     expect(vault.mint).to.have.been.calledWith(
//       user.address,
//       tokenAddress,
//       amountToMint
//     );

//     expect(mockDisplay.tx).to.have.been.called;

//     expect(mockDisplay.mintResult).to.have.been.calledWith(
//       50, // delta
//       amountToMint,
//       1, // statut de la tx
//       tokenAddress,
//       user.address
//     );
//   });

//   it("should handle errors gracefully", async function () {
//     vault.mint.throws(new Error("Mint failed"));

//     const amountToMint = 50;

//     const consoleErrorSpy = sinon.spy(console, "error");

//     await hre.run("func-mintBridgedToken", {
//       to: user.address,
//       token: tokenAddress,
//       amount: amountToMint,
//     });

//     expect(consoleErrorSpy).to.have.been.calledWith(
//       "Error:",
//       sinon.match.instanceOf(Error)
//     );

//     console.error.restore();
//   });
// });
