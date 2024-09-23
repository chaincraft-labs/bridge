#!/bin/bash

# This script deploys the contracts and sets the tokens on the networks specified in the deploymentConfig.js file
# The script uses the scripts 01_deployAllContracts.js and 02_setTokens.js
# The script is intended to be run from the root of the project
# It uses the network names specified in the deploymentConfig.js file

# Parse the usedNetworks from the deploymentConfig.js file
# Filter out comments, spaces, and quotes
# Exclude the const usedNetworks = [ part

# compatible macOS/Wsl
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

# Loop over the networks to deploy the contracts
for networkToDeploy in $usedNetworks; do
    commandCount=$((commandCount + 1))
    echo "Deploying contracts on network: $networkToDeploy - Commands: $commandCount/$totalCommands"
    npx hardhat run ./scripts/01_deployAllContracts.js --network $networkToDeploy
done

# Loop over the networks to set the tokens
for networkToDeploy in $usedNetworks; do
    commandCount=$((commandCount + 1))
    echo "Setting tokens on network: $networkToDeploy - Commands: $commandCount/$totalCommands"
    npx hardhat run ./scripts/02_setTokens.js --network "$networkToDeploy"
done

