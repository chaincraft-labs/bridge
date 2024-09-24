// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

contract Utils {
    // function toBytes32(uint256 x) public pure returns (bytes32) {
    //     return bytes32(uint256(x));
    // }

    // function toUint256(bytes32 x) public pure returns (uint256) {
    //     return uint256(x);
    // }

    // Nonce should be actual + 1 as for op creation
    function getMessageToSign(
        address sender,
        address receiver,
        uint256 chainIdFrom,
        uint256 chainIdTo,
        address tokenFrom,
        address tokenTo,
        uint256 amount,
        uint256 nonce
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(sender, receiver, chainIdFrom, chainIdTo, tokenFrom, tokenTo, amount, nonce));
    }

    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    function recoverSigner(bytes32 message, bytes memory sig) internal pure returns (address) {
        uint8 v;
        bytes32 r;
        bytes32 s;
        (v, r, s) = splitSignature(sig);
        return ecrecover(message, v, r, s);
    }

    function splitSignature(bytes memory sig) internal pure returns (uint8, bytes32, bytes32) {
        require(sig.length == 65);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }
        return (v, r, s);
    }
}
