// // SPDX-License-Identifier: MIT

// pragma solidity ^0.8.20;

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "./BridgeBase.sol";
// import "./Storage.sol";
// import "./Vault.sol";
// import "./Utils.sol";

// @todo REMOVE

// /**
//  * @notice Base contract comunicating with the oracle/server
//  * It's in charge to emit the bridge event to the oracle/server and maanage tx status
//  * @dev register is called to register a new bridge tx
//  * @dev confirm is called to confirm a tx when called by the oracle/server (to forward fees event)
//  * @dev when these 2 conditions are met the bridge event is emitted
//  */
// contract RelayerBase is Utils {
//     /* errors */
//     enum FeesType {
//         PROTOCOL,
//         OPERATION
//     }
//     /* types declarations */

//     // ADJUST/COMPLETE/REDUCE according to the final version
//     enum OrderStatus {
//         NONE,
//         CREATED, // user deposited
//         FEESLOCKED, // fees locked
//         FEESLOCKEDANDCONFIRMED, // fees locked and confirmed (same as processsing!)
//         PROCESSING, // relayer send the event // taken
//         RECEIVED, // other chain relayer received the event (same as finalized!)
//         FINALIZED, // origin chain relayer received the event all funds are transfered
//         CLOSED, // block confirmation is passed (origin plus destination chain)
//         CANCELED // at every step an operator can cancel the operation (failure..)

//     }
//     enum DestinationStatus {}

//     // @todo refactor params
//     struct OrderParams {
//         address from;
//         address to;
//         uint256 chainIdFrom;
//         uint256 chainIdTo;
//         address tokenFrom;
//         address tokenTo;
//         uint256 amount;
//         // uint256 fee;
//         uint256 nonce;
//         bytes signature;
//     }

//     struct Confirmation {
//         uint256 operationHash;
//         address from;
//         address to;
//         uint256 chainId;
//         address token;
//         uint256 amount;
//         // uint256 fee;
//         uint256 nonce;
//         bytes signature;
//     }

//     //RENAME

//     struct BlockStep {
//         uint256 initBlock;
//         uint256 confirmationBlock;
//         uint256 processingBlock;
//         uint256 receivedBlock;
//         uint256 finalizedBlock;
//         uint256 closedBlock;
//     }

//     struct OriginOperation {
//         OrderParams params;
//         OrderStatus status;
//         BlockStep blockStep;
//     }

//     struct DestinationOperation {
//         OrderParams params;
//         OrderStatus status;
//         BlockStep blockStep;
//     }
//     /* state variables */
//     //op as origin

//     mapping(bytes32 operationHash => OriginOperation) public s_originOperations;
//     // op as destination
//     mapping(bytes32 operationHash => DestinationOperation) public s_destinationOperations;
//     OriginOperation[] public s_originOperationsList;
//     DestinationOperation[] public s_destinationOperationsList;

//     address public s_storage;

//     /* events */

//     event BridgeEvent(
//         address indexed from, address indexed to, uint256 chainId, address token, uint256 amount, uint256 nonce
//     );

//     // event StatusChanged(uint256 operationHash, OrderStatus oldStatus, OrderStatus newStatus);
//     event OperationCreated(bytes32 operationHash, OrderParams params, uint256 blockNumber);
//     event OperationConfirmed(bytes32 operationHash, OrderStatus status, uint256 blockNumber);
//     event OperationTriggered(bytes32 operationHash, OrderParams params, uint256 initBlock, uint256 blockNumber);
//     event OperationReceived(bytes32 operationHash, OrderParams params, uint256 blockNumber);
//     event OperationFinalized(bytes32 operationHash, OrderParams params, uint256 blockNumber);
//     /* modifiers */

//     modifier onlyBridge() {
//         if (!Storage(s_storage).isBridge(msg.sender)) {
//             revert("only bridge");
//         }
//         _;
//     }

//     modifier onlyOracle() {
//         if (!Storage(s_storage).isOracle(msg.sender)) {
//             revert("only oracle");
//         }
//         _;
//     }

//     /* constructor */
//     constructor(address storageAddress) {
//         // first deployed is storage so admin of storage should be the admin of the factory and msg.sender
//         // store the storage address
//         // check is isAdmin(msg.sender) in the storage
//         s_storage = storageAddress;
//         if (!Storage(s_storage).isAdmin(msg.sender)) {
//             revert("TokenFactory: caller is not the admin");
//         }
//     }

//     // hash functions
//     function computeOperationHash(
//         address from,
//         address to,
//         uint256 chainIdFrom,
//         uint256 chainIdTo,
//         address tokenFrom,
//         address tokenTo,
//         uint256 amount,
//         // uint256 fee;
//         uint256 nonce
//     ) public pure returns (bytes32) {
//         return keccak256(abi.encodePacked(from, to, chainIdFrom, chainIdTo, tokenFrom, tokenTo, amount, nonce));
//     }

