const { program } = require('commander');
const { showContext, initNonce, setNonce, getNonce } = require('./as_utils');
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
  userDepositFees,
  showDeployAddresses,
} = require('./as_functions');


const deploy = async (pattern) => {
  const [networkEth, networkAft, chainidEth, chainidAft] = deployPatterns[pattern].split(',');

  initNonce();
  await showContext();
  await deployStorage();
  await deployTokenFactory();
  await deployVault();
  await deployRelayerBase();
  await deployBridgeBase();
  await updateOperator();
  await _addChainIds(`${chainidEth},${chainidAft}`, false); // hardcoding for testing
  await _addTokens(addTokenPatterns[pattern], false);
  await addEth(networkEth);
  await addAft(networkAft);
  await addDai();
  await showDeployAddresses();
}

const _deployStorage = async () => {
  await showContext(); 
  await deployStorage();
}

const _deployTokenFactory = async () => {
  await showContext(); 
  await deployTokenFactory();
}

const _deployVault = async () => {
  await showContext(); 
  await deployVault();
}

const _deployRelayerBase = async () => {
  await showContext(); 
  await deployRelayerBase();
}

const _deployBridgeBase = async () => {
  await showContext(); 
  await deployBridgeBase();
}

const _addEth = async (networkEth) => {
  await showContext(); 
  await addEth(networkEth);
}

const _addAft = async (networkAft) => {
  await showContext(); 
  await addAft(networkAft);
}

const _addDai = async () => {
  await showContext(); 
  await addDai();
}

const _updateOperator = async () => {
  await showContext(); 
  await updateOperator();
}

const deployAllContracts = async () => {
  initNonce();
  await deployStorage();
  await deployTokenFactory();
  await deployVault();
  await deployRelayerBase();
  await deployBridgeBase();
  await showDeployAddresses();
}

const _addChainIds = async (chainIds, show = true) => {
  if (show === true) {await showContext();}
  chainIds = chainIds.split(',');
  await addChainIds(chainIds);
}

const _addTokens = async (tokens, show = true) => {
  if (show === true) {await showContext();}
  tokens = tokens.split(',');
  await addTokens(tokens);
}

const _setNonce = async (userAddress) => {
  await showContext(); 
  setNonce(userAddress).catch((err) => console.log(err));

    getNonce(userAddress)
        .then((nonce) => console.log(`nonce => ${nonce}`))
        .catch((err) => console.log(err))
}

const _getNonce = async (userAddress) => {
  await showContext(); 
  getNonce(userAddress)
  .then((nonce) => console.log(`nonce => ${nonce}`))
  .catch((err) => console.log(err))
}

const _depositToken = async (pattern) => {
  const [userName, amount, chainIdFrom, chainIdTo, tokenName] = depositPatterns[pattern];
  await showContext(); 
  await userDepositToken(userName, amount, chainIdFrom, chainIdTo, tokenName);
}

const _depositFees = async (pattern) => {
  const [userName, amount, chainIdFrom, chainIdTo, tokenName] = depositPatterns[pattern];
  await showContext(); 
  await userDepositFees(userName, amount, chainIdFrom, chainIdTo, tokenName);
}

const depositPatterns = {
  "gethAllfeatLocal": ['user2', 1_000_000_000_000_000n, 1337, 440, 'ethereum'],
  "allfeatGethLocal": ['user2', 1_000_000_000_000_000n, 440, 1337,' allfeat'],
}

const deployPatterns = {
  "gethAllfeatLocal": 'geth,allfeat_local,1337,440',
}

const addTokenPatterns = {
  "gethAllfeatLocal": 'ethereum,allfeat,dai',
}


const main = async () => {

  program
    .version("1.0.0")
    .description("Bridge relayer CLI")
    .option('--deploy [pattern]', 'deploy all contracts, set operators, chainIds and token. Options: geth,allfeat_local,1337,440')
    .option('--deploy-contracts', 'deploy all contracts')
    .option('--deploy-storage', 'deploy Storage contract')
    .option('--deploy-token-factory', 'deploy TokenFactory contract')
    .option('--deploy-vault', 'deploy Vault contract')
    .option('--deploy-relayer-base', 'deploy RelayerBase contract')
    .option('--deploy-bridge-base', 'deploy BridgeBase contract')
    .option('--update-operator', 'update operator')
    .option('--add-chain-ids [chain Ids]', 'add chainIds to storage [1337,440]')
    .option('--add-tokens [tokens]', 'add tokens to storage []')
    .option('--add-eth [network ETH]', 'add ETH token. network e.g geth')
    .option('--add-aft [network AFT]', 'add AFT token. network e.g allfeat_local')
    .option('--add-dai', 'add DAI')
    .option('--deposit-token [pattern]', 'deposit token, pattern [getAllfeatLocal | allfreatGethLocal]')
    .option('--deposit-fees [pattern]', 'deposit fees, pattern: [getAllfeatLocal | allfreatGethLocal]')
    .option('--show-deployed-addr', 'show last deployed addresses')
    .option('--set-nonce [address]', 'set nonce')
    .option('--get-nonce [address]', 'get nonce')
    .action((options) => {
      
      if (options.deploy) {deploy(options.deploy);}
      if (options.deployContracts) {showContext(); deployAllContracts(); }
      if (options.deployStorage) {_deployStorage();}
      if (options.deployTokenFactory) {_deployTokenFactory();}
      if (options.deployVault) {_deployVault();}
      if (options.deployRelayerBase) {_deployRelayerBase();}
      if (options.deployBridgeBase) {_deployBridgeBase();}
      if (options.updateOperator) {_updateOperator();}
      if (options.addChainIds) {_addChainIds(options.addChainIds);}
      if (options.addTokens) {_addTokens(options.addTokens);}
      if (options.addEth) {_addEth(options.addEth);}
      if (options.addAft) {_addAft(options.addAft);}
      if (options.addDai) {_addDai();}
      if (options.depositToken) {_depositToken(options.depositToken);}
      if (options.depositFees) {_depositFees(options.depositFees);}
      if (options.showDeployedAddr) {showDeployAddresses()}
      if (options.setNonce) {_setNonce(options.setNonce)}
      if (options.getNonce) {_getNonce(options.getNonce)}      
    });

  program.parse(process.argv);

};

main().catch((error) => {console.error(error);process.exitCode = 1;});