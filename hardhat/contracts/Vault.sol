// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Storage} from "./Storage.sol";
import {BridgedToken} from "./BridgedToken.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

error Vault__CallerHasNotRole(string role);
error Vault__TransferFailed();
error Vault__InsufficientBalance(string message);
// ADD event!!!!

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

/**
 * @title Vault
 *
 * @notice This is the contract managing funds
 * @notice Its called by bridge to process operation, server (oracle) & admin to redeem fees
 *
 * @dev Native coin address is MAX_ADDRESS
 *
 * @dev Funds deposited are first updated in 's_usersDeposits'
 * @dev and then transfered to 's_vaultBalance'when operation is finalized
 * @dev or to 's_usersAmountToRedeem' if the operation is canceled to be redeemable
 */
contract Vault {
    //****************************************************************** */
    //
    //              STATE VARIABLES
    //
    //****************************************************************** */

    address constant MAX_ADDRESS = address(type(uint160).max); //....... 0xffffFFFfFFffffffffffffffffffffFfFFFfffFFFfF

    address public s_storage;

    mapping(address => uint256) public s_vaultBalance;
    // should be add by admin with storage setting authorized tokens (not remove if unauthorized !!)
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

    address[] public s_tokensInVault;

    //****************************************************************** */
    //
    //              MODIFIERS
    //
    //****************************************************************** */

    modifier onlyRole(string memory role) {
        if (!Storage(s_storage).isRole(role, msg.sender)) {
            revert Vault__CallerHasNotRole(role);
        }
        _;
    }

    //****************************************************************** */
    //
    //              EVENTS @todo add events without duplicating relayer and bridge
    //
    //****************************************************************** */

    //****************************************************************** */
    //
    //              CONSTRUCTOR / INITIALIZATION
    //
    //****************************************************************** */
    constructor(address storageAddress) {
        s_storage = storageAddress;

        if (!Storage(s_storage).isRole("admin", msg.sender)) {
            revert Vault__CallerHasNotRole("admin");
        }
    }

    //****************************************************************** */
    //
    //              BRIDGE TOKENS FUNCTIONS called ONLY by Bridge
    //
    //****************************************************************** */

    //**************************** DEPOSIT ORIGIN SIDE *********************************/
    /**
     * @notice Function to deposit native coin
     * @dev usersDeposit balance is updated not yet vaultBalance
     * @param from sender
     */
    function depositNative(address from) external payable onlyRole("bridge") {
        // add to the depositors balance
        s_usersDeposits[from][MAX_ADDRESS] += msg.value;
    }

    /**
     * @notice Function to deposit tokens
     * @dev usersDeposit balance is updated not yet vaultBalance
     * @param from sender
     * @param token address of the token deposited
     * @param amount amount to deposit
     */
    function depositToken(address from, address token, uint256 amount) external onlyRole("bridge") {
        s_usersDeposits[from][token] += amount;

        bool res = ERC20(token).transferFrom(from, address(this), amount);
        if (!res) {
            revert Vault__TransferFailed();
        }
    }
    /**
     * @notice Function to deposit tokens
     * @dev usersDeposit balance is updated not yet vaultBalance
     * @param from sender
     * @param token address of the token deposited
     * @param amount amount to deposit
     */

    function burn(address token, address owner, uint256 amount) external onlyRole("bridge") {
        s_mintedBalance[token] -= amount;
        s_usersDeposits[owner][token] -= amount;
        BridgedToken(token).burn(owner, amount);
    }

    function finalizeDeposit(address from, address token, uint256 amount) external onlyRole("bridge") {
        if (amount > s_usersDeposits[from][token]) {
            revert Vault__InsufficientBalance("Amount greater than deposit");
        }
        s_usersDeposits[from][token] -= amount;
        s_vaultBalance[token] += amount;
    }
    //**************************** TRANSFER DESTINATION SIDE *********************************/

    // BRIDGED TOKENS
    // SEE bridge : Vault is the owner
    function mint(address to, address token, uint256 amount) external onlyRole("bridge") {
        s_mintedBalance[token] += amount;
        s_usersDeposits[to][token] += amount;
        BridgedToken(token).mint(to, amount);
    }

    function unlockNative(address to, uint256 amount) external onlyRole("bridge") {
        if (amount > s_vaultBalance[MAX_ADDRESS]) {
            revert Vault__InsufficientBalance("Insufficient vault balance");
        }
        s_vaultBalance[MAX_ADDRESS] -= amount;

        payable(to).transfer(amount);
    }

    function unlockToken(address to, address token, uint256 amount) external onlyRole("bridge") {
        if (amount > s_vaultBalance[token]) {
            revert Vault__InsufficientBalance("Insufficient vault balance");
        }
        s_vaultBalance[token] -= amount;

        bool res = ERC20(token).transfer(to, amount);
        if (!res) {
            revert Vault__TransferFailed();
        }
    }

    //**************************** CANCELING *********************************/

    function cancelDeposit(address from, address token, uint256 amount) external onlyRole("bridge") {
        if (amount > s_usersDeposits[from][token]) {
            revert Vault__InsufficientBalance("Amount greater than deposit");
        }
        s_usersDeposits[from][token] -= amount;
        s_usersAmountToRedeem[from][token] += amount;
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
        s_opFeesBalance[MAX_ADDRESS] += msg.value;
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
    function adminUrgenceWithdrawal(address token, uint256 amount) external onlyRole("admin") {
        if (token == MAX_ADDRESS) {
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
    function adminOpFeesWithdrawal(address token, uint256 amount) external onlyRole("admin") {
        // check fee balance
        if (amount > s_feesBalance[token]) {
            revert("Vault: amount is greater than the balance");
        }
        if (token == MAX_ADDRESS) {
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
    function operatorRedeem(address token, uint256 amount) external onlyRole("oracle") {
        // check op fees balance
        // check ad is operator
        // later mapping operators => feesRedeemable
        if (amount > s_opFeesBalance[token]) {
            revert("Vault: amount is greater than the balance");
        }
        if (token == MAX_ADDRESS) {
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
        if (token == MAX_ADDRESS) {
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
    function updateVaultBalance(address user, address token, uint256 amount) external onlyRole("relayer") {
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
