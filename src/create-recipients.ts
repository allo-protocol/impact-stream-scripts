import * as dotenv from "dotenv";
import { parse } from "csv";
import { finished } from "stream/promises";
import fs from "fs";
import fsPromises from "fs/promises";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

import { storage, createFileObject } from "../common/ipfs";
import { RawSupabaseData, Recipient } from "../types";
import { Contract, ethers } from "ethers";
import allo from "../abi/Allo.json";

dotenv.config();

const EMPTY_METADATA = [0, ""];
const EMPTY_RECIPIENT_ID = "0x0000000000000000000000000000000000000000";

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.INFURA_RPC_URL as string
  );

  const signer = new ethers.Wallet(
    process.env.SIGNER_PRIVATE_KEY as string,
    provider
  );
  const alloContract: Contract = new ethers.Contract(
    process.env.ALLO_MAIN_ADDRESS as string,
    allo.abi,
    signer
  );

  if (process.argv.length < 3) {
    console.error("Please provide the CSV file path as an argument");
    process.exit(1);
  }

  const filePath = process.argv[2];
  const supabaseData = await processFile(filePath);

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    {
      auth: {
        persistSession: false,
      },
    }
  );

  const recipients = await Promise.all(
    supabaseData.map(async (recipient: RawSupabaseData) => {
      try {
        const fileObject = createFileObject({
          name: `${recipient.allo_recipient_id}`,
          data: {
            user_id: recipient.author.id,
            supabase_proposal_id: recipient.proposal_id,
          },
        });

        await storage.put([fileObject], { wrapWithDirectory: false });
      } catch (error) {
        console.error(error);
      }
      return {
        proposalId: recipient.proposal_id as string,
        userId: recipient.author.id as string,
        recipientAddress: recipient.safe_address as string,
        requestedAmount: recipient.minimum_budget as number
      };
    })
  );

  await createRecipients(recipients, alloContract, supabaseAdmin);
}

const processFile = async (filePath: string): Promise<RawSupabaseData[]> => {
  let records: string[][] = [];

  const parser = fs.createReadStream(filePath).pipe(
    parse({
      delimiter: ",",
      bom: true,
    })
  );

  parser.on("readable", function () {
    let record;
    while ((record = parser.read()) !== null) {
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
        mimimum_budget: parseInt(record[3]),
        // recipient_id: record[4],
        // recipient_id: "0x0000000000000000000000000000000000000000",
        safe_address: record[5],
      };
    });
  return recipients;
};

const createRecipients = async (
  recipients: Recipient[],
  alloContract: Contract,
  supabaseClient: SupabaseClient
) => {
  let resultsData: any[] = [
    "\ufeff", // BOM
    "id,recipient_created,recipient_id,supabase_updated\n", // Header
  ];

  for (const recipient of recipients) {
    const userId = recipient.userId;

    let resultDataRow = `${recipient.proposalId},`;
    
    console.log("=======================");
    console.info(`Creating Allo recipient for ${recipient.proposalId}...`);

    try {

      const recipientAddress = recipient.recipientAddress;
      const requestedAmount = recipient.requestedAmount;
      
      const recipientRegisterData = ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "uint256", "tuple(uint256, string)"],
        [EMPTY_RECIPIENT_ID, recipientAddress, requestedAmount, EMPTY_METADATA]
      );

      const staticCallResult = await alloContract.registerRecipient(
        process.env.ALLO_POOL_ID,
        recipientRegisterData
      );

      const createTx = await alloContract.registerRecipient(
        process.env.ALLO_POOL_ID,
        recipientRegisterData
      );
  
      await createTx.wait();

      // get recipientId after registering
      const recipientId = staticCallResult.toString();

      resultDataRow += `${userId},${recipientId},`;
      console.info(`Allo recipient created with id ${recipientId}`);
      
      try {

        // TODO: check if this is needed
        // const { error } = await supabaseClient
        //   .from("users")
        //   .update({ allo_recipient_id: recipientId })
        //   .eq("author_id", userId);

        // make sure proposal is linked to recipientId

        const { error } = await supabaseClient
          .from("proposals")
          .update({ allo_recipient_id: recipientId })
          .eq("id", recipient.proposalId);
        
        if (error) throw error;

        resultDataRow += `true\n`;
        console.info(`Allo recipient id ${recipientId} - ${recipient.proposalId} added to supabase`);
        console.log("=======================");
      } catch (error) {
        
        resultDataRow += `false\n`;
        console.error(error);
        console.log("=======================");
      }
    } catch (error) {
      resultDataRow += `false\n`;
      console.error(error);
    }
    resultsData.push(resultDataRow);
  }

  try {
    // write userId -> proposalId -> recipientId -> link status to csv 
    await fsPromises.writeFile("recipients.csv", resultsData.join(""));
  } catch (error) {
    console.error(error);
  }
};
main();
