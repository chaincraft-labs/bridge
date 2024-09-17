# IDEAS / THINGS TO ADD ...

## CONTEXT:

### FOR THIS POC:

- fees are not recoverable
- communications:
  allfeat bridge => one to many
  others bridge => one to one (allfeat)
  later: all => one to many
- only one server (centralized) / later network of servers
- we wait for finalization of tx (or good amount of confirmations) to ensure not minting/unlocking tokens if origin deposit is canceled. (same for the destination fees)

## IMPLEMENTATION:

### naming

- order or operation
- decide actions/events names

### orders storage

- need nonces to avoid replay / user risk => nonce per userAdd
- hash of params as tx id is not a good idea. No proof of non collision (only proba)
- rethink organization
  mapping hashOp => Op
  mapping chainTo => hashOp
  or user => Op
- need to get Op => hash == details
- also ? by user ? by chain ?
- if iteration to loop => use nonce mapping to hashOp ?

## IMPROVEMENTS:

### Add granular pause state & contract status (up...)

### EIP712

- add typed structured data (for tx infos when user sign ...)

### Refactor params of calls

- to reduce gas due to params (bytes unused ..)=> pack data
- reduce external call, mainly when transfering ETH and AFT

### EIP165

- to recognize 'bridged token' interface
- idea is to allow batch mint/burn when possible to reduce fees (server side).

### Permit2

- to allow transferWithPermit by signing a msg (deploy it to Allfeat)
- test approvals
- test token (with permit or not ?)
- => different process to deposit following these possibilities

### NON REENTRANCY !!

- add global process to storage contract with transient variable

### ROLE ACCESS

- better design of role & access

### USER ACTIONS

- Later : AA
- Process => 1 deposit tx managing all (fees => reorg to convert & dispatch fees)
- Deposit / Redeem
- At the moment : Approve/Deposit/LockFees (remove approve with permit... when possible)

### Check weird ERC20

- decimals
- blacklist
- approval race
- return value or void
- fees on transfer
- revert (approval to 0 add, 0 value approval or transfer)
- non revert on failure
- revert on large amount
- rebase token (balance modification)
- reentrancy
- upgradable
- flash mintable
- multi token add
- transferFrom with src==msg.sender
- metadata in bytes instead of string
- js injection in name attribute
- unusual permit function
- transfer less than amount

### fees manager

- case of many servers => make a dedicated vault
- get the fees and convert it in the relevant token
- manages balances redeemable by operators depending on their actions

### refactor servers actions

- transform order creation in proposal to vote
- servers check and validate conditions => a threshold trigger the event needed to bridge

// bckup files
BridgeBase

/\*

- @note:
- - fees:
- - business fees are taken in the user deposit
- - op fees:
- - first tx (deposit) is paid by user
- - final tx (server initiating final tx) is paid by server
- => final fees can be
- - computed at deposit time and charged to user then transfered to server
- - computed at deposit time and approved by user, then send back to server on its tx
- - paid by server on its tx and reimbourse
- - ... ?
-
- - user actions: ?
- - send / redeem
- - approve / finalize
- - only send (=> need fees management, conversion of token..)
-
- - reflexion : ATTENTION liquidity of asset if multi chain
- - ex: 1 bridge ETH from A to B / 2 bridge bETH from B to C = not possible
- - register amount bridged on each other chain from allfeat to know where liquidity is available

- // track liquidity bridged as it can be "consumed"
- @todo:
- - IMPLEMENT REAL nonce or txHash management !!!!!!!!!!!!
- - register of bridge contracts and server addresses
- - register of authorized tokens
- - pause mechanism (granular)
- - change admin mechanism (?)
- - batch operations (gped by token address)
- - status of the bridge (open / closed)
- - store deposit, nonce, status of tx
- - access control
- - manual redeem (case of pb): possibility to let user reddem against a proof
- - max optimization to reduce fees!!
- - add external vault to not lock all the liquidity in case of pb
- - tx simulation to return fees and recieved amount estimation
- - implement Permit2 for better UX or AA
    \*/

// max value of uint8 = 255
// which uint type to contain : 1155511 => uint32 wich is 4294967295

// NOT LOGIC to ask user or dapp to know tokenADD for destination
// reduce params of signed msg
// as we have a mapping of tokens => destination will get the eq token

// ATTNETION tokenFrom => TO !!! check when to change it
// function bridge(address tokenAddress, uint256 amount, uint256 chainId, bytes calldata signature) external payable {

//helper testing
// function getTokenAddresses(string memory tokenName, uint256 chainIdFrom, uint256 chainIdTo)
// public
// view
// returns (address, address)
// {
// (address a1, address a2) = Storage(s_storage).getTokenAddressesBychainIds(tokenName, chainIdFrom, chainIdTo);
// console.log("a1: %s", a1);
// console.log("a2: %s", a2);
// return (a1, a2);
// }

// possible to pack chainId and nonce in 1 uint256 and timestamp
// timestamp till year 6000 is 4 bytes and this timestamp value will be
// 9999 = 253382420675 / in bytes 253382420675 =

// max val for bytes4 = 2^32 - 1 = 4294967295
// max val for bytes8 = 2^64 - 1 = 18446744073709551615

// deopsit & coplete => struct for params ?

