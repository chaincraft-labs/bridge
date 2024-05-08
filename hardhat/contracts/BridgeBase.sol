// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BridgeBase {
    constructor() {}

    function mint(address to, uint256 amount) external {}

    function burn(address owner, uint256 amount) external {}

    function lock(address to, uint256 amount) external {}

    function unlock(address owner, uint256 amount) external {}

    // Bridge receiving tokens to bridge
    function bridgeToken(address tokenAddress, address to, uint256 amount, uint256 chainId) external {}

    function bridgeNative(address to, uint256 chainId) external payable {}
    receive() external payable {}

    fallback() external payable {}

    // Bridge recieving call from other chain
    function bridgeFinalize(address tokenAddress, address to, uint256 amount, uint256 chainId) external {}
}
