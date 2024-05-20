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
    address public admin; // bridge contract address

    event CustomTransfer(address indexed from, address indexed to, uint256 amount);

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        admin = msg.sender;
    }

    function updateAdmin(address newAdmin) external {
        require(msg.sender == admin, "only admin");
        admin = newAdmin;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == admin, "only admin");
        _mint(to, amount);
    }

    function burn(address owner, uint256 amount) external {
        require(msg.sender == admin, "only admin");
        _burn(owner, amount);
    }
}
