//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "./TokenBase.sol";

/**
 * DAI token on Eth tesnet
 */
contract Dai is TokenBase {
    constructor() TokenBase("DAI Token", "DAI") {}
}
