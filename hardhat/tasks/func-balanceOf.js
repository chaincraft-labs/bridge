const { display } = require("../helpers/loggingHelper");
const { networkParams } = require("../helpers/configHelper");

const erc20Abi = [
  {
    constant: true,
    inputs: [
      {
        name: "_owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "balance",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

/**
 * @description Get the token or native coin balance of an address
 */
task("func-balanceOf", "get token balance of a user")
  .addParam("user", "The address of the user")
  .addOptionalParam(
    "token",
    "The address of the token - default (no token) = ETH/native coin"
  )
  .setAction(async (taskArgs, hre) => {
    if (!taskArgs.token) {
      // No token address: get ETH/native balance
      const balance = await hre.ethers.provider.getBalance(taskArgs.user);
      const symbol = networkParams[hre.network.name].nativeToken.symbol;
      display.balance("", symbol, balance, taskArgs.user);
      return;
    }
    // Else: get ERC20 token balance

    // get contract instance
    const contract = await hre.ethers.getContractAt(erc20Abi, taskArgs.token);
    // call the method
    try {
      const result = await contract.balanceOf(taskArgs.user);
      const symbol = await contract.symbol();
      display.balance(taskArgs.token, symbol, result, taskArgs.user);
    } catch (error) {
      console.error("Error:", error);
    }
  });
