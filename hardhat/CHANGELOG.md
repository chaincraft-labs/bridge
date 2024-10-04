> The primary purpose of this changelog is to keep developers and users informed about the evolution of the project. By documenting changes, it helps to understand what has been added or modified in each release, making it easier to manage updates and maintain the codebase.

## Update 2024-07-04

Adding a bridge.js CLI tool to help to interact with contracts

- bridge.js : CLI tool
- functions.js : Logic functions
- utils.js : Generic functions
- constants/networks : refacto network definitions
- constants/tokens : refacto token definitions

## Update 2024-09-20

Clean up of the original hackathon codebase

- Refactoring of contracts and scripts
- Adding script to automate deployment and user actions on multiple networks
- Previous CLI tool replaced with hardhat tasks
- Adding tasks for generic and specific operations
- Adding tests

## Update 2024-09-30

- Refacto:
  - Refactoring of `constants/` data (js object to json)
  - Add usedConfigs & activeConfig to run scripts, tasks, automation..
  - nonceRecord.json: Add multi nonce management to allow batch transactions on the same side
  - Refactoring of helper functions to manage constants folder changes
  - Improve js syntax in scripts (review)
- Features:
  - Add tasks to manage config params
- Tests:
  - Adding tasks tests (beginning)
- Optimization:
  - Refactoring of s_storage in Bridge & Relayer contracts replacing address with instance and removing useless cast

## Update 2024-10-04

- Storage contract:
  - Collision risk mitigation:
    As the key can be hashed from one or more values and that these values can be of different types and some have a dynamic length, using encodePacked (which does not pad the values), there is a risk of having an entry after concatenation that can be the same for different inputs and thus generate a collision.  
    Mitigation:
    - Replace encodePacked with encode to have fixed length entries before hashing (padded to 32 bytes)
    - Add a dummy key as second entry for non composite keys in the same idea of having a hash of the same number of entries of the same length.
