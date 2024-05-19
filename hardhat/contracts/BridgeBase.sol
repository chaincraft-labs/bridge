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

// error BridgeBase__DepositNativeWithZeroValue();
// error BridgeBase__DepositTokenWithNonZeroValue();
// error BridgeBase__DepositTokenWithInsufficientBalance();
// error BridgeBase__DepositTokenWithInsufficientAllowance();
error BridgeBase__DepositFailed(string message);
error BridgeBase__FinalizationFailed(string message);
error BridgeBase__UnlockFailed(string message);

contract BridgeBase {
    address public s_relayer;
    address public s_admin;
    address public s_oracle; //s_serverWallet;
    address public s_factory;
    address public s_storage;
    // @dev deposited tokens
    // @dev user => chainId => tokenAddress => amount
    mapping(address => mapping(uint256 => mapping(address => uint256))) public deposited;
    // @dev authorized tokens (add(0) for native token)
    mapping(address => bool) public authorizedTokens;
    mapping(uint256 => bool) public authorizedChains;
    mapping(uint256 => address) public s_chainId; // remove
    //or
    // mapping(address token => mapping(uint256 chainId => bool)) public authorizedTokens;
    // @dev bridged tokens (minted on deposit and burned on withdraw)
    mapping(address => bool) public bridgedTokens;
    address[] public bridgedTokensList;
    // nonce management
    // mapping(address user => uint256 nonce) public nonces;
    //or
    mapping(address user => mapping(uint256 => bool) nonce) public nonces; // destination side
    //or by chain also
    // mapping(address user => mapping(uint256 => mapping(uint256 => bool)) nonce) public nonces;
    // or with hash (user, chainId) and bitset of nonce ?
    // tempo actual nonce to process
    mapping(address user => uint256) public actualNonce; // origin side

    mapping(address tokenHere => mapping(uint256 chainId => address tokenThere)) public tokenMapping;
    address[] public tokensList;
    uint256[] public chainIdsList;

    // MAke Access control instead
    modifier onlyAdmin() {
        require(msg.sender == admin, "only admin");
        _;
    }

    modifier onlyAuthorizedToken(address tokenAddress) {
        require(authorizedTokens[tokenAddress], "unauthorized token");
        _;
    }

    modifier onlyAuthorizedChain(uint256 chainId) {
        require(authorizedChains[chainId], "unauthorized chain");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == s_oracle, "only oracle");
        _;
    }

    modifier onlyRelayer() {
        require(msg.sender == s_relayer, "only relayer");
        _;
    }

    modifier onlyAdminOrBridge() {
        require(msg.sender == s_admin || msg.sender == s_relayer, "only admin or bridge");
        _;
    }

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 chainId,
        address tokenFrom,
        address tokenTo,
        uint256 amount,
        uint256 timestamp,
        uint256 nonce
    );
    event Finalized(
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

    event RelayerChanged(address newRelayer);
    event OracleChanged(address newOracle);
    event TokenAuthorizationChanged(address tokenAddress, bool newAuthorization);
    event ChainAuthorizationChanged(uint256 chainId, bool newAuthorization);
    event TokenMappingChanged(address tokenHere, uint256 chainId, address tokenThere);

    // oracle is the server wallet
    // at the moment deal with one relayer and one oracle (changing it = remove the old one)
    // constructor(address relayer, address oracle, address factory, address storage) {
    //     s_oracle = s_oracle;
    //     s_relayer = relayer;
    //     s_factory = factory;
    //     s_admin = msg.sender;
    //     s_storage = storage;
    // }
    constructor(address storageAddress) {
        // first deployed is storage so admin of storage should be the admin of the factory and msg.sender
        // store the storage address
        // check is isAdmin(msg.sender) in the storage
        s_storage = storageAddress;
        if (!Storage(s_storage).isAdmin(msg.sender)) {
            revert("TokenFactory: caller is not the admin");
        }
    }

    // function setNewRelayer(address newRelayer) external onlyAdmin {
    //     s_relayer = newRelayer;
    //     emit RelayerChanged(newRelayer);
    // }

    // function setNewOracle(address newOracle) external onlyAdmin {
    //     s_oracle = newOracle;
    //     emit OracleChanged(newOracle);
    // }

    //****************************************************************** */
    //
    //              TOKEN FACTORY
    //
    //****************************************************************** */

    // ?? Admin call factory to create and factory set auth in bridge ?? or
    // ?? Admin call this funciton in bridge and bridge call factory ??
    /*
     * At the moment Bridge is responsible for deploying the bridged token, managing
     * initialization and finalization of the bridge operation.
     * Perhaps a separate contract to serve as factory and vault ? => manage access accordingly
     * OR have a token Factory and trasfer the ownership to the bridge contract
     */
    // /**
    //  * @notice deploy a new bridged token
    //  * @dev allow the bridge to mint and burn the token
    //  * @param name token name
    //  * @param symbol token symbol
    //  * @param decimals token decimals
    //  */
    // function deployBridgedToken(string memory name, string memory symbol, uint8 decimals) external onlyAdmin {
    //     address wewToken = TokenFactory(s_factory).createToken(name, symbol);
    //     authorizedTokens[wewToken] = true;
    // }

    //check add is a contract
    function isContract(address _add) internal view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_add)
        }
        return size > 0;
    }

    // function setTokenAuthorization(address tokenAddress, bool authorization) public onlyAdminOrBridge {
    //     require(isContract(tokenAddress), "not a contract");
    //     authorizedTokens[tokenAddress] = authorization;
    //     emit TokenAuthorizationChanged(tokenAddress, authorization);
    // }

    // function registerBridgedToken(address tokenAddress) public onlyAdmin {
    //     bridgedTokens[tokenAddress] = true;
    // }

    // function removeBridgedToken(address tokenAddress) public onlyAdmin {
    //     bridgedTokens[tokenAddress] = false;
    // }

    // function setChainAuthorization(uint256 chainId, bool authorization) public onlyAdmin {
    //     authorizedChains[chainId] = authorization;
    //     emit ChainAuthorizationChanged(chainId, authorization);
    // }

    // // used to check correct data eq between chains for the same token
    // function setMappedToken(address tokenHere, uint256 chainId, address tokenThere) public onlyAdmin {
    //     require(authorizedTokens[tokenHere], "unauthorized token");
    //     require(authorizedChains[chainId], "unauthorized chain");
    //     tokenMapping[tokenHere][chainId] = tokenThere;
    //     emit TokenMappingChanged(tokenHere, chainId, tokenThere);
    // }

    // function isCorrectTokenMapping(address tokenHere, uint256 chainId, address tokenThere) public view returns (bool) {
    //     return tokenMapping[tokenHere][chainId] == tokenThere;
    // }
    //****************************************************************** */
    //
    //              DEPOSIT SIDE (init bridge operation)
    //
    //****************************************************************** */

    // max value of uint8 = 255
    // which uint type to contain : 1155511 => uint32 wich is 4294967295

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
    function bridge(address tokenAddress, uint256 amount, uint256 chainId, bytes calldata signature) external payable {
        // if (!authorizedTokens[tokenAddress]) {
        if (!Storage(s_storage).getAuthorizedToken(tokenAddress)) {
            revert BridgeBase__DepositFailed("unauthorized token");
        }
        // if (!authorizedChains[chainId]) {
        if (!Storage(s_storage).getAuthorizedChain(chainId)) {
            revert BridgeBase__DepositFailed("invalid chainId");
        }
        address vault = Storage(s_storage).getOperator("vault");

        if (tokenAddress == address(0)) {
            // native token
            if (msg.value == 0) {
                revert BridgeBase__DepositFailed("Native needs non zero value");
            }
            if (msg.sender.balance < msg.value) {
                revert BridgeBase__DepositFailed("Insufficient balance");
            }
            // _lockNative(msg.sender, chainId);
            Vault(vault).depositNative(msg.sender);
        } else {
            // erc20 token
            if (msg.value > 0) {
                revert BridgeBase__DepositFailed("Token needs zero value");
            }
            if (ERC20(tokenAddress).balanceOf(msg.sender) < amount) {
                revert BridgeBase__DepositFailed("Insufficient balance");
            }
            // ask allowance
            bool res = ERC20(tokenAddress).approve(vault, amount);
            if (!res) {
                revert BridgeBase__DepositFailed("Initial allowance failed");
            }

            if (!Storage(s_storage).getBridgedToken(tokenAddress)) {
                // if (!bridgedTokens[tokenAddress]) {
                // _lockToken(tokenAddress, msg.sender, amount, chainId);
                Vault(vault).depositToken(msg.sender, tokenAddress, amount);
            } else {
                // bridge token
                // burn the bridge token
                // SHOULD BE SENT to the vault and burn ONLY when FINALIZED
                // To let user reedem if op is CANCELED
                // _burn(tokenAddress, msg.sender, amount, chainId);
                Vault(vault).burn(tokenAddress, msg.sender, amount);
            }
        }

        // @todo when setAuthorizedToken => set the mapping to otherchains!!!
        // fetch token and the other chain
        // address tokenTo = getTokenByChain(tokenAddress, chainId);
        address tokenTo = Storage(s_storage).getTokenOnChainId(tokenAddress, chainId);
        // NONCE CHOOSE WHO MANAGE!!!!
        uint256 nonce = actualNonce[msg.sender]++;
        RelayerBase(s_relayer).register(
            msg.sender, msg.sender, tokenAddress, tokenTo, amount, chainId, nonce, signature
        );
    }

    // /*
    //  * These function should not be called directly !! checks are done into the bridge function
    //  */
    // /**
    //  * @notice receive native token and update balance mappings
    //  */
    // function _lockNative(address to, uint256 chainId) internal {
    //     deposited[msg.sender][chainId][address(0)] += msg.value;
    //     // uint256 nonce = actualNonce[msg.sender]++;
    //     // // emit Transfer(msg.sender, to, chainId, address(0), msg.value, block.timestamp, nonce);
    //     // RelayerBase(s_relayer).registerTx(msg.sender, to, chainId, address(0), msg.value, nonce);
    // }

    // function _lockToken(address tokenAddress, address to, uint256 amount, uint256 chainId) internal {
    //     deposited[msg.sender][chainId][tokenAddress] += amount;
    //     bool res = ERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
    //     // uint256 nonce = actualNonce[msg.sender]++;

    //     if (!res) {
    //         revert BridgeBase__DepositFailed("lock");
    //     }
    //     // emit Transfer(msg.sender, to, chainId, tokenAddress, amount, block.timestamp, nonce);
    // }

    // function _burn(address tokenAddress, address owner, uint256 amount, uint256 chainId) internal {
    //     // deposited[owner][chainId][tokenAddress] -= amount;
    //     BridgedToken(tokenAddress).burn(owner, amount);
    //     // uint256 nonce = actualNonce[msg.sender]++;
    //     // if (!res) {
    //     //     revert BridgeBase__DepositFailed("burn");
    //     // }
    //     // emit Transfer(owner, address(0), chainId, tokenAddress, amount, block.timestamp, nonce);
    // }

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
    function finalize(
        address from,
        address to,
        address tokenFrom,
        address tokenTo,
        uint256 amount,
        uint256 chainId,
        uint256 nonce,
        bytes calldata signature
    )
        // ) external onlyOracle {
        external
        onlyRelayer
    {
        // !!!!!!!!!!!!!!!
        // checker les params // avoir un process pour certifier les params
        // !!!!!!!!!!

        // SHOULD NOT OCCUR !!! => (manage this case)
        // when calling the relayer ?? to approve and transfert fees the oher side.
        // ?? check if we have the liquidity ?? and send the result with the approve confirmation
        if (!authorizedTokens[tokenTo]) {
            revert BridgeBase__FinalizationFailed("unauthorized token");
        }

        bytes32 message = prefixed(keccak256(abi.encodePacked(from, to, tokenFrom, tokenTo, amount, chainId, nonce)));
        if (recoverSigner(message, signature) != from) {
            revert BridgeBase__FinalizationFailed("wrong signature");
        }
        if (nonces[from][nonce]) {
            revert BridgeBase__FinalizationFailed("transfer already processed");
        }
        nonces[from][nonce] = true;

        if (tokenTo == address(0)) {
            // native token
            _unlockNative(from, to, tokenFrom, tokenTo, amount, chainId, nonce, signature);
        } else {
            if (!bridgedTokens[tokenTo]) {
                // bridge token
                _unlockToken(from, to, tokenFrom, tokenTo, amount, chainId, nonce, signature);
            } else {
                // erc20 token
                _mint(from, to, tokenFrom, tokenTo, amount, chainId, nonce, signature);
            }
        }
        // _mint(from, to, tokenFrom, tokenTo, amount, nonce, signature);
    }

    /*
     * These function should not be called directly !! checks are done into the finalize function
     */
    function _unlockNative(
        address from,
        address to,
        address tokenFrom,
        address tokenTo,
        uint256 amount,
        uint256 chainId,
        uint256 nonce,
        bytes calldata signature
    ) internal {
        // bytes32 message = prefixed(keccak256(abi.encodePacked(from, to, amount, nonce)));
        // require(recoverSigner(message, signature) == from, "wrong signature");
        // require(nonces[from][nonce] == false, "transfer already processed");
        // nonces[from][nonce] = true;
        // payable(to).transfer(amount);
        // transfer via call
        if (address(this).balance < amount) {
            revert BridgeBase__UnlockFailed("Insufficient balance");
        }
        (bool res,) = to.call{value: amount}("");
        if (!res) {
            revert BridgeBase__UnlockFailed("Final transfer failed");
        }
        emit Finalized(from, to, tokenFrom, tokenTo, amount, chainId, nonce, signature, block.timestamp);
    }

    function _unlockToken(
        address from,
        address to,
        address tokenFrom,
        address tokenTo,
        uint256 amount,
        uint256 chainId,
        uint256 nonce,
        bytes calldata signature
    ) internal {
        // bytes32 message = prefixed(keccak256(abi.encodePacked(from, to, amount, nonce)));
        // require(recoverSigner(message, signature) == from, "wrong signature");
        // require(nonces[from][nonce] == false, "transfer already processed");
        // nonces[from][nonce] = true;
        bool res = ERC20(tokenTo).transfer(to, amount);
        if (!res) {
            revert BridgeBase__UnlockFailed("Final transfer failed");
        }
        emit Finalized(from, to, tokenFrom, tokenTo, amount, chainId, nonce, signature, block.timestamp);
    }

    function _mint(
        address from,
        address to,
        address tokenFrom,
        address tokenTo,
        uint256 amount,
        uint256 chainId,
        uint256 nonce,
        bytes calldata signature
    ) internal {
        // bytes32 message = prefixed(keccak256(abi.encodePacked(from, to, amount, nonce)));
        // require(recoverSigner(message, signature) == from, "wrong signature");
        // require(nonces[from][nonce] == false, "transfer already processed");
        // nonces[from][nonce] = true;
        BridgedToken(tokenTo).mint(to, amount);
        emit Finalized(from, to, tokenFrom, tokenTo, amount, chainId, nonce, signature, block.timestamp);
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

    // when getting the corresponding token and the destination
    // must chek if tokenFrom is authorized
    // if not risk is to have address(0) as tokenTo, wrong value if token From is not AFT (by example)
    function getTokenByChain(address tokenFrom, uint256 chainId) public view returns (address) {
        require(authorizedTokens[tokenFrom], "unauthorized token");
        return tokenMapping[tokenFrom][chainId];
    }
}
