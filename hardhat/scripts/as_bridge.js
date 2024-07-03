const { program } = require('commander');
const { showContext, setNonce, getNonce } = require('./as_utils');
const {
  deployStorage,
  deployTokenFactory,
  deployVault,
  deployRelayerBase,
  deployBridgeBase,
  updateOperator,
  addChainIds,
  addTokens,
  addEth,
  addAft,
  addDai,
  userDepositToken,
  userDepositFee,
  showDeployAddresses,
} = require('./as_functions');


const deploy = async () => {
  await deployAllContracts();
  await updateOperator();
}

const deployAllContracts = async () => {
  await deployStorage();
  await deployTokenFactory();
  await deployVault();
  await deployRelayerBase();
  await deployBridgeBase();
  await showDeployAddresses();
}

const _addChainIds = async (chainIds) => {
  chainIds = chainIds.split(',');
  await addChainIds(chainIds);
}

const _addTokens = async (tokens) => {
  tokens = tokens.split(',');
  await addTokens(tokens);
}


program
  .version("1.0.0")
  .description("Bridge relayer CLI")
  .option('--deploy', 'deploy all contracts, set operators, chainIds and token')
  .option('--deploy-contracts', 'deploy all contracts')
  .option('--deploy-storage', 'deploy Storage contract')
  .option('--deploy-token-factory', 'deploy TokenFactory contract')
  .option('--deploy-vault', 'deploy Vault contract')
  .option('--deploy-relayer-base', 'deploy RelayerBase contract')
  .option('--deploy-bridge-base', 'deploy BridgeBase contract')
  .option('--update-operator', 'update operator')
  .option('--add-chain-ids [chain Ids]', 'add chainIds to storage [11155111, 31337, 440, 441]')
  .option('--add-tokens [tokens]', 'add tokens to storage []')
  .option('--add-eth', 'add ETH token')
  .option('--add-aft', 'add AFT token')
  .option('--add-dai', 'add DAI')
  .option('--user-deposit-token', 'user deposit token')
  .option('--user-deposit-fee', 'user deposit fee')
  .option('--show-deployed-addr', 'show last deployed addresses')
  .option('--set-nonce [address]', 'set nonce')
  .option('--get-nonce [address]', 'get nonce')
  .action((options) => {
    
    if (options.deploy) {showContext(); deploy();}
    if (options.deployContracts) {showContext(); deployAllContracts(); }
    if (options.deployStorage) {showContext(); deployStorage();}
    if (options.deployTokenFactory) {showContext(); deployTokenFactory();}
    if (options.deployVault) {showContext(); deployVault();}
    if (options.deployRelayerBase) {showContext(); deployRelayerBase();}
    if (options.deployBridgeBase) {showContext(); deployBridgeBase();}
    if (options.updateOperator) {showContext(); updateOperator();}
    if (options.addChainIds) {showContext(); _addChainIds(options.addChainIds);}
    if (options.addTokens) {showContext(); _addTokens(options.addTokens);}
    if (options.addEth) {showContext(); addEth();}
    if (options.addAft) {showContext(); addAft();}
    if (options.addDai) {showContext(); addDai();}
    if (options.userDepositToken) {showContext(); userDepositToken();}
    if (options.userDepositFee) {showContext(); userDepositFee();}
    if (options.showDeployedAddr) {showDeployAddresses()}
    if (options.setNonce) {setNonce(options.setNonce)}
    if (options.getNonce) {getNonce(options.getNonce)}
    
  });

program.parse(process.argv);
