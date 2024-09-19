task("func-balanceOf", "get token balance of a user")
  .addParam("user", "The address of the user")
  .addParam("token", "The address of the token")
  .setAction(async (taskArgs, hre) => {
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
    ];
    // get contract instance
    const contract = await hre.ethers.getContractAt(erc20Abi, taskArgs.token);

    // call the method
    try {
      const result = await contract.balanceOf(taskArgs.user);
      console.log(`User balance: ${result} (=${ethers.formatEther(result)})`);
    } catch (error) {
      console.error("Error:", error);
    }
  });
