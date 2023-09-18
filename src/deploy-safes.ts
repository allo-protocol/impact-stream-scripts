import * as dotenv from "dotenv";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { parse } from "csv";
import { finished } from "stream/promises";
import fs from "fs";

import { ethers } from "ethers";
import Safe, {
 EthersAdapter,
 SafeAccountConfig,
 SafeFactory,
} from "@safe-global/protocol-kit";

type User = {
 id: string;
 address: string;
};

dotenv.config();

async function main() {
 if (process.argv.length < 3) {
  console.error("Please provide the CSV file path as an argument");
  process.exit(1); // Exit the script with an error code
 }
 const filePath = process.argv[2];
 const userList = await processFile(filePath);
 console.log(userList);

 // Create a single supabase client with admin rights
 const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
 );
 const providerUrl = `https://celo-alfajores.infura.io/v3/${process.env.INFURA_API_KEY as string
  }`;
 const provider = new ethers.providers.JsonRpcProvider(providerUrl);
 const safeOwner = new ethers.Wallet(
  process.env.SAFE_DEPLOYER_PRIVATE_KEY as string,
  provider,
 );

 const ethAdapter = new EthersAdapter({
  ethers,
  signerOrProvider: safeOwner,
 });
 const safeFactory = await SafeFactory.create({ ethAdapter });
 await deploySafes(userList, safeFactory, supabaseAdmin);
}

const processFile = async (filePath: string): Promise<User[]> => {
 const records: string[][] = [];
 const parser = fs.createReadStream(filePath).pipe(
  parse({
   delimiter: ",",
   bom: true,
  }),
 );
 parser.on("readable", function () {
  let record;
  while ((record = parser.read()) !== null) {
   // Work with each record
   records.push(record);
  }
 });
 await finished(parser);
 const userObjects: User[] = records
  .map((record) => {
   return {
    id: record[0],
    address: record[1],
   };
  })
  .slice(1); // Remove the header
 return userObjects;
};

const deploySafes = async (
 userList: User[],
 safeFactory: SafeFactory,
 supabase: SupabaseClient,
) => {
 const threshold = 2;
 for (const user of userList) {
  console.info(`Deploying safe for ${user.id}...`);
  try {
   const safeAccountConfig: SafeAccountConfig = {
    owners: [
     user.address,
     process.env.IMPACT_STREAM_MULTISIG_ADDRESS as string,
    ],
    threshold,
   };
   const sdk: Safe = await safeFactory.deploySafe({ safeAccountConfig });
   const newSafeAddress = await sdk.getAddress();
   console.info(`New safe deployed at ${newSafeAddress}`);
   const { error } = await supabase
    .from("users")
    .update({ safe_address: newSafeAddress })
    .eq("id", user.id);
   if (error) throw error;
   console.info(`User ${user.id} safe address added to supabase`);
  } catch (error) {
   console.error(error);
  }
 }
};

main();
