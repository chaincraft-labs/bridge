# EVM BASED ALLFEAT BRIDGE POC

> Please see [the second readme](hardhat/README.md) for more information

## Project Context

This project idea stems from the desire to continue a winning project from a hackathon, which aimed to create a crowdfunding platform dedicated to music on the Allfeat blockchain.

In the context of crowdfunding, using a volatile currency is not a viable solution, as both the donor and the receiver would be frustrated or disadvantaged by seeing the value given reduced. Therefore, we needed to utilize a stablecoin. However, since the blockchain did not yet exist, no services (AMM, bridge, stablecoin) were available.

This led to the necessity of creating a bridge.

### Expected Side Effects

Enable connectivity between the ecosystem and existing services.
Potentially bring more liquidity to the network, thereby aiding the progress and adoption of Allfeat.
Given Allfeat's very low transaction fees, we aim to attract DeFi projects to the platform.

## Purpose of this Repository

The purpose of this repository is to implement a bridge that allows for the transfer of native currency and ERC20 tokens between Allfeat and EVM chains.

## Useful Links

- [Off-chain Server repository](https://github.com/AlyraButerin/bridge-relay-poc)
- [Frontend repository](https://github.com/AlyraButerin/allfunding-bridge-ui)
- [Documentation](https://github.com/AlyraButerin/Allfunding-project-doc)
- Organization Board

## Steps (Development Roadmap)

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

## Possible Evolutions

Generalization of the bridge to enable the transfer of messages or cross-chain calls, as well as NFTs.
Integration with non-EVM chains.
