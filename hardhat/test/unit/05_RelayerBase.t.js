const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
const { mocked, fixtures } = require("../helper_fixture");
const { getMaxAddress, getZeroAddress } = require("../../utils/util");

/*
 * IMPORTANT - COVERAGE
 * fees and cancel functions are not tested at the moment
 * as these features are in progress
 */
/*
 * IMPORTANT - SETTINGS
 * (see helper_fixture.js::fixtures::deployAllContracts)
 * oracle operator in Storage contract is mocked with 'owner' address
 * in order to access functions called by oracle (server)
 */

// @todo test revert cases when caller has not role
// @todo network config to adapt test to different networks
// current(origin): hardhat->allfeat / token:"ethereum"
// current(destination): allfeat->hardhat / token:"ethereum" (fees: ethereum) / need previous deposit

const paramsTypes = [
  "address",
  "address",
  "uint",
  "uint",
  "string",
  "uint",
  "uint",
];
const aftChainId = 441;
const hhChainId = 31337;
const tokenName = "ethereum";
const fees = ethers.parseEther("0.01");

// const originSide = [hhChainId, aftChainId, tokenName];
// const destinationSide = [aftChainId, hhChainId, tokenName];
const nativeCoinIndex = 0;

const originSideCases = [
  [hhChainId, aftChainId, mocked.hhNativeTokenName], // HH->allfeat native ethereum
  [hhChainId, aftChainId, mocked.bridgedTokenName], // HH->allfeat bridged token
  [hhChainId, aftChainId, mocked.mockedTokenName], // HH->allfeat mocked token
];
const destinationSideCases = [
  [aftChainId, hhChainId, mocked.hhNativeTokenName], // allfeat->HH native ethereum
  [aftChainId, hhChainId, mocked.bridgedTokenName], // allfeat->HH bridged token
  [aftChainId, hhChainId, mocked.mockedTokenName], // allfeat->HH mocked token
];