//     /* receive / fallback */

//     /* external functions */
//     /**
//      * @notice register a new tx to be bridged
//      */

//     //********************************************************************** */
//     //
//     //     Function: register a new bridge operation (origin chain)
//     //
//     //**********************************************************************

//     // event ReadyToBridge(
//     //     address from,
//     //     address to,
//     //     uint256 chainIdFrom,
//     //     uint256 chainIdTo,
//     //     address tokenFrom,
//     //     address tokenTo,
//     //     uint256 amount,
//     //     uint256 nonce,
//     //     bytes signature
//     // );
//     // the bridge contract will call this function // or prepareCrossMsg

//     function createOperation(
//         address from,
//         address to,
//         uint256 chainIdFrom,
//         uint256 chainIdTo,
//         address tokenFrom,
//         address tokenTo,
//         uint256 amount,
//         uint256 nonce,
//         bytes calldata signature
//     ) external onlyBridge {
//         // uint256 operationHash = 123; //_hashOperation();

//         //create hash from params
//         bytes32 operationHash =
//             computeOperationHash(from, to, chainIdFrom, chainIdTo, tokenFrom, tokenTo, amount, nonce);
//         // uint256(keccak256(abi.encodePacked(from, to, tokenFrom, tokenTo, amount, chainId, nonce)));
//         require(s_originOperations[operationHash].status == OrderStatus.NONE, "RelayerBase: operation already exists");

//         OrderParams memory params;
//         params.from = from;
//         params.to = to;
//         params.chainIdFrom = chainIdFrom;
//         params.chainIdTo = chainIdTo;
//         params.tokenFrom = tokenFrom;
//         params.tokenTo = tokenTo;
//         params.amount = amount;
//         params.nonce = nonce;
//         params.signature = signature;

//         OriginOperation memory operation;
//         operation.params = params;
//         operation.status = OrderStatus.INITIALIZED;
//         operation.blockStep.initBlock = block.number;

//         s_originOperations[operationHash] = operation;

//         // rename to NewBridgeOperation
//         // emit ReadyToBridge(from, to, chainIdFrom, chainIdTo, tokenFrom, tokenTo, amount, nonce, signature);

//         // emit OperationCreated(from, to, chainIdFrom, chainIdTo, tokenFrom, tokenTo, amount, nonce, signature);
//         emit OperationCreated(operationHash, params, block.number);
//     }

//     // the server call this function forwarding the fees event confirFeesLocked
//     function confirmOperation(
//         bytes32 operationHash,
//         OrderStatus status,
//         address userFrom,
//         uint256 nonce,
//         address operator,
//         bytes calldata signature
//     ) external onlyOracle {
//         // check signature
//         OriginOperation storage operation = s_originOperations[operationHash];
//         require(operation.status == OrderStatus.INITIALIZED, "RelayerBase: invalid status");
//         require(status == OrderStatus.CONFIRMED || status == OrderStatus.CANCELED, "RelayerBase: invalid status");

//         bytes32 message = prefixed(keccak256(abi.encodePacked(operationHash, status, userFrom, nonce)));
//         require(recoverSigner(message, signature) == operator, "RelayerBase: invalid signature");
//         require(nonce == operation.params.nonce, "RelayerBase: invalid nonce");

//         operation.status = status;
//         // CONFUSION confirmation : block ? deposit ? fees // not clear it's the fees=> operation=> RENAME
//         operation.blockStep.confirmationBlock = block.number;

//         // emit OperationConfirmed(from, to, chainIdFrom, chainIdTo, tokenFrom, tokenTo, amount, nonce, signature);
//         emit OperationConfirmed(operationHash, status, block.number);

//         // HERE readyToBridge is emitted !!! cause we have 2 conditions met
//     }

//     function triggerOperation(bytes32 operationHash) external {
//         bytes32 key = Storage(s_storage).getKey("blockToWait", block.chainid);
//         uint256 blockToWait = Storage(s_storage).getUint(key);
//         OriginOperation storage operation = s_originOperations[operationHash];

//         require(block.number >= operation.blockStep.initBlock + blockToWait, "RelayerBase: block not reached");
//         require(operation.status == OrderStatus.CONFIRMED, "RelayerBase: invalid status");

//         operation.status = OrderStatus.PROCESSING;
//         operation.blockStep.processingBlock = block.number;

//         // Server has to call a getter to get params or we emit the event here :
//         // So this event the one that the oracle will listen to
//         emit OperationTriggered(operationHash, operation.params, operation.blockStep.initBlock, block.number);
//     }

//     // MAKE CONSTANT FOR VARIABLE NAME AND TAG !!!
//     // ADD MARGIN TO THE FEES in case of volatility !!

//     // to get fees estimation // from a base precompute compute fees with tx.gasprice
//     function simulateOperation() public view returns (uint256) {
//         return Storage(s_storage).getUint(Storage(s_storage).getKey("opFees", block.chainid));
//     }

