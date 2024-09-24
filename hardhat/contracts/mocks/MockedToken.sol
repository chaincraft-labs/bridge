//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../BridgedToken.sol";

/**
 * @title MockedToken
 * @notice ONLY USED FOR DEV OR TEST CONTEXT

 * @dev Used to mock DAI and other tokens on their native chain
 * @dev All the supply is given to 'supplyHolder' at creation
 */
contract MockedToken is ERC20 {
    uint256 constant INTIAL_SUPPLY = 1_000_000 * 10 ** 18;
    address immutable s_supplyHolder;

    constructor(address supplyholder, string memory tokenName, string memory tokenSymbol)
        ERC20(tokenName, tokenSymbol)
    {
        s_supplyHolder = supplyholder;
        _mint(supplyholder, INTIAL_SUPPLY);
    }
}
