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


const deploy = async (options) => {
  const [networkEth, networkAft] = options.split(',');

  initNonce();
  await showContext();
  await deployStorage();
  await deployTokenFactory();
  await deployVault();
  await deployRelayerBase();
  await deployBridgeBase();
  await updateOperator();
  await _addChainIds('1115511,31337,440,441', false); // hardcoding for testing
  await _addTokens('ethereum,allfeat,dai', false);
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
        .then((nonce) => console.log(`non => ${nonce}`))
        .catch((err) => console.log(err))
}

const _getNonce = async (userAddress) => {
  await showContext(); 
  getNonce(userAddress)
  .then((nonce) => console.log(`non => ${nonce}`))
  .catch((err) => console.log(err))
}

const _userDepositToken = async (data) => {
  let [userName, amount, chainIdFrom, chainIdTo, tokenName] = data.split(',');
  amount = 1_000_000_000_000_000n; // hardcoded in Storage contract
  await showContext(); 
  await userDepositToken(userName, amount, chainIdFrom, chainIdTo, tokenName);
}

const _userDepositFees = async (data) => {
  let [userName, amount, chainIdFrom, chainIdTo, tokenName] = data.split(',');
  amount = 1_000_000_000_000_000n; // hardcoded in Storage contract
  await showContext(); 
  await userDepositFees(userName, amount, chainIdFrom, chainIdTo, tokenName);
}

const _testDepositToken = async () => {
  const data = 'user1,1_000_000_000_000_000n,31337,440,ethereum'
  await _userDepositToken(data);
}

const _testDepositFees = async () => {
  const data = 'user1,1_000_000_000_000_000n,31337,440,ethereum'
  await _userDepositFees(data);
}




const main = async () => {

  program
    .version("1.0.0")
    .description("Bridge relayer CLI")
    .option('--deploy [options]', 'deploy all contracts, set operators, chainIds and token. Options: anvil_local,allfeat_local')
    .option('--deploy-contracts', 'deploy all contracts')
    .option('--deploy-storage', 'deploy Storage contract')
    .option('--deploy-token-factory', 'deploy TokenFactory contract')
    .option('--deploy-vault', 'deploy Vault contract')
    .option('--deploy-relayer-base', 'deploy RelayerBase contract')
    .option('--deploy-bridge-base', 'deploy BridgeBase contract')
    .option('--update-operator', 'update operator')
    .option('--add-chain-ids [chain Ids]', 'add chainIds to storage [11155111, 31337, 440, 441]')
    .option('--add-tokens [tokens]', 'add tokens to storage []')
    .option('--add-eth [network ETH]', 'add ETH token. network e.g anvil_local')
    .option('--add-aft [network AFT]', 'add AFT token. network e.g allfeat_local')
    .option('--add-dai', 'add DAI')
    .option('--user-deposit-token [userAddress,amount,chainIdFrom,chainIdTo,tokenName]', 'user deposit token')
    .option('--user-deposit-fees [userAddress,amount,chainIdFrom,chainIdTo,tokenName]', 'user deposit fees')
    .option('--test-deposit-token', 'Test user deposit token')
    .option('--test-deposit-fees', 'Test user deposit fees')
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
      if (options.userDepositToken) {_userDepositToken(options.userDepositToken);}
      if (options.userDepositFees) {_userDepositFees(options.userDepositFees);}
      if (options.testDepositToken) {_testDepositToken();}
      if (options.testDepositFees) {_testDepositFees();}
      if (options.showDeployedAddr) {showDeployAddresses()}
      if (options.setNonce) {_setNonce(options.setNonce)}
      if (options.getNonce) {_getNonce(options.getNonce)}      
    });

  program.parse(process.argv);

};

main().catch((error) => {console.error(error);process.exitCode = 1;});