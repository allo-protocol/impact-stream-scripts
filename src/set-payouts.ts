import * as dotenv from "dotenv";
import { parse } from "csv";
import { finished } from "stream/promises";
import fs from "fs";
import fsPromises from "fs/promises";

import { strategyContract } from "../common/ethers";
import { Payout } from "../types";

dotenv.config();

async function main() {
 if (process.argv.length < 3) {
  console.error("Please provide the CSV file path as an argument");
  process.exit(1); // Exit the script with an error code
 }
 const filePath = process.argv[2];
 const payoutData = await processFile(filePath);

 try {
  console.log("=======================");
  console.info(`Setting payouts for ${payoutData.length} recipients`);
  await strategyContract.setPayouts(payoutData);
  console.log("=======================");
  console.info(`Payouts set for ${payoutData.length} recipients`);
 } catch (error) {
  console.error(error);
 }
}

const processFile = async (filePath: string): Promise<Payout[]> => {
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
 const payouts: any[] = records
  .slice(1) // Remove the header
  .map((record) => {
   return {
    recipientId: record[0],
    amount: record[1],
   };
  });
 return payouts;
};

main();
