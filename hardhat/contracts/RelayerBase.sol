// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BridgeBase.sol";

/* errors */

/* types declarations */

/* state variables */

/* events */

/* modifiers */

/* constructor */

/* receive / fallback */

/* external functions */

/* public functions */

/* internal functions */

/* private functions */

/* pure functions */

/* view functions */

/*
 *
 */

/**
 * @notice Base contract comunicating with the oracle/server
 * It's in charge to emit the bridge event to the oracle/server and maanage tx status
 * @dev register is called to register a new bridge tx
 * @dev confirm is called to confirm a tx when called by the oracle/server (to forward fees event)
 * @dev when these 2 conditions are met the bridge event is emitted
 */
contract RelayerBase {
    /* errors */

    /* types declarations */
    enum OperationStatus {
        NONE,
        INITIATED,
        // READY,
        PROCESSING,
        CONFIRMED,
        FINALIZED,
        CANCELLED
    }

    // @todo refactor params
    struct OperationParams {
        address from;
        address to;
        uint256 chainId;
        address token;
        uint256 amount;
        // uint256 fee;
        uint256 nonce;
    }

    struct Confirmation {
        uint256 operationHash;
        address from;
        address to;
        uint256 chainId;
        address token;
        uint256 amount;
        // uint256 fee;
        uint256 nonce;
        bytes signature;
    }

    struct Operation {
        // address token;
        // address from;
        // address to;
        // uint256 amount;
        // uint256 fee;
        // uint256 nonce;
        // bytes signature; // vrs ?
        OperationParams params;
        Confirmation confirmation;
        OperationStatus status;
        uint256 OperationHash;
        uint256 initTimestamp;
    }
    /* state variables */

    mapping(uint256 operationHash => Operation) public s_operations;

    address public s_bridgeAddress;
    address public s_oracleAddress;
    address public s_admin;
    /* events */

    event BridgeEvent(
        address indexed from, address indexed to, uint256 chainId, address token, uint256 amount, uint256 nonce
    );

    event StatusChanged(uint256 operationHash, OperationStatus oldStatus, OperationStatus newStatus);

    /* modifiers */
    modifier onlyBridge() {
        require(msg.sender == s_bridgeAddress, "only bridge");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == s_oracleAddress, "only oracle");
        _;
    }

    /* constructor */
    constructor(address _oracleAddress) {
        // s_bridgeAddress = _bridgeAddress;
        s_oracleAddress = _oracleAddress;
        s_admin = msg.sender;
    }

    function updateBridgeAddress(address _bridgeAddress) external {
        require(msg.sender == s_admin, "only admin");
        s_bridgeAddress = _bridgeAddress;
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

    // the bridge contract will call this function // or prepareCrossMsg
    function register(
        address from,
        address to,
        address tokenFrom,
        address tokenTo,
        uint256 amount,
        uint256 chainId,
        uint256 nonce,
        bytes calldata signature
    ) external onlyBridge {
        // uint256 operationHash = 123; //_hashOperation();

        //create hash from params
        uint256 operationHash =
            uint256(keccak256(abi.encodePacked(from, to, tokenFrom, tokenTo, amount, chainId, nonce)));
        OperationParams memory params = OperationParams(from, to, chainId, tokenFrom, amount, nonce);

        Operation memory operation;
        operation.params = params;
        operation.OperationHash = operationHash;

        _checkConditions(operationHash);
    }

    // the server call this function forwarding the fees event
    function confirm() external onlyOracle {
        uint256 operationHash = 123; //_hashOperation();
        _checkConditions(operationHash);
    }

    //********************************************************************** */
    //
    //     Function: fees management and liquidity check (destination chain)
    //
    //**********************************************************************

    // We should simulate operation to get the needed fees
    // these op will be server calling
    function lockOperationalFees() external {
        // @todo

        // we should check liquidity asked if native token is the output token and :
        // - revert => status on origin don't changed, passed a time the user can reedem
        // - or emit a event, status on origin chain change to CANCELLED

        // user approve this relayer to smpend is native token

        // we transfer the fees eq amount to the serverWallet

        // we craft a confirmation message (operation ready ?) and emit an event to the oracle

        // => on the origine chain the opHash status pass to PROCESSING on receipt of the event
        // SO EMIT THE EVENT
    }

    /* public functions */

    /* internal functions */

    // rename updateStatus
    // check fot a opHash if we init a new op and if we received the associated feesLock event from the other chain
    function _checkConditions(uint256 operationHash) internal {
        OperationStatus status = s_operations[operationHash].status;
        OperationStatus oldStatus = status;

        if (status == OperationStatus.NONE) {
            status = OperationStatus.INITIATED;
        } else if (status == OperationStatus.INITIATED) {
            emit BridgeEvent(
                s_operations[operationHash].params.from,
                s_operations[operationHash].params.to,
                s_operations[operationHash].params.chainId,
                s_operations[operationHash].params.token,
                s_operations[operationHash].params.amount,
                s_operations[operationHash].params.nonce
            );
            status = OperationStatus.PROCESSING;
        }
        emit StatusChanged(operationHash, oldStatus, status);
        s_operations[operationHash].status = status;
    }

    /* private functions */

    /* pure functions */

    /* view functions */
}
