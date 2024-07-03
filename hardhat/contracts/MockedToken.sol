//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BridgedToken.sol";

/**
 * DAI token on Eth tesnet
 */
contract MockedToken is ERC20 {
    // testing
    uint256 constant INTIAL_SUPPLY = 1000000 * 10 ** 18;
    address immutable s_supplyHolder;

    constructor(address supplyholder, string memory tokenName, string memory tokenSymbol)
        ERC20(tokenName, tokenSymbol)
    {
        s_supplyHolder = supplyholder;
        // testing
        _mint(supplyholder, INTIAL_SUPPLY);
    }
}
