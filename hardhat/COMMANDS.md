This file serves as a comprehensive guide for developers and users of the repository. It provides concise documentation on configuration as well as essential commands to facilitate the integration and use of the project. This helps to reduce errors and accelerate the development process, ensuring that everyone has the necessary information to work effectively with the code.

# TOC

- [Config](#config)
  - [Files and variables](#files-and-variables)
  - [CLI : tasks available to modify the configuration:](#cli--tasks-available-to-modify-the-configuration)
- [Tests](#tests)
- [Nodes](#nodes)
  - [Hardhat](#hardhat)
  - [Forks](#forks)
  - [Geth](#geth)
- [Scripts](#scripts-commands)
  - [Deployments](#deployment-of-contracts)
  - [Adding a new token](#adding-a-new-token)
  - [User Actions](#user-actions)
- [Tasks](#tasks)
  - [Generic tasks](#generic-tasks)
  - [Specific tasks](#specific-tasks)
  - [Example of generic tasks](#example-of-prepared-commands-for-call-readfunc-and-call-writefunc)

# CONFIG

### Files and variables

Few files are used to configure the project. Some data are to be set in the files other have tasks to be done with the CLI below.

- `.env` file:
  It contains the private data needed to deploy and use the bridge.

  - DEPLOYER: the deployer, bridge admin and default signer for non local networks
  - USER<1-20>: other optional signers for non local networks
  - SERVER_ADDRESS: is the address of the off-chain server

  > Set your private data in the `.env` file.

- `hardhat.config.js` file:
  It contains the networks used with valid params: RPC_URL, accounts.

  - The signers will be those set in the .env file for non local networks
    or the default hardhat signers for local networks, the seed used can be changed in .env file.
  - Signers are available with 'accounts' array. Index 0: the deployer, then the other users.

  > Add the networks you want to use in the hardhat config file if not already present.

- `nonceRecord.json` file:
  It stores the current nonces used to create an operation on a chain to use it for fees deposit on destination chain.
  It managed nonces for each network and each user and give an array of nonces for each user. As soon as a nonce is used for fees deposit, it is removed from the array.

  A deposit script will add a nonce a the end of the array and a fees deposit script will remove the first nonce of the array. It works as a FIFO.

  > This file is created and managed by the scripts, so it's better to not modify it manually.

- `deployedAddresses.json` file:
  It stores the addresses of the deployed contracts on each network. It's used to interact with the contracts.

  > This file is created and managed by the scripts, so it's better to not modify it manually.

- `simulationParams.js` can be used to store inputs used for differents actions to simulate, automatize actions... as scenarios, user actions...

- `deploymentConfig.json` file:
  It stores the networks, tokens, chainIds used and the elements needed to interact with deployed contracts.
  It provides some objects to use in the scripts and tests:

  - **forkPorts**: the ports used for forks. It allows to launch a fork on a specific port to avoid conflicts. And
    it allows to run automatically script on forks with the associated network defined in the hardhat config file.

  - **networkParams**: networks allowed and their params. It should correspond to the networks defined in hardhat config. For each network are defined:

    - chainId: the chainId of the network
    - nativeToken: {name, symbol} of the native token of the network
    - deployedTokens: array of {name, symbol, <address>} of the tokens deployed on the network
      You should add the networks you want to use in the `networkParams` object if you add a network in the hardhat config file.

  It represents all the networks and tokens the system know and can interact with.
  Mocked tokens used for dev/test should be added **BEFORE** using them in the scripts.

  - **activeConfig**: the name of the usedConfig object active for the deployment and the scripts. It should be set to the name of the object you want to use in the scripts and tests.

  - **usedConfigs**: an array of 'usedConfig' you can set to use in the scripts and tests. It should contain the name of the objects you want to use in the scripts and tests. `activeConfig` should be one of them.

    Each one is composed of:

    - usedNetworks: array of network names used for deployment and scripts
    - usedTokens: array of token names used for deployment and scripts

  > NOTE: scripts run only on networks defined in `usedNetworks` of the `activeConfig` and with its tokens in `usedTokens`.

  > Hardhat config and networkParams contains available networks and tokens, but only those in `usedNetworks` and `usedTokens` of the `activeConfig` are used/authorized for scripts.

### CLI : tasks available to modify the configuration:

- **Reset json files:**
  It allows to reset the nonceRecord and deployedAddresses files. It will remove all the data in the files.

  ```shell
  npx hardhat reset-config
  ```

- **Set the activeConfig in the deploymentConfig:**
  It allows to set the activeConfig in the deploymentConfig file. This config will be used for the scripts and tests.

  ```shell
  npx hardhat set-activeConfig --name <configName>

  # example:
  npx hardhat set-activeConfig --name "my-localNet-config"
  ```

- **List the usedConfigs in the deploymentConfig:**
  It allows to list the usedConfigs in the deploymentConfig file.

  ```shell
  npx hardhat list-used-configs
  ```

- **Add a usedConfig to the deploymentConfig:**
  It allows to set a new usedConfig in the deploymentConfig file with its authorized networks and tokens.

  ```shell
  npx hardhat add-used-config --name <configName> --networks <networks> --tokens <tokens>

  # example:
  npx hardhat add-used-config --name "my-localNet-config" --networks "sepolia,harmonie" --tokens "ethereum,myToken"
  ```

  Where networks and tokens are strings of comma separated values.

- **Add a token or a network to a usedConfig:**
  It allows to add a token or a network to a usedConfig in the deploymentConfig file to expand the authorized networks and tokens.

  ```shell
  npx hardhat add-to-config --name <configName> --type <"network"|"token"> --element <name of the network or token>

  # example:
  npx hardhat add-to-config --name "my-localNet-config" --type "network" --element "sepolia"
  ```

- **Remove a usedConfig from the usedConfigs:**

  ```shell
  npx hardhat remove-used-config --name <usedConfigName>

  # example:
  npx hardhat remove-used-config --name "my-localNet-config"
  ```

- **Add a token to networkParams:**
  It allows to declared a new token on a network in the networkParams object, in order to use it in scripts or to deploy it (case of mocked tokens).

  ```shell
  npx hardhat add-deployed-token --networkName <network of the token> --name <name of the token> --symbol <symbol of the token> [--tokenAddress <address of the NON mocked token >]

  # example (mockedToken):
  npx hardhat add-deployed-token --networkName "sepolia" --name "mockedDai" --symbol "mDAI"
  # example (non mockedToken):
  npx hardhat add-deployed-token --networkName "sepolia" --name "DAI" --symbol "DAI" --tokenAddress "0x6B175474E89094C44Da98b954EedeAC495271d0F"
  ```

  The tokenAddress is optional and should be used only for tokens already deployed on the network.

# TESTS AND COVERAGE

Some 'describe' blocks are tagged with '@skip' to avoid running them or '@only' to run only them. Uncomment the '@skip' to run the tests.

```shell
# To run tests:
npx hardhat test [--network <network-name>]

# To run a specific test file:
npx hardhat test ./test/testfile.js.
# Or use a rule to filter tests:
npx hardhat test --grep "add|con?vert"

# To run tests with coverage:
npx hardhat coverage
```

# GAS REPORT

```shell
REPORT_GAS=true npx hardhat test
```

# NODES

> Commands to use in a second terminal to run local nodes

### HARDHAT:

```shell
npx hardhat node
```

### FORKS:

- Be sure to have the port to use defined in `constants/deploymentConfig.js::forkPorts`
- The forked network MUST BE set in hardhat config with the network name and 'Fork' as suffix.

- **Regular command:**

```shell
npx hardhat node --fork https://<rpc-url-to-fork> --port <port-to-use>
```

- **Task:**  
  It will use the port defined in `constants/deploymentConfig.json::forkPorts` and corresponding to the network in the hardhat config file.

```shell
npx hardhat start-node --networkToFork sepolia
```

- To check process running and kill the node if not terminated with 'ctrl C':
  - get current process ans PIDs: `ps aux | grep hardhat`
  - kill it: `kill -9 PID`

### GETH:

Set up local node in dev mode

1. Install Geth
2. Start the node
3. Import Hardhat account
4. Fund new imported account

#### 1 Install Geth

[Download Geth](https://geth.ethereum.org/downloads)

#### 2 Start Geth node

Example:

```bash
mkdir /tmp/geth
cd /tmp/geth
geth geth --datadir . --dev --http --dev.period 12
```

- --http : allow to interact with the node
- --dev.period 12 : mine a block every 12 seconds

#### 3 Import hardhat account

1. Copy the hardhat account private key into a file (without the 0x suffix)

```bash
echo "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" > user2
```

2. Import the account and define a password (at least 10 chars)

```bash
clef importraw user2
```

#### 4 Fund imported account

1. Identify the IPC once the node is started with the "IPC endpoint opened" words. The IPC should be something like url=/tmp/geth/geth.ipc

2. Start the javascript console
   ```bash
   geth attach /tmp/geth/geth.ipc
   ```
3. Fund the account. (eth.accounts[0] is the dev account)
   ```bash
    eth.sendTransaction({from: eth.accounts[0], to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", value: web3.toWei(50, "ether")})
   ```

# SCRIPTS COMMANDS

### Deployment of contracts:

You can deploy and initialize network-by-network contracts using method 1 or automate the set with methods 2 or 3

- Method 1:

  - Use: 01_deployAllContracts_refactor.js on each network to deploy contracts (it will save addresses in 'constants' folder).
  - Then: 01_setTokens_refactor.js on each network to set the addresses of tokens from other networks.

  ```shell
  npx hardhat run scripts/01_deployAllContracts.js --network <network>
  npx hardhat run scripts/02_setTokens.js --network <network>
  ```

  - example:

  ```shell
  npx hardhat run scripts/01_deployAllContracts.js --network sepolia
  npx hardhat run scripts/01_deployAllContracts.js --network harmonie
  npx hardhat run scripts/02_setTokens.js --network sepolia
  npx hardhat run scripts/02_setTokens.js --network harmonie
  ```

- Method 2:

  This method allows to automate deployments and initialization on each network with one command.  
  As it's using js to run hardhat command, the terminal output will be displayed only at the end of each sub script, so no information are given during each deployment.

  It uses the networks written in the `usedNetworks` array of `constants/deploymentConfig.js`.

  ```shell
  node ./scripts/09_deployAndConfig.js
  ```

- Method 3:

  This method allows to automate deployments and initialization on each network with one command.  
  This bash script gives information during operations as the output are displayed in real time.

  - To make the script executable, run once:

  ```shell
  cd scripts
  chmod u+x 09_deployAndConfig.sh
  cd -
  ```

  It uses the networks written in the `usedNetworks` array of `constants/deploymentConfig.js`.

  ```shell
  ./scripts/09_deployAndConfig.sh
  ```

### Adding a new token:

These scripts are used to deploy a new mocked token and associated bridged tokens on each network to a bridge already deployed. And then to set the token addresses in the Storage contract of each network.

Before using these script, the token should be configured in `constants/deploymentConfig.js::tokenParams` and `networkParams`.

The networks used are those present in `constants/deploymentConfig.js::usedNetworks`.

- **Automation of all steps:**  
  It will the deploy the mocked token on the specified network and its bridged tokens on each other networks (those configured in `usedNetworks` array of the `activeConfig`).
  It will then register in the 'Storage' contracts of each network the new addresses with their associated 'chainId' for the token.

  Args: the token name and symbol of the mocked token and its origin network

  ```shell
  ./scripts/09_addNewToken.sh tokenName tokenSymbol originNetwork

  # example:
  # this will deploy a mocked token 'mDAI' on sepolia and its bridged tokens on networks in 'usedNetworks' array of 'activeConfig' and set the addresses in the Storage contracts on each network.
  ./scripts/09_addNewToken.sh mockedDai mDAI sepolia
  ```

  This script use the following scripts in the order:

- **Deploy and set a new token step by step:**

  - **Add address of a deployed token** (case of non mocked token):  
    This is use to add the address of a token already deployed on a network to the Storage contract of another network.
    In order to deploy its bridged version on the other networks.
    Args: the token name and symbol of the mocked token

    ```shell
    TOKEN_OPTION=<"tokenName,tokenSymbol,tokenAddress"> npx hardhat run scripts/03_setDeployedToken.js --network <networkName>
    ```

  - **Deploy mocked token:**  
    This is use to deploy a new mocked token on a network. In order to deploy its bridged version on the other networks.
    Args: the token name and symbol of the mocked token

    ```shell
    MOCKED_TOKEN_OPTION=<"tokenName,tokenSymbol"> npx hardhat run scripts/03_deployMockedToken.js --network <networkName>
    ```

  - **Deploy bridged token:**  
    Args: the token name and symbol of the **mocked** token

    ```shell
    MOCKED_TOKEN_OPTION=<"tokenName,tokenSymbol"> npx hardhat run scripts/03_deployBridgedToken.js --network <networkName>
    ```

  - **Set the new addresses in Storage for each network:**  
    Args: the token name of the mocked token

    ```shell
    TOKEN_OPTION=<"tokenName"> npx hardhat run scripts/04_setNewToken.js --network <networkName>
    ```

### User actions:

- **Create a bridge operation and deposit funds:**

  - Command:
    ```shell
    [SIGNER_OPTION=<0-2>] [PARAMS_OPTION=<params>] npx hardhat run scripts/11_userAction_deposit.js --network <originNetwork>
    ```
  - Examples:

    ```shell
    # This will use default values from the constants/simulationParams.js file for the operation
    npx hardhat run scripts/11_userAction_deposit.js --network sepolia

    # This will use the values given in the PARAMS_OPTION for the operation
    SIGNER_OPTION=1 PARAMS_OPTION="11155111,441,ethereum,0.05" npx hardhat run scripts/11_userAction_deposit.js --network sepolia
    ```

  - Options:

    - SIGNER_OPTION: uint

      - Optional - default: 0 (deployer / default signer)
      - Index of the accounts array defined in hardhat config (0-20 following the number of private keys set in .env file)

    - PARAMS_OPTION: string,
      - Optional - default: `defaultOrigin,sepolia`
      - 'regular format': `chainIdFrom,chainIdTo,tokenName,amount` (ex: `11155111,441,ethereum,1.5`)
        Amount is in ethers with '.' as decimal separator
      - 'simulation format': `name,network`
        It will use the values in `constants/simulationParams.js` for the given network

- **Deposit fees to the destination network:**

  - Command:
    ```shell
    [SIGNER_OPTION=<index>] [PARAMS_OPTION=<params>] [FEES_OPTION=<fees>] npx hardhat run scripts/12_userAction_depositFees.js --network <destinationNetwork>
    ```
  - Examples:

    ```shell
    # This will use default values from the constants/simulationParams.js file for the operation
    npx hardhat run scripts/12_userAction_depositFees.js --network harmonie

    # This will use the values given in the PARAMS_OPTION for the operation
    SIGNER_OPTION=1 PARAMS_OPTION="11155111,441,ethereum,0.05" npx hardhat run scripts/12_userAction_depositFees.js --network harmonie
    ```

  - Options:

    - SIGNER_OPTION: uint

      - Optional - default: 0 (deployer / default signer)
      - Index of the accounts array defined in hardhat config (0-20 following the number of private keys set in .env file)

    - PARAMS_OPTION: string,

      - Optional - default: `defaultOrigin,sepolia`
      - 'regular format': `chainIdFrom,chainIdTo,tokenName,amount` (ex: `11155111,441,ethereum,1.5`)
        Amount is in ethers with '.' as decimal separator
      - 'simulation format': `name,network`
        It will use the values in `constants/simulationParams.js` for the given network

    - FEES_OPTION: number
      - Optional - default: FEES_AMOUNT defined in config (0.001)
      - 'regular' format: fees in ethers (ex: `0.01`). Decimal separator: '.'
      - 'simulation format': `name,network`
        It will use the values in `constants/simulationParams.js` for the given network

# TASKS

### Help:

```shell
npx hardhat help [SCOPE] <TASK>
```

### Generic tasks:

Generic calls allowing to use any function of the contracts. 'call-readFunc' is to use with getters and 'call-writeFunc' with functions modifying states.

Arguments are given with '--args' option. It's a string with values space separated. Array are inserted with brackets and with values commas separated (for more details see helpers/functionHelpers::convertParamsStringToArray).

#### Read functions (getters):

```shell
npx hardhat call-readFunc --contract <ContractName> --func <functionName> --args <"args space separated"> --network <network>
```

#### Write functions:

```shell
npx hardhat call-writeFunc --contract <ContractName> --func <functionName> --args <"args space separated"> --network <network>
```

### Specific tasks:

Calls to specific functions.

#### Display signer addresses configured for the network and their balances

```shell
npx hardhat func-printSigners --network <network>
```

#### Get the token/ether balance of an address

--token: optional, if not given, it will get the balance of ethers/native currency

```shell
npx hardhat func-balanceOf --user <userAddress> [--token <tokenAddress>] --network <network>

# example:
npx hardhat func-balanceOf --user 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --token 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6 --network localhost
```

#### Mint amount of bridged token to an address (test purpose)

```shell
npx hardhat func-mintBridgedToken --to <recipient> --token <tokenAddress> --amount <amountToMint> --network <network>

# example:
npx hardhat func-mintBridgedToken --to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --token 0xCafac3dD18aC6c6e92c921884f9E4176737C052c --amount 1000000000000000000 --network localhost
```

#### Transfer amount of mocked token to an address (test purpose)

```shell
npx hardhat func-transferMockedToken --to <recipient> --token <tokenAddress> --amount <amountToTransfer> --network <network>

# example:
npx hardhat func-transferMockedToken --to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --token 0xCafac3dD18aC6c6e92c921884f9E4176737C052c --amount 1000000000000000000 --network localhost
```

#### Get the operation hash from args

```shell
npx hardhat func-getMsgHash --args <"userAddress userAddress chainIdFrom chainIdTo tokenName amount nonce"> --network <network>

# example:
npx hardhat func-getMsgHash --args "0xbfae728Cf6D20DFba443c5A297dC9b344108de90 0xbfae728Cf6D20DFba443c5A297dC9b344108de90 11155111 441 mockedDai 10000000000000000n 0" --network localhost
```

#### Get the signature of the operation hash

signer:

- Index of the accounts array defined in hardhat config (0-20 following the number of private keys set in .env file)
- Optional - default: 0 (deployer / default signer)

```shell
npx hardhat func-getMsgSignature --args <"userAddress userAddress chainIdFrom chainIdTo tokenName amount nonce"> [--signer <index>] --network <network>

# examples:
npx hardhat func-getMsgSignature --args "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 11155111 441 mockedDai 10000000000000000n 0" --network localhost

npx hardhat func-getMsgSignature --args "0xD850badD41F9f7B5Fdc4387C14A9e7938E57619C 0xD850badD41F9f7B5Fdc4387C14A9e7938E57619C 11155111 441 mockedDai 10000000000000000n 0" --signer 1 --network sepolia
```

### Example of 'call-readFunc' and 'call-writeFunc' commands:

```shell
npx hardhat call-readFunc --contract "Storage" --func "getOperator" --args "bridge" --network sepolia

npx hardhat call-writeFunc --contract "Storage" --func "updateOperator" --args "bridge 0xbfae728Cf6D20DFba443c5A297dC9b344108de90" --network sepolia

npx hardhat call-writeFunc --contract "Storage" --func "addTokenNameToList" --args "mockedDai" --network harmonie

npx hardhat call-writeFunc --contract "Storage" --func "addChainIdToList" --args "441" --network sepolia

npx hardhat call-readFunc --contract "Storage" --func "getChainIdsList" --args "" --network localhost

npx hardhat call-writeFunc --contract "Storage" --func "addNewTokenAddressByChainId" --args "mockedDai 441 0x2B530BeCE26560D3241cB3Aa1a07Cb7164082414" --signer 0 --network sepolia

npx hardhat call-writeFunc --contract "Storage" --func "updateTokenAddressByChainId" --args "mockedDai 441 0x2B530BeCE26560D3241cB3Aa1a07Cb7164082414" --network sepolia

npx hardhat call-readFunc --contract "Storage" --func "getTokenAddressByChainId" --args "mockedDai 441" --network sepolia

npx hardhat call-readFunc --contract "Storage" --func "getTokenAddressesByChainIds" --args "mockedDai 441 11155111" --network sepolia

npx hardhat call-readFunc --contract "BridgeBase" --func "getNewUserNonce" --args "0xbfae728Cf6D20DFba443c5A297dC9b344108de90" --network sepolia

npx hardhat call-writeFunc --contract "BridgeBase" --func "createBridgeOperation" --args "0xbfae728Cf6D20DFba443c5A297dC9b344108de90 0xbfae728Cf6D20DFba443c5A297dC9b344108de90 11155111 441 mockedDai 10000000000000000n 0 0x993dab3dd91f5c6dc28e17439be475478f5635c92a56e17e82349d3fb2f166196f466c0b4e0c146f285204f0dcb13e5ae67bc33f4b888ec32dfe0a063e8f3f781b" --signer 1 --network sepolia

npx hardhat call-writeFunc --contract "BridgeBase" --func "depositFees" --args "0x5e2c8f1e3c6f1c4e8d5b5e8f8c5a8e29e1f4b7c3a2c8e1d4c5e2e8f2a1b8c4e5 11155111 441" --network harmonie

npx hardhat call-readFunc --contract "RelayerBase" --func "getUserOperations" --args "0xbfae728Cf6D20DFba443c5A297dC9b344108de90" --network sepolia

npx hardhat call-readFunc --contract "RelayerBase" --func "getDetailedOriginOperation" --args "0x5e2c8f1e3c6f1c4e8d5b5e8f8c5a8e29e1f4b7c3a2c8e1d4c5e2e8f2a1b8c4e5" --network sepolia

npx hardhat call-readFunc --contract "RelayerBase" --func "getDetailedDestinationOperation" --args "0x5e2c8f1e3c6f1c4e8d5b5e8f8c5a8e29e1f4b7c3a2c8e1d4c5e2e8f2a1b8c4e5" --network sepolia

npx hardhat call-readFunc --contract "RelayerBase" --func "getOriginOperationStatus" --args "0x5e2c8f1e3c6f1c4e8d5b5e8f8c5a8e29e1f4b7c3a2c8e1d4c5e2e8f2a1b8c4e5" --network sepolia

npx hardhat call-readFunc --contract "RelayerBase" --func "getDestinationOperationStatus" --args "0x5e2c8f1e3c6f1c4e8d5b5e8f8c5a8e29e1f4b7c3a2c8e1d4c5e2e8f2a1b8c4e5" --network sepolia

```
