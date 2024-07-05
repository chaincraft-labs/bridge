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