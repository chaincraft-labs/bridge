# EVM BASED ALLFEAT BRIDGE POC

> purpose: implements bridge allowing transfer of erc20 between Allfeat and EVM chains

## STEPS:

1. Manage the listening of events:
   - Basic ERC20 contract => deployment and script to transfer it
   - Create a server to listen to these vents and display them
2. Implement minimalistic bridge to bridge tokens between Allfeat and Sepolia
   - Bridge contracts on each chain.
   - Token contracts on each chain.
   - Server side: receive transfer event & manage calls fpr mint/burn, lock/unclock actions
3. Improve the bridge
