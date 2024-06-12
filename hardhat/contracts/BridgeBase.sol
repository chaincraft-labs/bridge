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
/**
 * @title BridgeBase contract
 * @notice IMPORTANT: Approvals should be done by the user before calling the bridge function !!
 * @notice It is responsible for receiving and transferring tokens
 * @dev This contract is the base contract for all bridge contracts
 * @dev It contains the basic functions for minting, burning, locking and unlocking tokens
 * @dev process:
 * - token -> bridgeToken => lock token -> mint bridge token
 * - bridge token -> token => burn bridge token -> unlock token
 * - native -> bridgeNative => lock native -> mint bridge token
 * - bridge token -> native => burn bridge token -> unlock native
 * @dev user actions:
 * - approve on the destination chain to manage fee equiv transfert to initiator
 * - send token to the bridge contract
 * @dev fees:
 * - business fees are taken in the user deposit
 * - operational fees are taken from the user wallet on the destination chain
 * (thanks to the approval) and are sent to the server wallet
 * @dev scenario:
 * - user deposit token on the bridge contract
 * - deposit call registerTx in relayer contract [tx status = init]
 * - user approve/for transfert or transfert token to the bridge contract/ fees pool on chain B
 * - oracle/Server receive event of fees transfer and forward to the relayer contract
 * - realyer contract check/gather registerTx with fees event and emit bridge event [tx = processing]
 * - oracle/Server (listener) receive bridge event and queue a message
 * - after x block confirmation oacle/server (executor) process the message and call finalize
 * - finalize check the signature and process the transfert
 * - if native token, transfer the amount to the destination address ...
 * - if erc20 token, transfer the amount to the destination address ...
 * - if bridge token, mint the amount to the destination address ...
 * - emit event finalized => receive then call first realyer to mark the tx done (need to wait block conf)
 */
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BridgedToken.sol";
import "./RelayerBase.sol";
import "./TokenFactory.sol";
import "./Vault.sol";
import "./Storage.sol";
import "./Utils.sol";

// error BridgeBase__DepositNativeWithZeroValue();
// error BridgeBase__DepositTokenWithNonZeroValue();
// error BridgeBase__DepositTokenWithInsufficientBalance();
// error BridgeBase__DepositTokenWithInsufficientAllowance();
error BridgeBase__DepositFailed(string message);
error BridgeBase__FinalizationFailed(string message);
error BridgeBase__UnlockFailed(string message);