//     function computeFees() public view returns (uint256) {
//         uint256 simulatedOpFees = simulateOperation();
//         // uint256 protocolPercentFees = Storage(s_storage).getUint(Storage(s_storage).getKey("protocolPercentFees", block.chainid));
//         // uint256 protocolFees =
//         // @todo calcul of protFees // server incentive at destination chain
//         return simulatedOpFees;
//     }
//     //********************************************************************** */
//     //
//     //     Function: fees management and liquidity check (destination chain)
//     //
//     //**********************************************************************

//     // We should simulate operation to get the needed fees
//     // these op will be server calling

//     //In Later versions THIS WILL create a vote (or at the beginning on origin chain)
//     // operator will act like bot for a vote
//     // triggering status changes
//     // some status trigger operation such as feesLock...
//     // signature checks.. are done in the contract.
//     // final vote are to vote for but against to cancelled a bad tx
//     // threshold reach trigger the fianl execution

//     // USER HAS TO APPROVE THE RELAYER TO SPEND HIS TOKENS
//     // first call to destination creating a new DestinationOperation
//     function lockDestinationFees(
//         bytes32 operationHash,
//         OrderParams calldata operationParams,
//         uint256 initBlock,
//         uint256 confirmationBlock
//     ) external payable onlyOracle {
//         require(
//             confirmationBlock - initBlock
//                 > Storage(s_storage).getUint(Storage(s_storage).getKey("blockToWait", operationParams.chainIdTo)),
//             "RelayerBase: block not reached"
//         );
//         uint256 fees = computeFees();
//         require(msg.value == fees, "RelayerBase: invalid fees");

//         // check params validity and signature
//         bytes32 message = prefixed(
//             keccak256(
//                 abi.encodePacked(
//                     operationParams.from,
//                     operationParams.to,
//                     operationParams.chainIdFrom,
//                     operationParams.chainIdTo,
//                     operationParams.tokenFrom,
//                     operationParams.tokenTo,
//                     operationParams.amount,
//                     operationParams.nonce
//                 )
//             )
//         );
//         require(
//             recoverSigner(message, operationParams.signature) == operationParams.from, "RelayerBase: invalid signature"
//         );

//         _createDestinationOperation(operationHash, operationParams, initBlock, confirmationBlock);
//         Vault vault = Vault(Storage(s_storage).getOperator("vault"));
//         vault.depositFees{value: msg.value}(operationParams.tokenFrom, fees, uint8(FeesType.OPERATION));
//         // @todo

//         // we should check liquidity asked if native token is the output token and :
//         // - revert => status on origin don't changed, passed a time the user can reedem
//         // - or emit a event, status on origin chain change to CANCELED

//         // user approve this relayer to smpend is native token

//         // we transfer the fees eq amount to the serverWallet

//         // we craft a confirmation message (operation ready ?) and emit an event to the oracle

//         // => on the origine chain the opHash status pass to PROCESSING on receipt of the event
//         // SO EMIT THE EVENT
//     }

//     function finalizeOperation(bytes32 operationHash) external onlyOracle {
//         // check block (signature checked at creation)
//         // check status not CANCELED

//         DestinationOperation storage operation = s_destinationOperations[operationHash];
//         require(operation.status == OrderStatus.RECEIVED, "RelayerBase: invalid status");

//         operation.status = OrderStatus.FINALIZED;
//         operation.blockStep.finalizedBlock = block.number;

//         BridgeBase bridge = BridgeBase(Storage(s_storage).getOperator("bridge"));
//         bridge.finalize(
//             operation.params.from,
//             operation.params.to,
//             operation.params.chainIdFrom,
//             operation.params.chainIdTo,
//             operation.params.tokenFrom,
//             operation.params.tokenTo,
//             operation.params.amount,
//             operation.params.nonce,
//             operation.params.signature
//         );

//         // emit OperationFinalized(operationHash, operation.params, block.number);
//         emit OperationFinalized(operationHash, operation.params, block.number);
//     }

//     function _createDestinationOperation(
//         bytes32 operationHash,
//         OrderParams calldata operationParams,
//         uint256 initBlock,
//         uint256 confirmationBlock
//     ) internal {
//         require(
//             s_destinationOperations[operationHash].status == OrderStatus.NONE, "RelayerBase: operation already exists"
//         );
//         DestinationOperation memory operation;
//         operation.params = operationParams;
//         operation.status = OrderStatus.INITIALIZED;
//         operation.blockStep.initBlock = block.number;

//         s_destinationOperations[operationHash] = operation;
//         s_destinationOperationsList.push(operation);

//         // oracle listen to this then run a counter to trigger the feesLock confirmation
//         // CHANGE THE STATUS

//         emit OperationReceived(operationHash, operationParams, block.number);
//     }

//     /* public functions */

//     /* internal functions */

//     /* pure functions */

//     /* view functions */
// }
