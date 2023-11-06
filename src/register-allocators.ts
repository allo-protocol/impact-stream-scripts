import * as dotenv from "dotenv";
import { parse } from "csv";
import { finished } from "stream/promises";
import fs from "fs";
import fsPromises from "fs/promises";

import { abiEncoder, alloContract } from "../common/ethers";
import { AddressList, Recipient } from "../types";
import { Contract } from "ethers";

dotenv.config();

async function main() {
 if (process.argv.length < 3) {
  console.error("Please provide the CSV file path as an argument");
  process.exit(1); // Exit the script with an error code
 }
 const filePath = process.argv[2];
 const supabaseData = await processFile(filePath);

 await registerAllocators(supabaseData, alloContract);
}

const processFile = async (filePath: string): Promise<AddressList> => {
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
 const allocators: any[] = records
  .slice(1) // Remove the header
  .map((record) => {
   return record[0];
  });
 return allocators;
};

const registerAllocators = async (
 addresses: AddressList,
 alloContract: Contract,
) => {
 let resultsData: any[] = [
  "\ufeff", // BOM
  "wallet_address,allocator_registered\n", // Header
 ];
 for (const address of addresses) {
  let resultDataRow = `${address},`;
  console.log("=======================");
  console.info(`Registering ${address} as an allocator...`);

  try {
   const addTx = await alloContract.addAllocator(address);
   const txReceipt = await addTx.wait();
   resultDataRow += `true\n`;
   console.info(`${address} registered as an allocator`);
  } catch (error) {
   resultDataRow += `false\n`;
   console.error(error);
  }
  resultsData.push(resultDataRow);
 }
 try {
  await fsPromises.writeFile("allocators.csv", resultsData.join(""));
 } catch (error) {
  console.error(error);
 }
};
main();
