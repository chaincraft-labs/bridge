// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {TokenFactory} from "./TokenFactory.sol";

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
    // event Storage__TokenAddressSet(string tokenName, uint256 chainId, address newAddress, address oldAddress);

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
        _setInitialValues();
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //                              KEY GENERATORS
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

    // test - name conflict with ethers 'getAddress()' see tests/units/01_Storage.t.js
    function getAddr(bytes32 key) public view returns (address) {
        return getAddress(key);
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

    function getUintArrayValue(bytes32 key, uint256 index) public view returns (uint256) {
        return s_uintArrayStorage[key][index];
    }

    function getAddressArrayValue(bytes32 key, uint256 index) public view returns (address) {
        return s_addressArrayStorage[key][index];
    }

    function getStringArrayValue(bytes32 key, uint256 index) public view returns (string memory) {
        return s_stringArrayStorage[key][index];
    }
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //                              DATA SETTERS BY TYPE
    //                          ONLY admin can access setters
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /* *****************SIMPLE VALUE ************************** */
    function setAddress(bytes32 key, address value) public {
        if (!_isAdmin() && !_isFactory()) {
            revert Storage__NotAdmin();
        }
        s_addressStorage[key] = value;
        emit Storage__AddressDataChanged(key, value);
    }

    function setUint(bytes32 key, uint256 value) public {
        _checkAccess();
        s_uintStorage[key] = value;
        emit Storage__UintDataChanged(key, value);
    }

    function setBool(bytes32 key, bool value) public {
        _checkAccess();
        s_boolStorage[key] = value;
        emit Storage__BoolDataChanged(key, value);
    }

    function setBytes(bytes32 key, bytes memory value) public {
        _checkAccess();
        s_bytesStorage[key] = value;
        emit Storage__BytesDataChanged(key, value);
    }

    function setString(bytes32 key, string memory value) public {
        _checkAccess();
        s_stringStorage[key] = value;
        emit Storage__StringDataChanged(key, value);
    }

    function setBytes32(bytes32 key, bytes32 value) public {
        _checkAccess();
        s_bytes32Storage[key] = value;
        emit Storage__Bytes32_DataChanged(key, value);
    }
    /* ***************** ARRAYS ************************** */

    function setUintArray(bytes32 key, uint256[] memory array) public {
        _checkAccess();
        s_uintArrayStorage[key] = array;
        emit Storage__UintArrayChanged(key, array);
    }

    function setAddressArray(bytes32 key, address[] memory array) public {
        _checkAccess();
        s_addressArrayStorage[key] = array;
        emit Storage__AddressArrayChanged(key, array);
    }

    function setStringArray(bytes32 key, string[] memory array) public {
        _checkAccess();
        s_stringArrayStorage[key] = array;
        emit Storage__StringArrayChanged(key, array);
    }

    /* *****************ARRAY VALUE ************************** */
    function addToUintArray(bytes32 key, uint256 value) public {
        _checkAccess();
        uint256[] storage array = s_uintArrayStorage[key];
        array.push(value);
        emit Storage__UintArrayDataChanged(key, array.length - 1, value);
    }

    function addToAddressArray(bytes32 key, address value) public {
        _checkAccess();
        address[] storage array = s_addressArrayStorage[key];
        array.push(value);
        emit Storage__AddressArrayDataChanged(key, array.length - 1, value);
    }

    function addToStringArray(bytes32 key, string calldata value) public {
        _checkAccess();
        string[] storage array = s_stringArrayStorage[key];
        array.push(value);
        emit Storage__StringArrayDataChanged(key, array.length - 1, value);
    }

    function updateUintArray(bytes32 key, uint256 index, uint256 value) public {
        _checkAccess();
        if (index >= s_uintArrayStorage[key].length) {
            revert Storage__InvalidArrayLengthInParams("updateUintArray");
        }
        s_uintArrayStorage[key][index] = value;
        emit Storage__UintArrayDataChanged(key, index, value);
    }

    function updateAddressArray(bytes32 key, uint256 index, address value) public {
        _checkAccess();
        if (index >= s_uintArrayStorage[key].length) {
            revert Storage__InvalidArrayLengthInParams("updateUintArray");
        }
        s_addressArrayStorage[key][index] = value;
        emit Storage__AddressArrayDataChanged(key, index, value);
    }

    function updateStringArray(bytes32 key, uint256 index, string calldata value) public {
        _checkAccess();
        if (index >= s_uintArrayStorage[key].length) {
            revert Storage__InvalidArrayLengthInParams("updateUintArray");
        }
        s_stringArrayStorage[key][index] = value;
        emit Storage__StringArrayDataChanged(key, index, value);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //                              ROLES HELPERS
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * @notice update address of an operator (role)
     */
    function updateOperator(string calldata role, address newOperator) public {
        setAddress(getKey(role), newOperator);
    }

    /**
     * @notice update the addresses of a set of operators
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
     * @notice get the addresses of an operator
     */
    function getOperator(string memory role) public view returns (address) {
        return getAddress(getKey(role));
    }

    /**
     * @notice Get the addresses of a set of operators
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
     * @notice Check that 'role' is assigned to 'address'
     */
    function isRole(string calldata role, address addr) public view returns (bool) {
        return getOperator(role) == addr;
    }

    /**
     * @notice Check that 'roles' are assigned to operators addresses
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
    //                              TOKEN NAMES AND CHAIN IDS
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /*
     * This functions have security purpose by forcing 2 step actions when adding a token
     * @todo REMOVE as not responsability of the contract
     */

    /**
     * @notice add a token name to the list of authorized tokens
     */
    function addTokenNameToList(string memory tokenName) public {
        _checkAccess();
        if (isTokenNameInList(tokenName)) {
            revert Storage__TokenAlreadyInList(tokenName);
        }
        string[] storage list = s_stringArrayStorage[getKey("tokenNamesList")];
        list.push(tokenName);

        emit Storage__TokenNameAdded(tokenName);
    }

    /**
     * @notice add a batch of token name to the list of authorized tokens
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
     * @notice get the list of authorized tokens
     */
    function getTokenNamesList() public view returns (string[] memory) {
        return getStringArray(getKey("tokenNamesList"));
    }

    /**
     * @notice check if token is in the list of authorized tokens
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
     * @notice add a chainId to the list of authorized chains
     */
    function addChainIdToList(uint256 chainId) public {
        _checkAccess();
        if (isChainIdInList(chainId)) {
            revert Storage__ChainIdAlreadyInList(chainId);
        }
        uint256[] storage list = s_uintArrayStorage[getKey("chainIdsList")];
        list.push(chainId);

        emit Storage__ChainIdAdded(chainId);
    }

    /**
     * @notice add a batch of chainId to the list of authorized chains
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
     * @notice get the list of authorized chain
     */
    function getChainIdsList() public view returns (uint256[] memory) {
        return getUintArray(getKey("chainIdsList"));
    }

    /**
     * @notice check if the chainId is in the list of authorized chain
     */
    function isChainIdInList(uint256 chainId) public view returns (bool) {
        uint256[] memory list = getUintArray(getKey("chainIdsList"));
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == chainId) {
                return true;
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
     * @notice get the address of 'tokenName' on 'chainId'
     */
    function getTokenAddressByChainId(string memory tokenName, uint256 chainId) public view returns (address) {
        return getAddress(getKey(tokenName, chainId));
    }

    /**
     * @notice get the addresses of 'tokenName' on origin and destination 'chainId'
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
     * @notice add a new address and chainId for 'tokenName'
     * @dev address shouldn't exist before
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
     * @notice update the address of 'tokenName' on 'chainId'
     * @dev address should exist before
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
     * @notice add a set of new addresses and chainIds for 'tokenNames'
     * @dev addresses shouldn't exist before
     */
    function batchAddNewTokensAddressesByChainId(
        string[] memory tokenNames,
        uint256[] memory chainIds,
        address[] memory tokenAddresses
    ) public {
        if (!_isAdmin() && !_isFactory()) {
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

    /**
     * @notice check if tokenName on chainId is authorized
     * @dev address shouldn't exist before
     */
    function isAuthorizedTokenByChainId(string memory tokenName, uint256 chainId) public view returns (bool) {
        return getTokenAddressByChainId(tokenName, chainId) != address(0);
    }

    //****************************************************************** */
    //
    //              PRIVATE FUNCTIONS
    //
    //****************************************************************** */

    // @todo ADD separate setters
    /**
     * @notice Sets the initial values. Draft version to ease dev/test
     *
     * @dev set default params (fees, block confimration..)
     * @dev TO REFACTOR when block checks, fees management implemented
     */
    function _setInitialValues() private {
        // blockToWait for confirmation on chainId
        setUint(getKey("blockToWait", 1), 6); //........... eth
        setUint(getKey("blockToWait", 11155111), 6); //.... sepolia
        setUint(getKey("blockToWait", 441), 2); //......... allfeat
        setUint(getKey("blockToWait", 31337), 2); //....... hardhat
        setUint(getKey("blockToWait", 440), 2); //......... allfeatLocal
        setUint(getKey("blockToWait", 1337), 2); //........ geth

        // operational fees on chainId
        uint256 opFees = 0.001 ether;
        setUint(getKey("opFees", 1), opFees); //........... eth
        setUint(getKey("opFees", 11155111), opFees); //.... sepolia
        setUint(getKey("opFees", 441), opFees); //......... allfeat
        setUint(getKey("opFees", 31337), opFees); //....... hardhat
        setUint(getKey("opFees", 440), opFees); //......... allfeatLocal
        setUint(getKey("opFees", 1337), opFees); //........ geth
        // protocol fees
        uint256 protocolPercentFees = 1000; // 0.1%
        setUint(getKey("protocolPercentFees", 1), protocolPercentFees); //....... eth
        setUint(getKey("protocolPercentFees", 11155111), protocolPercentFees); // sepolia
        setUint(getKey("protocolPercentFees", 441), protocolPercentFees); //..... allfeat
        setUint(getKey("protocolPercentFees", 31337), protocolPercentFees); //... hardhat
        setUint(getKey("protocolPercentFees", 440), protocolPercentFees); //..... allfeatLocal
        setUint(getKey("protocolPercentFees", 1337), protocolPercentFees); //.... geth
    }

    /**
     * @notice checks sender is the admin
     */
    function _isAdmin() private view returns (bool) {
        return getOperator("admin") == msg.sender;
    }

    /**
     * @notice checks sender is the factory
     */
    function _isFactory() private view returns (bool) {
        return getOperator("factory") == msg.sender;
    }

    /**
     * @notice checks sender is admin
     */
    function _checkAccess() private view {
        if (!_isAdmin()) {
            revert Storage__NotAdmin();
        }
    }

    function _setTokenAddressByChainId(string memory tokenName, uint256 chainId, address tokenAddress) private {
        setAddress(getKey(tokenName, chainId), tokenAddress);

        emit Storage__TokenAddressSet(tokenName, chainId, tokenAddress);
    }
}
