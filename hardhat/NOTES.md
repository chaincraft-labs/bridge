# IDEAS / THINGS TO ADD ...

# CONTEXT:

## FOR THIS POC:

- fees are not recoverable
- communications:  
  allfeat bridge => one to many  
  others bridge => one to one (allfeat)  
  _later: all => one to many_
- only one server (centralized)  
  _later: network of servers_
- we wait for finalization of tx (or 'good amount' of confirmations) to ensure not minting/unlocking tokens if origin deposit is canceled (same for the destination fees).

# NEXT STEPS:

1. [ ] Fix V0 release (on/off chain)
2. [ ] Add fees management
3. [ ] Add cancel operation management
4. [ ] Decentralized version:
   - [ ] Contracts: structure as execution vote / encoded function calls
   - [ ] Multi server management
   - [ ] Use of MPC/TSS for keys management
5. Security & optimization are permanent tasks

# TODOs:

Things to implement and ideas to dig.
Prefixed by '!' are important.

## Naming:

- Rethink naming of contracts & functions / explicit but with coherence
- Rethink events & errors naming
- Better naming of variables like owner in factory: ? minter ?

## Events / errors:

- Complete events & errors in all contracts
- No unnecessary duplicate events when calling other contracts
- !! Errors: bubble up to the top level (cancel management)

## Storage:

### Operations

- Rethink nonces user & chain / global bridge (origin & destination)
- Rethink structures and mapping (more efficient)
- Utility of packing (bitmap)?
  - BlockStep: 4 steps in one uint256
  - Token data: symbol, status (up/down), decimals, address
- Manage different address format (solana) => use bytes32 with specific conversion
- max val for bytes4 = 2^32 - 1 = 4294967295, max val for bytes8 = 2^64 - 1 = 18446744073709551615, uint8 => 2^8 - 1 = 255

### General

- Use IPFS to store tx data (to check and less storage) when done ?

## Contracts:

- Use of library if needed rather than import ?
- !! Refactor call params (struct, payload..) to reduce gas usage

### Storage

- !! Improve functions (cause the more called)
- !! Add specific getters/functions in relayer/bridge to avoid multiple calls
- Key, label, types validation ?
- !! Setter for gas management
- !! Setter for blocks verification
- Management of nodes whitelist

### BridgeToken & Factory

- Add Ownable & Burnable
- batchMint and burn (to decrease gas usage) when off-chain ready to sort/batch calls
- Rename owner as minter
- Better symbol format

### BridgeBase

- Don't pass chainFrom in user calls (reduce payload)

### RelayerBase

- Check chainId in params (origin & from..)
- Block verification

## Improvements:

### Security:

#### weird erc20

#### Many vaults

- Add multiple vaults (per type, volume ??) to reduce risks of all funds stolen/locked in case of hack.

#### !! Non reentrancy

- !! Add global process to storage contract
- Check use of reentrancy guard in all contracts
- Use transient storage

#### !! Pause mechanism

- Add granular pause mechanism (update/stop if hack) / and status of the pair

#### !! Access role

- Better design of role & access / access control (openzeppelin)
- use bytes32 for role & reverse mapping
- Manage nodes addresses (whitelist) for later steps

### Token management:

#### Check token specifities

- Later: Different token types (ERC20, ERC721, ERC1155, ...)
- Ensure compatibility of bridged token with original token

#### Check weird ERC20

- decimals
- !! blacklist
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

#### Permit2 / EIP2612

- To allow transferWithPermit by signing a msg
- => different process to deposit following these possibilities
- Deploy Permit2 to Allfeat

### Others:

#### Config

- Add contract verification for allfeat (scout)

#### EIP712

- Add typed structured data (for tx infos when user sign ...)

#### EIP165

- To recognize 'bridged token' interface
- Idea is to allow batch mint/burn when possible to reduce fees (server side).

#### User actions/ UX

- Manual redeem (case of pb) => possibility to let user redeem against a proof
- Later: Account abstraction for better UX (no need to have eth for fees)...
  This need a dedicated development (see differents solutions as kernel ...)

#### Refactor server actions

- Transform order creation in proposal to vote
- Servers check and validate conditions => a threshold trigger the event needed to bridge

### Optimizations:

- Use deposit or fallback function to reduce gas
