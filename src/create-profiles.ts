import { supabaseAdmin, SupabaseClient } from "../common/supabase";
import * as dotenv from "dotenv";
import { parse } from "csv";
import { finished } from "stream/promises";
import fs from "fs";
import fsPromises from "fs/promises";

import { provider, registryContract, Contract } from "../common/ethers";

import { Profile, RawSupabaseData } from "../types";

dotenv.config();

async function main() {
 if (process.argv.length < 3) {
  console.error("Please provide the CSV file path as an argument");
  process.exit(1); // Exit the script with an error code
 }
 const filePath = process.argv[2];
 const supabaseData = await processFile(filePath);

 let nonce: number;
 await provider.getBlockNumber().then(async (blockNumber: number) => {
  const block = await provider.getBlock(blockNumber);
  nonce = block.number;
 });
 const profiles = supabaseData.map((profile: RawSupabaseData) => {
  return {
   nonce: nonce++,
   name: `${profile.author.name} ${profile.author.family_name} - ${profile.author.id}`,
   metadata: {
    protocol: 1,
    pointer: "Test Pointer",
   },
   owner: profile.author.address,
   members:
    profile.collaborators !== null
     ? [...profile.collaborators, profile.author.address]
     : [profile.author.address],
  };
 });

 await createProfiles(profiles, registryContract, supabaseAdmin);
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

const createProfiles = async (
 profileList: Profile[],
 registryContract: Contract,
 supabaseClient: SupabaseClient,
) => {
 let resultsData: any[] = [
  "\ufeff", // BOM
  "id,profile_created,profile_id,supabase_updated\n", // Header
 ];
 for (const profile of profileList) {
  const userId = profile.name.substring(profile.name.indexOf("- ") + 2);
  let resultDataRow = `${userId},`;
  console.log("=======================");
  console.info(`Creating profile for ${userId}...`);

  try {
   const { nonce, name, metadata, owner, members } = profile;
   const createTx = await registryContract.createProfile(
    nonce,
    name,
    metadata,
    owner,
    members,
   );
   const txReceipt = await createTx.wait();
   let logs = txReceipt?.logs.map((log: any) => {
    return registryContract.interface.parseLog(log);
   });
   const profileLog = logs.find((log: any) => {
    return log.name === "ProfileCreated";
   });
   const { profileId, anchor } = profileLog.args;
   resultDataRow += `true,${profileId},`;
   console.info(`Profile created with id ${profileId}`);
   try {
    const { error } = await supabaseClient
     .from("users")
     .update({ allo_profile_id: profileId, allo_anchor_address: anchor })
     .eq("id", userId);
    if (error) throw error;
    resultDataRow += `true\n`;
    console.info(
     `Allo profile id ${profileId} and anchor address ${anchor} added to supabase`,
    );
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
  await fsPromises.writeFile("profiles.csv", resultsData.join(""));
 } catch (error) {
  console.error(error);
 }
};
main();
