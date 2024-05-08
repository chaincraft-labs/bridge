//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TokenBase.sol";

/**
 * AFT token on Eth tesnet
 */
contract TokenAft is TokenBase {
    constructor() TokenBase("AFT Token", "eAFT") {}
}
