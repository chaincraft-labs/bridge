//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "./BridgedToken.sol";

/**
 * AFT token on Eth tesnet
 */
contract BridgedAft is BridgedToken {
    constructor() BridgedToken("AFT Token", "eAFT") {}
}
