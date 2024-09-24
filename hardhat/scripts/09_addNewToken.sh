#!/bin/bash

# This script deploy a new mocked Token on its native chain, then
# it will deploy the corresponding bridged tokens on the other chains
# and set the addresses in the Storage contracts on each chain.
# Chains used are defined in constants/deploymentConfig::usedNetworks
# The script is intended to be run from the root of the project
# The new mocked token MUST BE config in helpers/configHelper::tokenParams BEFORE!
# ARGS: tokenName tokenSymbol nativeNetwork

# Get the args
if [ "$#" -lt 3 ]; then
    echo "Usage: $0 <tokenName> <tokenSymbol> <nativeNetwork>"
    exit 1
fi
tokenName=$1
tokenSymbol=$2
nativeNetwork=$3

# Parse the usedNetworks from the deploymentConfig.js file
# Filter out comments, spaces, and quotes
# Exclude the const usedNetworks = [ part

# compatible on macOs and wsl
usedNetworks=$(awk '/^const usedNetworks = \[/{print}' constants/deploymentConfig.js | sed 's/.*const usedNetworks = \[\([^]]*\)\].*/\1/' | tr -d '",' | tr ' ' '\n')



if [ -z "$usedNetworks" ]; then
    echo "No networks found in usedNetwork."
    exit 1
fi
echo "Used networks:"
echo "$usedNetworks"

networkCount=$(echo "$usedNetworks" | wc -l)
totalCommands=$((networkCount * 2))
commandCount=0

# Deploy the mocked token on its native network
commandCount=$((commandCount + 1))
echo "Deploying mocked token on network: $nativeNetwork - Commands: $commandCount/$totalCommands"
MOCKED_TOKEN_OPTION="$tokenName,$tokenSymbol" npx hardhat run ./scripts/03_deployMockedToken.js --network $nativeNetwork

# Loop over the networks to deploy the bridged contracts
for networkToDeploy in $usedNetworks; do
    commandCount=$((commandCount + 1))
    if [ "$networkToDeploy" = "$nativeNetwork" ]; then
        continue
    fi
    echo "Deploying bridged token on network: $networkToDeploy - Commands: $commandCount/$totalCommands"
    MOCKED_TOKEN_OPTION="$tokenName,$tokenSymbol" npx hardhat run ./scripts/03_deployBridgedToken.js --network $networkToDeploy
done

# Loop over the networks to set the token and its addresses
for networkToDeploy in $usedNetworks; do
    commandCount=$((commandCount + 1))
    echo "Setting tokens on network: $networkToDeploy - Commands: $commandCount/$totalCommands"
    TOKEN_OPTION=$tokenName npx hardhat run ./scripts/04_setNewToken.js --network "$networkToDeploy"
done

