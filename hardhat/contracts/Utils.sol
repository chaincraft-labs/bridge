// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

contract Utils {
    //************************* BIT OPERATIONS / PACKING ***********************/
    // This bloc of functions is in progress, not yet used
    // Contract too large
    // function toBytes32(uint256 x) public pure returns (bytes32) {
    //     return bytes32(uint256(x));
    // }

    // function toUint256(bytes32 x) public pure returns (uint256) {
    //     return uint256(x);
    // }

    // // Function to set a block step (4 blocknumber of uint64 by variable)
    // function setBlockStep(uint8 index, uint32 value, uint256 blockStep) public pure returns (uint256) {
    //     require(index < 4, "Index out of bounds");
    //     uint256 shiftedValue = uint256(value) << (index * 32);
    //     uint256 mask = uint256(0xFFFFFFFF) << (index * 32);
    //     blockStep = (blockStep & ~mask) | shiftedValue;
    //     return blockStep;
    // }

    // // // Function to get a block step
    // function getBlockStep(uint8 index, uint256 blockStep) public pure returns (uint32) {
    //     require(index < 4, "Index out of bounds");
    //     return uint32((blockStep >> (index * 32)) & 0xFFFFFFFF);
    // }

    //************************* CONTRACT HELPERS ***********************/

    function isContract(address _add) internal view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_add)
        }
        return size > 0;
    }

    //************************* HASH HELPERS ***********************/

    /**
     * @notice Gets the hash of inputs
     *
     * @dev It's used to get hash Id of operations
     *
     * @param sender sender of the tokens
     * @param receiver recipient
     * @param chainIdFrom origin chain id
     * @param chainIdTo destination chain id
     * @param tokenName name of the token as referenced in Storage (official token name)
     * @param amount token amount
     * @param nonce new user nonce to be used on origin chain
     */
    function getMessageHash(
        address sender,
        address receiver,
        uint256 chainIdFrom,
        uint256 chainIdTo,
        string memory tokenName,
        uint256 amount,
        uint256 nonce
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(sender, receiver, chainIdFrom, chainIdTo, tokenName, amount, nonce));
    }

    /**
     * @notice Gets the prefixed hash of inputs
     *
     * @param sender sender of the tokens
     * @param receiver recipient
     * @param chainIdFrom origin chain id
     * @param chainIdTo destination chain id
     * @param tokenName name of the token as referenced in Storage (official token name)
     * @param amount token amount
     * @param nonce new user nonce to be used on origin chain
     */
    function getPrefixedMessageHash(
        address sender,
        address receiver,
        uint256 chainIdFrom,
        uint256 chainIdTo,
        string memory tokenName,
        uint256 amount,
        uint256 nonce
    ) public pure returns (bytes32) {
        return prefixed(getMessageHash(sender, receiver, chainIdFrom, chainIdTo, tokenName, amount, nonce));
    }

    /**
     * @notice Prefix a msg hash
     *
     * /    * @dev signMessage from ethers/hardhat dont put 32 at the end :
     * @dev https://docs.ethers.org/v5/api/signer/#Signer-signMessage
     * @dev return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n", hash));
     *
     * @param hash hash to prefix
     * @return a hash: original hash prefixed
     */
    function prefixed(bytes32 hash) public pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    //************************* SIGNATURE HELPERS ***********************/

    /**
     * @notice Recovers the signer of a message
     *
     * @param message message signed by the signer
     * @param sig signature of the message by the signer
     * @return the address of the signer
     */
    function recoverSigner(bytes32 message, bytes memory sig) public pure returns (address) {
        uint8 v;
        bytes32 r;
        bytes32 s;

        (r, s, v) = splitSignature(sig);

        return ecrecover(message, v, r, s);
    }

    /**
     * @notice Splits a signature to extract r, s, v
     *
     * @param sig the signature
     * @return (r as bytes32, s as bytes32, v as uint8)
     */
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
        return (r, s, v);
    }
}
