// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BridgedToken.sol";
import "./Storage.sol";

error TokenFactory__CallerNotAdmin();
error TokenFactory__TokenCreationFailed(string message);
/**
 * @title TokenFactory
 * @notice This contract creates bridged tokens and stores created tokens.
 *
 * @dev Only the owner (admin of the bridge) can use the factory.
 * @dev The format of the token symbol is: cbSYM (c: first letter of the chain, SYM: symbol).
 */

contract TokenFactory {
    address private immutable s_storageAddress;
    Storage private immutable s_storage;

    mapping(address => bool) private s_isBridgedToken;
    mapping(string => address) private s_symbolToAddress;
    string[] private s_BridgedTokens;

    modifier onlyAdmin() {
        if (!s_storage.isRole("admin", msg.sender)) {
            revert TokenFactory__CallerNotAdmin();
        }
        _;
    }

    event BridgeTokenCreated(address indexed token, string name, string symbol, address owner);

    /**
     * @notice Constructor to set the storage address and ensure the sender is the bridge admin.
     *
     * @param storageAddress The address of the Storage contract.
     */
    constructor(address storageAddress) {
        s_storageAddress = storageAddress;
        s_storage = Storage(storageAddress);

        if (!s_storage.isRole("admin", msg.sender)) {
            revert("TokenFactory: caller is not the admin");
        }
    }

    /**
     * @notice Creates a new bridged token.
     *
     * @dev Admin should have added the chain and token to the authorized list of Storage before calling.
     * @dev Requires:
     * @dev - name and symbol are not empty strings.
     * @dev - the token has not already been deployed (address associated with the symbol is address 0).
     *
     * @dev Process:
     * @dev - Deploy the token.
     * @dev - Store the token data in the Storage contract.
     * @dev - Transfer ownership of the token to the Vault.
     * @dev - Update token data in Factory storage.
     *
     * @dev emit BridgeTokenCreated event.
     * @param name The name of the token.
     * @param symbol The symbol of the token.
     * @return address The address of the newly created token.
     */
    function createToken(string memory name, string memory symbol) external onlyAdmin returns (address) {
        if (bytes(name).length == 0 || bytes(symbol).length == 0) {
            revert TokenFactory__TokenCreationFailed("Name or symbol is empty");
        }

        if (s_symbolToAddress[symbol] != address(0)) {
            revert TokenFactory__TokenCreationFailed("Token symbol already exists");
        }

        BridgedToken token = new BridgedToken(name, symbol);

        s_storage.addNewTokenAddressByChainId(name, block.chainid, address(token));

        address vault = s_storage.getOperator("vault");
        BridgedToken(token).updateAdmin(vault);

        s_BridgedTokens.push(symbol);
        s_isBridgedToken[address(token)] = true;
        s_symbolToAddress[symbol] = address(token);

        emit BridgeTokenCreated(address(token), name, symbol, vault);
        return address(token);
    }

    /**
     * @notice Gets the list of bridged tokens.
     *
     * @return string[] The array of bridged token symbols.
     */
    function getTokenList() external view returns (string[] memory) {
        return s_BridgedTokens;
    }

    /**
     * @notice Checks if a given address is a bridged token.
     *
     * @param token The address of the token to check.
     * @return bool True if the token is a bridged token, false otherwise.
     */
    function isBridgedToken(address token) external view returns (bool) {
        return s_isBridgedToken[token];
    }

    /**
     * @notice Gets the address of a token given its symbol.
     *
     * @param symbol The symbol of the token.
     * @return address The address of the token associated with the symbol.
     */
    function getTokenAddress(string memory symbol) external view returns (address) {
        return s_symbolToAddress[symbol];
    }

    /**
     * @notice Gets the address of the storage contract.
     *
     * @return address The address of the storage contract.
     */
    function getStorageAddress() external view returns (address) {
        return s_storageAddress;
    }
}
