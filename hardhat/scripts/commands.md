# commands

npx hardhat run scripts/01_deployAllContracts_refactor.js --network localhost
npx hardhat run scripts /01_setTokens_refactor.js--network localhost

npx hardhat run scripts/01_deployAllContracts_refactor.js --network sepolia
npx hardhat run scripts/01_deployAllContracts_refactor.js --network allfeat
npx hardhat run scripts/01_setTokens_refactor.js --network sepolia
npx hardhat run scripts/01_setTokens_refactor.js --network allfeat

$ cd scripts && ./tryDeployAll.sh && cd -

//Forking

npx hardhat node --fork https://<url-nœud-pour-la-chaine2> --port 8546

puis pour le script : npx..run ... --network un reseau de config pour ce fork avec le même port
