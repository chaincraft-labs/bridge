//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BridgedToken.sol";

/**
 * DAI token on Eth tesnet
 */
contract MockedDai is ERC20 {
    constructor() ERC20("DAI Token", "DAI") {
        // testing
        _mint(msg.sender, 1000000 * 10 ** 18);
    }
}
