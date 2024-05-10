// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

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
 * @todo:
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
 */
/**
 * @title BridgeBase contract
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
 */
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BridgedToken.sol";

error BridgeBase__DepositNativeWithZeroValue();
error BridgeBase__DepositTokenWithNonZeroValue();
error BridgeBase__DepositTokenWithInsufficientBalance();
error BridgeBase__DepositTokenWithInsufficientAllowance();
error BridgeBase__DepositFailed(string message);

contract BridgeBase {
    // @dev deposited tokens
    // @dev user => chainId => tokenAddress => amount
    mapping(address => mapping(uint256 => mapping(address => uint256))) public deposited;
    // @dev authorized tokens (add(0) for native token)
    mapping(address => bool) public authorizedTokens;
    // @dev bridged tokens (minted on deposit and burned on withdraw)
    mapping(address => bool) public bridgeTokens;
    // nonce management
    // mapping(address user => uint256 nonce) public nonces;
    //or
    mapping(address user => mapping(uint256 => bool) nonce) public nonces;
    //or by chain also
    // mapping(address user => mapping(uint256 => mapping(uint256 => bool)) nonce) public nonces;
    // or with hash (user, chainId) and bitset of nonce ?
    // tempo actual nonce to process
    mapping(address user => uint256) public actualNonce;

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 chainId,
        address tokenAddress,
        uint256 amount,
        uint256 timestamp,
        uint256 nonce
    );
    event Finalized(address from, address to, uint256 amount, uint256 timestamp, uint256 nonce, bytes signature);

    constructor() {}

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
     * @param tokenAddress token address
     * @param amount token amount
     * @param chainId chain id
     */
    function bridge(address tokenAddress, uint256 amount, uint256 chainId) external payable {
        if (tokenAddress == address(0)) {
            // native token
            if (msg.value == 0) {
                revert BridgeBase__DepositNativeWithZeroValue();
            }
            _lockNative(msg.sender, chainId);
        } else {
            // erc20 token
            if (msg.value > 0) {
                revert BridgeBase__DepositTokenWithNonZeroValue();
            }
            if (ERC20(tokenAddress).balanceOf(msg.sender) < amount) {
                revert BridgeBase__DepositTokenWithInsufficientBalance();
            }
            // ask allowance
            bool res = ERC20(tokenAddress).approve(address(this), amount);
            if (!res) {
                revert BridgeBase__DepositTokenWithInsufficientAllowance();
            }

            if (!bridgeTokens[tokenAddress]) {
                _lockToken(tokenAddress, msg.sender, amount, chainId);
            } else {
                // bridge token
                // burn the bridge token
                _burn(tokenAddress, msg.sender, amount, chainId);
            }
        }
    }

    /**
     * @notice receive native token and update balance mappings
     */
    function _lockNative(address to, uint256 chainId) internal {
        deposited[msg.sender][chainId][address(0)] += msg.value;
        uint256 nonce = actualNonce[msg.sender]++;
        emit Transfer(msg.sender, to, chainId, address(0), msg.value, block.timestamp, nonce);
    }

    function _lockToken(address tokenAddress, address to, uint256 amount, uint256 chainId) internal {
        deposited[msg.sender][chainId][tokenAddress] += amount;
        bool res = ERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        uint256 nonce = actualNonce[msg.sender]++;

        if (!res) {
            revert BridgeBase__DepositFailed("lock");
        }
        emit Transfer(msg.sender, to, chainId, tokenAddress, amount, block.timestamp, nonce);
    }

    function _burn(address tokenAddress, address owner, uint256 amount, uint256 chainId) internal {
        deposited[owner][chainId][tokenAddress] -= amount;
        BridgedToken(tokenAddress).burn(owner, amount);
        uint256 nonce = actualNonce[msg.sender]++;
        // if (!res) {
        //     revert BridgeBase__DepositFailed("burn");
        // }
        emit Transfer(owner, address(0), chainId, tokenAddress, amount, block.timestamp, nonce);
    }

    //nonces = processedNonces
    //AJOUTER LE CHAINID
    // ATTENTION trick pour native token  add bridgeNative => native !!!
    // Ajouter transfer de fee au server wallet // avoir un registre de server wallet authorizé
    // Ajouter ?? mapping de correspondance add token add token / chain ?

    /**
     * @dev Finalize the transfer (called by a bridge server)
     * @dev if the signature is valid, the transfer is processed
     * @dev checks if the token to transfer is a bridge token / erc20 or native token
     */
    function finalize(address from, address to, address token, uint256 amount, uint256 nonce, bytes calldata signature)
        external
    {
        if (token == address(0)) {
            // native token
            _unlockNative(from, to, token, amount, nonce, signature);
        } else {
            if (!bridgeTokens[token]) {
                // bridge token
                _unlockToken(from, to, token, amount, nonce, signature);
            } else {
                // erc20 token
                _mint(from, to, token, amount, nonce, signature);
            }
        }
        _mint(from, to, token, amount, nonce, signature);
    }

    function _unlockNative(
        address from,
        address to,
        address token,
        uint256 amount,
        uint256 nonce,
        bytes calldata signature
    ) internal {
        bytes32 message = prefixed(keccak256(abi.encodePacked(from, to, amount, nonce)));
        require(recoverSigner(message, signature) == from, "wrong signature");
        require(nonces[from][nonce] == false, "transfer already processed");
        nonces[from][nonce] = true;
        // payable(to).transfer(amount);
        // transfer via call
        (bool res,) = to.call{value: amount}("");
        require(res, "transfer failed");
        emit Finalized(from, to, amount, block.timestamp, nonce, signature);
    }

    function _unlockToken(
        address from,
        address to,
        address token,
        uint256 amount,
        uint256 nonce,
        bytes calldata signature
    ) internal {
        bytes32 message = prefixed(keccak256(abi.encodePacked(from, to, amount, nonce)));
        require(recoverSigner(message, signature) == from, "wrong signature");
        require(nonces[from][nonce] == false, "transfer already processed");
        nonces[from][nonce] = true;
        bool res = ERC20(token).transfer(to, amount);
        if (!res) {
            revert BridgeBase__DepositFailed("unlock");
        }
        emit Finalized(from, to, amount, block.timestamp, nonce, signature);
    }

    function _mint(address from, address to, address token, uint256 amount, uint256 nonce, bytes calldata signature)
        internal
    {
        bytes32 message = prefixed(keccak256(abi.encodePacked(from, to, amount, nonce)));
        require(recoverSigner(message, signature) == from, "wrong signature");
        require(nonces[from][nonce] == false, "transfer already processed");
        nonces[from][nonce] = true;
        BridgedToken(token).mint(to, amount);
        emit Finalized(from, to, amount, block.timestamp, nonce, signature);
    }

    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    function recoverSigner(bytes32 message, bytes memory sig) internal pure returns (address) {
        uint8 v;
        bytes32 r;
        bytes32 s;
        (v, r, s) = splitSignature(sig);
        return ecrecover(message, v, r, s);
    }

    function splitSignature(bytes memory sig) internal pure returns (uint8, bytes32, bytes32) {
        require(sig.length == 65);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }
        return (v, r, s);
    }

    bool public isPausedBridge = false;
    bool public isPausedFinalize = false;
    address public admin;
    // admin functions (urgence pause, change admin, add authorized token, add bridge token, whithdraw token/native)

    // @dev pause the bridge function
    function pauseBridge() external {
        isPausedBridge = true;
    }

    function unpauseBridge() external {
        isPausedBridge = false;
    }

    function pauseFinalize() external {
        isPausedFinalize = true;
    }

    function unpauseFinalize() external {
        isPausedFinalize = false;
    }

    function pauseAll() external {
        isPausedBridge = true;
        isPausedFinalize = true;
    }

    function unpauseAll() external {
        isPausedBridge = false;
        isPausedFinalize = false;
    }

    // @dev change the admin address
    function changeAdmin(address newAdmin) external {
        require(msg.sender == admin, "only admin");
        admin = newAdmin;
    }

    // @dev add a token to the authorized tokens
    function addAuthorizedToken(address tokenAddress) external {
        require(msg.sender == admin, "only admin");
        authorizedTokens[tokenAddress] = true;
    }

    // @dev remove a token from the authorized tokens
    function removeAuthorizedToken(address tokenAddress) external {
        require(msg.sender == admin, "only admin");
        authorizedTokens[tokenAddress] = false;
    }

    // @dev add a token to the bridge tokens
    function addBridgeToken(address tokenAddress) external {
        require(msg.sender == admin, "only admin");
        bridgeTokens[tokenAddress] = true;
    }

    // @dev remove a token from the bridge tokens
    function removeBridgeToken(address tokenAddress) external {
        require(msg.sender == admin, "only admin");
        bridgeTokens[tokenAddress] = false;
    }

    // DISSOCIATE FEES AND VAULT LIQUIDITY !!

    // @dev withdraw native token
    function withdrawNative(uint256 amount) external {
        require(msg.sender == admin, "only admin");
        payable(admin).transfer(amount);
    }

    // @dev withdraw erc20 token
    function withdrawToken(address tokenAddress, uint256 amount) external {
        require(msg.sender == admin, "only admin");
        ERC20(tokenAddress).transfer(admin, amount);
    }
}
