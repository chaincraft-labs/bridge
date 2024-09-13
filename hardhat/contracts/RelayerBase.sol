// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BridgeBase.sol";
import "./Storage.sol";
import "./Vault.sol";
import "./Utils.sol";
import "hardhat/console.sol";

//TODO
//block step struct :RENAME + opti in one state + converter
// bytes4 => uint64 (4 step in one uint256) / need reader...
// or uint64 don't use pcking function let evm do the job

// operator param => to specify h many fee to qich one...

// Not store chainIdFrom in struct OperationParams=> we're on it... At initialization => Store immutable variable

// hash op    /* state variables */
//..??
// No way to prove no collision between origin and destination with many chain...(it's only probability)
// only sure things are the chainId and the nonce
// So later modify for a mapping of chainId => nonce => Operation (with hash in it) or hashOperation & ref to nonce
// chainId => nonce allows to have iterable list of operation. With index begin - end (actual)
// possibility to prune the list after a certain time and update the index

// load on ipfs ?

// Naming

// getter user op in progress (front/onchain fetch to continue/display)

// DESTINATION

// We should simulate operation to get the needed fees
// these op will be server calling

//In Later versions THIS WILL create a vote (or at the beginning on origin chain)
// operator will act like bot for a vote
// triggering status changes
// some status trigger operation such as feesLock...
// signature checks.. are done in the contract.
// threshold reach trigger the final execution

// USER HAS TO APPROVE THE RELAYER TO SPEND HIS TOKENS
// first call to destination creating a new DestinationOperation

// We don't check signature here cause we perhaps won't keep this function in the final version making
// all the fees management in the first tx of origin chain

// rename event IMPACT Arnaud   prefix

error RelayerBase__CallerHasNotRole(string role);
error RelayerBase__OperationAlreadyExists();
error RelayerBase__InvalidOperationStatus();
error RelayerBase__BlockConfirmationNotReached();
error RelayerBase__UserOperationsEmpty();
error RelayerBase__InvalidOperationHash();

/**
 * @notice Base contract comunicating with the oracle/server
 * It's in charge to emit the bridge event to the oracle/server and maanage tx status
 * @dev register is called to register a new bridge tx
 * @dev confirm is called to confirm a tx when called by the oracle/server (to forward fees event)
 * @dev when these 2 conditions are met the bridge event is emitted
 */
