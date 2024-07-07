# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```

## Update 2024-07-04

Adding a bridge.js CLI tool to help to interact with contracts

- bridge.js : CLI tool
- functions.js : Logic functions
- utils.js : Generic functions
- constants/networks : refacto network definitions
- constants/tokens : refacto token definitions

### Usage 


**Deploy all contract to a blockchain**
Example: Deploy contracts on allfeat_local
```bash
HARDHAT_NETWORK=allfeat_local node scripts/as_bridge.js --deploy anvil_local,allfeat_local
```

**Deposit token**
Example: deposit token on anvil_local
```bash
HARDHAT_NETWORK=anvil_local node scripts/as_bridge.js --test-deposit-token
```

**Deposit fees**
Example: deposit fees on allfeat_local
```bash
HARDHAT_NETWORK=allfeat_local node scripts/as_bridge.js --test-deposit-fees
```

**Other options**

Use help argument to show all options

```bash
HARDHAT_NETWORK=allfeat_local node scripts/as_bridge.js --help
```

```bash
Usage: as_bridge [options]

Bridge relayer CLI

Options:
  -V, --version                                                              output the version number
  --deploy [options]                                                         deploy all contracts, set operators, chainIds
                                                                             and token. Options: anvil_local,allfeat_local
  --deploy-contracts                                                         deploy all contracts
  --deploy-storage                                                           deploy Storage contract
  --deploy-token-factory                                                     deploy TokenFactory contract
  --deploy-vault                                                             deploy Vault contract
  --deploy-relayer-base                                                      deploy RelayerBase contract
  --deploy-bridge-base                                                       deploy BridgeBase contract
  --update-operator                                                          update operator
  --add-chain-ids [chain Ids]                                                add chainIds to storage [11155111, 31337, 440,
                                                                             441]
  --add-tokens [tokens]                                                      add tokens to storage []
  --add-eth [network ETH]                                                    add ETH token. network e.g anvil_local
  --add-aft [network AFT]                                                    add AFT token. network e.g allfeat_local
  --add-dai                                                                  add DAI
  --user-deposit-token [userAddress,amount,chainIdFrom,chainIdTo,tokenName]  user deposit token
  --user-deposit-fees [userAddress,amount,chainIdFrom,chainIdTo,tokenName]   user deposit fees
  --test-deposit-token                                                       Test user deposit token
  --test-deposit-fees                                                        Test user deposit fees
  --show-deployed-addr                                                       show last deployed addresses
  --set-nonce [address]                                                      set nonce
  --get-nonce [address]                                                      get nonce
  -h, --help                                
```


## Setup GETH local node in dev mode

1. Install Geth
2. Start the node
3. Import Hardhat account
4. Fund new imported account

### 1 Install Geth
[Download Geth](https://geth.ethereum.org/downloads)

### 2 Start Geth node
Example:
```bash
mkdir /tmp/geth
cd /tmp/geth
geth geth --datadir . --dev --http --dev.period 12
```

* --http : allow to interact with the node
* --dev.period 12 : mine a block every 12 seconds


### 3 Import hardhat account
1. Copy the hardhat account private key into a file (without the 0x suffix)
```bash
echo "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" > user2
```
2. Import the account and define a password (at least 10 chars)
```bash
clef importraw user2
```

### 4 Fund imported account

1. Identify the IPC once the node is started with the "IPC endpoint opened" words. The IPC should be something like url=/tmp/geth/geth.ipc

2. Start the javascript console
   ```bash
   geth attach /tmp/geth/geth.ipc
   ```
3. Fund the account. (eth.accounts[0] is the dev account)
   ```bash
    eth.sendTransaction({from: eth.accounts[0], to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", value: web3.toWei(50, "ether")})
    ```
