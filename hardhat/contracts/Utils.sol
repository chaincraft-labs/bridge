// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

contract Utils {
    // function toBytes32(uint256 x) public pure returns (bytes32) {
    //     return bytes32(uint256(x));
    // }

    // function toUint256(bytes32 x) public pure returns (uint256) {
    //     return uint256(x);
    // }

    // BlockStep bitmap
    // uint256 = 8 uint32

    // Function to set a block step
    // function setBlockStep(uint8 index, uint32 value) public {
    //     require(index < 4, "Index out of bounds");
    //     uint256 shiftedValue = uint256(value) << (index * 32);
    //     uint256 mask = uint256(0xFFFFFFFF) << (index * 32);
    //     blockStep = (blockStep & ~mask) | shiftedValue;
    // }

    // // Function to get a block step
    // function getBlockStep(uint8 index) public view returns (uint32) {
    //     require(index < 4, "Index out of bounds");
    //     return uint32((blockStep >> (index * 32)) & 0xFFFFFFFF);
    // }

    function isContract(address _add) internal view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_add)
        }
        return size > 0;
    }

    // hash functions
    function computeOperationHash(
        address from,
        address to,
        uint256 chainIdFrom,
        uint256 chainIdTo,
        // address tokenFrom,
        // address tokenTo,
        string memory tokenName,
        uint256 amount,
        // uint256 fee;
        uint256 nonce
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(from, to, chainIdFrom, chainIdTo, tokenName, amount, nonce));
    }
    //replace in brdige to let internal other function and make library
    // Nonce should be actual + 1 as for op creation

    // function getMessageToSign(
    function getMessageHash(
        address sender,
        address receiver,
        uint256 chainIdFrom,
        uint256 chainIdTo,
        // address tokenFrom,
        // address tokenTo,
        string memory tokenName,
        uint256 amount,
        uint256 nonce
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(sender, receiver, chainIdFrom, chainIdTo, tokenName, amount, nonce));
        // return prefixed(keccak256(abi.encodePacked(sender, receiver, chainIdFrom, chainIdTo, tokenName, amount, nonce)));
    }

    // function getMessageToSignPrefixed(
    function getPrefixedMessageHash(
        address sender,
        address receiver,
        uint256 chainIdFrom,
        uint256 chainIdTo,
        // address tokenFrom,
        // address tokenTo,
        string memory tokenName,
        uint256 amount,
        uint256 nonce
    ) public pure returns (bytes32) {
        // return keccak256(abi.encodePacked(sender, receiver, chainIdFrom, chainIdTo, tokenName, amount, nonce));
        // return prefixed(keccak256(abi.encodePacked(sender, receiver, chainIdFrom, chainIdTo, tokenName, amount, nonce)));

        return prefixed(getMessageHash(sender, receiver, chainIdFrom, chainIdTo, tokenName, amount, nonce));
    }

    function prefixed(bytes32 hash) public pure returns (bytes32) {
        // return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
        // signMessage from ethers/hardhat dont put 32 at the end :
        //https://docs.ethers.org/v5/api/signer/#Signer-signMessage
        // return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n", hash));

        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    function recoverSigner(bytes32 message, bytes memory sig) public pure returns (address) {
        uint8 v;
        bytes32 r;
        bytes32 s;
        // (v, r, s) = splitSignature(sig);
        // (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        (r, s, v) = splitSignature(sig);

        return ecrecover(message, v, r, s);
    }

    function splitSignature(bytes memory sig) internal pure returns (bytes32, bytes32, uint8) {
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
        // return (v, r, s);
        return (r, s, v);
    }
}
