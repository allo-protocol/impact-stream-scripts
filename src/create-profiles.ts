import * as dotenv from "dotenv";
import { parse } from "csv";
import { finished } from "stream/promises";
import fs from "fs";
import fsPromises from "fs/promises";

import { ethers } from "ethers";

import registry from "../abi/Registry.json";

type Metadata = {
 protocol: number;
 pointer: string;
};
type Profile = {
 nonce: number;
 name: string;
 metadata: Metadata;
 owner: string;
 members: string[];
};

type RawSupabaseData = {
 proposal_id: string;
 author: {
  id: string;
  name: string;
  family_name: string;
  address: string;
 };
 collaborators: string[] | null;
};

dotenv.config();

// Ingest data from supabase
// Create ethers contract instances for Registry
// Loop through records and create profile for each one
// Write outcome to file

async function main() {
 if (process.argv.length < 3) {
  console.error("Please provide the CSV file path as an argument");
  process.exit(1); // Exit the script with an error code
 }
 const filePath = process.argv[2];
 const profileList = await processFile(filePath);

 const provider = new ethers.providers.JsonRpcProvider(
  process.env.INFURA_RPC_URL as string,
 );
 let nonce;
 await provider.getBlockNumber().then(async (blockNumber: number) => {
  const block = await provider.getBlock(blockNumber);
  nonce = block.number;
 });
 // const profileObjects = profileList.map((profile: RawSupabaseData) => {
 //  return {
 //   nonce,
 //   name: `${profile.author.name} ${profile.author.family_name} - ${profile.author.id}`,
 //   metadata: {
 //    protocol: 1,
 //    pointer: "Test Pointer",
 //   },
 //   owner: profile.author.address,
 //   members:
 //    profile.collaborators !== null
 //     ? [...profile.collaborators, profile.author.address]
 //     : [profile.author.address],
 //  };
 // });
 console.log(profileList);
 const profileDeployer = new ethers.Wallet(
  process.env.DEPLOYER_PRIVATE_KEY as string,
  provider,
 );
 const registryContract = new ethers.Contract(
  process.env.REGISTRY_ADDRESS as string,
  registry.abi,
  profileDeployer,
 );
}

const processFile = async (filePath: string): Promise<RawSupabaseData[]> => {
 let records: string[][] = [];
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
 const profileObjects: any[] = records
  .slice(1) // Remove the header
  .map((record) => {
   return {
    proposal_id: record[0],
    author: JSON.parse(record[1]),
    collaborators: record[2].length === 0 ? null : JSON.parse(record[2]),
   };
  });
 return profileObjects;
};
main();
