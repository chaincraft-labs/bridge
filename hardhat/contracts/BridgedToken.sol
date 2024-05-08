//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

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
