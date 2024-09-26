#!/bin/bash

# This script deploys the contracts and sets the tokens on the networks specified in the deploymentConfig.js file
# The script uses the scripts 01_deployAllContracts.js and 02_setTokens.js
# The script is intended to be run from the root of the project
# It uses the network names specified in the deploymentConfig.js file

# Parse the usedNetworks from the deploymentConfig.js file
# Filter out comments, spaces, and quotes
# Exclude the const usedNetworks = [ part

# @todo REMOVE these lines when solution validated
# compatible on macOs and wsl / need to install jq on macOs
# usedNetworks=$(awk '/^const usedNetworks = \[/{print}' constants/deploymentConfig.js | sed 's/.*const usedNetworks = \[\([^]]*\)\].*/\1/' | tr -d '",' | tr ' ' '\n')

# Get the usedNetworks from the deploymentConfig.json file
# json_file="./constants/deploymentConfig.json"
# usedNetworks=$(jq -r '.usedNetworks | join(" ")' "$json_file")

# Get the usedNetworks from the deploymentConfig.json file
json_file="./constants/deploymentConfig.json"
activeConfig=$(jq -r '.activeConfig' "$json_file")

# Check if the activeConfig exists in usedConfigs
if jq -e ".usedConfigs | has(\"$activeConfig\")" "$json_file" > /dev/null; then
    # Extract the usedNetworks from the activeConfig
    usedNetworks=$(jq -r ".usedConfigs.$activeConfig.usedNetworks | join(\" \")" "$json_file")

    if [ -z "$usedNetworks" ]; then
        echo "No networks found in usedNetwork."
        exit 1
    fi
    echo "Used networks for active config ($activeConfig): $usedNetworks"
else
    echo "The label: '$activeConfig' does not exist in usedConfigs."
    exit 1
fi

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

