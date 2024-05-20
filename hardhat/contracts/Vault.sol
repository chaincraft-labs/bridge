// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Storage} from "./Storage.sol";
import {BridgedToken} from "./BridgedToken.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// This contract is a placeholder for the actual vault contract
// Later dispatch DepositVault (native and erc20/ bridged) and FeesVault
// to have less exposure in case of a bug

// At the moment its the vault of all the tokens for the bridges and the fees
// A balance will be kept for each token

// ??
// It will be the owner of bridgedTokens (transfer of ownership will be done by the factory)
// to be abble to mint and burn tokens

// Authorized actors : admin, factory, bridge (relayer can't access the vault)

// @todo : add status of the vault (open, closed, paused, locked...)
// and up/down // ready (if all role are set in storage)

// @todo custom errors !!!

contract Vault {
    address public s_storageAddress;
    mapping(address => uint256) public s_vaultBalance;
    // balance should be given to vault WHEN op is finalized
    // userBalance is redeemable if op is CANCELED
    // Mapping of user/operator => token => balance
    mapping(address user => mapping(address token => uint256 balance) tokenBalance) public s_usersDeposits;

    // Mapping of the fees for each token (only one relayer, orcale... but later
    // should be adjust to manage list of oracles... and amount due to each)
    mapping(address token => uint256) public s_feesBalance;
    // opFees are meant for the tx fees of the operators reumbursment
    mapping(address token => uint256) public s_opFeesBalance;

    // Mapping of minted tokens (bridged)
    mapping(address token => uint256) public s_mintedBalance;

    // modifier (later functions if more optimized)
    modifier onlyAdmin() {
        require(Storage(s_storageAddress).isAdmin(msg.sender), "Vault: caller is not the admin");
        _;
    }

    modifier onlyFactory() {
        require(Storage(s_storageAddress).isFactory(msg.sender), "Vault: caller is not the factory");
        _;
    }

    modifier onlyBridge() {
        require(Storage(s_storageAddress).isBridge(msg.sender), "Vault: caller is not the bridge");
        _;
    }
    // server

    modifier onlyOracle() {
        require(Storage(s_storageAddress).isOracle(msg.sender), "Vault: caller is not the oracle");
        _;
    }

    modifier onlyRelayer() {
        require(Storage(s_storageAddress).isRelayer(msg.sender), "Vault: caller is not the relayer");
        _;
    }

    constructor(address storageAddress) {
        // first deployed is storage so admin of storage should be the admin of the factory and msg.sender
        // store the storage address
        // check is isAdmin(msg.sender) in the storage
        s_storageAddress = storageAddress;
        if (!Storage(s_storageAddress).isAdmin(msg.sender)) {
            revert("TokenFactory: caller is not the admin");
        }
    }

    // function deposit(address from, address token, uint256 amount, string memory tokenType, string memory depositType) {
    //     // check if the token is bridged
    //     // check if the token is allowed
    //     // check if the user is allowed
    //     // check if the amount is not 0
    //     // check if the depositType is allowed
    //     // check if the tokenType is allowed
    //     // check if the user has enough balance
    // }

    // deposit token or native token
    function depositNative(address from) external payable onlyBridge {
        // add to the depositors balance
        s_usersDeposits[from][address(0)] += msg.value;
    }

    function depositToken(address from, address token, uint256 amount) external onlyBridge {
        // transfer token to the vault
        // add to the depositors balance
        // uint256 nonce = actualNonce[msg.sender]++;
        bool res = ERC20(token).transferFrom(from, address(this), amount);

        if (!res) {
            revert("transfer failed");
        }
        s_usersDeposits[from][token] += amount;
    }

    // BRIDGED TOKENS
    // SEE bridge : should
    function mint(address token, address to, uint256 amount) external onlyBridge {
        BridgedToken(token).mint(to, amount);
        s_mintedBalance[token] += amount;
    }

    function burn(address token, address owner, uint256 amount) external onlyBridge {
        // ERC20burnable check if the caller is the owner and the amount is not greater than the balance
        BridgedToken(token).burn(owner, amount);
        s_mintedBalance[token] -= amount;
    }

    function unlockNative(address to, uint256 amount) external onlyBridge {
        // check if the amount is not greater than the balance
        // transfer the amount to the user
        if (amount > s_vaultBalance[address(0)]) {
            revert("Vault: amount is greater than the balance");
        }
        payable(to).transfer(amount);
        s_vaultBalance[address(0)] -= amount;
    }

    function unlockToken(address to, address token, uint256 amount) external onlyBridge {
        // check if the amount is not greater than the balance
        // transfer the amount to the user
        if (amount > s_vaultBalance[token]) {
            revert("Vault: amount is greater than the balance");
        }
        bool res = ERC20(token).transfer(to, amount);
        if (!res) {
            revert("transfer failed");
        }
        s_vaultBalance[token] -= amount;
    }

    // FEES MANAGEMENT
    // function depositFeesNative() external payable {
    //     s_feesBalance[address(0)] += msg.value;
    // }

    // function depositFeesToken(address token, uint256 amount) external {
    //     // transfer token to the vault
    //     // add to the fees balance
    //     bool res = ERC20(token).transferFrom(msg.sender, address(this), amount);

    //     if (!res) {
    //         revert("transfer failed");
    //     }
    //     s_feesBalance[token] += amount;
    // }

    enum FeesType {
        PROTOCOL,
        OPERATION
    }

    function depositFees(address token, uint256 amount, uint8 u8FeesType) external payable {
        FeesType feesType = FeesType(u8FeesType);
        if (token == address(0)) {
            if (msg.value == 0) {
                revert("Vault: msg.value is 0");
            }
            amount = msg.value;
        } else {
            if (amount == 0) {
                revert("Vault: amount is 0");
            }
            bool res = ERC20(token).transferFrom(msg.sender, address(this), amount);
            if (!res) {
                revert("transfer failed");
            }
        }
        if (feesType == FeesType.PROTOCOL) {
            s_feesBalance[token] += amount;
        } else {
            s_opFeesBalance[token] += amount;
        }
    }

    // Admin withdrawal (urgence // add check pause status... later), admin can withdraw all
    function adminUrgenceWithdrawal(address token, uint256 amount) external onlyAdmin {
        if (token == address(0)) {
            if (amount > address(this).balance) {
                revert("Vault: amount is greater than the balance");
            }
            payable(msg.sender).transfer(amount);
        } else {
            if (amount > s_vaultBalance[token]) {
                revert("Vault: amount is greater than the balance");
            }
            bool res = ERC20(token).transfer(msg.sender, amount);
            if (!res) {
                revert("transfer failed");
            }
        }
    }

    // Admin regular withdrawal (only protocol fees)
    function adminWithdrawal(address token, uint256 amount) external onlyAdmin {
        // check fee balance
        if (amount > s_feesBalance[token]) {
            revert("Vault: amount is greater than the balance");
        }
        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            bool res = ERC20(token).transfer(msg.sender, amount);
            if (!res) {
                revert("transfer failed");
            }
        }
        // update the fees balance
        s_feesBalance[token] -= amount;
    }

    // Operator redeem (add check mapping its actions to correspondant fees)
    function operatorRedeem(address token, uint256 amount) external onlyBridge {
        // check op fees balance
        if (amount > s_opFeesBalance[token]) {
            revert("Vault: amount is greater than the balance");
        }
        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            bool res = ERC20(token).transfer(msg.sender, amount);
            if (!res) {
                revert("transfer failed");
            }
        }
        // update the fees balance
        s_opFeesBalance[token] -= amount;
    }

    // user withdrawal (only his balance / add later check with relayer ONLY if op is CANCELED)
    function userReddem(address token, uint256 amount) external {
        // ADD CHECK OP CANCELED
        // check user balance
        if (amount > s_usersDeposits[msg.sender][token]) {
            revert("Vault: amount is greater than the balance");
        }
        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            bool res = ERC20(token).transfer(msg.sender, amount);
            if (!res) {
                revert("transfer failed");
            }
        }
        // update the user balance
        s_usersDeposits[msg.sender][token] -= amount;
    }

    // update balance of the vault
    // called by relayer : op FINALIZED => balance is transfered to the vault from user
    function updateVaultBalance(address user, address token, uint256 amount) external onlyRelayer {
        s_vaultBalance[token] += amount;
        s_usersDeposits[user][token] -= amount;
    }
}
