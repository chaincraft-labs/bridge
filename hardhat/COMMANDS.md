@todo make shortcuts
@todo allow to change signer (among pvkey of .env)

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

# COMMANDS

### Deployment of contracts:

- Method 1:

  - Use: 01_deployAllContracts_refactor.js on each network to deploy contracts (it will save addresses in 'constants' folder).
  - Then: 01_setTokens_refactor.js to set addresses of tokens from one network to the other one.

  ```node
  npx hardhat run scripts/01_deployAllContracts_refactor.js --network localhost
  npx hardhat run scripts /01_setTokens_refactor.js --network localhost
  ```

  ```node
  npx hardhat run scripts/01_deployAllContracts_refactor.js --network sepolia
  npx hardhat run scripts/01_deployAllContracts_refactor.js --network allfeat
  npx hardhat run scripts/01_setTokens_refactor.js --network sepolia
  npx hardhat run scripts/01_setTokens_refactor.js --network allfeat
  ```

- Method 2:  
  This method allows to automate deployments and initialization on each network with one command.  
  As it's using js to run hardhat command, the terminal output will be displayed only at the end of each sub script, so no information are given during each deployment.

  Put the networks to deploy in `networksToDeploy` array of `scripts/09_deployAndConfig.js`, then run:

  ```node
  node ./scripts/09_deployAndConfig.js
  ```

- Method 3:  
  This method allows to automate deployments and initialization on each network with one command.  
  This bash script gives information during operations as the output are displayed in real time.

  - To make the script executable, run once:

  ```node
  cd scripts
  chmod u+x script.sh
  ```

  - Replace the value of `networkToDeploy` variable with the networks to use for deployment, then run (in hardhat folder):

  ```node
  ./scripts/09_deployAndConfig.sh
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

# TASKS

### Read functions (getters):

```node
npx hardhat call-readFunc --contract <"ContractName"> --func <"functionName"> --args <"args space separated"> --network <network-name>
```

### Write functions:

```node
npx hardhat call-writeFunc --contract <"ContractName"> --func <"functionName"> --args <"args space separated"> --network <network-name>
```

### Specific tasks:

#### Mint amount of bridged token to an address

```node
 npx hardhat func-mintBridgedToken --to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --token 0xCafac3dD18aC6c6e92c921884f9E4176737C052c --amount 1000000000000000000n --network localhost
```

#### Transfer amount of mocked token to an address

```node
 npx hardhat func-transferMockedToken --to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --token 0xCafac3dD18aC6c6e92c921884f9E4176737C052c --amount 1000000000000000000n --network localhost
```

#### Get the operation hash from args

```node
 npx hardhat func-getMsgHash --args "0xbfae728Cf6D20DFba443c5A297dC9b344108de90 0xbfae728Cf6D20DFba443c5A297dC9b344108de90 11155111 441 mockedDai 10000000000000000n 0" --network localhost
```

#### Get the signature of the operation hash

signer: optional, possible values [0, 1, 2]

The default value is 0, which corresponds to the deployer/admin account (the first Ethers signer / deployer defined in the .env file).
Values 1 and 2 correspond to Ethers signer 1 or 2 for a local environment, or user 2 or user 3 as configured in the .env file.

```node
 npx hardhat func-getMsgSignature --args "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 11155111 441 mockedDai 10000000000000000n 0" --network localhost

 npx hardhat func-getMsgSignature --args "0xD850badD41F9f7B5Fdc4387C14A9e7938E57619C 0xD850badD41F9f7B5Fdc4387C14A9e7938E57619C 11155111 441 mockedDai 10000000000000000n 0" --signer 1 --network sepolia
```

### Example of prepared commands:

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