contract BridgeBase is Utils {
    enum FeesType {
        PROTOCOL,
        OPERATION
    }

    address constant maxAddress = address(type(uint160).max); // 0xffffFFFfFFffffffffffffffffffffFfFFFfffFFFfF

    address public s_storage;
    address public s_relayer;

    // mapping(address user => mapping(uint256 => mapping(uint256 => bool)) nonce) public nonces;
    // or with hash (user, chainId) and bitset of nonce ?
    // tempo actual nonce to process
    // nonce management
    // mapping(address user => uint256 nonce) public nonces;
    //or
    // MORE REFLEXION ABOUT NONCE !!
    // mapping(address user => mapping(uint256 => bool) nonce) public nonces; // destination side
    // mapping(address user => uint256) public actualNonce; // origin side
    // uint256 public nonce; // (pb if we want to pack)
    mapping(address user => uint256 newNonce) public nextUserNonce; // origin side
    mapping(address user => mapping(uint256 chainIdFrom => mapping(uint256 => bool))) public destinationNonces; // destination side

    // MAke Access control instead
    modifier onlyAdmin(address _admin) {
        if (!Storage(s_storage).isAdmin(_admin)) {
            revert("BridgeBase: caller is not the admin");
        }
        _;
    }

    // MODIFY modifier according to storage changes => check symbol, chain and tokenADD on chainId

    // modifier onlyAuthorizedToken(address tokenAddress) {
    //     if (!Storage(s_storage).getAuthorizedToken(tokenAddress)) {
    //         revert("BridgeBase: unauthorized token");
    //     }
    //     _;
    // }

    // modifier onlyAuthorizedChain(uint256 chainId) {
    //     if (!Storage(s_storage).getAuthorizedChain(chainId)) {
    //         revert("BridgeBase: unauthorized chain");
    //     }
    //     _;
    // }

    modifier onlyOracle() {
        if (!Storage(s_storage).isOracle(msg.sender)) {
            revert("BridgeBase: caller is not the oracle");
        }
        _;
    }

    modifier onlyRelayer() {
        if (!Storage(s_storage).isRelayer(msg.sender)) {
            revert("BridgeBase: caller is not the relayer");
        }
        _;
    }

    modifier onlyAdminOrBridge() {
        if (!Storage(s_storage).isAdmin(msg.sender) && !Storage(s_storage).isBridge(msg.sender)) {
            revert("BridgeBase: caller is not the admin or the bridge");
        }
        _;
    }

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

    // size of an address is 20 bytes
    // possible to pack chainId and nonce in 1 uint256 and timestamp
    // timestamp till year 6000 is 4 bytes and this timestamp value will be
    // 9999 = 253382420675 / in bytes 253382420675 =

    // max val for bytes4 = 2^32 - 1 = 4294967295
    // max val for bytes8 = 2^64 - 1 = 18446744073709551615

    // constructor(address storageAddress, address relayer) {
    //     if (!Storage(s_storage).isAdmin(msg.sender)) {
    //         revert("TokenFactory: caller is not the admin");
    //     }
    //     s_storage = storageAddress;
    //     s_relayer = relayer;
    // }
    constructor(address storageAddress, address relayer) {
        s_storage = storageAddress;
        s_relayer = relayer;
    }
    //****************************************************************** */
    //
    //              DEPOSIT SIDE (init bridge operation)
    //
    //****************************************************************** */

    // max value of uint8 = 255
    // which uint type to contain : 1155511 => uint32 wich is 4294967295

    // NOT LOGIC to ask user or dapp to know tokenADD for destination
    // reduce params of signed msg
    // as we have a mapping of tokens => destination will get the eq token

    // ATTNETION  tokenFrom => TO !!! check when to change it
    // function bridge(address tokenAddress, uint256 amount, uint256 chainId, bytes calldata signature) external payable {

    //helper testing
    function getTokenAddresses(string memory tokenName, uint256 chainIdFrom, uint256 chainIdTo)
        public
        view
        returns (address, address)
    {
        (address a1, address a2) = Storage(s_storage).getTokenAddressesBychainIds(tokenName, chainIdFrom, chainIdTo);
        console.log("a1: %s", a1);
        console.log("a2: %s", a2);
        return (a1, a2);
    }
    /**
     * @notice Entry point to deposit tokens to the bridge
     *
     * @dev native token: add(0) and msg.value > 0
     * @dev erc20 token: add(tokenAdd) and msg.value = 0
     * @dev erc20: check if it's a bridge token (to burn it)
     *
     * @dev payable for native token
     * @dev ERC20 token: approve the contract to transfer the token
     *
     * @param amount token amount
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
        uint256 newNonce = nextUserNonce[from];
        require(nonce == newNonce, "BridgeBase: wrong nonce");
        // address tokenFrom;
        // address tokenTo;
        // (tokenFrom, tokenTo) = Storage(s_storage).getTokenAddressesBychainIds(tokenName, chainIdFrom, chainIdTo);

        // (address tokenFrom, address tokenTo) =
        //     Storage(s_storage).getTokenAddressesBychainIds(tokenName, chainIdFrom, chainIdTo);
        address tokenFrom = Storage(s_storage).getTokenAddressByChainId(tokenName, chainIdFrom);
        address tokenTo = Storage(s_storage).getTokenAddressByChainId(tokenName, chainIdTo);
        address vault;
        address relayer;
        // address factory;

        // too avoid stack too deep
        {
            nextUserNonce[from]++;

            // string[] memory roles;
            // roles[0] = "vault";
            // roles[1] = "relayer";
            // address[] memory operators = Storage(s_storage).getOperators(roles);
            // vault = operators[0];
            // relayer = operators[1];
            // address[] memory operators = Storage(s_storage).getOperators(roles);
            vault = Storage(s_storage).getOperator("vault");
            relayer = Storage(s_storage).getOperator("relayer");
            // factory = Storage(s_storage).getOperator("factory");
        }

        // Vault vault = Vault(operators[0]);
        // RelayerBase relayer = RelayerBase(operators[1]);
        // merge storage function to have less call
        if (!Storage(s_storage).isAuthorizedTokenByChainId(tokenName, chainIdFrom)) {
            revert BridgeBase__DepositFailed("unauthorized token");
        }
        // if (!authorizedChains[chainId]) {

        // CHANGE DUE TO SROTAGE CHANGE
        // if (!Storage(s_storage).getAuthorizedChain(chainIdTo)) {
        //     revert BridgeBase__DepositFailed("invalid chainId");
        // }

        if (tokenFrom == maxAddress) {
            // native token
            if (msg.value == 0) {
                revert BridgeBase__DepositFailed("Native needs non zero value");
            }
            if (msg.sender.balance < msg.value) {
                revert BridgeBase__DepositFailed("Insufficient balance");
            }
            // _lockNative(msg.sender, chainId);
            Vault(vault).depositNative{value: msg.value}(msg.sender);
        } else {
            // erc20 token
            if (msg.value > 0) {
                revert BridgeBase__DepositFailed("Token needs zero value");
            }
            if (ERC20(tokenFrom).balanceOf(msg.sender) < amount) {
                revert BridgeBase__DepositFailed("Insufficient balance");
            }
            // ask allowance
            bool res = ERC20(tokenFrom).approve(vault, amount);
            if (!res) {
                revert BridgeBase__DepositFailed("Initial allowance failed");
            }

            if (!Storage(s_storage).isBridgedToken(tokenFrom)) {
                Vault(vault).depositToken(msg.sender, tokenFrom, amount);
            } else {
                // burn the bridge token
                // SHOULD BE SENT to the vault and burn ONLY when FINALIZED
                // To let user reedem if op is CANCELED
                Vault(vault).burn(tokenFrom, msg.sender, amount);
            }
        }
        RelayerBase(relayer).createOperation(
            msg.sender, msg.sender, chainIdFrom, chainIdTo, tokenName, amount, nonce, signature
        );
    }

    function mintOnlyTEST(address to, address token, uint256 amount) external {
        Vault vault = Vault(Storage(s_storage).getOperator("vault"));
        vault.mint(token, to, amount);
    }

    //****************************************************************** */
    //
    //              FINALIZE SIDE (receive order to send token to user)
    //
    //****************************************************************** */

    //nonces = processedNonces
    //AJOUTER LE CHAINID
    // ATTENTION trick pour native token  add bridgeNative => native !!!
    // Ajouter transfer de fee au server wallet // avoir un registre de server wallet authorizé
    // Ajouter ?? mapping de correspondance add token add token / chain ?

    //CHANGEDto receive call from relayer
    /**
     * @dev Finalize the transfer (called by a bridge server)
     * @dev if the signature is valid, the transfer is processed
     * @dev checks if the token to transfer is a bridge token / erc20 or native token
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
    )
        // ) external onlyOracle {
        external
        onlyRelayer
    {
        // TO CHANGE nonce set on creation , there check status
        if (destinationNonces[from][chainIdTo][nonce]) {
            revert BridgeBase__FinalizationFailed("transfer already processed");
        }
        Vault vault;
        // RelayerBase relayer;
        TokenFactory factory;
        // merge with authorization getter to have less call
        (address tokenFrom, address tokenTo) =
            Storage(s_storage).getTokenAddressesBychainIds(tokenName, chainIdFrom, chainIdTo);
        // (tokenName, chainIdFrom, chainIdTo);
        // too avoid stack too deep
        {
            destinationNonces[from][chainIdTo][nonce] = true;

            // string[] memory roles;
            // roles.push("vault");
            // roles.push("relayer");
            // address[] memory operators = Storage(s_storage).getOperators(roles);
            vault = Vault(Storage(s_storage).getOperator("vault"));
            // relayer = RelayerBase(Storage(s_storage).getOperator("relayer"));
            factory = TokenFactory(Storage(s_storage).getOperator("factory"));
        }

        // SHOULD NOT OCCUR !!! => (manage this case)
        // when calling the relayer ?? to approve and transfert fees the oher side.
        // ?? check if we have the liquidity ?? and send the result with the approve confirmation
        // if (!Storage(s_storage).getAuthorizedToken(tokenTo)) {
        //     revert BridgeBase__FinalizationFailed("unauthorized token");
        // }
        if (!Storage(s_storage).isAuthorizedTokenByChainId(tokenName, chainIdTo)) {
            revert BridgeBase__DepositFailed("unauthorized token");
        }

        // bytes32 message =
        //     prefixed(keccak256(abi.encodePacked(from, to, tokenName, amount, chainIdFrom, chainIdTo, nonce)));
        // bytes32 message = computeOperationHash(from, to, chainIdFrom, chainIdTo, tokenName, amount, nonce);
        bytes32 message = getMessageToSign(from, to, chainIdFrom, chainIdTo, tokenName, amount, nonce);

        // if (recoverSigner(message, signature) != from) {
        // address recSigner = recoverSigner(message, signature);
        if (recoverSigner(message, signature) != from) {
            console.log("LALALALALLALA TEST SIGNATURE from: %s", from);
            console.log("LALALALALLALA TEST SIGNATURE recSigner: %s", recoverSigner(message, signature));
            console.logBytes(signature);
            revert BridgeBase__FinalizationFailed("wrong signature");
        }

        if (tokenTo == maxAddress) {
            // native token
            vault.unlockNative(to, amount);
        } else {
            if (!TokenFactory(factory).isBridgedToken(tokenTo)) {
                // bridge token
                vault.unlockToken(to, tokenFrom, amount);
            } else {
                // erc20 token
                vault.mint(to, tokenTo, amount);
            }
        }
        // _mint(from, to, tokenFrom, tokenTo, amount, nonce, signature);
    }

    // MOCK FEES ESTIMATION
    function simulateOperation() public view returns (uint256) {
        return Storage(s_storage).getUint(Storage(s_storage).getKey("opFees", block.chainid));
    }

    function computeFees() public view returns (uint256) {
        uint256 simulatedOpFees = simulateOperation();
        return simulatedOpFees;
    }

    // should be receive or fallback !! to save gas
    function depositFees(
        bytes32 operationHash,
        // OperationParams calldata operationParams,
        uint256 chainIdFrom // if we change the storage to have the chainId as first key
            // uint256 initBlock, // ??
            // uint256 confirmationBlock // ??
    ) external payable {
        address relayer = Storage(s_storage).getOperator("relayer");
        require(
            !RelayerBase(relayer).isDestinationOperationExist(operationHash), "RelayerBase: operation already exists"
        );

        // address tokenTOADD = address(0);
        uint256 fees = computeFees();
        require(msg.value == fees, "RelayerBase: invalid fees");

        Vault vault = Vault(Storage(s_storage).getOperator("vault"));
        try vault.depositOperationFee{value: msg.value}() {
            RelayerBase(relayer).lockDestinationFees(operationHash, chainIdFrom);
        } catch {
            RelayerBase(relayer).emitCancelOperation(operationHash, chainIdFrom);
        }
    }

    function cancelBridgeDeposit(address user, address tokenFrom, uint256 amount) external onlyAdminOrBridge {
        Vault vault = Vault(Storage(s_storage).getOperator("vault"));
        vault.cancelDeposit(user, tokenFrom, amount);
    }

    function finalizeBridgeDeposit(address user, address tokenFrom, uint256 amount) external onlyAdminOrBridge {
        Vault vault = Vault(Storage(s_storage).getOperator("vault"));
        vault.finalizeDeposit(user, tokenFrom, amount);
    }

    // function redeemUserDeposit(bytes32 hash, address tokenFrom, address user, uint256 amount) external  {
    //     Vault vault = Vault(Storage(s_storage).getOperator("vault"));
    //     vault.redeemUserDeposit(tokenFrom, user, amount);
    // }

    function getNewUserNonce(address user) external view returns (uint256) {
        return nextUserNonce[user];
    }
}
