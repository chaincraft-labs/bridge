#!/bin/bash

# This script deploy a new mocked Token on its native chain, then
# it will deploy the corresponding bridged tokens on the other chains
# and set the addresses in the Storage contracts on each chain.
# Chains used are defined in constants/deploymentConfig::usedNetworks
# The script is intended to be run from the root of the project
# The new mocked token MUST BE config in helpers/configHelper::tokenParams BEFORE!
# ARGS: tokenName tokenSymbol nativeNetwork [tokenAddress if not a mocked token]

# Get the args
if [ "$#" -lt 3 ]; then
    echo "Usage: $0 <tokenName> <tokenSymbol> <nativeNetwork> [tokenAddress if not a mocked token]"
    exit 1
fi
tokenName=$1
tokenSymbol=$2
nativeNetwork=$3
tokenAddress=$4

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

# Check if it's a mocked token by checking if name contains 'mocked'
commandCount=$((commandCount + 1))
if [[ $tokenName != *"mocked"* ]]; then
    # Check if the token address is provided
    if [ -z "$tokenAddress" ]; then
        echo "Token address is required for non-mocked tokens."
        exit 1
    fi
    # Set address of the real deployed token
    echo "Setting token address on network: $nativeNetwork - Commands: $commandCount/$totalCommands"
    TOKEN_OPTION="$tokenName,$tokenSymbol,$tokenAddress" npx hardhat run ./scripts/03_setDeployedToken.js --network $nativeNetwork
else
    # Deploy the mocked token on its native network
    echo "Deploying mocked token on network: $nativeNetwork - Commands: $commandCount/$totalCommands"
    MOCKED_TOKEN_OPTION="$tokenName,$tokenSymbol" npx hardhat run ./scripts/03_deployMockedToken.js --network $nativeNetwork
fi

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

