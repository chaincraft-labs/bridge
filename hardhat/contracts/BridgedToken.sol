//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/*
 * @todo
 * - Add Ownable & Burnable + batchMint and burn (to decrease gas usage)
 * - Add a way to pause the contract
 * To manage pause/upgrade in case of hacks...
 * - add 'minter' => Factory keeps owner role, minter (Vault) can be updated
 * - updateMinter callable only by owner (Factory) => need same func in Factory callable by bridge admin
 * Renaming => owner / admin / minter
 */

error BridgedToken__OnlyOwner(string message);

/**
 * @title BridgedToken
 * @notice This is the token minted & burned by the bridge (the representation of a token
 *   on a chain other than its native chain)
 * @dev At creation, owner is Factory as only the factory can create new bridged tokens
 * @dev At initialization, Factory transfers ownership to Vault.
 * @dev Only Vault can mint/burn tokens
 */
contract BridgedToken is ERC20 {
    address private s_owner; //.................. Factory at creation then Vault

    modifier onlyOwner() {
        if (msg.sender != s_owner) {
            revert BridgedToken__OnlyOwner("caller not the owner");
        }
        _;
    }

    event OwnerUpdated(string tokenName, address newAdmin);

    constructor(string memory tokenName, string memory tokenSymbol) ERC20(tokenName, tokenSymbol) {
        s_owner = msg.sender;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address tokenOwner, uint256 amount) external onlyOwner {
        _burn(tokenOwner, amount);
    }

    function updateAdmin(address newAdmin) external onlyOwner {
        s_owner = newAdmin;

        string memory tokenName = name();
        emit OwnerUpdated(tokenName, newAdmin); // @todo OPTI name() without memory variable
    }

    function getOwner() external view returns (address) {
        return s_owner;
    }
}