contract RelayerBase is Utils {
    //****************************************************************** */
    //
    //              STRUCT/ENUM DECLARATIONS
    //
    //****************************************************************** */
    // not used yet
    enum FeesType {
        PROTOCOL,
        OPERATION
    }

    // Process steps on each side
    // ORG: origin, DST: destination, OP: bridge tx, FEES: fees tx
    enum OperationStatus {
        NONE, //.................Step 0
        ORG_OP_CREATED, //.......Step 1 user deposited asking for bridge
        DST_FEES_DEPOSITED, //...Step 2 user deposited fees on dst chain
        DST_FEES_CONFIRMED, //...Step 3 fees deposit tx confirmed (finalized)
        ORG_FEES_LOCKED, //......Step 4 org received the fees event from dst
        ORG_OP_READY, //.........Step 5 fees locked & confirmed and deposit confirmed (finalized) (=processing)
        DST_OP_RECEIVED, //......Step 6 dst received operation order with params
        DST_OP_FINALIZED, //.....Step 7 dst tx is finalized
        ORG_OP_CLOSED, //........Step 8 org tx is closed after dst tx is finalized
        ORG_OP_CANCELED //.......Step x org tx is canceled

    }

    // Operation params are set on the origin and used on both side as is
    struct OperationParams {
        address from;
        address to;
        uint256 chainIdFrom;
        uint256 chainIdTo;
        string tokenName;
        uint256 amount;
        uint256 nonce;
        bytes signature;
    }

    // not yet used
    struct OperatorParams {
        address operator;
        uint256 feesAmount;
    }

    struct OriginBlockStep {
        uint64 creationBlock; //.....Step 1 (init)
        uint64 processingBlock; //...Step 5 (main event to destination)
        uint64 closingBlock; //......Step 8 (received finalization status from destination)
    }

    struct DestinationBlockStep {
        uint64 feesDeposit; //........Step 2 (fees deposit)
        uint64 feesConfirmation; //...Step 3 (destination setup ready)
        uint64 receptionBlock; //.....Step 6 (processing on destination)
        uint64 finalisationBlock; //..Step 7 (done on destination)
    }

    struct OriginOperation {
        OperationParams params;
        OperationStatus status;
        OriginBlockStep blockStep;
    }

    struct DestinationOperation {
        OperationParams params;
        OperationStatus status;
        DestinationBlockStep blockStep;
        OperatorParams operator;
    }

    //****************************************************************** */
    //
    //              STATE VARIABLES
    //
    //****************************************************************** */
    address public s_storage;
    // op states on origin
    mapping(bytes32 operationHash => OriginOperation) public s_originOperations;
    // op states on destination
    mapping(bytes32 operationHash => DestinationOperation) public s_destinationOperations;
    // user op in progress
    mapping(address user => bytes32[] operations) public s_currentUserOperations;

    // to change :
    // temporary list of operations / not good to have a list of struct for op as the array can be too big quickly
    bytes32[] public s_originOperationsList;
    bytes32[] public s_destinationOperationsList;

    //****************************************************************** */
    //
    //              EVENTS
    //
    //****************************************************************** */

    // 1. origin: intial event
    event OperationCreated(bytes32 operationHash, OperationParams params, uint256 blockStep);
    // 2. destination: fees deposited then confirmed
    event FeesDeposited(bytes32 operationHash, OperationParams params, uint256 blockStep);
    event FeesDepositConfirmed(bytes32 operationHash, OperationParams params, uint256 blockStep);
    // 3. origin: received fees confirmation then deposit and fees OK (==ready to proceed)
    event FeesLockedConfirmed(bytes32 operationHash, OperationParams params, uint256 blockStep);
    event FeesLockedAndDepositConfirmed(bytes32 operationHash, OperationParams params, uint256 blockStep);
    // 4. destination: operation received and processed
    event OperationFinalized(bytes32 operationHash, OperationParams params, uint256 blockNumber);
    // 5. origin: operation closed after receiving operation confirmation on destination
    event OperationClosed(bytes32 operationHash, uint256 blockNumber);
    // Cancel events (@todo to complete)
    event OperationCanceled(bytes32 operationHash, uint256 chainId, uint256 blockNumber);
    event SentOperationCanceled(bytes32 operationHash, uint256 chainId, uint256 blockNumber);
    event ReceveidOperationCanceled(bytes32 operationHash, uint256 chainId, uint256 blockNumber);

    //****************************************************************** */
    //
    //              MODIFIERS
    //
    //****************************************************************** */
    modifier onlyRole(string memory role) {
        if (!Storage(s_storage).isRole(role, msg.sender)) {
            revert RelayerBase__CallerHasNotRole(role);
        }
        _;
    }

    //****************************************************************** */
    //
    //              CONSTRUCTOR / INITIALIZATION
    //
    //****************************************************************** */

    constructor(address storageAddress) {
        s_storage = storageAddress;

        if (!Storage(s_storage).isRole("admin", msg.sender)) {
            revert RelayerBase__CallerHasNotRole("admin");
        }
    }

    /* receive / fallback */

    //********************************************************************** */
    //
    //             ORIGIN SIDE FUNCTIONS
    //
    //**********************************************************************
    /**
     * @notice Main function to trigger crosschain op
     * @notice Bridge calls it to emit firs event with the operation hash to init off-chain listening
     *
     * @dev status NONE -> ORG_OP_CREATED
     * @dev emit OperationCreated(operationHash, params, block.number)
     *
     * @param from sender of the tokens
     * @param to recipient
     * @param chainIdFrom origin chain id
     * @param chainIdTo destination chain id
     * @param tokenName name of the token as referenced in Storage (official token name)
     * @param amount token amount
     * @param nonce new user nonce to be used on origin chain
     * @param signature sig of the message containing previous params
     */
    function createOperation(
        address from,
        address to,
        uint256 chainIdFrom,
        uint256 chainIdTo,
        string memory tokenName,
        uint256 amount,
        uint256 nonce,
        bytes calldata signature
    ) external onlyRole("bridge") {
        bytes32 operationHash = getMessageHash(from, to, chainIdFrom, chainIdTo, tokenName, amount, nonce);

        if (s_originOperations[operationHash].status != OperationStatus.NONE) {
            revert RelayerBase__OperationAlreadyExists();
        }

        OperationParams memory params;
        params.from = from;
        params.to = to;
        params.chainIdFrom = chainIdFrom;
        params.chainIdTo = chainIdTo;
        params.tokenName = tokenName;
        params.amount = amount;
        params.nonce = nonce;
        params.signature = signature;

        OriginOperation memory operation;
        operation.params = params;
        operation.status = OperationStatus.ORG_OP_CREATED;
        operation.blockStep.creationBlock = uint64(block.number);

        s_originOperations[operationHash] = operation;
        s_currentUserOperations[from].push(operationHash);

        emit OperationCreated(operationHash, params, block.number);
    }

    /**
     * @notice Server calls this function to specify fees deposit on destination
     *
     * @dev status: ORG_OP_CREATED -> ORG_FEES_LOCKED
     * @dev emit: FeesLockedConfirmed(operationHash, params, block.number)
     *
     * @param operationHash hash id of the operation
     * @param params operation params
     * @param blockStep tx block when last event was emitted on destination
     */
    function receiveFeesLockConfirmation(bytes32 operationHash, OperationParams calldata params, uint256 blockStep)
        external
        onlyRole("oracle")
    {
        uint256 chainIdTo = params.chainIdTo;
        OriginOperation storage operation = s_originOperations[operationHash];

        if (operation.status != OperationStatus.ORG_OP_CREATED) {
            revert RelayerBase__InvalidOperationStatus();
        }

        operation.status = OperationStatus.ORG_FEES_LOCKED;
        emit FeesLockedConfirmed(operationHash, params, block.number);
    }

    /**
     * @notice Server calls this function to specify confirmation of deposit & fees deposit
     * @notice It emit the main event to pass operation params to the destination in order to proceed
     *
     * @dev status: ORG_FEES_LOCKED -> ORG_OP_READY
     * @dev emit: FeesLockedAndDepositConfirmed(operationHash, params, block.number)
     *
     * @param operationHash hash id of the operation
     * @param params operation params
     * @param blockStep tx block when last event was emitted
     */
    function confirmFeesLockedAndDepositConfirmed(
        bytes32 operationHash,
        OperationParams calldata params,
        uint256 blockStep
    ) external {
        bytes32 key = Storage(s_storage).getKey("blockToWait", block.chainid);
        uint256 blockToWait = Storage(s_storage).getUint(key);
        OriginOperation storage operation = s_originOperations[operationHash];

        if (operation.status != OperationStatus.ORG_FEES_LOCKED) {
            revert RelayerBase__InvalidOperationStatus();
        }
        if (block.number < operation.blockStep.creationBlock + blockToWait) {
            revert RelayerBase__BlockConfirmationNotReached();
        }

        operation.status = OperationStatus.ORG_OP_READY;
        operation.blockStep.processingBlock = uint64(block.number);

        emit FeesLockedAndDepositConfirmed(operationHash, operation.params, operation.blockStep.creationBlock);
    }

    /**
     * @notice Server calls this function to specify operation is done on destination
     * @notice It closes the operation on origin chain
     *
     * @dev status: ORG_OP_READY -> ORG_OP_CLOSED
     * @dev emit: OperationClosed(operationHash, params, block.number)
     *
     * @param operationHash hash id of the operation
     * @param params operation params
     * @param blockStep tx block when last event was emitted on destination
     */
    function receivedFinalizedOperation(bytes32 operationHash, OperationParams calldata params, uint256 blockStep)
        external
        onlyRole("oracle")
    {
        OriginOperation storage operation = s_originOperations[operationHash];
        if (operation.status != OperationStatus.ORG_OP_READY) {
            revert RelayerBase__InvalidOperationStatus();
        }

        operation.status = OperationStatus.ORG_OP_CLOSED;
        operation.blockStep.closingBlock = uint64(block.number);

        address tokenFrom =
            Storage(s_storage).getTokenAddressByChainId(operation.params.tokenName, operation.params.chainIdFrom);
        BridgeBase bridge = BridgeBase(Storage(s_storage).getOperator("bridge"));
        bridge.finalizeBridgeDeposit(operation.params.from, tokenFrom, operation.params.amount);

        _removeUserOperation(operation.params.from, operationHash);

        emit OperationClosed(operationHash, block.number);
    }

    /**
     * @notice Server calls this function to cancel operation in case of error to allows user to redeem deposit
     *
     * @dev It calls Bridge to forward cancel to Vault
     * @dev status: ANY -> ORG_OP_CANCELED
     * @dev emit: OperationFinalized(operationHash, params, block.number)
     *
     * @param operationHash hash id of the operation
     * @param chainIdFrom oringin chain Id
     */
    function receiveCancelOperation(bytes32 operationHash, uint256 chainIdFrom) external onlyRole("oracle") {
        OriginOperation storage operation = s_originOperations[operationHash];

        if (operation.status == OperationStatus.ORG_OP_CLOSED || operation.status == OperationStatus.NONE) {
            revert RelayerBase__InvalidOperationStatus();
        }

        operation.status = OperationStatus.ORG_OP_CANCELED;
        operation.blockStep.closingBlock = uint64(block.number);
        address tokenFrom =
            Storage(s_storage).getTokenAddressByChainId(operation.params.tokenName, operation.params.chainIdFrom);

        BridgeBase bridge = BridgeBase(Storage(s_storage).getOperator("bridge"));
        bridge.cancelBridgeDeposit(operation.params.from, tokenFrom, operation.params.amount);

        _removeUserOperation(operation.params.from, operationHash);

        emit ReceveidOperationCanceled(operationHash, chainIdFrom, block.number);
    }

    //********************************************************************** */
    //
    //      DESTINATION SIDE FUNCTIONS
    //
    //**********************************************************************

    /**
     * @notice Bridge calls this function to specify deposit of fees on destination
     * @notice It init off-chain listening on destination
     *
     * @dev status: NONE -> DST_FEES_DEPOSITED
     * @dev emit: FeesDeposited(operationHash, params, block.number)
     *
     * @param operationHash hash id of the operation
     * @param chainIdFrom origin chain Id
     * @param chainIdTo destination chain Id
     */
    function lockDestinationFees(bytes32 operationHash, uint256 chainIdFrom, uint256 chainIdTo)
        external
        payable
        onlyRole("bridge")
    {
        if (s_destinationOperations[operationHash].status != OperationStatus.NONE) {
            revert RelayerBase__OperationAlreadyExists();
        }

        DestinationOperation memory newOperation;
        DestinationBlockStep memory newBlockStep;
        newBlockStep.feesDeposit = uint64(block.number);

        newOperation.params.chainIdFrom = chainIdFrom;
        newOperation.params.chainIdTo = chainIdTo;
        newOperation.status = OperationStatus.DST_FEES_DEPOSITED;
        newOperation.blockStep = newBlockStep;
        // OperationParams memory params = newOperation.params;

        s_destinationOperations[operationHash] = newOperation;
        s_destinationOperationsList.push(operationHash);

        emit FeesDeposited(operationHash, newOperation.params, block.number); // params
    }

    /**
     * @notice Server calls this function to specify fees confirmation on destination
     *
     * @dev status: DST_FEES_DEPOSITED -> DST_FEES_CONFIRMED
     * @dev emit: FeesDeposited(operationHash, params, block.number)
     *
     * @param operationHash hash id of the operation
     * @param params operation params
     * @param blockStep tx block when last event was emitted on destination
     */
    function sendFeesLockConfirmation(bytes32 operationHash, OperationParams calldata params, uint256 blockStep)
        external
        onlyRole("oracle")
    {
        DestinationOperation storage operation = s_destinationOperations[operationHash];
        bytes32 key = Storage(s_storage).getKey("blockToWait", operation.params.chainIdTo);
        uint256 blockToWait = Storage(s_storage).getUint(key);

        if (operation.status != OperationStatus.DST_FEES_DEPOSITED) {
            revert RelayerBase__InvalidOperationStatus();
        }
        if (block.number - operation.blockStep.feesDeposit > blockToWait) {
            revert RelayerBase__BlockConfirmationNotReached();
        }

        operation.status = OperationStatus.DST_FEES_CONFIRMED;
        operation.blockStep.feesConfirmation = uint64(block.number);

        emit FeesDepositConfirmed(operationHash, params, block.number);
    }

    /**
     * @notice Server calls this function to process the bridge operation on destination
     * @notice This call contains all necessary params (sent in event from origin)
     *
     * @dev It calls Bridge to forward operation to Vault
     * @dev status: DST_FEES_CONFIRMED -> DST_OP_FINALIZED
     * @dev emit: OperationFinalized(operationHash, params, block.number)
     *
     * @param operationHash hash id of the operation
     * @param params operation params
     * @param blockStep tx block when last event was emitted on destination
     */
    function completeOperation(bytes32 operationHash, OperationParams calldata params, uint256 blockStep)
        external
        onlyRole("oracle")
    {
        bytes32 computedHash = getMessageHash(
            params.from, params.to, params.chainIdFrom, params.chainIdTo, params.tokenName, params.amount, params.nonce
        );
        if (computedHash != operationHash) {
            revert RelayerBase__InvalidOperationHash();
        }
        if (s_destinationOperations[computedHash].status != OperationStatus.DST_FEES_CONFIRMED) {
            revert RelayerBase__InvalidOperationStatus();
        }

        DestinationOperation storage operation = s_destinationOperations[computedHash];

        operation.status = OperationStatus.DST_OP_FINALIZED;
        operation.blockStep.receptionBlock = uint64(block.number);

        BridgeBase bridge = BridgeBase(Storage(s_storage).getOperator("bridge"));
        bridge.completeBridgeOperation(
            params.from,
            params.to,
            params.chainIdFrom,
            params.chainIdTo,
            params.tokenName,
            params.amount,
            params.nonce,
            params.signature
        );

        emit OperationFinalized(computedHash, operation.params, block.number);
    }

    /**
     * @notice Bridge calls this function to cancel operation in case of error to allows user to redeem deposit
     *
     * @dev status: ANY -> ORG_OP_CANCELED
     * @dev emit: SentOperationCanceled(operationHash, params, block.number)
     *
     * @param operationHash hash id of the operation
     * @param chainIdFrom oringin chain Id
     * @param chainIdTo destionation chain Id
     */
    function emitCancelOperation(bytes32 operationHash, uint256 chainIdFrom, uint256 chainIdTo)
        external
        onlyRole("bridge")
    {
        DestinationOperation storage operation = s_destinationOperations[operationHash];
        if (operation.status == OperationStatus.DST_OP_FINALIZED || operation.status == OperationStatus.NONE) {
            revert RelayerBase__InvalidOperationStatus();
        }

        operation.status = OperationStatus.ORG_OP_CANCELED;
        operation.blockStep.finalisationBlock = uint64(block.number);

        emit SentOperationCanceled(operationHash, chainIdFrom, block.number);
    }

    //****************************************************************** */
    //
    //              GETTERS / HELPERS
    //
    //****************************************************************** */

    /// @notice It returns the status of the operation on origin
    /// @param operationHash hash Id of the operation
    function getOriginOperationStatus(bytes32 operationHash) external view returns (OperationStatus) {
        return s_originOperations[operationHash].status;
    }

    /// @notice It returns the status of the operation on destination
    /// @param operationHash hash Id of the operation
    function getDestinationOperationStatus(bytes32 operationHash) external view returns (OperationStatus) {
        return s_destinationOperations[operationHash].status;
    }

    /// @notice It returns all params of the operation on origin
    /// @param operationHash hash Id of the operation
    function getDetailedOriginOperation(bytes32 operationHash)
        external
        view
        returns (OriginOperation memory operation)
    {
        return s_originOperations[operationHash];
    }

    /// @notice It returns all params of the operation on destination
    /// @param operationHash hash Id of the operation
    function getDetailedDestinationOperation(bytes32 operationHash)
        external
        view
        returns (DestinationOperation memory operation)
    {
        return s_destinationOperations[operationHash];
    }

    /// @notice It returns operationHash array of the user operations in progress on origin
    /// @param user address of the user
    function getUserOperations(address user) external view returns (bytes32[] memory) {
        return s_currentUserOperations[user];
    }

    //****************************************************************** */
    //
    //              PRIVATE FUNCTIONS
    //
    //****************************************************************** */
    /**
     * @notice It removes an operationHash from current user operations (in progress)
     * @notice It's used when on op is closed or canceled on the origin
     *
     * @param user address of the user
     * @param operationHash hash to remove
     */
    function _removeUserOperation(address user, bytes32 operationHash) private {
        bytes32[] storage userOperations = s_currentUserOperations[user];
        uint256 operationsCount = userOperations.length;
        if (operationsCount == 0) {
            revert RelayerBase__UserOperationsEmpty();
        }

        if (operationsCount > 1) {
            for (uint256 i; i < operationsCount;) {
                if (userOperations[i] == operationHash) {
                    userOperations[i] = userOperations[operationsCount - 1];
                    break;
                }
                unchecked {
                    i++;
                }
            }
        }

        userOperations.pop();
    }
}
