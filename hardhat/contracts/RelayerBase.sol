// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BridgeBase.sol";
import "./Storage.sol";
import "./Vault.sol";
import "./Utils.sol";

/**
 * @notice Base contract comunicating with the oracle/server
 * It's in charge to emit the bridge event to the oracle/server and maanage tx status
 * @dev register is called to register a new bridge tx
 * @dev confirm is called to confirm a tx when called by the oracle/server (to forward fees event)
 * @dev when these 2 conditions are met the bridge event is emitted
 */
contract RelayerBase is Utils {
    /* errors */
    enum FeesType {
        PROTOCOL,
        OPERATION
    }
    /* types declarations */

    enum OperationStatus {
        NONE, //.................Step 0
        ORG_OP_CREATED, //.......Step 1 user deposited asking for bridge
        DST_FEES_DEPOSITED, //...Step 2 user deposited fees on dst chain
        DST_FEES_CONFIRMED, //...Step 3 fees deposit tx confirmed (finalized)
        ORG_FEES_LOCKED, //......Step 4 org received the fees event from dst
        ORG_OP_READY, //.........Step 5 fees locked & confirmed and deposit confirmed (finalized) (=processing)
        DST_OP_RECEIVED, //......Step 6 dst received operation order with params
        DST_OP_FINALIZED, // mkdir, //.....Step 7 dst tx is finalized
        ORG_OP_CLOSED, //........Step 8 org tx is closed after dst tx is finalized
        ORG_OP_CANCELED //.......Step x org tx is canceled

    }

    // @todo refactor params
    struct OperationParams {
        address from;
        address to;
        uint256 chainIdFrom; // for signature but not necessary in memory (we're on the chain)
        uint256 chainIdTo;
        string tokenName;
        uint256 amount;
        uint256 nonce;
        bytes signature;
    }

    struct OperatorParams {
        address operator;
        uint256 feesAmount;
    }
    //RENAME
    // bytes4 => uint64 (4 step in one uint256) / need reader...
    // or uint64 don't use pcking function let evm do the job

    struct OriginBlockStep {
        uint64 creationBlock; //.....Step 1
        uint64 processingBlock; //...Step 5
        uint64 closingBlock; //......Step 8
    }

    struct DestinationBlockStep {
        uint64 feesDeposit; //........Step 2
        uint64 feesConfirmation; //...Step 3
        uint64 receptionBlock; //.....Step 7
        uint64 finalisationBlock; //..Step 8 ??
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

    /* state variables */
    //..??
    // No way to prove no collision between origin and destination with many chain...(it's only probability)
    // only sure things are the chainId and the nonce
    // So later modify for a mapping of chainId => nonce => Operation (with hash in it) or hashOperation & ref to nonce
    // chainId => nonce allows to have iterable list of operation. With index begin - end (actual)
    // possibility to prune the list after a certain time and update the index

    //op as origin
    mapping(bytes32 operationHash => OriginOperation) public s_originOperations;
    // op as destination
    mapping(bytes32 operationHash => DestinationOperation) public s_destinationOperations;
    // to change :
    // temporary list of operations / not good to have a list of struct for op as the array can be too big quickly
    bytes32[] public s_originOperationsList;
    bytes32[] public s_destinationOperationsList;

    // mapping(address => uint256) public s_userOriginNonce;

    address public s_storage;
    // add storage of the instance

    /* events */

    // event BridgeEvent(
    //     address indexed from, address indexed to, uint256 chainId, address token, uint256 amount, uint256 nonce
    // );
    // event StatusChanged(uint256 operationHash, OperationStatus oldStatus, OperationStatus newStatus);

    event OperationCanceled(bytes32 operationHash, uint256 chainId, uint256 blockNumber);
    event SentOperationCanceled(bytes32 operationHash, uint256 chainId, uint256 blockNumber);
    event ReceveidOperationCanceled(bytes32 operationHash, uint256 chainId, uint256 blockNumber);
    // As origin
    event OperationCreated(bytes32 operationHash, OperationParams params, uint256 blockNumber);
    event FeesLockedConfirmed(bytes32 operationHash, OperationStatus status, uint256 blockNumber);
    event FeesLockedAndDepositConfirmed(
        bytes32 operationHash, OperationParams params, uint256 initBlock, uint256 blockNumber
    );
    event OperationClosed(bytes32 operationHash, uint256 blockNumber);
    // As destination
    event FeesDeposited(bytes32 operationHash, uint256 chainId);
    event FeesDepositConfirmed(bytes32 operationHash, uint256 chainId, uint256 blockNumber);
    event OperationReceived(bytes32 operationHash, OperationParams params, uint256 blockNumber);
    event OperationFinalized(bytes32 operationHash, OperationParams params, uint256 blockNumber);

    /* modifiers */

    modifier onlyBridge() {
        if (!Storage(s_storage).isBridge(msg.sender)) {
            revert("only bridge");
        }
        _;
    }

    modifier onlyOracle() {
        if (!Storage(s_storage).isOracle(msg.sender)) {
            revert("only oracle");
        }
        _;
    }

    /* constructor */
    constructor(address storageAddress) {
        // first deployed is storage so admin of storage should be the admin of the factory and msg.sender

        s_storage = storageAddress;
        if (!Storage(s_storage).isAdmin(msg.sender)) {
            revert("TokenFactory: caller is not the admin");
        }
    }

    /* receive / fallback */

    /* external functions */
    /**
     * @notice register a new tx to be bridged
     */

    //********************************************************************** */
    //
    //     Function: register a new bridge operation (origin chain)
    //
    //**********************************************************************

    // event ReadyToBridge(
    //     address from,
    //     address to,
    //     uint256 chainIdFrom,
    //     uint256 chainIdTo,
    //     address tokenFrom,
    //     address tokenTo,
    //     uint256 amount,
    //     uint256 nonce,
    //     bytes signature
    // );
    // the bridge contract will call this function // or prepareCrossMsg

    // attention adddomain separator

    function createOperation(
        address from,
        address to,
        uint256 chainIdFrom,
        uint256 chainIdTo,
        string memory tokenName,
        uint256 amount,
        uint256 nonce,
        bytes calldata signature
    ) external onlyBridge {
        bytes32 operationHash = computeOperationHash(from, to, chainIdFrom, chainIdTo, tokenName, amount, nonce);
        require(
            s_originOperations[operationHash].status == OperationStatus.NONE, "RelayerBase: operation already exists"
        );

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

        emit OperationCreated(operationHash, params, block.number);
    }

    // @todo => fix naming ! prefer operation to order

    // the server call this function forwarding the fees event confirming FeesLocked
    function receiveFeesLockConfirmation(
        bytes32 operationHash,
        uint256 chainTo, // chain id of the destination chain making this call (to compare with hash)
        address operator
    ) external onlyOracle {
        OriginOperation storage operation = s_originOperations[operationHash];
        // Quid if org : eth, dst : quick chain and:
        // user deposit and fees tx at the beginning of the eth block => fees confirmation tx can
        // be in the same block as the deposit tx on the dst chain (even before following tx org)
        // Current solution => server should wait one block before calling this function
        require(operation.status == OperationStatus.ORG_OP_CREATED, "RelayerBase: invalid status");
        // require(status == OperationStatus.CONFIRMED || status == OperationStatus.CANCELED, "RelayerBase: invalid status");

        // check of msg ??
        // user sign msg on dst chain : hashOp, fees, chainIdTo
        // ?? operator sign hash of msg => 2* check ?? or register operator and onlyOracle check
        operation.status = OperationStatus.ORG_FEES_LOCKED;

        emit FeesLockedConfirmed(operationHash, operation.status, block.number);
    }

    // emit the MAIN EVENT with params
    // server set op as ready (2 conditions met: deposit, fees) to emit event with param to perform op on dst chain
    // Could merge with the previous function. Function would check fees msg reverting if not fees locked
    // conditions to emit the event:
    // deposit tx should be confirmed
    // fees tx should be confirmed
    function confirmFeesLockedAndDepositConfirmed(bytes32 operationHash) external {
        bytes32 key = Storage(s_storage).getKey("blockToWait", block.chainid);
        uint256 blockToWait = Storage(s_storage).getUint(key);
        OriginOperation storage operation = s_originOperations[operationHash];

        require(block.number >= operation.blockStep.creationBlock + blockToWait, "RelayerBase: block not reached");
        require(operation.status == OperationStatus.ORG_FEES_LOCKED, "RelayerBase: invalid status");

        operation.status = OperationStatus.ORG_OP_READY;
        operation.blockStep.processingBlock = uint64(block.number);

        // THE event!!
        emit FeesLockedAndDepositConfirmed(
            operationHash, operation.params, operation.blockStep.creationBlock, block.number
        );
    }

    function receivedFinalizedOperation(bytes32 operationHash) external onlyOracle {
        OriginOperation storage operation = s_originOperations[operationHash];
        require(operation.status == OperationStatus.ORG_OP_READY, "RelayerBase: invalid status");

        operation.status = OperationStatus.ORG_OP_CLOSED;
        operation.blockStep.closingBlock = uint64(block.number);

        address tokenFrom =
            Storage(s_storage).getTokenAddressByChainId(operation.params.tokenName, operation.params.chainIdFrom);
        BridgeBase bridge = BridgeBase(Storage(s_storage).getOperator("bridge"));
        bridge.finalizeBridgeDeposit(operation.params.from, tokenFrom, operation.params.amount);
        emit OperationClosed(operationHash, block.number);
    }

    // MAKE CONSTANT FOR VARIABLE NAME AND TAG !!!
    // ADD MARGIN TO THE FEES in case of volatility !!

    //********************************************************************** */
    //
    //     Function: fees management and liquidity check (destination chain)
    //
    //**********************************************************************

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
    function lockDestinationFees(
        bytes32 operationHash,
        // OperationParams calldata operationParams,
        uint256 chainIdFrom // if we change the storage to have the chainId as first key
    ) external payable onlyBridge {
        require(
            s_destinationOperations[operationHash].status == OperationStatus.NONE,
            "RelayerBase: operation already exists"
        );

        DestinationOperation memory newOperation;
        DestinationBlockStep memory blockStep;
        blockStep.feesDeposit = uint64(block.number);

        newOperation.params.chainIdFrom = chainIdFrom;
        newOperation.status = OperationStatus.DST_FEES_DEPOSITED;

        emit FeesDeposited(operationHash, chainIdFrom); // event name
        s_destinationOperations[operationHash] = newOperation;
        s_destinationOperationsList.push(operationHash);
    }

    // server check block confirmation for feesLock if finality is reached then call this function to emit the event and
    // forward to origin chain
    // ADd chainID for operation
    function sendFeesLockConfirmation(bytes32 operationHash) external onlyOracle {
        DestinationOperation storage operation = s_destinationOperations[operationHash];
        require(operation.status == OperationStatus.DST_FEES_DEPOSITED, "RelayerBase: invalid status");
        require(
            block.number - operation.blockStep.feesDeposit
                > Storage(s_storage).getUint(Storage(s_storage).getKey("blockToWait", operation.params.chainIdTo)),
            "RelayerBase: block not reached"
        );

        operation.status = OperationStatus.DST_FEES_CONFIRMED;
        operation.blockStep.feesConfirmation = uint64(block.number);

        emit FeesDepositConfirmed(operationHash, operation.params.chainIdFrom, block.number);
    }

    function completeOperation(
        address from,
        address to,
        uint256 chainIdFrom,
        uint256 chainIdTo,
        string memory tokenName,
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) external onlyOracle {
        // check block (signature checked at creation)
        // check status not CANCELED
        bytes32 operationHash = computeOperationHash(from, to, chainIdFrom, chainIdTo, tokenName, amount, nonce);
        require(
            s_destinationOperations[operationHash].status == OperationStatus.DST_FEES_CONFIRMED,
            "RelayerBase: invalid status"
        );

        DestinationOperation storage operation = s_destinationOperations[operationHash];
        // require(operation.status == OperationStatus.RECEIVED, "RelayerBase: invalid status");

        operation.status = OperationStatus.DST_OP_FINALIZED;
        operation.blockStep.receptionBlock = uint64(block.number);

        BridgeBase bridge = BridgeBase(Storage(s_storage).getOperator("bridge"));
        bridge.completeBridgeOperation(from, to, chainIdFrom, chainIdTo, tokenName, amount, nonce, signature);

        emit OperationFinalized(operationHash, operation.params, block.number);
    }

    //////////////////////
    // CANCEL OPERATION //
    //////////////////////

    // ORGN SIDE
    function receiveCancelOperation(bytes32 operationHash, uint256 chainIdFrom) external onlyOracle {
        OriginOperation storage operation = s_originOperations[operationHash];
        require(
            operation.status != OperationStatus.ORG_OP_CLOSED && operation.status != OperationStatus.NONE,
            "RelayerBase: invalid status"
        );

        operation.status = OperationStatus.ORG_OP_CANCELED;
        operation.blockStep.closingBlock = uint64(block.number);
        address tokenFrom =
            Storage(s_storage).getTokenAddressByChainId(operation.params.tokenName, operation.params.chainIdTo);
        // BRDIGE => VAULT => free the user balance
        BridgeBase bridge = BridgeBase(Storage(s_storage).getOperator("bridge"));
        bridge.cancelBridgeDeposit(operation.params.from, tokenFrom, operation.params.amount);

        emit ReceveidOperationCanceled(operationHash, chainIdFrom, block.number);
    }

    function emitCancelOperation(bytes32 operationHash, uint256 chainIdFrom) external onlyBridge {
        DestinationOperation storage operation = s_destinationOperations[operationHash];
        require(
            operation.status != OperationStatus.DST_OP_FINALIZED && operation.status != OperationStatus.NONE,
            "RelayerBase: invalid status"
        );

        // operation.params.chainIdFrom = chainIdFrom;
        operation.status = OperationStatus.ORG_OP_CANCELED;
        operation.blockStep.finalisationBlock = uint64(block.number);

        emit SentOperationCanceled(operationHash, chainIdFrom, block.number);
    }
    /* public functions */

    /* internal functions */

    /* pure functions */

    /* view functions */
    function getDestinationOperationStatus(bytes32 operationHash) external view returns (OperationStatus) {
        return s_destinationOperations[operationHash].status;
    }

    function isDestinationOperationExist(bytes32 operationHash) external view returns (bool) {
        return s_destinationOperations[operationHash].status != OperationStatus.NONE;
    }

    function isOriginOperationExist(bytes32 operationHash) external view returns (bool) {
        return s_originOperations[operationHash].status != OperationStatus.NONE;
    }

    function isOriginOperationCanceled(bytes32 operationHash) external view returns (bool) {
        return s_originOperations[operationHash].status == OperationStatus.ORG_OP_CANCELED;
    }

    function getOriginOperationStatus(bytes32 operationHash) external view returns (OperationStatus) {
        return s_originOperations[operationHash].status;
    }

    function getDetailedOriginOperation(bytes32 operationHash)
        external
        view
        returns (OriginOperation memory operation)
    {
        return s_originOperations[operationHash];
    }
}
