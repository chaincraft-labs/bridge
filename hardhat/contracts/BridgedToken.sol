//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

error BridgedToken__CallerNotOwner();

/**
 * @title BridgedToken
 * @notice This is the token minted & burned by the bridge.
 *
 * This token represents a token on a chain other than its native chain.
 *
 * @dev At creation, the owner is the Factory, as only the factory can create new bridged tokens.
 * @dev At initialization, the Factory transfers ownership to the Vault.
 * @dev Only the Vault can mint or burn tokens.
 */
contract BridgedToken is ERC20 {
    address private s_owner; // Factory at creation then Vault

    modifier onlyOwner() {
        if (msg.sender != s_owner) {
            revert BridgedToken__CallerNotOwner();
        }
        _;
    }

    event OwnerUpdated(string tokenName, address newAdmin);

    /**
     * @notice Constructor to create a new bridged token.
     *
     * @param tokenName The name of the bridged token.
     * @param tokenSymbol The symbol of the bridged token.
     */
    constructor(string memory tokenName, string memory tokenSymbol) ERC20(tokenName, tokenSymbol) {
        s_owner = msg.sender;
    }

    /**
     * @notice Mints new tokens to a specified address.
     *
     * @dev Only the owner can call this function to mint tokens.
     * @param to The address to which the minted tokens will be sent.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Burns tokens from a specified address.
     *
     * @dev Only the owner can call this function to burn tokens.
     * @param tokenOwner The address from which the tokens will be burned.
     * @param amount The amount of tokens to burn.
     */
    function burn(address tokenOwner, uint256 amount) external onlyOwner {
        _burn(tokenOwner, amount);
    }

    /**
     * @notice Updates the owner of the bridged token.
     *
     * @dev Only the current owner can call this function to update the owner.
     * @param newAdmin The address of the new owner.
     */
    function updateAdmin(address newAdmin) external onlyOwner {
        s_owner = newAdmin;

        emit OwnerUpdated(name(), newAdmin);
    }

    /**
     * @notice Returns the current owner of the bridged token.
     *
     * @return address The address of the current owner.
     */
    function getOwner() external view returns (address) {
        return s_owner;
    }
}
