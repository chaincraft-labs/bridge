// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {TokenFactory} from "./TokenFactory.sol";
// Eternal storage for the bridge ecosyste allowing to upgrade modules
// ERRORS

error Storage__NotAdmin();
error Storage__TokenNotInList(string tokenName);
error Storage__ChainIdNotInList(uint256 chainId);
// error Storage__TokenAlreadySet(string tokenName, uint256 chainId);
// error Storage__TokenNotSet(string tokenName, uint256 chainId);
error Storage__InvalidArrayLengthInParams(string functionName);
error Storage__TokenAlreadyInList(string tokenName);
error Storage__ChainIdAlreadyInList(uint256 chainId);
error Storage__TokenAddressAlreadySet(string tokenName, uint256 chainId);
error Storage__TokenAddressNotSet(string tokenName, uint256 chainId);

// @todo
// refactor and add events
// add fees variables (op, base, protocol, etc.)
// keep only needed storage
// store all varibles without balances (managed by vault) and operation (managed by relayer)

//@todo
// refactor token infos to : name => chainId => symbol & address

// THINK about key label validation
// not for all complete key cause it can be huge and not needed
// enum StorageType {
//     UINT,
//     ADDRESS,
//     BOOL,
//     BYTES,
//     STRING,
//     BYTES32,
//     UINT_ARRAY,
//     ADDRESS_ARRAY,
//     BYTES_ARRAY,
//     STRING_ARRAY,
//     BYTES32_ARRAY
// }

// struct Key {
//     bool exists;
//     string field;
//     address optionalAddress;
//     uint256 optionalUint;
//     // bytes32 id;
//     StorageType storageType;
// }

// system to valid keys ?

// NATIVE toekn address(0) => address.max == 0xffffffffffffffffffffffffffffffffffffffff
// to avoid confusion with real address(0) == 0x

// RENAME ALL LABEL USING A SPECIAL FORMAT : opertator_role ... to reduce collision risk / with maj/min
// USE constant if possible for essential values

// @todo
// At the moment only one admin, relayer, oracle (server), factory, vault, etc.
// later refactor to have array of relayers, orcales, etc.
// and refactor to have access control for admin, relayer, oracle, etc. (via openzeppelin access control)

// @todo ENUM of role for admin, relayer, oracle, factory, vault, etc.

