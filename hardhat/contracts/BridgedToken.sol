//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/*
 * @todo: 
 * - Add Ownable & Burnable
 * - batchMint and burn ? (to have a better gas usage for minting and burning)
 * - Add a way to pause the contract
 * - Add a way to change the admin (admin should be the bridge contract address)
 * - ? Factory contract to create new bridged tokens ? (handle special cases)
 * - remove CustomTransfer event
 */
contract BridgedToken is ERC20 {
    address public owner; // bridge contract address

    event CustomTransfer(address indexed from, address indexed to, uint256 amount);
    event OwnerUpdated(string tokenName, address newAdmin);

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        owner = msg.sender;
    }

    function updateAdmin(address newAdmin) external {
        require(msg.sender == owner, "only admin owner");
        owner = newAdmin;
        // name of token
        string memory tokenName = name();
        emit OwnerUpdated(tokenName, newAdmin);
    }

    function getOwner() external view returns (address) {
        return owner;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == owner, "only admin owner");
        _mint(to, amount);
    }

    function burn(address tokenOwner, uint256 amount) external {
        require(msg.sender == owner, "only admin owner");
        _burn(tokenOwner, amount);
    }
    // TESTING: to give supply to an address

    function minttest(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