// describe.only("RelayerBase", function () {
describe("RelayerBase", function () {
  describe("Relayer deployment", function () {
    it("Should store the admin at deployment", async function () {
      const { storage, owner } = await loadFixture(fixtures.deployAllContracts);
      expect(await storage.getOperator("admin")).to.equal(owner.address);
    });

    it("Should revert if NON owner tries to deploy Bridge", async function () {
      const { storage, otherAccount } = await loadFixture(fixtures.deployVault);

      await expect(
        hre.ethers.deployContract("BridgeBase", [storage.target], otherAccount)
      ).to.be.reverted;
    });
  });

  /////////////////////////////////////////////////////////////
  //
  //                   ORIGIN SIDE
  //
  /////////////////////////////////////////////////////////////
  originSideCases.forEach((originSide, caseIndex) => {
    const valueToSend =
      caseIndex === nativeCoinIndex ? mocked.amountToDeposit : 0n;
    const feesToSend = caseIndex === nativeCoinIndex ? fees : 0n;
    describe(`calls origin side - with: ${originSide[2]}`, function () {
      const prepareOperationContextFixture = async function () {
        const {
          storage,
          factory,
          vault,
          bridge,
          relayer,
          mockedToken,
          bridgedToken,
          bridgedTokenAddress,
          owner,
          otherAccount,
        } = await loadFixture(fixtures.deployAllContracts);
        const initialNonce = await bridge.getNewUserNonce(owner.address);
        const originParams = [
          owner.address,
          owner.address,
          ...originSide,
          mocked.amountToDeposit,
          initialNonce,
        ];
        expect(initialNonce).to.equal(0);

        const msgHash = ethers.solidityPackedKeccak256(
          paramsTypes,
          originParams
        );
        const signedMsgHash = await owner.signMessage(ethers.getBytes(msgHash));
        return {
          storage,
          factory,
          vault,
          bridge,
          relayer,
          mockedToken,
          bridgedToken,
          bridgedTokenAddress,
          owner,
          otherAccount,
          initialNonce,
          originParams,
          msgHash,
          signedMsgHash,
        };
      };
      describe("createOperation function", function () {
        it("Should revert if operation status is not NONE", async function () {
          const {
            storage,
            bridge,
            relayer,
            vault,
            bridgedToken,
            mockedToken,
            owner,
            originParams,
            signedMsgHash,
          } = await loadFixture(prepareOperationContextFixture);

          if (caseIndex === 1) {
            await bridgedToken
              .connect(owner)
              .approve(vault.target, mocked.amountToDeposit);
          }
          if (caseIndex === 2) {
            await mockedToken
              .connect(owner)
              .approve(vault.target, mocked.amountToDeposit);
          }
          await bridge
            .connect(owner)
            .createBridgeOperation(...originParams, signedMsgHash, {
              value: valueToSend,
            });

          // mock bridge role to access relayer function
          await storage.updateOperator("bridge", owner.address);
          await expect(
            relayer
              .connect(owner)
              .createOperation(...originParams, signedMsgHash)
          ).to.be.revertedWithCustomError(
            relayer,
            "RelayerBase__OperationAlreadyExists"
          );
        });
        it("Should revert if NON bridge tries to call", async function () {
          const { relayer, owner, originParams, signedMsgHash } =
            await loadFixture(prepareOperationContextFixture);

          await expect(
            relayer
              .connect(owner)
              .createOperation(...originParams, signedMsgHash)
          )
            .to.be.revertedWithCustomError(
              relayer,
              "RelayerBase__CallerHasNotRole"
            )
            .withArgs("bridge");
        });
        it("Should set the new operation params in originOperations mapping", async function () {
          const {
            storage,
            relayer,
            owner,
            initialNonce,
            originParams,
            msgHash,
            signedMsgHash,
          } = await loadFixture(prepareOperationContextFixture);

          // mock bridge role to access relayer function
          await storage.updateOperator("bridge", owner.address);
          const blockNumber = await ethers.provider.getBlockNumber();

          await relayer
            .connect(owner)
            .createOperation(...originParams, signedMsgHash);

          const operation = await relayer.getDetailedOriginOperation(msgHash);
          //   console.log(operation);
          expect(operation[0][0]).to.equal(owner.address);
          expect(operation[0][1]).to.equal(owner.address);
          expect(operation[0][2]).to.equal(BigInt(originSide[0])); //31337
          expect(operation[0][3]).to.equal(BigInt(originSide[1])); //441
          expect(operation[0][4]).to.equal(originSide[2]); //"ethereum"
          expect(operation[0][5]).to.equal(mocked.amountToDeposit);
          expect(operation[0][6].toString()).to.equal(initialNonce.toString());
          expect(operation[0][7].toString()).to.equal(signedMsgHash);
          expect(operation[1]).to.equal(1n); // status step 1
          expect(operation[2][0].toString()).to.equal(
            (blockNumber + 1).toString()
          );
          expect(operation[2][1]).to.equal(0n);
          expect(operation[2][2]).to.equal(0n);
        });
        it("Should add current operation to the list of user operation in progress", async function () {
          const {
            storage,
            relayer,
            owner,
            originParams,
            msgHash,
            signedMsgHash,
          } = await loadFixture(prepareOperationContextFixture);

          // mock bridge role to access relayer function
          await storage.updateOperator("bridge", owner.address);
          const blockNumber = await ethers.provider.getBlockNumber();

          await relayer
            .connect(owner)
            .createOperation(...originParams, signedMsgHash);

          const operationList = await relayer.getUserOperations(owner);
          //   console.log(operationList);
          expect(operationList.length).to.equal(1);
          expect(operationList[0]).to.equal(msgHash);
        });
      });
      describe("receiveFeesLockConfirmation function", function () {
        it("Should revert if NON bridge tries to call", async function () {
          const {
            relayer,
            otherAccount,
            originParams,
            msgHash,
            signedMsgHash,
          } = await loadFixture(prepareOperationContextFixture);

          const blockNumber = await ethers.provider.getBlockNumber();
          await expect(
            relayer
              .connect(otherAccount)
              .receiveFeesLockConfirmation(
                msgHash,
                [...originParams, signedMsgHash],
                blockNumber
              )
          )
            .to.be.revertedWithCustomError(
              relayer,
              "RelayerBase__CallerHasNotRole"
            )
            .withArgs("oracle");
        });
        it("Should revert if operation status is not ORG_OP_CREATED (1)", async function () {
          const { relayer, owner, originParams, msgHash, signedMsgHash } =
            await loadFixture(prepareOperationContextFixture);

          const blockNumber = await ethers.provider.getBlockNumber();
          await expect(
            relayer
              .connect(owner)
              .receiveFeesLockConfirmation(
                msgHash,
                [...originParams, signedMsgHash],
                blockNumber
              )
          ).to.be.revertedWithCustomError(
            relayer,
            "RelayerBase__InvalidOperationStatus"
          );
        });
        it("Should set operation status to ORG_FEES_LOCKED (4)", async function () {
          const {
            storage,
            relayer,
            owner,
            originParams,
            msgHash,
            signedMsgHash,
          } = await loadFixture(prepareOperationContextFixture);

          const blockNumber = await ethers.provider.getBlockNumber();
          // mock bridge role to access relayer function
          await storage.updateOperator("bridge", owner.address);
          let tx = await relayer
            .connect(owner)
            .createOperation(...originParams, signedMsgHash);
          tx.wait();
          expect(await ethers.provider.getBlockNumber()).to.equal(
            blockNumber + 2
          );
          tx = await relayer
            .connect(owner)
            .receiveFeesLockConfirmation(
              msgHash,
              [...originParams, signedMsgHash],
              blockNumber + 2
            );
          tx.wait();

          const status = await relayer.getOriginOperationStatus(msgHash);
          expect(status).to.equal(4n);
        });

        it("Should emit FeesLockedConfirmed event", async function () {
          const {
            storage,
            relayer,
            owner,
            originParams,
            msgHash,
            signedMsgHash,
          } = await loadFixture(prepareOperationContextFixture);

          const blockNumber = await ethers.provider.getBlockNumber();
          // mock bridge role to access relayer function
          await storage.updateOperator("bridge", owner.address);
          let tx = await relayer
            .connect(owner)
            .createOperation(...originParams, signedMsgHash);
          tx.wait();
          expect(await ethers.provider.getBlockNumber()).to.equal(
            blockNumber + 2
          );
          await expect(
            relayer
              .connect(owner)
              .receiveFeesLockConfirmation(
                msgHash,
                [...originParams, signedMsgHash],
                blockNumber + 2
              )
          )
            .to.emit(relayer, "FeesLockedConfirmed")
            .withArgs(
              msgHash,
              [...originParams, signedMsgHash],
              blockNumber + 3
            );
        });
      });

      describe("confirmFeesLockedAndDepositConfirmed", function () {
        const prepareConfirmFeesLockedAndDepositConfirmFixture =
          async function () {
            const {
              storage,
              factory,
              vault,
              bridge,
              relayer,
              mockedToken,
              bridgedToken,
              bridgedTokenAddress,
              owner,
              otherAccount,
              initialNonce,
              originParams,
              msgHash,
              signedMsgHash,
            } = await loadFixture(prepareOperationContextFixture);
            const blockNumber = await ethers.provider.getBlockNumber();
            // mock bridge role to access relayer function
            await storage.updateOperator("bridge", owner.address);
            let tx = await relayer
              .connect(owner)
              .createOperation(...originParams, signedMsgHash);
            tx.wait();
            expect(await ethers.provider.getBlockNumber()).to.equal(
              blockNumber + 2
            );
            tx = await relayer
              .connect(owner)
              .receiveFeesLockConfirmation(
                msgHash,
                [...originParams, signedMsgHash],
                blockNumber + 2
              );
            tx.wait();

            // const status = await relayer.getOriginOperationStatus(msgHash);
            // expect(status).to.equal(4n);
            return {
              storage,
              factory,
              vault,
              bridge,
              relayer,
              mockedToken,
              bridgedToken,
              bridgedTokenAddress,
              owner,
              otherAccount,
              initialNonce,
              originParams,
              msgHash,
              signedMsgHash,
            };
          };

        it("Should revert if status is not ORG_FEES_LOCKED", async function () {
          const { relayer, owner, originParams, msgHash, signedMsgHash } =
            await loadFixture(prepareOperationContextFixture);

          const blockNumber = await ethers.provider.getBlockNumber();
          await expect(
            relayer
              .connect(owner)
              .confirmFeesLockedAndDepositConfirmed(
                msgHash,
                [...originParams, signedMsgHash],
                blockNumber
              )
          ).to.be.revertedWithCustomError(
            relayer,
            "RelayerBase__InvalidOperationStatus"
          );
        });
        it("Should revert if block number inferior to validation", async function () {
          const {
            storage,
            relayer,
            owner,
            originParams,
            msgHash,
            signedMsgHash,
          } = await loadFixture(
            prepareConfirmFeesLockedAndDepositConfirmFixture
          );

          // mock creation block number // FIND BETTER WAY !!
          const key = await storage["getKey(string, uint256)"](
            "blockToWait",
            originSide[0] //31337
          );
          let tx = await storage.setUint(key, 50);
          tx.wait();

          const blockNumber = await ethers.provider.getBlockNumber();
          await expect(
            relayer
              .connect(owner)
              .confirmFeesLockedAndDepositConfirmed(
                msgHash,
                [...originParams, signedMsgHash],
                blockNumber
              )
          ).to.be.revertedWithCustomError(
            relayer,
            "RelayerBase__BlockConfirmationNotReached"
          );
        });
        it("Should set status to ORG_OP_READY (5)", async function () {
          const {
            storage,
            relayer,
            owner,
            originParams,
            msgHash,
            signedMsgHash,
          } = await loadFixture(
            prepareConfirmFeesLockedAndDepositConfirmFixture
          );

          const blockNumber = await ethers.provider.getBlockNumber();
          let tx = await relayer
            .connect(owner)
            .confirmFeesLockedAndDepositConfirmed(
              msgHash,
              [...originParams, signedMsgHash],
              blockNumber
            );
          tx.wait();

          const status = await relayer.getOriginOperationStatus(msgHash);
          expect(status).to.equal(5n);
        });
        it("Should emit FeesLockAndDepositConfirmed event", async function () {
          const { relayer, owner, originParams, msgHash, signedMsgHash } =
            await loadFixture(prepareConfirmFeesLockedAndDepositConfirmFixture);

          const blockNumber = await ethers.provider.getBlockNumber();
          const creationBlock = (
            await relayer.getDetailedOriginOperation(msgHash)
          )[2][0];
          await expect(
            relayer
              .connect(owner)
              .confirmFeesLockedAndDepositConfirmed(
                msgHash,
                [...originParams, signedMsgHash],
                blockNumber
              )
          )
            .to.emit(relayer, "FeesLockedAndDepositConfirmed")
            .withArgs(msgHash, [...originParams, signedMsgHash], creationBlock);
        });
      });

      describe("receivedFinalizedOperation", function () {
        const prepareReceivedFinalizedOperationFixture = async function () {
          const {
            storage,
            factory,
            vault,
            bridge,
            relayer,
            mockedToken,
            bridgedToken,
            bridgedTokenAddress,
            owner,
            otherAccount,
            initialNonce,
            originParams,
            msgHash,
            signedMsgHash,
          } = await loadFixture(prepareOperationContextFixture);
          // const fees = ethers.parseEther("0.01");
          const blockNumber = await ethers.provider.getBlockNumber();
          // // const realBridge = await storage.getOperator("bridge");

          // In order to have userDeposit pending
          // we call the regular first function on the bridge: createBridgeOperation
          // it will call createOperation on the relayer and init the process
          if (caseIndex === 1) {
            // approve vault for amountToDeposit bridgedToken
            await bridgedToken
              .connect(owner)
              .approve(vault.target, mocked.amountToDeposit);
          }
          if (caseIndex === 2) {
            // approve vault for amountToDeposit mockedToken
            await mockedToken
              .connect(owner)
              .approve(vault.target, mocked.amountToDeposit);
          }

          let tx = await bridge
            .connect(owner)
            .createBridgeOperation(...originParams, signedMsgHash, {
              value: valueToSend + feesToSend,
            });
          tx.wait();

          //
          // // restore bridge to allows and test interaction relayer-bridge
          // // await storage.updateOperator("bridge", realBridge);
          // // mock another deposit to have funds in vault
          //

          tx = await relayer
            .connect(owner)
            .receiveFeesLockConfirmation(
              msgHash,
              [...originParams, signedMsgHash],
              blockNumber + 2
            );
          tx.wait();
          tx = await relayer
            .connect(owner)
            .confirmFeesLockedAndDepositConfirmed(
              msgHash,
              [...originParams, signedMsgHash],
              blockNumber + 3
            );
          tx.wait();

          return {
            storage,
            factory,
            vault,
            bridge,
            relayer,
            mockedToken,
            bridgedToken,
            bridgedTokenAddress,
            owner,
            otherAccount,
            initialNonce,
            originParams,
            msgHash,
            signedMsgHash,
          };
        };

        it("Should revert if status is not ORG_FEES_LOCKED", async function () {
          const { relayer, owner, originParams, msgHash, signedMsgHash } =
            await loadFixture(prepareOperationContextFixture);

          const blockNumber = await ethers.provider.getBlockNumber();
          await expect(
            relayer
              .connect(owner)
              .receivedFinalizedOperation(
                msgHash,
                [...originParams, signedMsgHash],
                blockNumber
              )
          ).to.be.revertedWithCustomError(
            relayer,
            "RelayerBase__InvalidOperationStatus"
          );
        });

        it("Should set status to ORG_OP_CLOSED (8)", async function () {
          const { relayer, owner, originParams, msgHash, signedMsgHash } =
            await loadFixture(prepareReceivedFinalizedOperationFixture);

          const blockNumber = await ethers.provider.getBlockNumber();
          let tx = await relayer
            .connect(owner)
            .receivedFinalizedOperation(
              msgHash,
              [...originParams, signedMsgHash],
              blockNumber
            );
          tx.wait();

          const status = await relayer.getOriginOperationStatus(msgHash);
          expect(status).to.equal(8n);
        });
        it("Should emit OperationClosed event", async function () {
          const { relayer, owner, originParams, msgHash, signedMsgHash } =
            await loadFixture(prepareReceivedFinalizedOperationFixture);

          const blockNumber = await ethers.provider.getBlockNumber();

          await expect(
            relayer
              .connect(owner)
              .receivedFinalizedOperation(
                msgHash,
                [...originParams, signedMsgHash],
                blockNumber
              )
          )
            .to.emit(relayer, "OperationClosed")
            .withArgs(msgHash, blockNumber + 1);
        });
      });
    });
  });
  /////////////////////////////////////////////////////////////
  //
  //                   DESTINATION SIDE
  //
  /////////////////////////////////////////////////////////////
  destinationSideCases.forEach((destinationSide, caseIndex) => {
    const valueToSend =
      caseIndex === nativeCoinIndex ? mocked.amountToDeposit : 0n;
    const feesToSend = caseIndex === nativeCoinIndex ? fees : 0n;
    describe(`calls destination side - with: ${destinationSide[2]}`, function () {
      const prepareOperationContextFixture = async function () {
        const {
          storage,
          factory,
          vault,
          bridge,
          relayer,
          mockedToken,
          bridgedToken,
          bridgedTokenAddress,
          owner,
          otherAccount,
        } = await loadFixture(fixtures.deployAllContracts);
        const initialNonce = await bridge.getNewUserNonce(owner.address);
        const originParams = [
          owner.address,
          owner.address,
          ...destinationSide,
          mocked.amountToDeposit,
          initialNonce,
        ];
        expect(initialNonce).to.equal(0);

        const msgHash = ethers.solidityPackedKeccak256(
          paramsTypes,
          originParams
        );
        const signedMsgHash = await owner.signMessage(ethers.getBytes(msgHash));
        return {
          storage,
          factory,
          vault,
          bridge,
          relayer,
          mockedToken,
          bridgedToken,
          bridgedTokenAddress,
          owner,
          otherAccount,
          initialNonce,
          originParams,
          msgHash,
          signedMsgHash,
        };
      };
      const destinationParams = [
        getZeroAddress(), // later filled with: owner.address,
        getZeroAddress(), // later filled with: owner.address,
        destinationSide[0], // chainIdFrom
        destinationSide[1], // chainIdTo
        "", // later filled with: ethereum
        0n, // later filled with: amount
        0n, // later filled with: initialNonce
        "0x", // later filled with: signedMsgHash,
      ];

      describe("lockDestinationFees function", function () {
        it("Should revert if operation status is not NONE", async function () {
          const { storage, relayer, owner, originParams, msgHash } =
            await loadFixture(prepareOperationContextFixture);

          // mock bridge role to access relayer function
          await storage.updateOperator("bridge", owner.address);
          await relayer
            .connect(owner)
            .lockDestinationFees(msgHash, originParams[2], originParams[3], {
              value: fees,
            });

          await expect(
            relayer
              .connect(owner)
              .lockDestinationFees(msgHash, originParams[2], originParams[3], {
                value: fees,
              })
          ).to.be.revertedWithCustomError(
            relayer,
            "RelayerBase__OperationAlreadyExists"
          );
        });
        it("Should set destination params", async function () {
          const { storage, relayer, owner, originParams, msgHash } =
            await loadFixture(prepareOperationContextFixture);
          const blockNumber = await ethers.provider.getBlockNumber();

          // mock bridge role to access relayer function
          await storage.updateOperator("bridge", owner.address);

          let tx = await relayer
            .connect(owner)
            .lockDestinationFees(msgHash, originParams[2], originParams[3], {
              value: fees,
            });
          tx.wait();

          const operation = await relayer.getDetailedDestinationOperation(
            msgHash
          );
          //   console.log(operation);
          expect(operation[0][0]).to.equal(getZeroAddress());
          expect(operation[0][1]).to.equal(getZeroAddress());
          expect(operation[0][2]).to.equal(BigInt(destinationSide[0])); //31337
          expect(operation[0][3]).to.equal(BigInt(destinationSide[1])); //441
          expect(operation[0][4]).to.equal(""); //"ethereum"
          expect(operation[0][5]).to.equal(0n);
          expect(operation[0][6].toString()).to.equal(0n);
          expect(operation[0][7].toString()).to.equal("0x");
          expect(operation[1]).to.equal(2n); // status step 2
          expect(operation[2][0].toString()).to.equal(
            (blockNumber + 2).toString()
          );
          expect(operation[2][1]).to.equal(0n);
          expect(operation[2][2]).to.equal(0n);
        });
        it("Should emit FeesDeposited event", async function () {
          const { storage, relayer, owner, originParams, msgHash } =
            await loadFixture(prepareOperationContextFixture);
          const blockNumber = await ethers.provider.getBlockNumber();

          // mock bridge role to access relayer function
          await storage.updateOperator("bridge", owner.address);

          await expect(
            relayer
              .connect(owner)
              .lockDestinationFees(msgHash, originParams[2], originParams[3], {
                value: fees,
              })
          )
            .to.emit(relayer, "FeesDeposited")
            .withArgs(msgHash, destinationParams, blockNumber + 2);
        });
      });
      describe("sendFeesLockConfirmation function", function () {
        const prepareSendFeesLockConfirmationFixture = async function () {
          const {
            storage,
            factory,
            vault,
            bridge,
            relayer,
            mockedToken,
            bridgedToken,
            bridgedTokenAddress,
            owner,
            otherAccount,
            initialNonce,
            originParams,
            msgHash,
            signedMsgHash,
          } = await loadFixture(prepareOperationContextFixture);

          // mock bridge role to access relayer function
          const realBridge = await storage.getOperator("bridge");
          await storage.updateOperator("bridge", owner.address);
          let tx = await relayer
            .connect(owner)
            .lockDestinationFees(msgHash, originParams[2], originParams[3], {
              value: fees,
            });
          tx.wait();
          // end mock
          await storage.updateOperator("bridge", realBridge);
          return {
            storage,
            factory,
            vault,
            bridge,
            relayer,
            mockedToken,
            bridgedToken,
            bridgedTokenAddress,
            owner,
            otherAccount,
            initialNonce,
            originParams,
            msgHash,
            signedMsgHash,
          };
        };
        it("Should revert if operation status is not DST_FEES_DEPOSITED", async function () {
          const { storage, relayer, owner, originParams, msgHash } =
            await loadFixture(prepareOperationContextFixture);

          const blockNumber = await ethers.provider.getBlockNumber();

          await expect(
            relayer
              .connect(owner)
              .sendFeesLockConfirmation(msgHash, destinationParams, blockNumber)
          ).to.be.revertedWithCustomError(
            relayer,
            "RelayerBase__InvalidOperationStatus"
          );
        });
        it("Should revert if block number is inferior to validation", async function () {
          const { storage, relayer, owner, originParams, msgHash } =
            await loadFixture(prepareSendFeesLockConfirmationFixture);

          // mock deposit fees block number validation // FIND BETTER WAY !!
          const key = await storage["getKey(string, uint256)"](
            "blockToWait",
            destinationSide[0] //31337
          );
          let tx = await storage.setUint(key, 50);
          tx.wait();

          const blockNumber = await ethers.provider.getBlockNumber();

          await expect(
            relayer
              .connect(owner)
              .sendFeesLockConfirmation(msgHash, destinationParams, blockNumber)
          ).to.be.revertedWithCustomError(
            relayer,
            "RelayerBase__BlockConfirmationNotReached"
          );
        });

        it("Should set destination params", async function () {
          const { storage, relayer, owner, originParams, msgHash } =
            await loadFixture(prepareSendFeesLockConfirmationFixture);

          const blockNumber = await ethers.provider.getBlockNumber();
          let tx = await relayer
            .connect(owner)
            .sendFeesLockConfirmation(msgHash, destinationParams, blockNumber);
          tx.wait();

          const operation = await relayer.getDetailedDestinationOperation(
            msgHash
          );

          expect(operation[1]).to.equal(3n); // DST_FEES_DEPOSITED
          expect(operation[2][1]).to.equal(blockNumber + 1); // blockStep.feesConfirmation
        });
      });
      describe("completeOperation function", function () {
        const prepareCompleteOperationFixture = async function () {
          const {
            storage,
            factory,
            vault,
            bridge,
            relayer,
            mockedToken,
            bridgedToken,
            bridgedTokenAddress,
            owner,
            otherAccount,
            initialNonce,
            originParams,
            msgHash,
            signedMsgHash,
          } = await loadFixture(prepareOperationContextFixture);

          // mock bridge role to access relayer function
          const realBridge = await storage.getOperator("bridge");
          await storage.updateOperator("bridge", owner.address);
          let tx = await relayer
            .connect(owner)
            .lockDestinationFees(msgHash, originParams[2], originParams[3], {
              value: fees,
            });
          tx.wait();
          // end mock
          await storage.updateOperator("bridge", realBridge);

          const blockNumber = await ethers.provider.getBlockNumber();
          tx = await relayer
            .connect(owner)
            .sendFeesLockConfirmation(msgHash, destinationParams, blockNumber);
          tx.wait();

          return {
            storage,
            factory,
            vault,
            bridge,
            relayer,
            mockedToken,
            bridgedToken,
            bridgedTokenAddress,
            owner,
            otherAccount,
            initialNonce,
            originParams,
            msgHash,
            signedMsgHash,
          };
        };
        it("Should revert if operation status is not DST_FEES_CONFIRMED", async function () {
          const { relayer, owner, originParams, msgHash, signedMsgHash } =
            await loadFixture(prepareOperationContextFixture);

          const blockNumber = await ethers.provider.getBlockNumber();

          await expect(
            relayer.connect(owner).completeOperation(
              msgHash,
              [...originParams, signedMsgHash],
              blockNumber // unused now)
            )
          ).to.be.revertedWithCustomError(
            relayer,
            "RelayerBase__InvalidOperationStatus"
          );
        });
        it("Should revert if hash do not match params", async function () {
          const { relayer, owner, originParams, signedMsgHash, initialNonce } =
            await loadFixture(prepareCompleteOperationFixture);

          const blockNumber = await ethers.provider.getBlockNumber();

          // fake hash
          const fakeParams = [
            getZeroAddress(),
            getZeroAddress(),
            ...destinationSide,
            mocked.amountToDeposit,
            initialNonce,
          ];
          const fakeHash = ethers.solidityPackedKeccak256(
            paramsTypes,
            fakeParams
          );

          await expect(
            relayer.connect(owner).completeOperation(
              fakeHash,
              [...originParams, signedMsgHash],
              blockNumber // unused now)
            )
          ).to.be.revertedWithCustomError(
            relayer,
            "RelayerBase__InvalidOperationHash"
          );
        });
        it("Should emit OperationFinalized event", async function () {
          const {
            storage,
            bridge,
            relayer,
            vault,
            mockedToken,
            bridgedToken,
            owner,
            originParams,
            msgHash,
            signedMsgHash,
            initialNonce,
          } = await loadFixture(prepareCompleteOperationFixture);

          //////////////////////
          // mock a previous deposit
          const mockOpNonce = await bridge.getNewUserNonce(owner.address);
          const mockOpParams = [
            owner.address,
            owner.address,
            ...originSideCases[caseIndex], //...originSide,

            mocked.amountToDeposit * 2n,
            mockOpNonce,
          ];
          const mockOpHash = ethers.solidityPackedKeccak256(
            paramsTypes,
            mockOpParams
          );
          const signedMockOpgHash = await owner.signMessage(
            ethers.getBytes(mockOpHash)
          );
          const token = await storage.getTokenAddressByChainId(
            originSideCases[caseIndex][2],
            originSideCases[caseIndex][0]
          );

          if (caseIndex === 1) {
            await bridgedToken
              .connect(owner)
              .approve(vault.target, mocked.amountToDeposit * 2n);
          }
          if (caseIndex === 2) {
            await mockedToken
              .connect(owner)
              .approve(vault.target, mocked.amountToDeposit * 2n);
          }
          let tx = await bridge.createBridgeOperation(
            ...mockOpParams,
            signedMockOpgHash,
            { value: valueToSend * 2n + feesToSend }
          );
          tx.wait();
          tx = await bridge.finalizeBridgeDeposit(
            owner.address,
            token,
            mocked.amountToDeposit * 2n
          );

          // //////////////////////
          const blockNumber = await ethers.provider.getBlockNumber();

          await expect(
            relayer.connect(owner).completeOperation(
              msgHash,
              [...originParams, signedMsgHash],
              blockNumber // unused now)
            )
          )
            .to.emit(relayer, "OperationFinalized")
            .withArgs(msgHash, destinationParams, blockNumber + 1);
        });
      });
    });
  });
  /////////////////////////////////////////////////////////////
  //
  //                   CANCEL FUNCTIONS
  //
  /////////////////////////////////////////////////////////////
  // @todo test origin->receiveCancelOperation when implemented
  // @todo test destination->emitCancelOperation when implemented
});
