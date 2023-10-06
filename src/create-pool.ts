import * as dotenv from "dotenv";

import {
 alloContract,
 abiEncoder,
 ContractTransaction,
} from "../common/ethers";

dotenv.config();

async function main() {
 if (process.argv.length < 10) {
  console.error("Please input at least 10 arguments");
  process.exit(1); // Exit the script with an error code
 }

 const profileId = process.argv[2];
 const strategyAddress = process.argv[3];
 const initData = abiEncoder.encode(
  ["uint64", "uint64", "uint256"],
  [process.argv[4], process.argv[5], process.argv[6]],
 );
 const tokenAddress = process.argv[7];
 const amount = process.argv[8];
 const metadata = { protocol: 1, pointer: process.argv[9] };
 const managers = process.argv.slice(9);

 try {
  const createTx: ContractTransaction =
   await alloContract.createPoolWithCustomStrategy(
    profileId,
    strategyAddress,
    initData,
    tokenAddress,
    amount,
    metadata,
    managers,
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
main();
