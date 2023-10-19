# Impact Stream Scripts

Various admininistative scripts to help with the [Impact Stream](https://impact.stream).

## Installation

1. Clone the repository:

```bash
git clone https://github.com/0xPrimordia/impact-stream-scripts.git
```

2. Install dependencies:

```bash
pnpm install
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

## Usage

### Create Pool

Creates a new pool in the Allo Protocol. This script expects a CSV file with the following columns:

- Allo profile id
- Strategy address
- Allocation start time
- Allocation end time
- Max voice credits per allocator
- Pool token address
- Initial pool amount
- Pool metadata pointer
- Pool manager addresses

Once the CSV is created, run the following command:

```bash
pnpm create-pool <filepath>
```

### Create Profiles

Create profiles in the Allo Protocol registry contract based on user and proposal tables in Supabase. This script expects a CSV file with the following columns:

- Supabase proposal id
- Supabase proposal author id
- Proposal collaborator json string

This data can be exported from Supabase using the following sql command in their editor:

```sql
select
  p.id as proposal_id,
  json_build_object(
    'id',
    a.id,
    'name',
    a.name,
    'family_name',
    a.family_name,
    'address',
    a.address
  ) as author,
  case
    when count(pc.user_id) > 0 then array_agg(
      u.address
    )
    else null
  end as collaborators
from
  proposals p
  left join proposal_collaborators pc on p.id = pc.proposal_id
  left join users u on u.id = pc.user_id
  inner join users a on p.author_id = a.id
group by
  p.id,
  a.id,
  a.name,
  a.family_name,
  a.address;
```

You do not need to remove the header as the script will remove it. Once the CSV is created, run the following command:

```bash
pnpm create-profiles <filepath>
```

The script will produce a CSV file, profiles.csv, with the following columns:

- User Id
- Whether the profile was successfully created
- The resulting profile id if the profile was successfully created
- Whether Supabase was successfully updated with the new profile id

### Deploy Safes

Deploy Safe Multisigs for each proposal in Supabase. This script expects a CSV file with the following columns:

- Supabase User Id
- User Wallet Address

Once the CSV is created, run the following command:

```bash
pnpm deploy-safes <filepath>
```

The script will produce a CSV file, safes.csv, with the following columns:

- User Id
- Whether the safe was successfully deployed
- The resulting safe address if the safe was successfully deployed
- Whether Supabase was successfully updated with the new safe address

### Register Allocators

Registers each wallet address on Supabase as an allocator in Allo Protocol. This script expects a CSV file with the following columns:

- User wallet address

The data can be exported from Supabase using the following sql command in their editor:

```sql
select address from public.users;
```

Once the CSV is created, run the following command:

```bash
pnpm create-allocators <filepath>
```

The script will produce a CSV file, allocators.csv, with the following columns:

- User wallet address
- Whether the allocator was successfully registered

### Create Recipients

Create a recipient in Allo Protocol for each proposal in Supabase. This script expects a CSV file with the following columns:

- Proposal Author Id
- Safe Multisig Address Associated with Proposal
- Proposal Minimum Budget

The data can be exported from Supabase using the following sql command in their editor:

```sql
select
  p.id as proposal_id,
  p.author_id as author_id,
  p.allo_recipient_id as allo_recipient_id,
  u.safe_address as safe_address,
  p.minimum_budget as minimum_budget
from
  proposals p
  left join users u on u.id = p.author_id
group by
  p.id,
  p.author_id,
  p.allo_recipient_id,
  u.safe_address,
  p.minimum_budget;
```

You do not need to remove the header as the script will remove it. Once the CSV is created, run the following command:

```bash
pnpm create-recipients <filepath>
```

The script will produce a CSV file, recipients.csv, with the following columns:

- User id
- Whether the recipient was successfully created
- The resulting recipient id if the recipient was successfully created
- Whether Supabase was successfully updated with the new recipient id

### Calculate Payouts

Calculate the payouts offchain for each recipient in Allo Protocol based on how many votes they recieved.

To calculate the payouts, run the following command:

```bash
pnpm calculate-payouts
```

The script will produce a CSV file, calculated_payouts.csv, with the following columns:

- Recipient id
- Payout amount

### Set Payouts

Set the payout for each recipient in Allo Protocol. This script expects a CSV file in the same format as the export of the `calculate-payouts` script:

- Recipient id
- Payout amount

Once the CSV is created, run the following command:

```bash
pnpm set-payouts <filepath>
```

### Distribute Payouts

Distribute the payout for each recipient in Allo Protocol. This script expects a CSV file with the following columns:

- A comma-separated list of recipient addresses

Once the CSV is created, run the following command:

```bash
pnpm distribute-payouts <filepath>
```

### Upload Files to IPFS

Upload several files to IPFS at once. This script expects one argument, the path to where the files are located. Be aware that this script will pack files into a [Content Archive](https://web3.storage/docs/how-tos/work-with-car-files/) before uploading.

To upload files, run the following command:

```bash
pnpm ipfs-upload <filepath>
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)

````

```

```
````
