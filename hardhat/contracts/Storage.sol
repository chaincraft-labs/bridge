// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {TokenFactory} from "./TokenFactory.sol";
// Eternal storage for the bridge ecosyste allowing to upgrade modules
// ERRORS

error storage_not_admin();
error storage_token_not_in_list(string tokenName);
error storage_chainid_not_in_list(uint256 chainId);
error storage_token_already_set(string tokenName, uint256 chainId);
error storage_token_not_set(string tokenName, uint256 chainId);

// @todo
// refactor and add events
// add fees variables (op, base, protocol, etc.)
// keep only needed storage
// store all varibles without balances (managed by vault) and operation (managed by relayer)

//@todo
// refactor token infos to : name => chainId => symbol & address
contract Storage {
    address constant maxAddress = address(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF);

    mapping(bytes32 => uint256) internal s_uintStorage;
    mapping(bytes32 => address) internal s_addressStorage;
    mapping(bytes32 => bool) internal s_boolStorage;
    mapping(bytes32 => bytes) internal s_bytesStorage;
    mapping(bytes32 => string) internal s_stringStorage;
    mapping(bytes32 => bytes32) internal s_bytes32Storage;
    mapping(bytes32 => uint256[]) internal s_uintArrayStorage;
    mapping(bytes32 => address[]) internal s_addressArrayStorage; // use this for operators versions.. also
    mapping(bytes32 => bytes[]) internal s_bytesArrayStorage;
    mapping(bytes32 => string[]) internal s_stringArrayStorage;
    mapping(bytes32 => bytes32[]) internal s_bytes32ArrayStorage;

    //
    //TESTING
    address owner;
    // move into addressStorage key == H(symbol, chainId)
    // mapping(string tokenTokenName => mapping(uint256 chainId => address tokenAddressOnChainId)) public tokensMapping;

    // EVENTS
    event Storage_TokenNameAdded(string tokenName);
    event Storage_ChainIdAdded(uint256 chainId);
    event Storage_AuthorizedTokenNameAdded(string tokenName, uint256 chainId);
    event Storage_AuthorizedTokenNameRemoved(string tokenName, uint256 chainId);
    event Storage_TokenAddressSet(string tokenName, uint256 chainId, address tokenAddress);

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

    // mapping(bytes32 => Key) public existingKeys;
    // bytes32[] public existingKeysList;

    // // only admin access setters!!

    // function addNewKey(bytes32 key, string memory field, StorageType storageType) public {
    //     existingKeys[key] = Key(true, field, address(0), 0, storageType);
    //     existingKeysList.push(key);
    // }

    // function removeKey(bytes32 key) public {
    //     delete existingKeys[key];
    //     for (uint256 i = 0; i < existingKeysList.length; i++) {
    //         if (existingKeysList[i] == key) {
    //             existingKeysList[i] = existingKeysList[existingKeysList.length - 1];
    //             existingKeysList.pop();
    //             break;
    //         }
    //     }
    // }

    // function isValidKey(bytes32 key) public view returns (bool) {
    //     return existingKeys[key].exists;
    // }

    // NATIVE toekn address(0) => address.max == 0xffffffffffffffffffffffffffffffffffffffff
    // to avoid confusion with real address(0) == 0x

    // RENAME ALL LABEL USING A SPECIAL FORMAT : opertator_role ... to reduce collision risk / with maj/min
    // USE constant if possible for essential values
    constructor(string memory nativeTokenName) {
        //TESTING
        owner = msg.sender;
        uint256 nativeChainId = block.chainid; // on hardhat == 31337

        // set admin role as msg.sender
        // updateOperator("admin", msg.sender);
        // setAddress(getKey("admin"), msg.sender);
        s_addressStorage[getKey("admin")] = msg.sender;

        setUint(getKey("nativeChainId"), nativeChainId);

        setString(getKey("nativeTokenName"), nativeTokenName);
        addChainIdToList(nativeChainId);
        addTokenNameToList(nativeTokenName);

        // set initial values
        setInitialValues();
    }

    //TESTSING
    function getOwner() public view returns (address) {
        return owner;
    }

    // @todo IMPORTANT
    // make nonreeentrant var for all the system via transient storage

    // chainId eth == 1(0x1), sepolia == 11155111 (0xaa36a7), allfeat  441, hardhat 31337
    // TEMPORARY (define real value) blockToWait : blockId eth : 6 , allfeat : 2
    // TEMPORARY TO EASE TESTING
    function setInitialValues() public {
        // blockToWait for confirmation on chainId
        setUint(getKey("blockToWait", 1), 6); // eth
        setUint(getKey("blockToWait", 11155111), 6); // sepolia
        setUint(getKey("blockToWait", 441), 2); // allfeat
        setUint(getKey("blockToWait", 440), 2); // allfeat
        setUint(getKey("blockToWait", 31337), 2); // hardhat
        setUint(getKey("blockToWait", 1337), 2); // geth
        // operational fees on chainId
        uint256 opFees = 0.001 ether;
        setUint(getKey("opFees", 1), opFees); // eth
        setUint(getKey("opFees", 11155111), opFees); // sepolia
        setUint(getKey("opFees", 441), opFees); // allfeat
        setUint(getKey("opFees", 440), opFees); // allfeat
        setUint(getKey("opFees", 31337), opFees); // hardhat
        setUint(getKey("opFees", 1337), opFees); // geth

        // protocol fees
        uint256 protocolPercentFees = 1000; // 0.1%
        setUint(getKey("protocolPercentFees", 1), protocolPercentFees); // eth
        setUint(getKey("protocolPercentFees", 11155111), protocolPercentFees); // sepolia
        setUint(getKey("protocolPercentFees", 441), protocolPercentFees); // allfeat
        setUint(getKey("protocolPercentFees", 440), protocolPercentFees); // allfeat
        setUint(getKey("protocolPercentFees", 31337), protocolPercentFees); // hardhat
        setUint(getKey("protocolPercentFees", 1337), protocolPercentFees); // geth
    }
    // for mock and tesing

    function setTestValues(address mockedDai, address bridgedEth, address bridgedAft, address bridgedDai) public {
        // setAuthorizedToken(mockedDai, true);
        // addTokenList(mockedDai);
        // addChainIdsList(31337);
        // setBridgedTokenToChainId(bridgedEth, 441);
        // setTokenOnChainId("ETH", 1, address(0));

        // ADD chains to list
        addChainIdToList(11155111);
        addChainIdToList(441);
        addChainIdToList(440);
        addChainIdToList(31337);
        // add token tokenNames to list
        addTokenNameToList("ETH");
        addTokenNameToList("AFT");
        addTokenNameToList("DAI");

        // add authorized tokenNames to chainId
        addToAuthorizedTokenNamesListByChainId("ETH", 441);
        addToAuthorizedTokenNamesListByChainId("AFT", 441);
        addToAuthorizedTokenNamesListByChainId("DAI", 441);

        // add native token to chainId
        addNativeTokenByChainId("ETH", 11155111);
        addNativeTokenByChainId("ETH", 31337);
        addNativeTokenByChainId("AFT", 441);

        addNewTokenAddressByChainId("ETH", 441, bridgedEth);

        addNewTokenAddressByChainId("AFT", 11155111, bridgedAft); // sepolia bridgedAFT
        addNewTokenAddressByChainId("AFT", 31337, bridgedAft); // hardhat bridgedAFT

        addNewTokenAddressByChainId("DAI", 441, bridgedDai);
        addNewTokenAddressByChainId("DAI", 31337, mockedDai);
    }

    function setTestOperator(
        address admin,
        address relayer,
        address oracle,
        address bridge,
        address factory,
        address vault
    ) public {
        updateOperator("admin", admin);
        updateOperator("relayer", relayer);
        updateOperator("oracle", oracle);
        updateOperator("bridge", bridge);
        updateOperator("factory", factory);
        updateOperator("vault", vault);
    }

    // ACCESS CONTROL
    function isAdmin() public view returns (bool) {
        return getOperator("admin") == msg.sender;
    }

    function isBridge() public view returns (bool) {
        return getOperator("bridge") == msg.sender;
    }

    function isFactory() public view returns (bool) {
        return getOperator("factory") == msg.sender;
    }

    // key management functions
    function getKey(string memory key) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(key));
    }
    // get key by name and address

    function getKey(string memory key, address addr) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(key, addr));
    }
    // get key by name and uint

    function getKey(string memory key, uint256 number) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(key, number));
    }

    // all getters for s_xxxStorage where xxx ist the type of the storage
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

    function getBytesArray(bytes32 key) public view returns (bytes[] memory) {
        return s_bytesArrayStorage[key];
    }

    function getStringArray(bytes32 key) public view returns (string[] memory) {
        return s_stringArrayStorage[key];
    }

    function getBytes32Array(bytes32 key) public view returns (bytes32[] memory) {
        return s_bytes32ArrayStorage[key];
    }

    // all setters for s_xxxStorage where xxx ist the type of the storage
    // SET ACCESS CONTROLE FOR SETTERS!!
    function setUint(bytes32 key, uint256 value) public {
        if (!isAdmin()) {
            revert storage_not_admin();
        }
        s_uintStorage[key] = value;
    }

    // SEPARATE FUNC
    function setAddress(bytes32 key, address value) public {
        if (!isAdmin() && !isFactory()) {
            revert storage_not_admin();
        }
        s_addressStorage[key] = value;
    }

    function setBool(bytes32 key, bool value) public {
        if (!isAdmin()) {
            revert storage_not_admin();
        }
        s_boolStorage[key] = value;
    }

    function setBytes(bytes32 key, bytes memory value) public {
        if (!isAdmin()) {
            revert storage_not_admin();
        }
        s_bytesStorage[key] = value;
    }

    function setString(bytes32 key, string memory value) public {
        if (!isAdmin()) {
            revert storage_not_admin();
        }
        s_stringStorage[key] = value;
    }

    function setBytes32(bytes32 key, bytes32 value) public {
        if (!isAdmin()) {
            revert storage_not_admin();
        }
        s_bytes32Storage[key] = value;
    }

    function setUintArray(bytes32 key, uint256[] memory value) public {
        if (!isAdmin()) {
            revert storage_not_admin();
        }
        s_uintArrayStorage[key] = value;
    }

    function setAddressArray(bytes32 key, address[] memory value) public {
        if (!isAdmin()) {
            revert storage_not_admin();
        }
        s_addressArrayStorage[key] = value;
    }

    // function setBytesArray(bytes32 key, bytes[] memory value) public {
    //     s_bytesArrayStorage[key] = value;
    // }

    // function setStringArray(bytes32 key, string[] memory value) public {
    //     s_stringArrayStorage[key] = value;
    // }

    // function setBytes32Array(bytes32 key, bytes32[] memory value) public {
    //     s_bytes32ArrayStorage[key] = value;
    // }

    // REMOVED DELETE FUNCTIONS SHOULD SET TO DEFAULT VALUE (! with arrays & complex type if added)
    // function deleteUint(bytes32 key) public {
    //     delete s_uintStorage[key];
    // }

    //         mapping(address => bool) public authorizedTokens;//bool storage
    //     mapping(uint256 => bool) public authorizedChains;// bool storage
    //  mapping(address => bool) public bridgedTokens;
    //     address[] public bridgedTokensList;
    //       mapping(address tokenHere => mapping(uint256 chainId => address tokenThere)) public tokenMapping;
    //     address[] public tokensList;
    //     uint256[] public chainIdsList;

    // RENAME FUNCTIONS!!
    // getter / setter of authorizedTokens using bool storage and key getter
    // function getAuthorizedToken(address token) public view returns (bool) {
    //     return getBool(getKey("authorizedTokens", token));
    // }

    // function setAuthorizedToken(address token, bool value) public {
    //     setBool(getKey("authorizedTokens", token), value);
    // }

    // function setTokenAuthorization(address token, uint256 chainId, bool value) public {
    //     setAuthorizedToken(token, value);
    //     if (value) {
    //         addTokenList(token);
    //     } else {
    //         removeTokenList(token);
    //     }
    // }

    // getter / setter of authorizedChains using bool storage and key getter

    // function getAuthorizedChain(uint256 chainId) public view returns (bool) {
    //     return getBool(getKey("authorizedChains", chainId));
    // }

    // function setAuthorizedChain(uint256 chainId, bool value) public {
    //     setBool(getKey("authorizedChains", chainId), value);
    // }
    // // getter / setter of bridgedTokens using bool storage and key getter

    // function getBridgedToken(address token) public view returns (bool) {
    //     return getBool(getKey("bridgedTokens", token));
    // }

    // function isBridgedToken(address token) public view returns (bool) {
    //     return getBool(getKey("bridgedTokens", token));
    // }

    // function setBridgedToken(address token, bool value) public {
    //     setBool(getKey("bridgedTokens", token), value);
    // }

    // getter / setter of bridgedTokensList using address storage and key getter
    // get all / get by index / add / remove

    // function getBridgedTokenList() public view returns (address[] memory) {
    //     return getAddressArray(getKey("bridgedTokensList"));
    // }

    // function getBridgedTokenList(uint256 index) public view returns (address) {
    //     return getAddress(getKey("bridgedTokensList", index));
    // }

    // function addBridgedTokenList(address token) public {
    //     address[] storage list = s_addressArrayStorage[getKey("bridgedTokensList")];
    //     list.push(token);
    // }

    // function removeBridgedTokenList(address token) public {
    //     address[] storage list = s_addressArrayStorage[getKey("bridgedTokensList")];
    //     for (uint256 i = 0; i < list.length; i++) {
    //         if (list[i] == token) {
    //             list[i] = list[list.length - 1];
    //             list.pop();
    //             break;
    //         }
    //     }
    // }
    // getter / setter of tokenLists using address storage and key getter
    // get all / get by index / add / remove

    // function getTokenList() public view returns (address[] memory) {
    //     return getAddressArray(getKey("tokensList"));
    // }

    // function getTokenList(uint256 index) public view returns (address) {
    //     return getAddress(getKey("tokensList", index));
    // }

    // function addTokenList(address token) public {
    //     address[] storage list = s_addressArrayStorage[getKey("tokensList")];
    //     list.push(token);
    // }

    // function removeTokenList(address token) public {
    //     address[] storage list = s_addressArrayStorage[getKey("tokensList")];
    //     for (uint256 i = 0; i < list.length; i++) {
    //         if (list[i] == token) {
    //             list[i] = list[list.length - 1];
    //             list.pop();
    //             break;
    //         }
    //     }
    // }
    // getter / setter of chainIdsList using uint storage and key getter
    // get all / get by index / add / remove

    // function getChainIdsList() public view returns (uint256[] memory) {
    //     return getUintArray(getKey("chainIdsList"));
    // }

    // function getChainIdsList(uint256 index) public view returns (uint256) {
    //     return getUint(getKey("chainIdsList", index));
    // }

    // function addChainIdsList(uint256 chainId) public {
    //     uint256[] storage list = s_uintArrayStorage[getKey("chainIdsList")];
    //     list.push(chainId);
    // }

    // function removeChainIdsList(uint256 chainId) public {
    //     uint256[] storage list = s_uintArrayStorage[getKey("chainIdsList")];
    //     for (uint256 i = 0; i < list.length; i++) {
    //         if (list[i] == chainId) {
    //             list[i] = list[list.length - 1];
    //             list.pop();
    //             break;
    //         }
    //     }
    // }
    // getter / setter of birdegTokenToChainID using address storage and key getter
    //get / set // delete / add / remove

    ///////////////////////////////////////////////////////////////////////////////////////////////
    //
    //                      TOKENS LIST, INFOS ...
    //
    ///////////////////////////////////////////////////////////////////////////////////////////////

    // tokenNamesList == token symbol added to the bridge (we can not remove them - if we need recover old token)
    // authorizedTokensListByChainId == token authorized to be bridged (we can remove authorization)

    //@todo
    // CAHNGE SYMBOL TO NAME cause name is unique not symbol (ETH != bETH)
    // Later pack data ( symbol - address) and a utilities to extract it
    function addTokenNameToList(string memory tokenName) public {
        if (!isAdmin()) {
            revert storage_not_admin();
        }
        string[] storage list = s_stringArrayStorage[getKey("tokenNamesList")];
        list.push(tokenName);

        emit Storage_TokenNameAdded(tokenName);
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

    function addChainIdToList(uint256 chainId) public {
        if (!isAdmin()) {
            revert storage_not_admin();
        }
        uint256[] storage list = s_uintArrayStorage[getKey("chainIdsList")];
        list.push(chainId);

        emit Storage_ChainIdAdded(chainId);
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

    // @todo
    // for front add token tokenName by chain lists AND/? chain by token tokenName
    // It will have to checke authorization
    function addToAuthorizedTokenNamesListByChainId(string memory tokenName, uint256 chainId) public {
        if (!isAdmin() && !isFactory()) {
            revert storage_not_admin();
        }
        string[] storage list = s_stringArrayStorage[getKey("authorizedTokenNamesListByChainId", chainId)];
        list.push(tokenName);

        emit Storage_AuthorizedTokenNameAdded(tokenName, chainId);
    }

    function removeFromAuthorizedTokenNamesListByChainId(string memory tokenName, uint256 chainId) public {
        if (!isAdmin()) {
            revert storage_not_admin();
        }
        string[] storage list = s_stringArrayStorage[getKey("authorizedTokenNamesListByChainId", chainId)];
        for (uint256 i = 0; i < list.length; i++) {
            if (keccak256(abi.encodePacked(list[i])) == keccak256(abi.encodePacked(tokenName))) {
                list[i] = list[list.length - 1];
                list.pop();
                break;
            }
        }

        emit Storage_AuthorizedTokenNameRemoved(tokenName, chainId);
    }

    function getAuthorizedTokenNamesListByChainId(uint256 chainId) public view returns (string[] memory) {
        return getStringArray(getKey("authorizedTokenNamesListByChainId", chainId));
    }

    function isTokenNameAuthorizedByChainId(string memory tokenName, uint256 chainId) public view returns (bool) {
        string[] memory list = getStringArray(getKey("authorizedTokenNamesListByChainId", chainId));
        for (uint256 i = 0; i < list.length; i++) {
            if (keccak256(abi.encodePacked(list[i])) == keccak256(abi.encodePacked(tokenName))) {
                return true;
            }
        }
        return false;
    }

    // Token is Authorized on ChainID if tokenaddress is != add(0)
    // Native token address are address.max == 0xffffffffffffffffffffffffffffffffffffffff

    // REMOVED => the factory should manage this
    // function getBridgedTokenToChainId(address token) public view returns (uint256) {
    //     return getUint(getKey("bridgedTokenToChainId", token));
    // }

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

    // manage case of new version of token => ?? arrays of address, last is valid ??
    function setTokenAddressByChainId(string memory tokenName, uint256 chainId, address tokenAddress) public {
        if (!isTokenNameInList(tokenName)) {
            revert storage_token_not_in_list(tokenName);
        }
        if (!isChainIdInList(chainId)) {
            revert storage_chainid_not_in_list(chainId);
        }
        setAddress(getKey(tokenName, chainId), tokenAddress);

        emit Storage_TokenAddressSet(tokenName, chainId, tokenAddress);
    }

    function getTokenAddressByChainId(string memory tokenName, uint256 chainId) public view returns (address) {
        return getAddress(getKey(tokenName, chainId));
    }

    // explicit func to avoid errors
    function addNewTokenAddressByChainId(string memory tokenName, uint256 chainId, address tokenAddress) public {
        if (getTokenAddressByChainId(tokenName, chainId) != address(0)) {
            revert storage_token_already_set(tokenName, chainId);
        }
        setTokenAddressByChainId(tokenName, chainId, tokenAddress);

        addToAuthorizedTokenNamesListByChainId(tokenName, chainId);
    }

    function removeTokenAddressByChainId(string memory tokenName, uint256 chainId) public {
        if (getTokenAddressByChainId(tokenName, chainId) == address(0)) {
            revert storage_token_not_set(tokenName, chainId);
        }
        setTokenAddressByChainId(tokenName, chainId, address(0));

        removeFromAuthorizedTokenNamesListByChainId(tokenName, chainId);
    }

    function updateTokenAddressByChainId(string memory tokenName, uint256 chainId, address tokenAddress) public {
        if (getTokenAddressByChainId(tokenName, chainId) == address(0)) {
            revert storage_token_not_set(tokenName, chainId);
        }
        setTokenAddressByChainId(tokenName, chainId, tokenAddress);
    }
    // @todo CHANGE complex inutil => prone to error in flow of action / doon't store to tokenName but value set at initialization

    function addNativeTokenByChainId(string memory tokenName, uint256 chainId) public {
        setTokenAddressByChainId(getString(getKey("nativeTokenName")), chainId, maxAddress);

        addToAuthorizedTokenNamesListByChainId(tokenName, chainId);
    }

    function batchAddNewTokenAddressByChainId(
        string[] memory tokenNames,
        uint256[] memory chainIds,
        address[] memory tokenAddresses
    ) public {
        require(
            tokenNames.length == chainIds.length,
            "Storage: batchUpdateTokenAddressByChainId: tokenNames and chainIds length mismatch"
        );
        require(
            chainIds.length == tokenAddresses.length,
            "Storage: batchUpdateTokenAddressByChainId: chainIds and tokenAddresses length mismatch"
        );
        for (uint256 i = 0; i < tokenNames.length; i++) {
            addNewTokenAddressByChainId(tokenNames[i], chainIds[i], tokenAddresses[i]);
        }
    }

    function getTokenAddressesBychainIds(string memory tokenName, uint256 originChainId, uint256 destinationChainId)
        public
        view
        returns (address, address)
    {
        return (
            getTokenAddressByChainId(tokenName, originChainId), getTokenAddressByChainId(tokenName, destinationChainId)
        );
    }

    function isAuthorizedTokenByChainId(string memory tokenName, uint256 chainId) public view returns (bool) {
        return getTokenAddressByChainId(tokenName, chainId) != address(0);
    }

    // CHEAT to avoid stack too deep in bridge => to change later
    function isBridgedToken(address tokenAddress) public view returns (bool) {
        TokenFactory tf = TokenFactory(getOperator("factory"));
        return tf.isBridgedToken(tokenAddress);
    }

    // test packing tokenName and address
    // string of 5 char is 40 bits, btween 0x0 and 0xffffffffff convert in string :
    // "abd" => 0x616263
    // "a" => 0x61
    // "ZZZZZZ" => 0x5a5a5a5a5a5a
    // ?? => 0x 112233 SSSSSSSSS add(20bytes)
    // 1-3 status/pause state... SSSS tokenName in hex

    // // @todo
    // // ATTENTION add(0) => native token here
    // // tokenMapped = add(0) => native token on chainId
    // // by default Add are 0 so change this to Maxaddress for native tokens
    // // and convert

    // // getter / setter of tokensMapping using address storage and key getter
    // // RENAME!!
    // function getTokenOnChainId(string memory tokenName, uint256 chainId) public view returns (address) {
    //     return tokensMapping[tokenName][chainId];
    // }

    // function getTokensFromChains(string memory tokenName, uint256 chainIdFrom, uint256 chainIdTo)
    //     public
    //     view
    //     returns (address, address)
    // {
    //     return (tokensMapping[tokenName][chainIdFrom], tokensMapping[tokenName][chainIdTo]);
    // }

    // function setTokenOnChainId(string memory tokenName, uint256 chainId, address tokenAddressOnChainId) public {
    //     tokensMapping[tokenName][chainId] = tokenAddressOnChainId;
    // }

    // function batchSetTokenOnChainId(
    //     string[] memory tokenNames,
    //     uint256[] memory chainIds,
    //     address[] memory tokenAddressOnChainIds
    // ) public {
    //     require(
    //         chainIds.length == tokenAddressOnChainIds.length,
    //         "Storage: batchSetTokenOnChainId: chainIds and tokenAddressOnChainIds length mismatch"
    //     );
    //     require(
    //         tokenNames.length * 2 == tokenAddressOnChainIds.length,
    //         "Storage: batchSetTokenOnChainId: tokenNames and tokenAddressOnChainIds length mismatch"
    //     );
    //     for (uint256 i = 0; i < tokenNames.length; i++) {
    //         for (uint256 j = 0; j < 2; j++) {
    //             setTokenOnChainId(tokenNames[i], chainIds[i * 2 + j], tokenAddressOnChainIds[i * 2 + j]);
    //         }
    //     }
    // }

    ///////////////////////////////////////////////////////////////////////////////////////////////
    //
    //                      OPERATORS
    //
    ///////////////////////////////////////////////////////////////////////////////////////////////

    // @todo
    // At the moment only one admin, relayer, oracle (server), factory, vault, etc.
    // later refactor to have array of relayers, orcales, etc.
    // and refactor to have access control for admin, relayer, oracle, etc. (via openzeppelin access control)

    // @todo ENUM of role for admin, relayer, oracle, factory, vault, etc.

    // update functions to change the address of the admin, relayer, oracle, factory, vault, etc.
    function updateOperator(string memory role, address newOperator) public {
        setAddress(getKey(role), newOperator);
    }
    // function updateAdmin(address newAdmin) public {
    //     setAddress(getKey("admin"), newAdmin);
    // }
    // getters

    function getOperator(string memory role) public view returns (address) {
        return getAddress(getKey(role));
    }

    function getOperators(string[] memory roles) public view returns (address[] memory) {
        address[] memory operators = new address[](roles.length);
        for (uint256 i = 0; i < roles.length; i++) {
            operators[i] = getOperator(roles[i]);
        }
        return operators;
    }
    // function getAdmin() public view returns (address) {
    //     return getAddress(getKey("admin"));
    // }

    // chekc if address is admin, relayer, oracle, factory, vault, etc.

    function isAdmin(address addr) public view returns (bool) {
        return getOperator("admin") == addr;
    }

    function isRelayer(address addr) public view returns (bool) {
        return getOperator("relayer") == addr;
    }

    function isOracle(address addr) public view returns (bool) {
        return getOperator("oracle") == addr;
    }

    function isBridge(address addr) public view returns (bool) {
        return getOperator("bridge") == addr;
    }

    function isFactory(address addr) public view returns (bool) {
        return getOperator("factory") == addr;
    }

    function isVault(address addr) public view returns (bool) {
        return getOperator("vault") == addr;
    }

    function checkOperators(string[] memory roles, address[] memory operators) public view returns (bool) {
        require(roles.length == operators.length, "Storage: checkOperators: roles and operators length mismatch");
        for (uint256 i = 0; i < roles.length; i++) {
            if (getOperator(roles[i]) != operators[i]) {
                return false;
            }
        }
        return true;
    }
}
