networkToDeploy="localhost"
cd ..
npx hardhat run ./scripts/01_deployAllContracts_refactor.js --network "$networkToDeploy"
npx hardhat run ./scripts/01_setTokens_refactor.js --network "$networkToDeploy"

networkToDeploy="allfeat"
npx hardhat run ./scripts/01_deployAllContracts_refactor.js --network "$networkToDeploy"
npx hardhat run ./scripts/01_setTokens_refactor.js --network "$networkToDeploy"

