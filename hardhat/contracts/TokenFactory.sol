// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BridgedToken.sol";
import "./Storage.sol";

/**
 * Contract to create new bridged tokens
 */
contract TokenFactory {
    address public s_storageAddress;

    //TESTING
    address owner;
    // factory use symbol not name (name is used in storage for bridge )
    mapping(address => bool) public s_isBridgedToken;
    mapping(string => address) public symbolToAddress;
    string[] public BridgedTokens;

    modifier onlyAdmin() {
        require(Storage(s_storageAddress).isAdmin(msg.sender), "TokenFactory: caller is not the admin");
        _;
    }

    event BridgeTokenCreated(address indexed token, string name, string symbol, address owner);

    constructor(address storageAddress) {
        //TESTING
        owner = msg.sender;
        // first deployed is storage so admin of storage should be the admin of the factory and msg.sender
        // store the storage address
        // check is isAdmin(msg.sender) in the storage
        s_storageAddress = storageAddress;
        if (!Storage(s_storageAddress).isAdmin(msg.sender)) {
            revert("TokenFactory: caller is not the admin");
        }
    }

    //TESTING
    function getOwner() public view returns (address) {
        return owner;
    }

    // function updateAdmin(address newAdmin) external onlyAdmin {
    //     admin = newAdmin;
    // }

    // function updateBridge(address newBridge) external onlyAdmin {
    //     bridge = newBridge;
    // }

    // createToken => synthetic of orignal token
    // Make func to specifically Add a new token (AND its original eqv)
    // and another one to update (new synt version, or new original version)
    //@todo ADD :
    //     function createToken(string memory name, string memory symbol, uint256 originChainId, address originAddress)

    // SHOULD set origin cahin & address AND current chain & new address
    // SHOULD check if orign chain & address is not already set
    // in case of upgrade of token admin should remove from storage first (2* action to prevent error)
    //@todo :
    // rethink storage mapping and token ref => name instead of symbol
    // cause name is unique, but symbol can be different on different chain (bridged token)
    // Factory is the owner of the token
    // ADD origin symbol / bSymbol
    function createToken(string memory name, string memory symbol) external onlyAdmin returns (address) {
        // originChain != 0
        // if (originChainId == 0) {
        //     revert("TokenFactory: originChainId is 0");
        // }
        // check name and symbol are not empty

        if (bytes(name).length == 0 || bytes(symbol).length == 0) {
            revert("TokenFactory: name or symbol is empty");
        }

        if (symbolToAddress[symbol] != address(0)) {
            revert("TokenFactory: token symbol already exists");
        }

        BridgedToken token = new BridgedToken(name, symbol);

        // transfer ownership to the bridge
        // token.updateAdmin(bridge);
        // IsBridgedToken[address(token)] = true;
        // BridgedTokens.push(address(token));
        // updtae in storage (REMOVE UNUSED FUNCTIONS !!)
        // Storage(s_storageAddress).addBridgedTokenList(address(token));
        // Storage(s_storageAddress).setBridgedToken(address(token), true);
        // Storage(s_storageAddress).addTokenList(address(token));
        // Storage(s_storageAddress).setBridgedTokenToChainId(address(token), originChainId);
        // Storage(s_storageAddress).setAuthorizedToken(address(token), true);
        // RENAME setTokenOnChainId !!! the global mapping of token equivalence

        // ADMIN SHOULD HAVE ADDED THE SYMBOL & CHAIN TO LISTS
        //@todo change REF TO TOKEN BY NAME not SYMBOL (and add origin / destiantion symbol)
        // Storage(s_storageAddress).addNewTokenAddressByChainId(symbol, originChainId, originAddress);
        Storage(s_storageAddress).addNewTokenAddressByChainId(name, block.chainid, address(token));

        // transfert ownership to Vault
        address vault = Storage(s_storageAddress).getOperator("vault");
        BridgedToken(token).updateAdmin(vault);

        // add the token to the list of tokens and set boolean
        BridgedTokens.push(symbol);
        s_isBridgedToken[address(token)] = true;
        symbolToAddress[symbol] = address(token);

        emit BridgeTokenCreated(address(token), name, symbol, vault);
        return address(token);
    }

    // pb with allfeat deployment (see script)
    // due to create in createToken tx revert with indication of estimation gas pb
    // so for allfeat we deploy manually
    // this helper finish the config of the var in factory with the deployed token data
    function helperHCK(string memory name, string memory symbol, address tokenAdd) external returns (address) {
        Storage(s_storageAddress).addNewTokenAddressByChainId(name, block.chainid, tokenAdd);
        address vault = Storage(s_storageAddress).getOperator("vault");
        // BridgedToken(tokenAdd).updateAdmin(vault);
        BridgedTokens.push(symbol);
        s_isBridgedToken[tokenAdd] = true;
        symbolToAddress[symbol] = tokenAdd;
    }

    function getTokenAddress(string memory symbol) external view returns (address) {
        return symbolToAddress[symbol];
    }

    function getTokenList() external view returns (string[] memory) {
        return BridgedTokens;
    }

    function isBridgedToken(address token) external view returns (bool) {
        return s_isBridgedToken[token];
    }
    //updtat list... storage

    // function mint(address token, address to, uint256 amount) external onlyBridge {
    //     BridgedToken(token).mint(to, amount);
    // }

    // function burn(address token, address owner, uint256 amount) external onlyBridge {
    //     BridgedToken(token).burn(owner, amount);
    // }

    // function transfer(address token, address to, uint256 amount) external onlyBridge {
    //     BridgedToken(token).transfer(to, amount);
    // }

    // function transferFrom(address token, address from, address to, uint256 amount) external onlyBridge {
    //     BridgedToken(token).transferFrom(from, to, amount);
    // }

    // function approve(address token, address spender, uint256 amount) external onlyBridge {
    //     BridgedToken(token).approve(spender, amount);
    // }

    // function getBridgedTokens() external view returns (address[] memory) {
    //     return BridgedTokens;
    // }

    // function isBridgedToken(address token) external view returns (bool) {
    //     return IsBridgedToken[token];
    // }
}