// @todo add checks for chainID... (i.e chainIdTo != current chain if createOperation ...)

BridgedToken

/\*

- @todo
- - Add Ownable & Burnable + batchMint and burn (to decrease gas usage)
- - Add a way to pause the contract
- To manage pause/upgrade in case of hacks...
- - add 'minter' => Factory keeps owner role, minter (Vault) can be updated
- - updateMinter callable only by owner (Factory) => need same func in Factory callable by bridge admin
- Renaming => owner / admin / minter
  \*/

RelayerBase

//TODO
//block step struct :RENAME + opti in one state + converter
// bytes4 => uint64 (4 step in one uint256) / need reader...
// or uint64 don't use pcking function let evm do the job

// operator param => to specify h many fee to qich one...

// Not store chainIdFrom in struct OperationParams=> we're on it... At initialization => Store immutable variable

// hash op /_ state variables _/
//..??
// No way to prove no collision between origin and destination with many chain...(it's only probability)
// only sure things are the chainId and the nonce
// So later modify for a mapping of chainId => nonce => Operation (with hash in it) or hashOperation & ref to nonce
// chainId => nonce allows to have iterable list of operation. With index begin - end (actual)
// possibility to prune the list after a certain time and update the index

// load on ipfs ?

// Naming

// getter user op in progress (front/onchain fetch to continue/display)

// DESTINATION

// We should simulate operation to get the needed fees
// these op will be server calling

//In Later versions THIS WILL create a vote (or at the beginning on origin chain)
// operator will act like bot for a vote
// triggering status changes
// some status trigger operation such as feesLock...
// signature checks.. are done in the contract.
// threshold reach trigger the final execution

// USER HAS TO APPROVE THE RELAYER TO SPEND HIS TOKENS
// first call to destination creating a new DestinationOperation

// We don't check signature here cause we perhaps won't keep this function in the final version making
// all the fees management in the first tx of origin chain

// rename event IMPACT Arnaud prefix

// Eternal storage for the bridge ecosyste allowing to upgrade modules
// ERRORS

error Storage**NotAdmin();
error Storage**TokenNotInList(string tokenName);
error Storage**ChainIdNotInList(uint256 chainId);
// error Storage**TokenAlreadySet(string tokenName, uint256 chainId);
// error Storage**TokenNotSet(string tokenName, uint256 chainId);
error Storage**InvalidArrayLengthInParams(string functionName);
error Storage**TokenAlreadyInList(string tokenName);
error Storage**ChainIdAlreadyInList(uint256 chainId);
error Storage**TokenAddressAlreadySet(string tokenName, uint256 chainId);
error Storage**TokenAddressNotSet(string tokenName, uint256 chainId);

// @todo
// refactor and add events
// add fees variables (op, base, protocol, etc.)
// keep only needed storage
// store all varibles without balances (managed by vault) and operation (managed by relayer)

//@todo
// refactor token infos to : name => chainId => symbol & address

// THINK about key label validation
// not for all complete key cause it can be huge and not needed
// enum StorageType {
// UINT,
// ADDRESS,
// BOOL,
// BYTES,
// STRING,
// BYTES32,
// UINT_ARRAY,
// ADDRESS_ARRAY,
// BYTES_ARRAY,
// STRING_ARRAY,
// BYTES32_ARRAY
// }

// struct Key {
// bool exists;
// string field;
// address optionalAddress;
// uint256 optionalUint;
// // bytes32 id;
// StorageType storageType;
// }

// system to valid keys ?

// NATIVE toekn address(0) => address.max == 0xffffffffffffffffffffffffffffffffffffffff
// to avoid confusion with real address(0) == 0x

// RENAME ALL LABEL USING A SPECIAL FORMAT : opertator_role ... to reduce collision risk / with maj/min
// USE constant if possible for essential values

// @todo
// At the moment only one admin, relayer, oracle (server), factory, vault, etc.
// later refactor to have array of relayers, orcales, etc.
// and refactor to have access control for admin, relayer, oracle, etc. (via openzeppelin access control)

// @todo ENUM of role for admin, relayer, oracle, factory, vault, etc.

// update functions to change the address of the admin, relayer, oracle, factory, vault, etc.

TokenFactory

/\*

- @todo
- - Manage different token types
- - Unify the references to tokens (name, symbol..?)
- - Better symbol format (no collision of chain name...)
- - UpdateAdmin or Minter (see BridgedToken), to let admin update the minter address
- - OPTI: use Storage to check if token already exists
- - OPTI: state: Storage instead of address
    \*/

Vault

// ADD event!!!!

// This contract is a placeholder for the actual vault contract
// Later dispatch DepositVault (native and erc20/ bridged) and FeesVault
// to have less exposure in case of a bug

// At the moment its the vault of all the tokens for the bridges and the fees
// A balance will be kept for each token

// ??
// It will be the owner of bridgedTokens (transfer of ownership will be done by the factory)
// to be abble to mint and burn tokens

// Authorized actors : admin, factory, bridge (relayer can't access the vault)

// @todo : add status of the vault (open, closed, paused, locked...)
// and up/down // ready (if all role are set in storage)

// @todo custom errors !!!

// @todo IMPORTANT non reentrance with withdraw...

Utils use of library if needed rather than import
