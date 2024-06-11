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
    // struct UserPosition{
    //     uint256 tokenDepositBalance;

    // }
    address constant maxAddress = address(type(uint160).max); // 0xffffFFFfFFffffffffffffffffffffFfFFFfffFFFfF

    address public s_storageAddress;
    mapping(address => uint256) public s_vaultBalance;
    // should be add by admin with storage setting authorized tokens (not remove if unauthorized !!)
    address[] public s_tokensInVault;
    // balance should be given to vault WHEN op is finalized
    // userBalance is redeemable if op is CANCELED
    // Mapping of user/operator => token => balance
    // find better memory management (struct position ?)
    mapping(address user => mapping(address token => uint256 balance) tokenBalance) public s_usersDeposits;
    mapping(address user => mapping(address token => uint256 balance) tokenBalance) public s_usersAmountToRedeem;

    // Mapping of the fees for each token (only one relayer, orcale... but later
    // should be adjust to manage list of oracles... and amount due to each)
    // later struct totXTokenFees and mapping operator amountToReddem
    mapping(address token => uint256) public s_feesBalance;
    // opFees are meant for the tx fees of the operators reumbursment
    mapping(address token => uint256) public s_opFeesBalance;

    // Mapping of minted tokens (bridged) // or bunr and mint with mint >= burn
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
            revert("Vault: caller is not the admin");
        }
    }

    // deposit token or native token
    function depositNative(address from) external payable onlyBridge {
        // add to the depositors balance
        s_usersDeposits[from][maxAddress] += msg.value;
    }

    function depositToken(address from, address token, uint256 amount) external onlyBridge {
        // transfer token to the vault
        // add to the depositors balance
        // uint256 nonce = actualNonce[msg.sender]++;
        s_usersDeposits[from][token] += amount;

        bool res = ERC20(token).transferFrom(from, address(this), amount);

        if (!res) {
            revert("transfer failed");
        }
    }

    // BRIDGED TOKENS
    // SEE bridge : Vault is the owner
    function mint(address token, address to, uint256 amount) external onlyBridge {
        s_mintedBalance[token] += amount;
        s_usersDeposits[to][token] += amount;
        BridgedToken(token).mint(to, amount);
    }

    function burn(address token, address owner, uint256 amount) external onlyBridge {
        // ERC20burnable check if the caller is the owner and the amount is not greater than the balance
        s_mintedBalance[token] -= amount;
        s_usersDeposits[owner][token] -= amount;
        BridgedToken(token).burn(owner, amount);
    }

    function unlockNative(address to, uint256 amount) external onlyBridge {
        // check if the amount is not greater than the balance
        // transfer the amount to the user
        if (amount > s_vaultBalance[maxAddress]) {
            revert("Vault: amount is greater than the balance");
        }
        s_vaultBalance[maxAddress] -= amount;

        payable(to).transfer(amount);
    }

    function unlockToken(address to, address token, uint256 amount) external onlyBridge {
        // check if the amount is not greater than the balance
        // transfer the amount to the user
        if (amount > s_vaultBalance[token]) {
            revert("Vault: amount is greater than the balance");
        }
        s_vaultBalance[token] -= amount;

        bool res = ERC20(token).transfer(to, amount);
        if (!res) {
            revert("transfer failed");
        }
    }

    function cancelDeposit(address from, address token, uint256 amount) external onlyBridge {
        // check if the amount is not greater than the balance
        // transfer the amount to the user
        if (amount > s_usersDeposits[from][token]) {
            revert("Vault: amount is greater than the balance");
        }
        s_usersDeposits[from][token] -= amount;
        s_usersAmountToRedeem[from][token] += amount;
    }

    function finalizeDeposit(address from, address token, uint256 amount) external onlyBridge {
        // check if the amount is not greater than the balance
        // transfer the amount to the user
        if (amount > s_usersDeposits[from][token]) {
            revert("Vault: amount is greater than the balance");
        }
        s_usersDeposits[from][token] -= amount;
        s_vaultBalance[token] += amount;
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

    // function depositFees(address token, uint256 amount, uint8 u8FeesType) external payable {
    //     FeesType feesType = FeesType(u8FeesType);
    //     if (token == address(0)) {
    //         if (msg.value == 0) {
    //             revert("Vault: msg.value is 0");
    //         }
    //         amount = msg.value;
    //     } else {
    //         if (amount == 0) {
    //             revert("Vault: amount is 0");
    //         }
    //         bool res = ERC20(token).transferFrom(msg.sender, address(this), amount);
    //         if (!res) {
    //             revert("transfer failed");
    //         }
    //     }
    //     if (feesType == FeesType.PROTOCOL) {
    //         s_feesBalance[token] += amount;
    //     } else {
    //         s_opFeesBalance[token] += amount;
    //     }
    // }

    function depositOperationFee() external payable {
        if (msg.value == 0) {
            revert("Vault: msg.value is 0");
        }
        s_opFeesBalance[maxAddress] += msg.value;
    }

    function depositProtocolFee(address token, uint256 amount) external {
        if (amount == 0) {
            revert("Vault: amount is 0");
        }
        s_feesBalance[token] += amount;

        bool res = ERC20(token).transferFrom(msg.sender, address(this), amount);
        if (!res) {
            revert("transfer failed");
        }
    }

    // Admin withdrawal (urgence // add check pause status... later), admin can withdraw all
    function adminUrgenceWithdrawal(address token, uint256 amount) external onlyAdmin {
        if (token == maxAddress) {
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
        s_vaultBalance[token] -= amount;
    }

    // Admin regular withdrawal (only protocol fees)
    function adminOpFeesWithdrawal(address token, uint256 amount) external onlyAdmin {
        // check fee balance
        if (amount > s_feesBalance[token]) {
            revert("Vault: amount is greater than the balance");
        }
        if (token == maxAddress) {
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
    function operatorRedeem(address token, uint256 amount) external onlyOracle {
        // check op fees balance
        // check ad is operator
        // later mapping operators => feesRedeemable
        if (amount > s_opFeesBalance[token]) {
            revert("Vault: amount is greater than the balance");
        }
        if (token == maxAddress) {
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
    function redeemUserDeposit(address token, uint256 amount) external {
        // ADD CHECK OP CANCELED
        // check user balance
        if (amount > s_usersAmountToRedeem[msg.sender][token]) {
            revert("Vault: amount is greater than the balance");
        }
        s_usersAmountToRedeem[msg.sender][token] -= amount;
        if (token == maxAddress) {
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

    // getters
    function getTokenUserBalance(address user, address token) external view returns (uint256) {
        return s_usersDeposits[user][token];
    }

    function getOpFeesBalance(address token) external view returns (uint256) {
        return s_opFeesBalance[token];
    }
}
