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
