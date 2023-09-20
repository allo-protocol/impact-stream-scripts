import * as dotenv from "dotenv";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { parse } from "csv";
import { finished } from "stream/promises";
import fs from "fs";
import fsPromises from "fs/promises";

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

 // Create a single supabase client with admin rights
 const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  {
   auth: {
    persistSession: false,
   },
  },
 );
 const provider = new ethers.providers.JsonRpcProvider(
  process.env.INFURA_RPC_URL as string,
 );
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
 let resultsData: any[] = [
  "\ufeff", // BOM
  "id,safe_deployed,safe_address,supabase_updated\n", // Header
 ];
 for (const user of userList) {
  let resultDataRow = `${user.id},`;
  let newSafeAddress;
  console.log("=======================");
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
   newSafeAddress = await sdk.getAddress();
   resultDataRow += `true,${newSafeAddress},`;
   console.info(`New safe deployed at ${newSafeAddress} `);
   try {
    const { error } = await supabase
     .from("users")
     .update({ safe_address: newSafeAddress })
     .eq("id", user.id);
    if (error) throw error;
    resultDataRow += `true\n`;
    console.info(`User ${user.id} safe address added to supabase`);
    console.log("=======================");
   } catch (error) {
    resultDataRow += `false\n`;
    console.error(error);
    console.log("=======================");
   }
  } catch (error) {
   resultDataRow += `false,,false\n`;
   console.error(error);
  }
  resultsData.push(resultDataRow);
 }
 try {
  await fsPromises.writeFile("results.csv", resultsData.join(""));
 } catch (error) {
  console.error(error);
 }
};

main();
