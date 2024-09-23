// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Storage} from "./Storage.sol";
import {BridgedToken} from "./BridgedToken.sol";
import {TokenFactory} from "./TokenFactory.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

error Vault__CallerHasNotRole(string role);
error Vault__TransferFailed();
error Vault__InsufficientBalance(string message);
error Vault__InvalidFeesParams(string message);

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
    enum FeesType {
        PROTOCOL,
        OPERATION
    }

    //****************************************************************** */
    //
    //              STATE VARIABLES
    //
    //****************************************************************** */

    address constant MAX_ADDRESS = address(type(uint160).max); //....... 0xffffFFFfFFffffffffffffffffffffFfFFFfffFFFfF

    address public s_storage;

    mapping(address => uint256) public s_vaultBalance;
    // User balance of deposited tokens BEFORE operation is finalized
    mapping(address user => mapping(address token => uint256 balance) tokenBalance) public s_usersDeposits;
    // User balance of token deposited redeemable AFTER operation is canceled
    mapping(address user => mapping(address token => uint256 balance) tokenBalance) public s_usersAmountToRedeem;
    // protocolFees: team, protocol.. fees
    mapping(address token => uint256) public s_protocolFeesBalance;
    // operationFees: tx reimbursement and reward for server
    mapping(address token => uint256) public s_operationFeesBalance;

    /*
    proposal for naming convention

    s_vaultBalance -> s_vaultBalances
    s_usersDeposits -> s_userDeposits
    s_usersAmountToRedeem -> userRedeemableBalances
    s_protocolFeesBalance -> s_protocolFeeBalances
    s_operationFeesBalance -> s_operationFeeBalances
    s_tokensInVault -> s_vaultTokens
    */

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

    // @todo remove commented line (quick fix)
    /**
     * @notice Function to deposit bridged tokens
     * @dev usersDeposit balance is updated not yet vaultBalance
     * @param owner sender
     * @param token address of the token deposited
     * @param amount amount to deposit
     */
    function burn(address owner, address token, uint256 amount) external onlyRole("bridge") {
        s_usersDeposits[owner][token] += amount;
        BridgedToken(token).burn(owner, amount);
    }

    /**
     * @notice It finalizes deposit: transitory userDeposit balance is updated to vaultBalance
     * @param from sender
     * @param token address of the token deposited
     * @param amount amount to deposit
     */
    function finalizeDeposit(address from, address token, uint256 amount) external onlyRole("bridge") {
        if (amount > s_usersDeposits[from][token]) {
            revert Vault__InsufficientBalance("Amount greater than deposit");
        }
        s_usersDeposits[from][token] -= amount;

        TokenFactory factory = TokenFactory(Storage(s_storage).getOperator("factory"));

        if (!factory.isBridgedToken(token)) {
            s_vaultBalance[token] += amount;
        }
    }

    /**
     * @notice It transfers balance from usersDeposit to usersAmountToRedeem to make funds redeemable
     * @param from user
     * @param token address of the token to unlock
     * @param amount amount to unlock
     */
    function cancelDeposit(address from, address token, uint256 amount) external onlyRole("bridge") {
        if (amount > s_usersDeposits[from][token]) {
            revert Vault__InsufficientBalance("Amount greater than deposit");
        }
        s_usersDeposits[from][token] -= amount;
        s_usersAmountToRedeem[from][token] += amount;
    }
    //**************************** TRANSFER DESTINATION SIDE *********************************/

    /**
     * @notice It mints bridged token to user
     * @param to recipient
     * @param token address of the token to mint
     * @param amount amount to mint
     */
    function mint(address to, address token, uint256 amount) external onlyRole("bridge") {
        BridgedToken(token).mint(to, amount);
    }

    /**
     * @notice It unlocks native coin and transfers it to user
     * @param to recipient
     * @param amount amount to mint
     */
    function unlockNative(address to, uint256 amount) external onlyRole("bridge") {
        if (amount > s_vaultBalance[MAX_ADDRESS]) {
            revert Vault__InsufficientBalance("Insufficient vault balance");
        }
        s_vaultBalance[MAX_ADDRESS] -= amount;

        payable(to).transfer(amount);
    }

    /**
     * @notice It unlocks token and transfers it to user
     * @param to recipient
     * @param token address of the token to unlock
     * @param amount amount to unlock
     */
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

    //****************************************************************** */
    //
    //              FEES MANAGEMENT
    //
    //****************************************************************** */

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
    //         s_protocolFeesBalance[token] += amount;
    //     } else {
    //         s_operationFeesBalance[token] += amount;
    //     }
    // }

    /**
     * @notice It handles deposit of operation fees (native coin) on destination
     */
    function depositOperationFee() external payable {
        if (msg.value == 0) {
            revert Vault__InvalidFeesParams("Msg.value is 0");
        }
        s_operationFeesBalance[MAX_ADDRESS] += msg.value;
    }

    /**
     * @notice It handles deposit of protocol fees (% of token deposited) on origin
     * @param token address of the token to unlock
     * @param amount amount to unlock
     */
    function depositProtocolFee(address token, uint256 amount) external {
        if (amount == 0) {
            revert Vault__InvalidFeesParams("Amount is 0");
        }
        s_protocolFeesBalance[token] += amount;

        bool res = ERC20(token).transferFrom(msg.sender, address(this), amount);
        if (!res) {
            revert Vault__TransferFailed();
        }
    }

    //****************************************************************** */
    //
    //              WITHDRAWALS
    //
    //****************************************************************** */

    /**
     * @notice It allows urgence withdrawal (case of hacks..)
     * @notice @todo To be removed / or add a very strong key managt/vote to authorize this
     * @param token address of the token to withdraw
     * @param amount amount to withdraw
     */
    function adminUrgenceWithdrawal(address token, uint256 amount) external onlyRole("admin") {
        if (token == MAX_ADDRESS) {
            if (amount > address(this).balance) {
                revert Vault__InsufficientBalance("Insufficient vault balance");
            }
            payable(msg.sender).transfer(amount);
        } else {
            if (amount > s_vaultBalance[token]) {
                revert Vault__InsufficientBalance("Insufficient vault balance");
            }
            bool res = ERC20(token).transfer(msg.sender, amount);
            if (!res) {
                revert Vault__TransferFailed();
            }
        }
        s_vaultBalance[token] -= amount;
    }

    /**
     * @notice Allows Admin to redeem protocol fees
     * @param token address of the token to withdraw
     * @param amount amount to withdraw
     */
    function adminOpFeesWithdrawal(address token, uint256 amount) external onlyRole("admin") {
        if (amount > s_protocolFeesBalance[token]) {
            revert Vault__InsufficientBalance("Insufficient vault balance");
        }
        if (token == MAX_ADDRESS) {
            payable(msg.sender).transfer(amount);
        } else {
            bool res = ERC20(token).transfer(msg.sender, amount);
            if (!res) {
                revert Vault__TransferFailed();
            }
        }
        s_protocolFeesBalance[token] -= amount;
    }

    /**
     * @notice Allows Server to redeem operator fees
     * @param token address of the token to withdraw
     * @param amount amount to withdraw
     */
    function operatorRedeem(address token, uint256 amount) external onlyRole("oracle") {
        if (amount > s_operationFeesBalance[token]) {
            revert Vault__InsufficientBalance("Insufficient vault balance");
        }
        if (token == MAX_ADDRESS) {
            payable(msg.sender).transfer(amount);
        } else {
            bool res = ERC20(token).transfer(msg.sender, amount);
            if (!res) {
                revert Vault__TransferFailed();
            }
        }
        s_operationFeesBalance[token] -= amount;
    }

    /**
     * @notice Allows user to redeem funds in case of operation canceled
     * @param token address of the token to withdraw
     * @param amount amount to withdraw
     */
    function redeemUserDeposit(address token, uint256 amount) external {
        if (amount > s_usersAmountToRedeem[msg.sender][token]) {
            revert Vault__InsufficientBalance("Insufficient vault balance");
        }
        s_usersAmountToRedeem[msg.sender][token] -= amount;
        if (token == MAX_ADDRESS) {
            payable(msg.sender).transfer(amount);
        } else {
            bool res = ERC20(token).transfer(msg.sender, amount);
            if (!res) {
                revert Vault__TransferFailed();
            }
        }
        s_usersDeposits[msg.sender][token] -= amount;
    }

    //****************************************************************** */
    //
    //              GETTERS / HELPERS
    //
    //****************************************************************** */
    function getTokenUserBalance(address user, address token) external view returns (uint256) {
        return s_usersDeposits[user][token];
    }

    function getVaultBalance(address token) external view returns (uint256) {
        return s_vaultBalance[token];
    }

    function getOpFeesBalance(address token) external view returns (uint256) {
        return s_operationFeesBalance[token];
    }
}
