# Impact Stream Scripts

Various admininistative scripts to help with the [Impact Stream](https://impact.stream).

## Installation

1. Clone the repository:

```bash
git clone https://github.com/0xPrimordia/impact-stream-scripts.git
```

2. Install dependencies:

```bash
yarn install
```

3. Create a .env file at the root of the repository and add the following variables:

- INFURA_RPC_URL - Your Infura RPC URL
- SIGNER_PRIVATE_KEY - The private key of the pool manager/address that will call contracts
- IMPACT_STREAM_MULTISIG_ADDRESS - The address of the Impact Stream multisig
- ALLO_REGISTRY_ADDRESS - The address of the Allo Protocol registry
- ALLO_MAIN_ADDRESS - The address of the Allo Protocol main contract
- ALLO_STRATEGY_ADDRESS - The address of the Allo Protocol strategy contract
- ALLO_POOL_ID - The ID of the Allo Protocol pool (once pool has been created)
  WEB3_STORAGE_TOKEN - The token for the Web3 Storage API
- SUPABASE_URL - The URL for intializing the Supabase Client
- SUPABASE_SERVICE_ROLE_KEY - The service role key for the initializing the Supabase Client

4. Run the build command:

```bash
pnpm build
```

## Scripts

1. Deploy the QV Impact stream strategy. _(Verify the contract if it's not auto verified)_
```shell
pnm run deploy-strategy
```
2. Update `ALLO_STRATEGY_ADDRESS` in `.env` with the deployed contract
3. Update `pool.data.json` with the init data for pool creation. (_verify the timstamps and allo strategy address_)
4. Create pool on Allo using deployed strategy
```shell
pnpm run create-pool
```
5. Update `ALLO_POOL_ID` in `.env` with the pool Id
6. Head over to `impact-stream-app` and update [allo.config.ts](https://github.com/0xPrimordia/impact-stream-app/blob/develop/src/app/%5Blocale%5D/config/allo.config.ts) with the right addresses and poolId
7. Create Profiles from the Proposals in impact stream. (_Each proposal has a profile on the registry_)
```shell
pnpm run create-profiles
```
8. Next for every user with an approved proposal, we need deploy a safe which owned by the user wallet and impact stream multisig.  Update `IMPACT_STREAM_MULTISIG_ADDRESS` in `.env` with the wallet that will be the other signer
9. Deploy Safe for the users
```shell
pnpm run deploy-safes
```
10. Now we register the recipients
```shell
pnpm run register-recipients
```
11. To set the allocators, update `allocators.data.json` with the wallets that can allocate
12. Now we register the allocators
```shell
pnpm run register-allocators
```
13. Once the allocations have started, to get the payouts, run
```shell
pnpm run calculate-payouts
```
14. Once the allocations has ended, to set the payouts on chain, run
```shell
pnpm run set-payouts
```
15. To distribute payouts, run
```shell
pnpm run distribute-payouts
```