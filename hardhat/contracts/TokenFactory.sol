// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BridgedToken.sol";
import "./Storage.sol";

error TokenFactory__CallerNotAdmin();
error TokenFactory__TokenCreationFailed(string message);
/**
 * @title TokenFactory
 * @notice It creates bridged tokens and stores created tokens
 * @dev Only owner (admin of the bridge) can use the factory
 * @dev Format of token symbol: cbSYM (c: first letter of chain, SYM: symbol)
 */

contract TokenFactory {
    address private s_storageAddress;

    mapping(address => bool) private s_isBridgedToken;
    mapping(string => address) private s_symbolToAddress;
    string[] private s_BridgedTokens;

    modifier onlyAdmin() {
        if (!Storage(s_storageAddress).isRole("admin", msg.sender)) {
            revert TokenFactory__CallerNotAdmin();
        }
        _;
    }

    event BridgeTokenCreated(address indexed token, string name, string symbol, address owner);

    /**
     * @dev Set Storage address and check sender is the bridge admin
     */
    constructor(address storageAddress) {
        s_storageAddress = storageAddress;

        if (!Storage(s_storageAddress).isRole("admin", msg.sender)) {
            revert("TokenFactory: caller is not the admin");
        }
    }

    /**
     * @notice It creates a new BridgedToken
     * @dev Admin should have added chain and token in authorized list of Storage before calling
     * @dev Require:
     * @dev - name and symbol are not empty strings
     * @dev - not already deployed token (address associated to symbol is address 0)
     * @dev Process:
     * @dev - deploy the token
     * @dev - store the token data in Storage contract
     * @dev - transfer ownership of the token to Vault
     * @dev - update token data in Factory storage
     * @dev EMIT BridgeTokenCreated event
     * @param name: the name of the token
     * @param symbol: the symbol of the token
     * @return the address of the new token
     */
    function createToken(string memory name, string memory symbol) external onlyAdmin returns (address) {
        if (bytes(name).length == 0 || bytes(symbol).length == 0) {
            revert TokenFactory__TokenCreationFailed("Name or symbol is empty");
        }

        if (s_symbolToAddress[symbol] != address(0)) {
            revert TokenFactory__TokenCreationFailed("Token symbol already exists");
        }

        BridgedToken token = new BridgedToken(name, symbol);

        Storage(s_storageAddress).addNewTokenAddressByChainId(name, block.chainid, address(token));

        address vault = Storage(s_storageAddress).getOperator("vault");
        BridgedToken(token).updateAdmin(vault);

        s_BridgedTokens.push(symbol);
        s_isBridgedToken[address(token)] = true;
        s_symbolToAddress[symbol] = address(token);

        emit BridgeTokenCreated(address(token), name, symbol, vault);
        return address(token);
    }

    function getTokenList() external view returns (string[] memory) {
        return s_BridgedTokens;
    }

    function isBridgedToken(address token) external view returns (bool) {
        return s_isBridgedToken[token];
    }

    function getTokenAddress(string memory symbol) external view returns (address) {
        return s_symbolToAddress[symbol];
    }

    function getStorageAddress() external view returns (address) {
        return s_storageAddress;
    }
}
