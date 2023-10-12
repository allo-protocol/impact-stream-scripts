import { supabaseAdmin, SupabaseClient } from "../common/supabase";
import * as dotenv from "dotenv";
import { parse } from "csv";
import { finished } from "stream/promises";
import fs from "fs";
import fsPromises from "fs/promises";

import { abiEncoder, alloContract, Contract } from "../common/ethers";
import { storage, createFileObject } from "../common/ipfs";
import { RawSupabaseData, Recipient } from "../types";

dotenv.config();

async function main() {
 if (process.argv.length < 3) {
  console.error("Please provide the CSV file path as an argument");
  process.exit(1); // Exit the script with an error code
 }
 const filePath = process.argv[2];
 const supabaseData = await processFile(filePath);

 const recipients = await Promise.all(
  supabaseData.map(async (recipient: RawSupabaseData) => {
   let cid: string;
   try {
    const fileObject = createFileObject({
     name: `${recipient.allo_recipient_id}`,
     data: {
      user_id: recipient.author.id,
      supabase_proposal_id: recipient.proposal_id,
     },
    });

    cid = await storage.put([fileObject], { wrapWithDirectory: false });
   } catch (error) {
    cid = "";
    console.error(error);
   }
   return {
    userId: recipient.author.id as string,
    recipientId: recipient.allo_recipient_id as string,
    recipientAddress: recipient.safe_address as string,
    requestedAmount: recipient.minimum_budget as number,
    metadata: {
     protocol: 1,
     pointer: cid ? `https://ipfs.w3s.link/${cid}` : "",
    },
   };
  }),
 );

 await createRecipients(recipients, alloContract, supabaseAdmin);
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
 const recipients: any[] = records
  .slice(1) // Remove the header
  .map((record) => {
   return {
    proposal_id: record[0],
    author: JSON.parse(record[1]),
    collaborators: record[2].length === 0 ? null : JSON.parse(record[2]),
    udget: parseInt(record[3]),
    recipient_id: record[4],
    safe_address: record[5],
   };
  });
 return recipients;
};

const createRecipients = async (
 recipientList: Recipient[],
 alloContract: Contract,
 supabaseClient: SupabaseClient,
) => {
 let resultsData: any[] = [
  "\ufeff", // BOM
  "id,recipient_created,recipient_id,supabase_updated\n", // Header
 ];
 for (const recipient of recipientList) {
  const userId = recipient.userId;
  let resultDataRow = `${userId},`;
  console.log("=======================");
  console.info(`Creating Allo recipient for ${userId}...`);

  try {
   const { recipientId, recipientAddress, requestedAmount, metadata } =
    recipient;
   const strategyInitData = abiEncoder.encode(
    ["address", "address", "uint256", "Metadata"],
    [recipientId, recipientAddress, requestedAmount, metadata],
   );
   const createTx = await alloContract.createRecipient(
    process.env.POOL_ID,
    strategyInitData,
   );
   const txReceipt = await createTx.wait();
   resultDataRow += `true,${recipientId},`;
   console.info(`Allo recipient created with id ${recipientId}`);
   try {
    const { error } = await supabaseClient
     .from("users")
     .update({ allo_recipient_id: recipientId })
     .eq("author_id", userId);
    if (error) throw error;
    resultDataRow += `true\n`;
    console.info(`Allo recipient id ${recipientId} added to supabase`);
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
  await fsPromises.writeFile("recipients.csv", resultsData.join(""));
 } catch (error) {
  console.error(error);
 }
};
main();
