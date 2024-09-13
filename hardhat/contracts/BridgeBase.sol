// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "hardhat/console.sol";
/*
 * @note: 
 * - fees:
 *  - business fees are taken in the user deposit
 *  - op fees:
 *    - first tx (deposit) is paid by user
 *    - final tx (server initiating final tx) is paid by server
 *   => final fees can be
 *   - computed at deposit time and charged to user then transfered to server
 *   - computed at deposit time and approved by user, then send back to server on its tx
 *   - paid by server on its tx and reimbourse 
 *   - ... ?
 *
 * - user actions: ?
 *   - send / redeem
 *   - approve / finalize
 *   - only send (=> need fees management, conversion of token..)
 *
 * - reflexion : ATTENTION liquidity of asset if multi chain
 *   - ex: 1 bridge ETH from A to B / 2 bridge bETH from B to C = not possible
 *   - register amount bridged on each other chain from allfeat to know where liquidity is available

 * // track liquidity bridged as it can be "consumed"
 * @todo:
 * - IMPLEMENT REAL nonce or txHash management !!!!!!!!!!!!
 * - register of bridge contracts and server addresses
 * - register of authorized tokens
 * - pause mechanism (granular)
 * - change admin mechanism (?)
 * - batch operations (gped by token address)
 * - status of the bridge (open / closed)
 * - store deposit, nonce, status of tx
 * - access control
 * - manual redeem (case of pb): possibility to let user reddem against a proof
 * - max optimization to reduce fees!!
 * - add external vault to not lock all the liquidity in case of pb
 * - tx simulation to return fees and recieved amount estimation
 * - implement Permit2 for better UX or AA
 */

// max value of uint8 = 255
// which uint type to contain : 1155511 => uint32 wich is 4294967295

// NOT LOGIC to ask user or dapp to know tokenADD for destination
// reduce params of signed msg
// as we have a mapping of tokens => destination will get the eq token

// ATTNETION  tokenFrom => TO !!! check when to change it
// function bridge(address tokenAddress, uint256 amount, uint256 chainId, bytes calldata signature) external payable {

//helper testing
// function getTokenAddresses(string memory tokenName, uint256 chainIdFrom, uint256 chainIdTo)
//     public
//     view
//     returns (address, address)
// {
//     (address a1, address a2) = Storage(s_storage).getTokenAddressesBychainIds(tokenName, chainIdFrom, chainIdTo);
//     console.log("a1: %s", a1);
//     console.log("a2: %s", a2);
//     return (a1, a2);
// }

// possible to pack chainId and nonce in 1 uint256 and timestamp
// timestamp till year 6000 is 4 bytes and this timestamp value will be
// 9999 = 253382420675 / in bytes 253382420675 =

// max val for bytes4 = 2^32 - 1 = 4294967295
// max val for bytes8 = 2^64 - 1 = 18446744073709551615

// deopsit & coplete => struct for params ?

// @todo add checks for chainID... (i.e chainIdTo != current chain if createOperation ...)

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BridgedToken.sol";
import "./RelayerBase.sol";
import "./TokenFactory.sol";
import "./Vault.sol";
import "./Storage.sol";
import "./Utils.sol";

error BridgeBase__CallerHasNotRole(string role1, string role2);
error BridgeBase__OperationCreationFailed(string message);
error BridgeBase__DepositFailed(string message);
error BridgeBase__FeesDepositFailed(string message);
error BridgeBase__FinalizationFailed(string message);
error BridgeBase__UnlockFailed(string message);

