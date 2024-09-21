# TOC

- [Config](#config)
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

- hardhat.config.js: MUST CONTAIN the network used with valid params

- Networks, tokens (name and symbol), chainIds used MUST BE configured in `helpers/configHelpers.js::networkParams`

- Tokens used MUST BE also in `helpers/configHelpers.js::tokenParams`

- **Write elements used for deployment** in `constants/deploymentConfig.js`

  - networks: in `usedNetworks` array (you can not duplicate a local network, i.e. localhost and hardhat)
  - token names: in `usedTokens` array

- constants folder:

  This folder is used to store elements needed to interact with deployed contracts

  - `deployedAddresses.json` stores the last deployed address of each contract for each network
  - `nonceRecord.json` stores the current nonce used to create an operation on a chain to use it for fees deposit on destination chain
  - `simulationParams.js` can be used to store inputs used for differents actions, to simulate, automatize actions...

# TESTS

```node
npx hardhat test [--network <network-name>]
npx hardhat coverage
```

# GAS REPORT

```node
REPORT_GAS=true npx hardhat test
```

To save in a file the gas report:

```node
REPORT_GAS=true npx hardhat test  | awk '{gsub(/\033\[[0-9;]*m/, "")} /·-------------------/{found=1} found && !/passing/' > gas_report.txt
```

# NODES

> To run in a second terminal

### HARDHAT:

```node
npx hardhat node
```

### FORKS:

- **Regular command:**

```node
npx hardhat node --fork https://<rpc-url-to-fork> --port <port-to-use>
```

then, if a fork network is configured in hardhat.config with the port, use for the commands: --network [forked-network]

- **Tasks:**

```node
npx hardhat start-node --network-to-fork sepolia
```

- then use `--network sepoliaFork` with your commands.

- Ports in `hardhat.config` and `constants/deploymentConfig.js` MUST correspond.

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

- Method 1:

  - Use: 01_deployAllContracts_refactor.js on each network to deploy contracts (it will save addresses in 'constants' folder).
  - Then: 01_setTokens_refactor.js to set addresses of tokens from one network to the other one.

  ```node
  npx hardhat run scripts/01_deployAllContracts.js --network localhost
  npx hardhat run scripts/02_setTokens.js --network localhost
  ```

  ```node
  npx hardhat run scripts/01_deployAllContracts.js --network sepolia
  npx hardhat run scripts/01_deployAllContracts.js --network allfeat
  npx hardhat run scripts/02_setTokens.js --network sepolia
  npx hardhat run scripts/02_setTokens.js --network allfeat
  ```

- Method 2:  
  This method allows to automate deployments and initialization on each network with one command.  
  As it's using js to run hardhat command, the terminal output will be displayed only at the end of each sub script, so no information are given during each deployment.

  It uses the networks written in the `usedNetworks` array of `constants/deploymentConfig.js`.

  ```node
  node ./scripts/09_deployAndConfig.js
  ```

- Method 3:  
  This method allows to automate deployments and initialization on each network with one command.  
  This bash script gives information during operations as the output are displayed in real time.

  - To make the script executable, run once:

  ```node
  cd scripts
  chmod u+x 09_deployAndConfig.sh
  cd -
  ```

  It uses the networks written in the `usedNetworks` array of `constants/deploymentConfig.js`.

  ```node
  ./scripts/09_deployAndConfig.sh
  ```

### Adding a new token:

These scripts are used to deploy a new mocked token and associated bridged tokens on each network to a bridge already deployed. And then to set the token addresses in the Storage contract of each network.

Before using these script, the token should be configured in `constants/deploymentConfig.js::tokenParams`.

The networks used are those present in `constants/deploymentConfig.js::usedNetworks`.

- **Deploy mocked token:**  
  Args: the token name and symbol of the mocked token

  ```node
  MOCKED_TOKEN_OPTION=<"tokenName,tokenSymbol"> npx hardhat run scripts/03_deployMockedToken.js --network <networkName>
  ```

- **Deploy bridged token:**  
  Args: the token name and symbol of the **mocked** token

  ```node
  MOCKED_TOKEN_OPTION=<"tokenName,tokenSymbol"> npx hardhat run scripts/03_deployBridgedToken.js --network <networkName>
  ```

- **Set the new addresses in Storage for each network:**  
  Args: the token name of the mocked token

  ```node
  TOKEN_OPTION=<"tokenName"> npx hardhat run scripts/04_setNewToken.js --network <networkName>
  ```

- **Automation of all steps:**  
  It will the deploy the mocked token on the specified network and its bridged tokens on each other networks.
  It will then register in the 'Storage' contracts of each network the new addresses with their associated 'chainId' fo the token.

  Args: the token name and symbol of the mocked token and its origin network

  ```node
  ./scripts/09_deployAndConfig.sh tokenName tokenSymbol originNetwork
  ```

### User actions:

- **Create a bridge operation and deposit funds:**

  - Command:
    ```node
    [SIGNER_OPTION=<0-2>] [PARAMS_OPTION=<params>] npx hardhat run scripts/11_userAction_deposit.js --network <networkName>
    ```
  - Examples:

    ```node
    npx hardhat run scripts/11_userAction_deposit.js --network sepolia

    SIGNER_OPTION=1 PARAMS_OPTION="11155111,441,ethereum,0.05" npx hardhat run scripts/11_userAction_deposit.js --network sepolia
    ```

  - Default option values:
    - SIGNER_OPTION=0
    - PARAMS_OPTION=defaultOrigin,sepolia
  - Possible option values:
    - SIGNER_OPTION: [0, 1, 2] => 0: deployer, 1: user2, 2: user3 as defined in .env file and in hardhat.config (accounts)
    - PARAMS_OPTION:
      - Using custom params: `chainIdFrom,chainIdTo,tokenName,amount` (ex: `11155111,441,ethereum,1.5`)  
        Amount is in ethers with '.' as decimal separator
      - Using simulation params: `defaultOrigin,sepolia` ...  
        It will use the values in `constants/simulationParams.js` for the given network

- **Deposit fees to the destination network:**

  - Command:
    ```node
    [SIGNER_OPTION=<0-2>] [PARAMS_OPTION=<params>] [FEES_OPTION=<fees>] npx hardhat run scripts/12_userAction_depositFees.js --network <networkName>
    ```
  - Examples:

    ```node
    npx hardhat run scripts/12_userAction_depositFees.js --network allfeat

    SIGNER_OPTION=1 PARAMS_OPTION="11155111,441,ethereum,0.05" npx hardhat run scripts/12_userAction_depositFees.js --network allfeat
    ```

  - Default option values:
    - SIGNER_OPTION=0 => deployer/admin account
    - PARAMS_OPTION=defaultOrigin,sepolia
    - FEES_OPTION=null => `FEES_AMOUNT` as defined in `constants/deploymentConfig.js`
  - Possible option values:
    - SIGNER_OPTION: [0, 1, 2] => 0: deployer, 1: user2, 2: user3 as defined in .env file and in hardhat.config (accounts)
    - PARAMS_OPTION:
      - Using custom params: `chainIdFrom,chainIdTo,tokenName,amount` (ex: `11155111,441,ethereum,1.5`)  
        Amount is in ethers with '.' as decimal separator
      - Using simulation params: `defaultOrigin,sepolia` ...  
        It will use the values in `constants/simulationParams.js` for the given network
    - FEES_OPTION:
      - Using custom fees: `fees in ethers` (ex: `0.01`)  
        Fees is in ethers with '.' as decimal separator
      - Using simulation fees: `defaultOrigin,sepolia` ...  
        It will use the fees values in `constants/simulationParams.js` for the given network

# TASKS

### Help:

```node
npx hardhat help [SCOPE] <TASK>
```

### Generic tasks:

Generic calls allowing to use any function of the contracts. 'call-readFunc' is to use with getters and 'call-writeFunc' with functions modifying states.

Arguments are given with '--args' option. It's a string with values space separated. Array are inserted with brackets and with values commas separated (for more details see helpers/functionHelpers::convertParamsStringToArray).

#### Read functions (getters):

```node
npx hardhat call-readFunc --contract <ContractName> --func <functionName> --args <"args space separated"> --network <network>
```

#### Write functions:

```node
npx hardhat call-writeFunc --contract <ContractName> --func <functionName> --args <"args space separated"> --network <network>
```

### Specific tasks:

Calls to specific functions.

#### Display signer addresses configured for the network and their balances

```node
npx hardhat func-print-signers --network <network>
```

#### Get the token/ether balance of an address

--token: optional, if not given, it will get the balance of ethers/native currency

```node
npx hardhat func-balanceOf --user <userAddress> [--token <tokenAddress>] --network <network>

npx hardhat func-balanceOf --user 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --token 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6 --network localhost
```

#### Mint amount of bridged token to an address

```node
npx hardhat func-mintBridgedToken --to <recipient> --token <tokenAddress> --amount <amountToMint> --network <network>

npx hardhat func-mintBridgedToken --to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --token 0xCafac3dD18aC6c6e92c921884f9E4176737C052c --amount 1000000000000000000 --network localhost
```

#### Transfer amount of mocked token to an address

```node
npx hardhat func-transferMockedToken --to <recipient> --token <tokenAddress> --amount <amountToTransfer> --network <network>

npx hardhat func-transferMockedToken --to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --token 0xCafac3dD18aC6c6e92c921884f9E4176737C052c --amount 1000000000000000000 --network localhost
```

#### Get the operation hash from args

```node
npx hardhat func-getMsgHash --args <"userAddress userAddress chainIdFrom chainIdTo tokenName amount nonce"> --network <network>

npx hardhat func-getMsgHash --args "0xbfae728Cf6D20DFba443c5A297dC9b344108de90 0xbfae728Cf6D20DFba443c5A297dC9b344108de90 11155111 441 mockedDai 10000000000000000n 0" --network localhost
```

#### Get the signature of the operation hash

signer: optional, possible values [0, 1, 2]

The default value is 0, which corresponds to the deployer/admin account (the first Ethers signer / deployer defined in the .env file).
Values 1 and 2 correspond to Ethers signer 1 or 2 for a local environment, or user 2 or user 3 as configured in the .env file.

```node
npx hardhat func-getMsgSignature --args <"userAddress userAddress chainIdFrom chainIdTo tokenName amount nonce"> [--signer <index>] --network <network>

npx hardhat func-getMsgSignature --args "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 11155111 441 mockedDai 10000000000000000n 0" --network localhost

npx hardhat func-getMsgSignature --args "0xD850badD41F9f7B5Fdc4387C14A9e7938E57619C 0xD850badD41F9f7B5Fdc4387C14A9e7938E57619C 11155111 441 mockedDai 10000000000000000n 0" --signer 1 --network sepolia
```

### Example of prepared commands for 'call-readFunc' and 'call-writeFunc':

```node
npx hardhat call-readFunc --contract "Storage" --func "getChainIdsList" --args "" --network localhost
npx hardhat call-readFunc --contract "Storage" --func "getOperator" --args "bridge" --network sepolia
npx hardhat call-writeFunc --contract "Storage" --func "updateOperator" --args "bridge 0xbfae728Cf6D20DFba443c5A297dC9b344108de90" --network sepolia

npx hardhat call-writeFunc --contract "Storage" --func "addTokenNameToList" --args "mockedDai" --network allfeat
npx hardhat call-writeFunc --contract "Storage" --func "addChainIdToList" --args "441" --network sepolia

npx hardhat call-writeFunc --contract "Storage" --func "addNewTokenAddressByChainId" --args "mockedDai 441 0x2B530BeCE26560D3241cB3Aa1a07Cb7164082414" --signer 0 --network sepolia
npx hardhat call-writeFunc --contract "Storage" --func "updateTokenAddressByChainId" --args "mockedDai 441 0x2B530BeCE26560D3241cB3Aa1a07Cb7164082414" --network sepolia
npx hardhat call-readFunc --contract "Storage" --func "getTokenAddressByChainId" --args "mockedDai 441" --network sepolia
npx hardhat call-readFunc --contract "Storage" --func "getTokenAddressesByChainIds" --args "mockedDai 441 11155111" --network sepolia

npx hardhat call-readFunc --contract "BridgeBase" --func "getNewUserNonce" --args "0xbfae728Cf6D20DFba443c5A297dC9b344108de90" --network sepolia
npx hardhat call-writeFunc --contract "BridgeBase" --func "createBridgeOperation" --args "0xbfae728Cf6D20DFba443c5A297dC9b344108de90 0xbfae728Cf6D20DFba443c5A297dC9b344108de90 11155111 441 mockedDai 10000000000000000n 0 0x993dab3dd91f5c6dc28e17439be475478f5635c92a56e17e82349d3fb2f166196f466c0b4e0c146f285204f0dcb13e5ae67bc33f4b888ec32dfe0a063e8f3f781b" --signer 1 --network sepolia
npx hardhat call-writeFunc --contract "BridgeBase" --func "depositFees" --args "0x5e2c8f1e3c6f1c4e8d5b5e8f8c5a8e29e1f4b7c3a2c8e1d4c5e2e8f2a1b8c4e5 11155111 441" --network allfeat

npx hardhat call-readFunc --contract "RelayerBase" --func "getUserOperations" --args "0xbfae728Cf6D20DFba443c5A297dC9b344108de90" --network sepolia
npx hardhat call-readFunc --contract "RelayerBase" --func "getDetailedOriginOperation" --args "0x5e2c8f1e3c6f1c4e8d5b5e8f8c5a8e29e1f4b7c3a2c8e1d4c5e2e8f2a1b8c4e5" --network sepolia
npx hardhat call-readFunc --contract "RelayerBase" --func "getDetailedDestinationOperation" --args "0x5e2c8f1e3c6f1c4e8d5b5e8f8c5a8e29e1f4b7c3a2c8e1d4c5e2e8f2a1b8c4e5" --network sepolia
npx hardhat call-readFunc --contract "RelayerBase" --func "getOriginOperationStatus" --args "0x5e2c8f1e3c6f1c4e8d5b5e8f8c5a8e29e1f4b7c3a2c8e1d4c5e2e8f2a1b8c4e5" --network sepolia
npx hardhat call-readFunc --contract "RelayerBase" --func "getDestinationOperationStatus" --args "0x5e2c8f1e3c6f1c4e8d5b5e8f8c5a8e29e1f4b7c3a2c8e1d4c5e2e8f2a1b8c4e5" --network sepolia

```
