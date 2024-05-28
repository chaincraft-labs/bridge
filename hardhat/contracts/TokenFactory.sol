// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BridgedToken.sol";
import "./Storage.sol";

/**
 * Contract to create new bridged tokens
 */
contract TokenFactory {
    address public s_storageAddress;

    mapping(address => bool) public IsBridgedToken;
    address[] public BridgedTokens;

    modifier onlyAdmin() {
        require(Storage(s_storageAddress).isAdmin(msg.sender), "TokenFactory: caller is not the admin");
        _;
    }

    event BridgeTokenCreated(address indexed token, string name, string symbol, address owner);

    constructor(address storageAddress) {
        // first deployed is storage so admin of storage should be the admin of the factory and msg.sender
        // store the storage address
        // check is isAdmin(msg.sender) in the storage
        s_storageAddress = storageAddress;
        if (!Storage(s_storageAddress).isAdmin(msg.sender)) {
            revert("TokenFactory: caller is not the admin");
        }
    }

    // function updateAdmin(address newAdmin) external onlyAdmin {
    //     admin = newAdmin;
    // }

    // function updateBridge(address newBridge) external onlyAdmin {
    //     bridge = newBridge;
    // }

    // Factory is the owner of the token
    function createToken(string memory name, string memory symbol, uint256 originChainId, address originAddress)
        external
        onlyAdmin
        returns (address)
    {
        // originChain != 0
        if (originChainId == 0) {
            revert("TokenFactory: originChainId is 0");
        }
        // check name and symbol are not empty

        BridgedToken token = new BridgedToken(name, symbol);

        // transfer ownership to the bridge
        // token.updateAdmin(bridge);
        // IsBridgedToken[address(token)] = true;
        // BridgedTokens.push(address(token));
        // updtae in storage (REMOVE UNUSED FUNCTIONS !!)
        Storage(s_storageAddress).addBridgedTokenList(address(token));
        Storage(s_storageAddress).setBridgedToken(address(token), true);
        Storage(s_storageAddress).addTokenList(address(token));
        Storage(s_storageAddress).setBridgedTokenToChainId(address(token), originChainId);
        Storage(s_storageAddress).setAuthorizedToken(address(token), true);
        // RENAME setTokenOnChainId !!! the global mapping of token equivalence
        Storage(s_storageAddress).setTokenOnChainId(symbol, originChainId, originAddress);

        // transfert ownership to Vault
        address vault = Storage(s_storageAddress).getOperator("vault");
        BridgedToken(token).updateAdmin(vault);

        emit BridgeTokenCreated(address(token), name, symbol, vault);
        return address(token);
    }

    //updtat list... storage

    // function mint(address token, address to, uint256 amount) external onlyBridge {
    //     BridgedToken(token).mint(to, amount);
    // }

    // function burn(address token, address owner, uint256 amount) external onlyBridge {
    //     BridgedToken(token).burn(owner, amount);
    // }

    // function transfer(address token, address to, uint256 amount) external onlyBridge {
    //     BridgedToken(token).transfer(to, amount);
    // }

    // function transferFrom(address token, address from, address to, uint256 amount) external onlyBridge {
    //     BridgedToken(token).transferFrom(from, to, amount);
    // }

    // function approve(address token, address spender, uint256 amount) external onlyBridge {
    //     BridgedToken(token).approve(spender, amount);
    // }

    // function getBridgedTokens() external view returns (address[] memory) {
    //     return BridgedTokens;
    // }

    // function isBridgedToken(address token) external view returns (bool) {
    //     return IsBridgedToken[token];
    // }
}
