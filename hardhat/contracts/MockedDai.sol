//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BridgedToken.sol";

/**
 * DAI token on Eth tesnet
 */
contract MockedDai is ERC20 {
    constructor() BridgedToken("DAI Token", "DAI") {}
}
