//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "./BridgedToken.sol";

// @todo REMOVE

/**
 * ETH token on Aft tesnet
 */
contract BridgedEth is BridgedToken {
    constructor() BridgedToken("ETH token", "aETH") {}
}
