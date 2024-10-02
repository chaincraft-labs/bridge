// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {TokenFactory} from "./TokenFactory.sol";

error Storage__NotAdmin();
error Storage__TokenNotInList(string tokenName);
error Storage__ChainIdNotInList(uint256 chainId);
error Storage__InvalidArrayLengthInParams(string functionName);
error Storage__TokenAlreadyInList(string tokenName);
error Storage__ChainIdAlreadyInList(uint256 chainId);
error Storage__TokenAddressAlreadySet(string tokenName, uint256 chainId);
error Storage__TokenAddressNotSet(string tokenName, uint256 chainId);

/**
 * @title Storage
 * @notice This contract is the 'eternal storage' of the bridge
 * @dev It stores the addresses of the tokens on the different chains
 * @dev It stores the block confirmation needed for each chain
 * @dev It stores the fees for each chain
 * @dev It stores the addresses of the operators
 */
contract Storage {
    //****************************************************************** */
    //
    //              STATE VARIABLES
    //
    //****************************************************************** */

    address constant MAX_ADDRESS = address(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF);

    mapping(bytes32 => uint256) internal s_uintStorage;
    mapping(bytes32 => bytes32) internal s_bytes32Storage;
    mapping(bytes32 => string) internal s_stringStorage;
    mapping(bytes32 => bytes) internal s_bytesStorage;
    mapping(bytes32 => address) internal s_addressStorage;
    mapping(bytes32 => bool) internal s_boolStorage;

    mapping(bytes32 => uint256[]) internal s_uintArrayStorage;
    mapping(bytes32 => string[]) internal s_stringArrayStorage;
    mapping(bytes32 => address[]) internal s_addressArrayStorage;

    //****************************************************************** */
    //
    //              EVENTS
    //
    //****************************************************************** */

    event Storage__TokenNameAdded(string tokenName);
    event Storage__ChainIdAdded(uint256 chainId);

    event Storage__TokenAddressSet(string tokenName, uint256 chainId, address tokenAddress);

    event Storage__UintDataChanged(bytes32 key, uint256 newValue);
    event Storage__AddressDataChanged(bytes32 key, address newValue);
    event Storage__StringDataChanged(bytes32 key, string newValue);
    event Storage__BoolDataChanged(bytes32 key, bool newValue);
    event Storage__BytesDataChanged(bytes32 key, bytes newValue);
    event Storage__Bytes32_DataChanged(bytes32 key, bytes32 newValue);

    event Storage__UintArrayDataChanged(bytes32 key, uint256 index, uint256 newValue);
    event Storage__AddressArrayDataChanged(bytes32 key, uint256 index, address newValue);
    event Storage__StringArrayDataChanged(bytes32 key, uint256 index, string newValue);

    event Storage__UintArrayChanged(bytes32 key, uint256[] newArray);
    event Storage__AddressArrayChanged(bytes32 key, address[] newArray);
    event Storage__StringArrayChanged(bytes32 key, string[] newArray);

    //****************************************************************** */
    //
    //              CONSTRUCTOR / INITIALIZATION
    //
    //****************************************************************** */
    /**
     * @notice Sets the initial values
     *
     * @dev set native coin name and chainId
     * @dev set default params (fees, block confimration..)
     * @dev IMPORTANT: deployer of Storage is the admin of all contracts
     *
     * @param nativeTokenName name of the native coin
     */
    constructor(string memory nativeTokenName) {
        uint256 nativeChainId = block.chainid;

        s_addressStorage[getKey("admin")] = msg.sender;

        addChainIdToList(nativeChainId);
        addTokenNameToList(nativeTokenName);

        addNewTokenAddressByChainId(nativeTokenName, nativeChainId, MAX_ADDRESS);
        // set initial values
        _setInitialValues();
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //                                   KEY GENERATORS
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * @notice Computes a storage key by hashing the provided string 'key'.
     *
     * @dev This function uses the keccak256 hashing algorithm to generate a unique storage key.
     *
     * @param key The string representation of the key to store in the eternal storage.
     * @return bytes32 The hashed representation of the storage key.
     */
    function getKey(string memory key) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(key));
    }

    // @todo: 1 dynamic key and one inferior to 32 bytes
    // encodePacked don't pad to 32 bytes
    // in storage mapping used for different field with the same type
    // It is possible to have a collision potentaillly
    // Use:
    // hash of inputs: all will have 32 bytes length
    // or encode() to pad to 32 bytes
    /**
     * @notice Computes a hash of a composite key formed by the provided 'key' and an Ethereum address.
     *
     * @dev This function combines the string 'key' and the address into a single value,
     *      then hashes it using keccak256 to create a unique identifier for that specific key and address combination.
     *
     * @param key The string representation of the key to hash.
     * @param addr The Ethereum address to combine with the key for unique identification.
     * @return bytes32 The hashed representation of the composite key (key + address).
     */
    function getKey(string memory key, address addr) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(key, addr));
    }

    /**
     * @notice Computes a hash of a composite key formed by the provided 'key' and a uint256 number.
     *
     * @dev This function combines the string 'key' and the number into a single value,
     *      then hashes it using keccak256 to create a unique identifier for that specific key and number combination.
     *
     * @param key The string representation of the key to hash.
     * @param number The uint256 number to combine with the key for unique identification.
     * @return bytes32 The hashed representation of the composite key (key + number).
     */
    function getKey(string memory key, uint256 number) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(key, number));
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //                                   DATA GETTERS BY TYPE
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * @notice Retrieves a uint256 value from storage using the specified key.
     *
     * @param key The bytes32 key associated with the uint256 value.
     * @return uint256 The stored uint256 value.
     */
    function getUint(bytes32 key) public view returns (uint256) {
        return s_uintStorage[key];
    }

    /**
     * @notice Retrieves an address value from storage using the specified key.
     *
     * @param key The bytes32 key associated with the address value.
     * @return address The stored address value.
     */
    function getAddress(bytes32 key) public view returns (address) {
        return s_addressStorage[key];
    }

    /**
     * @notice Retrieves the address value for the specified key.
     *
     * @dev This function is a duplicate of getAddress. It is a temporary fix due to a conflict with ethers.getAddress()
     *      in tests/units/01_Storage.t.js.
     *
     * @param key The bytes32 key associated with the address value.
     * @return address The stored address value.
     */
    function getAddr(bytes32 key) public view returns (address) {
        return getAddress(key);
    }

    /**
     * @notice Retrieves a boolean value from storage using the specified key.
     *
     * @param key The bytes32 key associated with the boolean value.
     * @return bool The stored boolean value.
     */
    function getBool(bytes32 key) public view returns (bool) {
        return s_boolStorage[key];
    }

    /**
     * @notice Retrieves a bytes array value from storage using the specified key.
     *
     * @param key The bytes32 key associated with the bytes value.
     * @return bytes The stored bytes value.
     */
    function getBytes(bytes32 key) public view returns (bytes memory) {
        return s_bytesStorage[key];
    }

    /**
     * @notice Retrieves a string value from storage using the specified key.
     *
     * @param key The bytes32 key associated with the string value.
     * @return string The stored string value.
     */
    function getString(bytes32 key) public view returns (string memory) {
        return s_stringStorage[key];
    }

    /**
     * @notice Retrieves a bytes32 value from storage using the specified key.
     *
     * @param key The bytes32 key associated with the bytes32 value.
     * @return bytes32 The stored bytes32 value.
     */
    function getBytes32(bytes32 key) public view returns (bytes32) {
        return s_bytes32Storage[key];
    }

    /**
     * @notice Retrieves an array of uint256 values from storage using the specified key.
     *
     * @param key The bytes32 key associated with the uint256 array.
     * @return uint256[] The stored array of uint256 values.
     */
    function getUintArray(bytes32 key) public view returns (uint256[] memory) {
        return s_uintArrayStorage[key];
    }

    /**
     * @notice Retrieves an array of address values from storage using the specified key.
     *
     * @param key The bytes32 key associated with the address array.
     * @return address[] The stored array of address values.
     */
    function getAddressArray(bytes32 key) public view returns (address[] memory) {
        return s_addressArrayStorage[key];
    }

    /**
     * @notice Retrieves an array of string values from storage using the specified key.
     *
     * @param key The bytes32 key associated with the string array.
     * @return string[] The stored array of string values.
     */
    function getStringArray(bytes32 key) public view returns (string[] memory) {
        return s_stringArrayStorage[key];
    }

    /**
     * @notice Retrieves a specific value from a uint256 array using the specified key and index.
     *
     * @param key The bytes32 key associated with the uint256 array.
     * @param index The index of the value to retrieve.
     * @return uint256 The value from the uint256 array at the specified index.
     */
    function getUintArrayValue(bytes32 key, uint256 index) public view returns (uint256) {
        return s_uintArrayStorage[key][index];
    }

    /**
     * @notice Retrieves a specific value from an address array using the specified key and index.
     *
     * @param key The bytes32 key associated with the address array.
     * @param index The index of the value to retrieve.
     * @return address The value from the address array at the specified index.
     */
    function getAddressArrayValue(bytes32 key, uint256 index) public view returns (address) {
        return s_addressArrayStorage[key][index];
    }

    /**
     * @notice Retrieves a specific value from a string array using the specified key and index.
     *
     * @param key The bytes32 key associated with the string array.
     * @param index The index of the value to retrieve.
     * @return string The value from the string array at the specified index.
     */
    function getStringArrayValue(bytes32 key, uint256 index) public view returns (string memory) {
        return s_stringArrayStorage[key][index];
    }
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //                                   DATA SETTERS BY TYPE
    //                               ONLY admin can access setters
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /* *****************SIMPLE VALUE ************************** */

    /**
     * @notice Sets an address value in storage for the specified key.
     *
     * @param key The bytes32 key to associate with the address value.
     * @param value The address value to store.
     */
    function setAddress(bytes32 key, address value) public {
        _checkAccess();
        s_addressStorage[key] = value;
        emit Storage__AddressDataChanged(key, value);
    }

    /**
     * @notice Sets a uint256 value in storage for the specified key.
     *
     * @param key The bytes32 key to associate with the uint256 value.
     * @param value The uint256 value to store.
     */
    function setUint(bytes32 key, uint256 value) public {
        _checkAdminAccess();
        s_uintStorage[key] = value;
        emit Storage__UintDataChanged(key, value);
    }

    /**
     * @notice Sets a boolean value in storage for the specified key.
     *
     * @param key The bytes32 key to associate with the boolean value.
     * @param value The boolean value to store.
     */
    function setBool(bytes32 key, bool value) public {
        _checkAdminAccess();
        s_boolStorage[key] = value;
        emit Storage__BoolDataChanged(key, value);
    }

    /**
     * @notice Sets a bytes array value in storage for the specified key.
     *
     * @param key The bytes32 key to associate with the bytes value.
     * @param value The bytes value to store.
     */
    function setBytes(bytes32 key, bytes memory value) public {
        _checkAdminAccess();
        s_bytesStorage[key] = value;
        emit Storage__BytesDataChanged(key, value);
    }

    /**
     * @notice Sets a string value in storage for the specified key.
     *
     * @param key The bytes32 key to associate with the string value.
     * @param value The string value to store.
     */
    function setString(bytes32 key, string memory value) public {
        _checkAdminAccess();
        s_stringStorage[key] = value;
        emit Storage__StringDataChanged(key, value);
    }

    /**
     * @notice Sets a bytes32 value in storage for the specified key.
     *
     * @param key The bytes32 key to associate with the bytes32 value.
     * @param value The bytes32 value to store.
     */
    function setBytes32(bytes32 key, bytes32 value) public {
        _checkAdminAccess();
        s_bytes32Storage[key] = value;
        emit Storage__Bytes32_DataChanged(key, value);
    }

    /* ***************** ARRAYS ************************** */
    /**
     * @notice Sets an array of uint256 values in storage for the specified key.
     *
     * @param key The bytes32 key to associate with the uint256 array.
     * @param array The array of uint256 values to store.
     */
    function setUintArray(bytes32 key, uint256[] memory array) public {
        _checkAdminAccess();
        s_uintArrayStorage[key] = array;
        emit Storage__UintArrayChanged(key, array);
    }

    /**
     * @notice Sets an array of address values in storage for the specified key.
     *
     * @param key The bytes32 key to associate with the address array.
     * @param array The array of address values to store.
     */
    function setAddressArray(bytes32 key, address[] memory array) public {
        _checkAdminAccess();
        s_addressArrayStorage[key] = array;
        emit Storage__AddressArrayChanged(key, array);
    }

    /**
     * @notice Sets an array of string values in storage for the specified key.
     *
     * @param key The bytes32 key to associate with the string array.
     * @param array The array of string values to store.
     */
    function setStringArray(bytes32 key, string[] memory array) public {
        _checkAdminAccess();
        s_stringArrayStorage[key] = array;
        emit Storage__StringArrayChanged(key, array);
    }

    /* *****************ARRAY VALUE ************************** */

    /**
     * @notice Adds a value to a uint256 array stored under the specified key.
     *
     * @param key The bytes32 key associated with the uint256 array.
     * @param value The uint256 value to add to the array.
     */
    function addToUintArray(bytes32 key, uint256 value) public {
        _checkAdminAccess();
        uint256[] storage array = s_uintArrayStorage[key];
        array.push(value);
        emit Storage__UintArrayDataChanged(key, array.length - 1, value);
    }

    /**
     * @notice Adds a value to an address array stored under the specified key.
     *
     * @param key The bytes32 key associated with the address array.
     * @param value The address value to add to the array.
     */
    function addToAddressArray(bytes32 key, address value) public {
        _checkAdminAccess();
        address[] storage array = s_addressArrayStorage[key];
        array.push(value);
        emit Storage__AddressArrayDataChanged(key, array.length - 1, value);
    }

    /**
     * @notice Adds a value to a string array stored under the specified key.
     *
     * @param key The bytes32 key associated with the string array.
     * @param value The string value to add to the array.
     */
    function addToStringArray(bytes32 key, string calldata value) public {
        _checkAdminAccess();
        string[] storage array = s_stringArrayStorage[key];
        array.push(value);
        emit Storage__StringArrayDataChanged(key, array.length - 1, value);
    }

    /**
     * @notice Updates a specific value in a uint256 array stored under the specified key.
     *
     * @param key The bytes32 key associated with the uint256 array.
     * @param index The index of the value to update.
     * @param value The new uint256 value to set at the specified index.
     * @dev Reverts if the index is out of bounds.
     */
    function updateUintArray(bytes32 key, uint256 index, uint256 value) public {
        _checkAdminAccess();
        if (index >= s_uintArrayStorage[key].length) {
            revert Storage__InvalidArrayLengthInParams("updateUintArray");
        }
        s_uintArrayStorage[key][index] = value;
        emit Storage__UintArrayDataChanged(key, index, value);
    }

    /**
     * @notice Updates a specific value in an address array stored under the specified key.
     *
     * @param key The bytes32 key associated with the address array.
     * @param index The index of the value to update.
     * @param value The new address value to set at the specified index.
     * @dev Reverts if the index is out of bounds.
     */
    function updateAddressArray(bytes32 key, uint256 index, address value) public {
        _checkAdminAccess();
        if (index >= s_addressArrayStorage[key].length) {
            revert Storage__InvalidArrayLengthInParams("updateAddressArray");
        }
        s_addressArrayStorage[key][index] = value;
        emit Storage__AddressArrayDataChanged(key, index, value);
    }

    /**
     * @notice Updates a specific value in a string array stored under the specified key.
     *
     * @param key The bytes32 key associated with the string array.
     * @param index The index of the value to update.
     * @param value The new string value to set at the specified index.
     * @dev Reverts if the index is out of bounds.
     */
    function updateStringArray(bytes32 key, uint256 index, string calldata value) public {
        _checkAdminAccess();
        if (index >= s_stringArrayStorage[key].length) {
            revert Storage__InvalidArrayLengthInParams("updateStringArray");
        }
        s_stringArrayStorage[key][index] = value;
        emit Storage__StringArrayDataChanged(key, index, value);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //                                      ROLES HELPERS
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * @notice Updates the address of an operator associated with a specific role.
     *
     * @param role The role of the operator to update.
     * @param newOperator The new address to assign to the operator's role.
     */
    function updateOperator(string calldata role, address newOperator) public {
        setAddress(getKey(role), newOperator);
    }

    /**
     * @notice Updates the addresses of a batch of operators associated with their roles.
     *
     * @param roles An array of roles corresponding to the operators to update.
     * @param newOperators An array of new operator addresses to assign to the respective roles.
     * @dev Reverts if the lengths of roles and newOperators arrays do not match.
     */
    function batchUpdateOperators(string[] calldata roles, address[] calldata newOperators) public {
        if (roles.length != newOperators.length) {
            revert Storage__InvalidArrayLengthInParams("updatOperators");
        }
        for (uint256 i; i < roles.length;) {
            updateOperator(roles[i], newOperators[i]);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice Retrieves the address of an operator associated with a specific role.
     *
     * @param role The role of the operator to retrieve.
     * @return address The address of the operator associated with the specified role.
     */
    function getOperator(string memory role) public view returns (address) {
        return getAddress(getKey(role));
    }

    /**
     * @notice Retrieves the addresses of a batch of operators associated with their roles.
     *
     * @param roles An array of roles for which to retrieve operator addresses.
     * @return address[] An array of addresses corresponding to the specified roles.
     */
    function getOperators(string[] memory roles) public view returns (address[] memory) {
        address[] memory operators = new address[](roles.length);
        for (uint256 i; i < roles.length;) {
            operators[i] = getOperator(roles[i]);
            unchecked {
                ++i;
            }
        }
        return operators;
    }

    /**
     * @notice Checks if a specified role is assigned to a given address.
     *
     * @param role The role to check.
     * @param addr The address to verify against the specified role.
     * @return bool True if the address is assigned to the specified role, false otherwise.
     */
    function isRole(string calldata role, address addr) public view returns (bool) {
        return getOperator(role) == addr;
    }

    /**
     * @notice Checks if a batch of roles are assigned to their corresponding operator addresses.
     *
     * @param roles An array of roles to check.
     * @param operators An array of addresses to verify against the specified roles.
     * @return bool True if all roles are correctly assigned to their respective addresses, false otherwise.
     * @dev Reverts if the lengths of roles and operators arrays do not match.
     */
    function checkOperators(string[] memory roles, address[] memory operators) public view returns (bool) {
        if (roles.length != operators.length) {
            revert Storage__InvalidArrayLengthInParams("checkOperators");
        }
        for (uint256 i = 0; i < roles.length; i++) {
            if (getOperator(roles[i]) != operators[i]) {
                return false;
            }
        }
        return true;
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //                                          TOKEN NAMES AND CHAIN IDS
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /*
    * This function has security purposes by forcing 2-step actions when adding a token.
    */

    /**
     * @notice Adds a token name to the list of authorized tokens.
     *
     * @param tokenName The name of the token to add to the authorized list.
     * @dev Reverts if the token name is already in the list.
     */
    function addTokenNameToList(string memory tokenName) public {
        _checkAdminAccess();
        if (isTokenNameInList(tokenName)) {
            revert Storage__TokenAlreadyInList(tokenName);
        }
        string[] storage list = s_stringArrayStorage[getKey("tokenNamesList")];
        list.push(tokenName);

        emit Storage__TokenNameAdded(tokenName);
    }

    /**
     * @notice Adds a batch of token names to the list of authorized tokens.
     *
     * @param tokenNames An array of token names to add to the authorized list.
     */
    function batchAddTokenNamesToList(string[] calldata tokenNames) external {
        for (uint256 i; i < tokenNames.length;) {
            addTokenNameToList(tokenNames[i]);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice Retrieves the list of authorized token names.
     *
     * @return string[] An array of authorized token names.
     */
    function getTokenNamesList() public view returns (string[] memory) {
        return getStringArray(getKey("tokenNamesList"));
    }

    /**
     * @notice Checks if a token name is in the list of authorized tokens.
     *
     * @param tokenName The name of the token to check.
     * @return bool True if the token name is in the authorized list, false otherwise.
     */
    function isTokenNameInList(string memory tokenName) public view returns (bool) {
        string[] memory list = getStringArray(getKey("tokenNamesList"));
        for (uint256 i = 0; i < list.length; i++) {
            if (keccak256(abi.encodePacked(list[i])) == keccak256(abi.encodePacked(tokenName))) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Adds a chain ID to the list of authorized chains.
     *
     * @param chainId The ID of the chain to add to the authorized list.
     * @dev Reverts if the chain ID is already in the list.
     */
    function addChainIdToList(uint256 chainId) public {
        _checkAdminAccess();
        if (isChainIdInList(chainId)) {
            revert Storage__ChainIdAlreadyInList(chainId);
        }
        uint256[] storage list = s_uintArrayStorage[getKey("chainIdsList")];
        list.push(chainId);

        emit Storage__ChainIdAdded(chainId);
    }

    /**
     * @notice Adds a batch of chain IDs to the list of authorized chains.
     *
     * @param chainIds An array of chain IDs to add to the authorized list.
     */
    function batchAddChainIdsToList(uint256[] calldata chainIds) external {
        for (uint256 i; i < chainIds.length;) {
            addChainIdToList(chainIds[i]);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice Retrieves the list of authorized chain IDs.
     *
     * @return uint256[] An array of authorized chain IDs.
     */
    function getChainIdsList() public view returns (uint256[] memory) {
        return getUintArray(getKey("chainIdsList"));
    }

    /**
     * @notice Checks if a specified chain ID is in the list of authorized chains.
     *
     * @param chainId The chain ID to check.
     * @return bool True if the chain ID is in the authorized list, false otherwise.
     */
    function isChainIdInList(uint256 chainId) public view returns (bool) {
        uint256[] memory list = getUintArray(getKey("chainIdsList"));
        for (uint256 i = 0; i < list.length;) {
            if (list[i] == chainId) {
                return true;
            }
            unchecked {
                ++i;
            }
        }
        return false;
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////
    //
    //                              TOKENS MANAGEMENT
    //
    ///////////////////////////////////////////////////////////////////////////////////////////////

    /*
     * Native coin are set with MAX_ADDRESS
     * Authorized tokens have address != address(0)
     * Storage of tokens representation: mapping(hash(tokenName,chainId) => address)
     *
     * @todo modification with packing: status(up/down),tokenSymbol,...,address
     * and func to extract with bit shifting
     * @todo manage new versin of token => having 2 addresses for the same token (old/new)
     */

    /**
     * @notice Retrieves the address of a specified token on a specific chain.
     *
     * @param tokenName The name of the token to look up.
     * @param chainId The ID of the chain on which to find the token's address.
     * @return address The address of the token on the specified chain.
     */
    function getTokenAddressByChainId(string memory tokenName, uint256 chainId) public view returns (address) {
        return getAddress(getKey(tokenName, chainId));
    }

    /**
     * @notice Retrieves the addresses of a specified token on both the origin and destination chains.
     *
     * @param tokenName The name of the token to look up.
     * @param originChainId The ID of the origin chain.
     * @param destinationChainId The ID of the destination chain.
     * @return originChainAddress The address of the token on the origin chain.
     * @return destinationChainAddress The address of the token on the destination chain.
     */
    function getTokenAddressesByChainIds(string memory tokenName, uint256 originChainId, uint256 destinationChainId)
        public
        view
        returns (address originChainAddress, address destinationChainAddress)
    {
        originChainAddress = getTokenAddressByChainId(tokenName, originChainId);
        destinationChainAddress = getTokenAddressByChainId(tokenName, destinationChainId);
    }

    /**
     * @notice Adds a new address and chain ID for a specified token name.
     *
     * @param tokenName The name of the token to which the address should be assigned.
     * @param chainId The ID of the chain on which the token address is being added.
     * @param tokenAddress The address of the token to add.
     * @dev Reverts if the token name or chain ID is not in the authorized lists or if the address is already set.
     */
    function addNewTokenAddressByChainId(string memory tokenName, uint256 chainId, address tokenAddress) public {
        if (!isTokenNameInList(tokenName)) {
            revert Storage__TokenNotInList(tokenName);
        }
        if (!isChainIdInList(chainId)) {
            revert Storage__ChainIdNotInList(chainId);
        }
        if (getTokenAddressByChainId(tokenName, chainId) != address(0)) {
            revert Storage__TokenAddressAlreadySet(tokenName, chainId);
        }
        _setTokenAddressByChainId(tokenName, chainId, tokenAddress);
    }

    /**
     * @notice Updates the address of a specified token on a specific chain.
     *
     * @param tokenName The name of the token for which the address should be updated.
     * @param chainId The ID of the chain on which the token address is being updated.
     * @param tokenAddress The new address of the token.
     * @dev Reverts if the token name or chain ID is not in the authorized lists or if the old address does not exist.
     */
    function updateTokenAddressByChainId(string memory tokenName, uint256 chainId, address tokenAddress) public {
        address oldAddress = getTokenAddressByChainId(tokenName, chainId);
        if (!isTokenNameInList(tokenName)) {
            revert Storage__TokenNotInList(tokenName);
        }
        if (!isChainIdInList(chainId)) {
            revert Storage__ChainIdNotInList(chainId);
        }
        if (oldAddress == address(0)) {
            revert Storage__TokenAddressNotSet(tokenName, chainId);
        }
        _setTokenAddressByChainId(tokenName, chainId, tokenAddress);
    }

    /**
     * @notice Adds a set of new addresses and chain IDs for specified token names.
     *
     * @param tokenNames An array of token names to which addresses should be assigned.
     * @param chainIds An array of chain IDs corresponding to the token names.
     * @param tokenAddresses An array of addresses to assign to the respective token names and chain IDs.
     * @dev Reverts if the lengths of the input arrays do not match.
     */
    function batchAddNewTokensAddressesByChainId(
        string[] memory tokenNames,
        uint256[] memory chainIds,
        address[] memory tokenAddresses
    ) public {
        _checkAccess();
        if (tokenNames.length != chainIds.length || chainIds.length != tokenAddresses.length) {
            revert Storage__InvalidArrayLengthInParams("batchAddTokenAddressessByChainId");
        }

        for (uint256 i = 0; i < tokenNames.length;) {
            addNewTokenAddressByChainId(tokenNames[i], chainIds[i], tokenAddresses[i]);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice Checks if a specified token name on a specific chain ID is authorized.
     *
     * @param tokenName The name of the token to check.
     * @param chainId The ID of the chain to check against.
     * @return bool True if the token is authorized on the specified chain, false otherwise.
     */
    function isAuthorizedTokenByChainId(string memory tokenName, uint256 chainId) public view returns (bool) {
        return getTokenAddressByChainId(tokenName, chainId) != address(0);
    }

    //****************************************************************** //
    //              PRIVATE FUNCTIONS
    //****************************************************************** //

    /**
     * @notice Sets initial values for the contract, including default parameters.
     *
     * @dev This is a draft version to ease development and testing.
     *      To be refactored when block checks and fees management are implemented.
     */
    function _setInitialValues() private {
        // blockToWait for confirmation on chainId
        setUint(getKey("blockToWait", 1), 6); //........... eth
        setUint(getKey("blockToWait", 11155111), 6); //.... sepolia
        setUint(getKey("blockToWait", 441), 2); //......... harmonie (allfeat testnet)
        setUint(getKey("blockToWait", 31337), 2); //....... hardhat
        setUint(getKey("blockToWait", 440), 2); //......... harmonieLocal
        setUint(getKey("blockToWait", 1337), 2); //........ geth

        // operational fees on chainId
        uint256 opFees = 0.001 ether;
        setUint(getKey("opFees", 1), opFees); //........... eth
        setUint(getKey("opFees", 11155111), opFees); //.... sepolia
        setUint(getKey("opFees", 441), opFees); //......... harmonie (allfeat testnet)
        setUint(getKey("opFees", 31337), opFees); //....... hardhat
        setUint(getKey("opFees", 440), opFees); //......... harmonieLocal
        setUint(getKey("opFees", 1337), opFees); //........ geth

        // protocol fees
        uint256 protocolPercentFees = 1000; // 0.1%
        setUint(getKey("protocolPercentFees", 1), protocolPercentFees); //....... eth
        setUint(getKey("protocolPercentFees", 11155111), protocolPercentFees); // sepolia
        setUint(getKey("protocolPercentFees", 441), protocolPercentFees); //..... harmonie (allfeat testnet)
        setUint(getKey("protocolPercentFees", 31337), protocolPercentFees); //... hardhat
        setUint(getKey("protocolPercentFees", 440), protocolPercentFees); //..... harmonieLocal
        setUint(getKey("protocolPercentFees", 1337), protocolPercentFees); //.... geth
    }

    /**
     * @notice Checks if the sender is the admin.
     *
     * @return bool True if the sender is the admin, false otherwise.
     */
    function _isAdmin() private view returns (bool) {
        return getOperator("admin") == msg.sender;
    }

    /**
     * @notice Checks if the sender is the factory.
     *
     * @return bool True if the sender is the factory, false otherwise.
     */
    function _isFactory() private view returns (bool) {
        return getOperator("factory") == msg.sender;
    }

    /**
     * @notice Checks that the sender has admin access.
     *
     * @dev Reverts if the sender is not the admin.
     */
    function _checkAdminAccess() private view {
        if (!_isAdmin()) {
            revert Storage__NotAdmin();
        }
    }

    /**
     * @notice Checks that the sender has access (admin or factory).
     *
     * @dev Reverts if the sender is neither the admin nor the factory.
     */
    function _checkAccess() private view {
        if (!_isAdmin() && !_isFactory()) {
            revert Storage__NotAdmin();
        }
    }

    /**
     * @notice Sets the token address for a specified token name and chain ID.
     *
     * @param tokenName The name of the token for which the address is being set.
     * @param chainId The ID of the chain on which the token address is being set.
     * @param tokenAddress The address of the token to set.
     * @dev Emits a Storage__TokenAddressSet event upon success.
     */
    function _setTokenAddressByChainId(string memory tokenName, uint256 chainId, address tokenAddress) private {
        setAddress(getKey(tokenName, chainId), tokenAddress);
        emit Storage__TokenAddressSet(tokenName, chainId, tokenAddress);
    }
}
