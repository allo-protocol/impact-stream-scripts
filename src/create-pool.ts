import * as dotenv from "dotenv";
import { parse } from "csv";
import { finished } from "stream/promises";
import fs from "fs";

import { PoolDeployment } from "../types";
import {
 alloContract,
 abiEncoder,
 ethers,
 ContractTransaction,
} from "../common/ethers";

dotenv.config();

async function main() {
 if (process.argv.length < 2) {
  console.error("Please provide the CSV file path as an argument");
  process.exit(1); // Exit the script with an error code
 }
 const filePath = process.argv[2];
 const deploymentData = await processFile(filePath);
 console.log(deploymentData);
 const {
  profileId,
  strategyAddress,
  initData,
  tokenAddress,
  amount,
  metadata,
  managers,
 } = deploymentData[0];

 try {
  console.info("Creating pool...");
  const createTx: ContractTransaction =
   await alloContract.createPoolWithCustomStrategy(
    profileId,
    strategyAddress,
    initData,
    tokenAddress,
    amount,
    metadata,
    managers,
    {
     gasLimit: 10000000,
    },
   );
  const txReceipt = await createTx.wait();
  let logs = txReceipt?.logs.map((log: any) => {
   return alloContract.interface.parseLog(log);
  });
  const poolLog = logs.find((log: any) => {
   return log.name === "PoolCreated";
  });
  const { poolId } = poolLog.args;
  console.info(`Created pool with ID ${poolId}`);
 } catch (error) {
  console.error(error);
 }
}
const processFile = async (filePath: string): Promise<PoolDeployment[]> => {
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
 const deploymentObjects: any[] = records.map((record) => {
  return {
   profileId: record[0],
   strategyAddress: record[1],
   initData: abiEncoder.encode(
    ["tuple(uint64, uint64, uint256)"],
    [[record[2], record[3], record[4]]],
   ),
   tokenAddress: record[5],
   amount: record[6],
   metadata: { protocol: 1, pointer: record[7] },
   managers: record[8].split(","),
  };
 });
 return deploymentObjects;
};
main();