/**
 * @title BridgeBase
 *
 * @notice Users interact with this contract only
 * @notice It forwards calls to vault and relayer
 * @notice IMPORTANT: Approvals should be done by the user before calling the bridge function !!
 * @notice It is responsible for receiving and transfering tokens
 *
 * @dev bridge mechanism:
 * - token/native -> bridgedToken => lock token/native -> mint bridged token
 * - bridgedtoken -> token/native => burn bridged token -> unlock token/native
 * @dev user actions:
 * - approve on the destination chain to manage fee equiv transfert to initiator
 * - send token to the bridge contract
 * @dev fees:
 * - protocol fees are taken from user deposit
 * - operational fees are deposited on the destination chain and are sent to the server wallet
 * @dev scenario: (see doc for more details)
 * + Origin side:
 * - user deposits tokens on the bridge contract calling 'createBridgeOperation'
 * - 'createBridgeOperation' calls 'createOperation' in Relayer  [tx status = init]
 * - 'createBridgeOperation' calls deposit/burn functions in Vault
 * + Destination side:
 * - user approves Vault to transfer token calling 'depositFees'
 * + Server receives events, then call
 * - 'completeBridgeOperation' and 'finalizeBridgeDeposit' on destination to process the bridge operation
 */
contract BridgeBase is Utils {
    //****************************************************************** */
    //
    //              STRUCT/ENUM DECLARATIONS
    //
    //****************************************************************** */

    enum FeesType {
        PROTOCOL,
        OPERATION
    }

    //****************************************************************** */
    //
    //              STATE VARIABLES
    //
    //****************************************************************** */

    address constant MAX_ADDRESS = address(type(uint160).max); //....... 0xffffFFFfFFffffffffffffffffffffFfFFFfffFFFfF

    address public s_storage;

    mapping(address user => uint256 newNonce) public s_nextUserNonce;
    mapping(address user => mapping(uint256 chainIdFrom => mapping(uint256 => bool))) public s_destinationNonces;

    //****************************************************************** */
    //
    //              MODIFIERS
    //
    //****************************************************************** */

    modifier onlyRole(string memory role) {
        if (!Storage(s_storage).isRole(role, msg.sender)) {
            revert BridgeBase__CallerHasNotRole(role, "");
        }
        _;
    }

    modifier onlyRoles(string memory role1, string memory role2) {
        if (!Storage(s_storage).isRole(role1, msg.sender) && !Storage(s_storage).isRole(role2, msg.sender)) {
            revert BridgeBase__CallerHasNotRole(role1, role2);
        }
        _;
    }

    //****************************************************************** */
    //
    //              EVENTS
    //
    //****************************************************************** */

    event BridgeOperationCreated(
        address indexed from,
        address indexed to,
        uint256 chainId,
        address tokenFrom,
        address tokenTo,
        uint256 amount,
        uint256 timestamp,
        uint256 nonce
    );
    event BridgeOperationCompleted(
        address indexed from,
        address indexed to,
        address tokenFrom,
        address tokenTo,
        uint256 amount,
        uint256 chainId,
        uint256 nonce,
        bytes signature,
        uint256 timestamp
    );

    //****************************************************************** */
    //
    //              CONSTRUCTOR / INITIALIZATION
    //
    //****************************************************************** */

    // @review REMOVED RELAYER FROM INPUT => so refactor scripts
    // old: constructor(address storageAddress, address relayer)
    constructor(address storageAddress) {
        s_storage = storageAddress;

        if (!Storage(s_storage).isRole("admin", msg.sender)) {
            revert BridgeBase__CallerHasNotRole("admin", "");
        }
    }
    //****************************************************************** */
    //
    //              ORIGIN SIDE (init bridge operation)
    //
    //****************************************************************** */

    // @todo add sig check
    /**
     * @notice Entry point to deposit tokens to the bridge (origin side)
     *
     * @dev It creates the operation
     * @dev It inits the transfer to Vault
     * @dev It calls Relayer to init events pingpong with the server
     * @dev native coin: MAX_ADDRESS and msg.value > 0
     * @dev erc20 token: add(tokenAdd) and msg.value = 0
     * @dev erc20: check if it's a bridge token (to burn it), approve Vault for transfer
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
    function createBridgeOperation(
        address from,
        address to,
        uint256 chainIdFrom,
        uint256 chainIdTo,
        string memory tokenName,
        uint256 amount,
        uint256 nonce,
        bytes calldata signature
    ) external payable {
        if (nonce != s_nextUserNonce[from]) {
            revert BridgeBase__OperationCreationFailed("Wrong nonce");
        }
        if (from != msg.sender) {
            revert BridgeBase__OperationCreationFailed("From is not sender");
        }

        s_nextUserNonce[from]++;

        Storage store = Storage(s_storage);
        address tokenFrom = store.getTokenAddressByChainId(tokenName, chainIdFrom);

        if (!store.isAuthorizedTokenByChainId(tokenName, chainIdFrom)) {
            revert BridgeBase__DepositFailed("unauthorized token");
        }

        if (tokenFrom == MAX_ADDRESS) {
            _depositNative();
        } else {
            _depositToken(tokenFrom, amount);
        }
        _relayer().createOperation(from, to, chainIdFrom, chainIdTo, tokenName, amount, nonce, signature);
    }

    /**
     * @notice This function is called by Relayer to finalize deposit origin side
     *
     * @dev It calls Vault to finalize the transfer/mint
     *
     * @param user sender of the tokens
     * @param tokenFrom token address of the token to bridge
     * @param amount amount to bridge
     */
    function finalizeBridgeDeposit(address user, address tokenFrom, uint256 amount)
        external
        onlyRoles("admin", "relayer")
    {
        _vault().finalizeDeposit(user, tokenFrom, amount);
    }

    //****************************************************************** */
    //
    //              DESTINATION SIDE
    //
    //****************************************************************** */

    //**************************** DESTINATION SIDE *********************************/
    // MOCK FEES COMPUTATION
    function simulateOperation() public view returns (uint256) {
        return Storage(s_storage).getUint(Storage(s_storage).getKey("opFees", block.chainid));
    }
    // MOCK FEES COMPUTATION

    function computeFees() public view returns (uint256) {
        uint256 simulatedOpFees = simulateOperation();
        return simulatedOpFees;
    }

    /**
     * @notice Entry point to deposit fees to the bridge (destination side)
     *
     * @dev It transfer fees to the Vault
     * @dev It emits the de event to be forwarded by the server
     *
     * @param operationHash id of the operation (hash of the operation params used in create function)
     * @param chainIdFrom origin chain id
     * @param chainIdTo destination chain id
     */
    function depositFees(bytes32 operationHash, uint256 chainIdFrom, uint256 chainIdTo) external payable {
        RelayerBase relayer = _relayer();

        uint8 operationStatus = uint8(relayer.getDestinationOperationStatus(operationHash));
        if (operationStatus != 0) {
            revert BridgeBase__FeesDepositFailed("Operation already exists");
        }

        if (msg.value != computeFees()) {
            revert BridgeBase__FeesDepositFailed("Invalid fees amount");
        }

        try _vault().depositOperationFee{value: msg.value}() {
            relayer.lockDestinationFees(operationHash, chainIdFrom, chainIdTo);
        } catch {
            relayer.emitCancelOperation(operationHash, chainIdFrom, chainIdTo);
        }
    }

    // **************************** Operation functions *********************************/

    /**
     * @notice This function is called by Relayer to create operation destination side
     *
     * @dev It checks the signature and params validity
     * @dev It calls Vault to init the transfer/mint
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
    function completeBridgeOperation(
        address from,
        address to,
        uint256 chainIdFrom,
        uint256 chainIdTo,
        string memory tokenName,
        uint256 amount,
        uint256 nonce,
        bytes calldata signature
    ) external onlyRole("relayer") {
        if (s_destinationNonces[from][chainIdTo][nonce]) {
            revert BridgeBase__FinalizationFailed("transfer already processed");
        }

        (address tokenFrom, address tokenTo) =
            Storage(s_storage).getTokenAddressesByChainIds(tokenName, chainIdFrom, chainIdTo);

        // too avoid stack too deep
        // {
        s_destinationNonces[from][chainIdTo][nonce] = true;
        //}

        if (!Storage(s_storage).isAuthorizedTokenByChainId(tokenName, chainIdTo)) {
            revert BridgeBase__DepositFailed("unauthorized token");
        }

        bytes32 message = getPrefixedMessageHash(from, to, chainIdFrom, chainIdTo, tokenName, amount, nonce);
        if (recoverSigner(message, signature) != from) {
            // console.logBytes(signature);
            revert BridgeBase__FinalizationFailed("wrong signature");
        }

        if (tokenTo == MAX_ADDRESS) {
            // native coin
            _vault().unlockNative(to, amount);
        } else {
            if (!_factory().isBridgedToken(tokenTo)) {
                // erc20
                _vault().unlockToken(to, tokenFrom, amount);
            } else {
                // bridged token
                _vault().mint(to, tokenTo, amount);
            }
        }
    }

    //**************************** CANCELING *********************************/

    function cancelBridgeDeposit(address user, address tokenFrom, uint256 amount)
        external
        onlyRoles("admin", "bridge")
    {
        _vault().cancelDeposit(user, tokenFrom, amount);
    }

    //****************************************************************** */
    //
    //              GETTERS / HELPERS
    //
    //****************************************************************** */

    function getNewUserNonce(address user) external view returns (uint256) {
        return s_nextUserNonce[user];
    }

    //****************************************************************** */
    //
    //              PRIVATE FUNCTIONS
    //
    //****************************************************************** */

    /**
     * @notice returns instance of Vault contract
     */
    function _relayer() private view returns (RelayerBase) {
        Storage store = Storage(s_storage);
        address relayer = store.getOperator("relayer");
        return RelayerBase(relayer);
    }

    /**
     * @notice returns instance of Vault contract
     */
    function _vault() private view returns (Vault) {
        Storage store = Storage(s_storage);
        address vault = store.getOperator("vault");
        return Vault(vault);
    }

    /**
     * @notice returns instance of Vault contract and its address
     */
    function _getVaultData() private view returns (Vault, address) {
        Storage store = Storage(s_storage);
        address vault = store.getOperator("vault");
        return (Vault(vault), vault);
    }

    /**
     * @notice returns instance of TokenFactory contract
     */
    function _factory() private view returns (TokenFactory) {
        Storage store = Storage(s_storage);
        address factory = store.getOperator("factory");
        return TokenFactory(factory);
    }

    /**
     * @notice Helper for native coin deposit
     * @dev It transfers msg.value to vault
     * @dev Require: msg.value > 0
     */
    function _depositNative() private {
        if (msg.value == 0) {
            revert BridgeBase__DepositFailed("Native needs non zero value");
        }
        //
        if (msg.sender.balance < msg.value) {
            revert BridgeBase__DepositFailed("Insufficient balance");
        }
        _vault().depositNative{value: msg.value}(msg.sender);
    }

    /**
     * @notice Helper for token deposit
     * @dev It transfers msg.value to vault
     * @dev Require: msg.value == 0
     * @dev Require: allowance for vault >= amount prior to call
     */
    function _depositToken(address tokenFrom, uint256 amount) private {
        (Vault vault, address vaultAddress) = _getVaultData();

        if (msg.value > 0) {
            revert BridgeBase__DepositFailed("Token needs zero value");
        }
        if (ERC20(tokenFrom).balanceOf(msg.sender) < amount) {
            revert BridgeBase__DepositFailed("Insufficient balance");
        }

        if (ERC20(tokenFrom).allowance(msg.sender, vaultAddress) < amount) {
            revert BridgeBase__DepositFailed("Initial allowance failed");
        }

        if (!_factory().isBridgedToken(tokenFrom)) {
            vault.depositToken(msg.sender, tokenFrom, amount);
        } else {
            vault.burn(msg.sender, tokenFrom, amount);
        }
    }
}
