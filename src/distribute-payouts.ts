import * as dotenv from "dotenv";
import { parse } from "csv";
import { finished } from "stream/promises";
import fs from "fs";
import fsPromises from "fs/promises";

import { alloContract, Contract } from "../common/ethers";

import { PoolDistributionList } from "../types";

dotenv.config();

async function main() {
 if (process.argv.length < 3) {
  console.error("Please provide the CSV file path as an argument");
  process.exit(1); // Exit the script with an error code
 }
 const filePath = process.argv[2];
 const distributionData = await processFile(filePath);

 await distributeFunds(distributionData, alloContract);
}

const processFile = async (
 filePath: string,
): Promise<PoolDistributionList[]> => {
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
 const distributionList: any[] = records
  .slice(1) // Remove the header
  .map((record) => {
   return {
    poolId: record[0],
    recipientIds: record[1].split(","),
   };
  });
 return distributionList;
};

const distributeFunds = async (
 poolDistributionLists: PoolDistributionList[],
 alloContract: Contract,
) => {
 let resultsData: any[] = [
  "\ufeff", // BOM
  "pool_id,recipient_id,distribution_executed,recipient_address,amount\n", // Header
 ];
 for (const poolDistributionList of poolDistributionLists) {
  for (const recipientId of poolDistributionList.recipientIds) {
   console.log("=======================");
   console.info(
    `Running distribution for pool ${poolDistributionList.poolId} and recipient ${recipientId}...`,
   );
   let resultDataRow = `${poolDistributionList.poolId},`;
   resultDataRow += `${recipientId},`;
   try {
    const { poolId, recipientIds } = poolDistributionList;
    const createTx = await alloContract.distribute(
     poolId,
     recipientIds,
     "",
    );
    const txReceipt = await createTx.wait();
    let logs = txReceipt?.logs.map((log: any) => {
     return alloContract.interface.parseLog(log);
    });
    const distributionLog = logs.find((log: any) => {
     return log.name === "Distributed";
    });
    const { recipientAddress, amount } = distributionLog;
    resultDataRow += `true,${recipientAddress},${amount}\n`;
    console.info(
     `Distribution completed for pool ${poolId} to ${recipientId}`,
    );
   } catch (error) {
    resultDataRow += `false,,\n`;
    console.error(error);
   }
   resultsData.push(resultDataRow);
  }
 }
 try {
  await fsPromises.writeFile("distributions.csv", resultsData.join(""));
 } catch (error) {
  console.error(error);
 }
};
main();
