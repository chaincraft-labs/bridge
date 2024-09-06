//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BridgedToken.sol";

// @todo REMOVE
/**
 * DAI token on Eth tesnet
 */
contract MockedDai is ERC20 {
    // testing
    uint256 constant INTIAL_SUPPLY = 1000000 * 10 ** 18;

    constructor(address supplyholder) ERC20("DAI Token", "DAI") {
        // testing
        _mint(supplyholder, INTIAL_SUPPLY);
    }
}
