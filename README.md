# EVM BASED ALLFEAT BRIDGE POC

> purpose: implements bridge allowing transfer of erc20 and native currencies between Allfeat and EVM chains

## STEPS:

[ ] ~~1. Manage the listening of events:~~  
~~Basic ERC20 contract => deployment and script to transfer it~~  
~~Create a server to listen to these vents and display them~~  
~~2. Implement minimalistic bridge to bridge tokens between Allfeat and Sepolia~~  
~~Bridge contracts on each chain.~~  
~~Token contracts on each chain.~~  
~~Server side: receive transfer event & manage calls for mint/burn, lock/unclock actions~~  
~~3. Improve the bridge~~  
4. Cleanup  
5. Implement fees management  
6. Implement cancel features  
7. Refacto to make it decentralized  
+use of MPC/TSS or other solutions to not have a unique wallet signing tx..  
+restructure relayer calls as a vote process with encoded calls  
8. Security & Optimization (not a step but constant task to develop in //)