// update functions to change the address of the admin, relayer, oracle, factory, vault, etc.

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
    event Storage__TokenAddressSet(string tokenName, uint256 chainId, address newAddress, address oldAddress);

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
        uint256 nativeChainId = block.chainid; // on hardhat == 31337

        s_addressStorage[getKey("admin")] = msg.sender;

        // setUint(getKey("nativeChainId"), nativeChainId);
        // setString(getKey("nativeTokenName"), nativeTokenName);

        addChainIdToList(nativeChainId);
        addTokenNameToList(nativeTokenName);

        addNewTokenAddressByChainId(nativeTokenName, nativeChainId, MAX_ADDRESS);
        // set initial values
        setInitialValues();
    }

    //  @todo ADD separate setters
    /**
     * @notice Sets the initial values
     *
     * @dev set default params (fees, block confimration..)
     * @dev TO REFACTOR when block checks, fees management implemented
     */
    function setInitialValues() public {
        // blockToWait for confirmation on chainId
        setUint(getKey("blockToWait", 1), 6); // eth
        setUint(getKey("blockToWait", 11155111), 6); // sepolia
        setUint(getKey("blockToWait", 441), 2); // allfeat
        setUint(getKey("blockToWait", 31337), 2); // hardhat
        // operational fees on chainId
        uint256 opFees = 0.001 ether;
        setUint(getKey("opFees", 1), opFees); // eth
        setUint(getKey("opFees", 11155111), opFees); // sepolia
        setUint(getKey("opFees", 441), opFees); // allfeat
        setUint(getKey("opFees", 31337), opFees); // hardhat

        // protocol fees
        uint256 protocolPercentFees = 1000; // 0.1%
        setUint(getKey("protocolPercentFees", 1), protocolPercentFees); // eth
        setUint(getKey("protocolPercentFees", 11155111), protocolPercentFees); // sepolia
        setUint(getKey("protocolPercentFees", 441), protocolPercentFees); // allfeat
        setUint(getKey("protocolPercentFees", 31337), protocolPercentFees); // hardhat
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //                              Key generators
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    function getKey(string memory key) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(key));
    }

    function getKey(string memory key, address addr) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(key, addr));
    }

    function getKey(string memory key, uint256 number) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(key, number));
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //                              DATA GETTERS BY TYPE
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    function getUint(bytes32 key) public view returns (uint256) {
        return s_uintStorage[key];
    }

    function getAddress(bytes32 key) public view returns (address) {
        return s_addressStorage[key];
    }

    function getBool(bytes32 key) public view returns (bool) {
        return s_boolStorage[key];
    }

    function getBytes(bytes32 key) public view returns (bytes memory) {
        return s_bytesStorage[key];
    }

    function getString(bytes32 key) public view returns (string memory) {
        return s_stringStorage[key];
    }

    function getBytes32(bytes32 key) public view returns (bytes32) {
        return s_bytes32Storage[key];
    }

    function getUintArray(bytes32 key) public view returns (uint256[] memory) {
        return s_uintArrayStorage[key];
    }

    function getAddressArray(bytes32 key) public view returns (address[] memory) {
        return s_addressArrayStorage[key];
    }

    function getStringArray(bytes32 key) public view returns (string[] memory) {
        return s_stringArrayStorage[key];
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //                              Data setters by types
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // only Admin can access setters (later : access role)
    function setAddress(bytes32 key, address value) public {
        if (!isAdmin() && !isFactory()) {
            revert Storage__NotAdmin();
        }
        s_addressStorage[key] = value;
        emit Storage__AddressDataChanged(key, value);
    }

    function setUint(bytes32 key, uint256 value) public {
        if (!isAdmin()) {
            revert Storage__NotAdmin();
        }
        s_uintStorage[key] = value;
        emit Storage__UintDataChanged(key, value);
    }

    function setBool(bytes32 key, bool value) public {
        if (!isAdmin()) {
            revert Storage__NotAdmin();
        }
        s_boolStorage[key] = value;
        emit Storage__BoolDataChanged(key, value);
    }

    function setBytes(bytes32 key, bytes memory value) public {
        if (!isAdmin()) {
            revert Storage__NotAdmin();
        }
        s_bytesStorage[key] = value;
        emit Storage__BytesDataChanged(key, value);
    }

    function setString(bytes32 key, string memory value) public {
        if (!isAdmin()) {
            revert Storage__NotAdmin();
        }
        s_stringStorage[key] = value;
        emit Storage__StringDataChanged(key, value);
    }

    function setBytes32(bytes32 key, bytes32 value) public {
        if (!isAdmin()) {
            revert Storage__NotAdmin();
        }
        s_bytes32Storage[key] = value;
        emit Storage__Bytes32_DataChanged(key, value);
    }
    ////////////////////////////// ARRAYS /////////////////////////////////
    // @todo complete array methods
    // @note memory instead of calldat cause of compilation error (copy nested calldata to storage "not implemented in old code generator")

    function setUintArray(bytes32 key, uint256[] memory array) public {
        if (!isAdmin()) {
            revert Storage__NotAdmin();
        }
        s_uintArrayStorage[key] = array;
        emit Storage__UintArrayChanged(key, array);
    }

    function setAddressArray(bytes32 key, address[] memory array) public {
        if (!isAdmin()) {
            revert Storage__NotAdmin();
        }
        s_addressArrayStorage[key] = array;
        emit Storage__AddressArrayChanged(key, array);
    }

    function setStringArray(bytes32 key, string[] memory array) public {
        if (!isAdmin()) {
            revert Storage__NotAdmin();
        }
        s_stringArrayStorage[key] = array;
        emit Storage__StringArrayChanged(key, array);
    }

    ///////////////////////// ARRAYS VALUES ADDING //////////////////////////
    // @todo
    function addToUintArray(bytes32 key, uint256 value) public {
        if (!isAdmin()) {
            revert Storage__NotAdmin();
        }
        uint256[] storage array = s_uintArrayStorage[key];
        array.push(value);
        emit Storage__UintArrayDataChanged(key, array.length - 1, value);
    }

    function addToAddressArray(bytes32 key, address value) public {
        if (!isAdmin()) {
            revert Storage__NotAdmin();
        }
        address[] storage array = s_addressArrayStorage[key];
        array.push(value);
        emit Storage__AddressArrayDataChanged(key, array.length - 1, value);
    }

    function addToStringArray(bytes32 key, string calldata value) public {
        if (!isAdmin()) {
            revert Storage__NotAdmin();
        }
        string[] storage array = s_stringArrayStorage[key];
        array.push(value);
        emit Storage__StringArrayDataChanged(key, array.length - 1, value);
    }

    function updateUintArray(bytes32 key, uint256 index, uint256 value) public {
        if (!isAdmin()) {
            revert Storage__NotAdmin();
        }
        s_uintArrayStorage[key][index] = value;
        emit Storage__UintArrayDataChanged(key, index, value);
    }

    function updateAddressArray(bytes32 key, uint256 index, address value) public {
        if (!isAdmin()) {
            revert Storage__NotAdmin();
        }
        s_addressArrayStorage[key][index] = value;
        emit Storage__AddressArrayDataChanged(key, index, value);
    }

    function updateStringArray(bytes32 key, uint256 index, string calldata value) public {
        if (!isAdmin()) {
            revert Storage__NotAdmin();
        }
        s_stringArrayStorage[key][index] = value;
        emit Storage__StringArrayDataChanged(key, index, value);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //                              ROLES HELPERS (to avoid errors when calling with specialized setters/getters)
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // @todo is it necessary ? => setter for role label => need to update an existing label
    function updateOperator(string calldata role, address newOperator) public {
        setAddress(getKey(role), newOperator);
    }

    // function updateOperators(string[] calldata roles, address[] calldata newOperators) public {
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

    function getOperator(string memory role) public view returns (address) {
        return getAddress(getKey(role));
    }

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

    function isRole(string calldata role, address addr) public view returns (bool) {
        return getOperator(role) == addr;
    }

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

    // @todo : move at the end, prefix with '_'
    function isAdmin() private view returns (bool) {
        return getOperator("admin") == msg.sender;
    }

    function isFactory() private view returns (bool) {
        return getOperator("factory") == msg.sender;
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //                              NETWORKS AND TOKENS LISTs
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Security (2* action) need to had the tokenName before to set its address to avoid setting add form not listed tokens
    // and allows front to fetch tokenName used to access its data
    // @todo  Later pack data ( symbol - address) and a utilities to extract it
    function addTokenNameToList(string memory tokenName) public {
        if (!isAdmin()) {
            revert Storage__NotAdmin();
        }
        if (isTokenNameInList(tokenName)) {
            revert Storage__TokenAlreadyInList(tokenName);
        }
        string[] storage list = s_stringArrayStorage[getKey("tokenNamesList")];
        list.push(tokenName);

        emit Storage__TokenNameAdded(tokenName);
    }

    function batchAddTokenNamesToList(string[] calldata tokenNames) external {
        for (uint256 i; i < tokenNames.length;) {
            addTokenNameToList(tokenNames[i]);
            unchecked {
                ++i;
            }
        }
    }

    function getTokenNamesList() public view returns (string[] memory) {
        return getStringArray(getKey("tokenNamesList"));
    }

    // BAD HAVE a mapping in //  (in case of large list)
    function isTokenNameInList(string memory tokenName) public view returns (bool) {
        string[] memory list = getStringArray(getKey("tokenNamesList"));
        for (uint256 i = 0; i < list.length; i++) {
            if (keccak256(abi.encodePacked(list[i])) == keccak256(abi.encodePacked(tokenName))) {
                return true;
            }
        }
        return false;
    }

    // same principe as tokenName (2* action)
    // and allows front to fetch cahinId used to access its data
    function addChainIdToList(uint256 chainId) public {
        if (!isAdmin()) {
            revert Storage__NotAdmin();
        }
        if (isChainIdInList(chainId)) {
            revert Storage__ChainIdAlreadyInList(chainId);
        }
        uint256[] storage list = s_uintArrayStorage[getKey("chainIdsList")];
        list.push(chainId);

        emit Storage__ChainIdAdded(chainId);
    }

    // @ todo have 2 entry points (regular/batch) with checks and one private function without checks
    function batchAddChainIdsToList(uint256[] calldata chainIds) external {
        for (uint256 i; i < chainIds.length;) {
            addChainIdToList(chainIds[i]);
            unchecked {
                ++i;
            }
        }
    }

    function getChainIdsList() public view returns (uint256[] memory) {
        return getUintArray(getKey("chainIdsList"));
    }

    function isChainIdInList(uint256 chainId) public view returns (bool) {
        uint256[] memory list = getUintArray(getKey("chainIdsList"));
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == chainId) {
                return true;
            }
        }
        return false;
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //                              TOKENS DATA HELPERS
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // @todo Remove => replace by flag in token data

    // Token is Authorized on ChainID if tokenaddress is != add(0)
    // Native token address are address.max == 0xffffffffffffffffffffffffffffffffffffffff

    ///////////////////////////////////////////////////////////////////////////////////////////////
    //
    //                      TOKEN ADDRESS BY CHAIN ID BY SYMBOL
    //
    ///////////////////////////////////////////////////////////////////////////////////////////////

    // SECURITY admin should add first tokenName to tokenList and chainId to chainIdsList
    // token mapping : eq : mapping(string memory tokenName => mapping(uint256 chainId => address tokenAddress))
    // used to add address and remove by resetting it to address(0)
    // address(0) = unauthorized token
    // address.max = native token

    // ?? instead of address ?? => bytes32 status-address => status : up, down, paused ??
    // in this case function extract address or status from data stored with bit shifting

    // @todo reorg pub, ext, private
    // // manage case of new version of token => ?? arrays of address, last is valid ??
    // function _setTokenAddressByChainId(string memory tokenName, uint256 chainId, address tokenAddress) private {
    //     setAddress(getKey(tokenName, chainId), tokenAddress);

    //     emit Storage__TokenAddressSet(tokenName, chainId, tokenAddress);
    // }

    //essai
    function getTokenAddressByChainId(string memory tokenName, uint256 chainId) public view returns (address) {
        return getAddress(getKey(tokenName, chainId));
    }

    function getTokenAddressesBychainIds(string memory tokenName, uint256 originChainId, uint256 destinationChainId)
        public
        view
        returns (address originChainAddress, address destinationChainAddress)
    {
        originChainAddress = getTokenAddressByChainId(tokenName, originChainId);
        destinationChainAddress = getTokenAddressByChainId(tokenName, destinationChainId);
    }

    // explicit function to avoid misuse (adding instead of updating)
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

    function batchAddNewTokensAddressesByChainId(
        string[] memory tokenNames,
        uint256[] memory chainIds,
        address[] memory tokenAddresses
    ) public returns (string memory) {
        if (!isAdmin() && !isFactory()) {
            revert Storage__NotAdmin();
        }
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

    function isAuthorizedTokenByChainId(string memory tokenName, uint256 chainId) public view returns (bool) {
        return getTokenAddressByChainId(tokenName, chainId) != address(0);
    }

    // @todo REMOVE call factory to have result
    function isBridgedToken(address tokenAddress) public view returns (bool) {
        TokenFactory tf = TokenFactory(getOperator("factory"));
        return tf.isBridgedToken(tokenAddress);
    }

    //****************************************************************** */
    //
    //              PRIVATE FUNCTIONS
    //
    //****************************************************************** */

    function _setTokenAddressByChainId(string memory tokenName, uint256 chainId, address tokenAddress) private {
        setAddress(getKey(tokenName, chainId), tokenAddress);

        emit Storage__TokenAddressSet(tokenName, chainId, tokenAddress);
    }
}
