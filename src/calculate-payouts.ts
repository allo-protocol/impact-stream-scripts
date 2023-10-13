import * as dotenv from "dotenv";
import { parse } from "csv";
import { finished } from "stream/promises";
import fs from "fs";
import fsPromises from "fs/promises";

import { alloContract, Contract } from "../common/ethers";

import { PayoutList, Payout, AllocationEvent } from "../types";

dotenv.config();

async function main() {
 await calculatePayouts(alloContract);
}

const calculatePayouts = async (alloContract: Contract) => {
 const allocationEventSignature = "Allocated(address,uint256,address)";
 const allocationStartTime = await alloContract.allocationStartTime();
 let allocationLogFilter = alloContract.filters.Allocated(null, null, null);
 allocationLogFilter.fromBlock = allocationStartTime;
 allocationLogFilter.toBlock = "latest";
 const allocationLogs = await alloContract.queryFilter(allocationLogFilter);
 const parsedAllocationLogs = allocationLogs.map((log: any) => {
  return alloContract.interface.decodeEventLog(
   allocationEventSignature,
   log.data,
  );
 });

 let payoutList: AllocationEvent[] = [];
 for (const parsedAllocationLog of parsedAllocationLogs) {
  const { recipientId, voteResult } = parsedAllocationLog;
  const existingRecipientIdIndex = payoutList.findIndex(
   (vote: any) => vote.recipientId === recipientId,
  );
  if (existingRecipientIdIndex === -1) {
   payoutList.push({ recipientId, voteResult });
  } else {
   payoutList[existingRecipientIdIndex].voteResult += voteResult;
  }
 }
 payoutList.sort((a: any, b: any) => {
  return b.voteResult - a.voteResult;
 });
 let resultsData: any[] = [
  "\ufeff", // BOM
  "recipient_id,amount\n", // Header
 ];
 for (const payout of payoutList) {
  const { recipientId, voteResult } = payout;
  resultsData.push(`${recipientId},${voteResult}\n`);
 }
 try {
  await fsPromises.writeFile("calculated_payouts.csv", resultsData.join(""));
 } catch (error) {
  console.error(error);
 }
};
main();
