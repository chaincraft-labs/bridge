// //SPDX-License-Identifier: MIT

// pragma solidity ^0.8.20;

// import "./BridgedToken.sol";

// /**
//  * DAI token on Aft tesnet
//  */
// contract BridgedDai is BridgedToken {
//     // event CustomTransfer(address indexed from, address indexed to, uint256 amount);

//     uint256 public constant INITIAL_SUPPLY = 1000000 * 10 ** 18;

//     constructor() BridgedToken("DAI Token", "aDAI") {
//         _mint(msg.sender, INITIAL_SUPPLY);
//     }

//     //when transfer emit a custom event
//     function transfer(address to, uint256 amount) public override returns (bool) {
//         // emit CustomTransfer(msg.sender, to, amount);
//         bool res = super.transfer(to, amount);
//         return res;
//     }
// }
