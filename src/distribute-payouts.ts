import * as dotenv from "dotenv";
import data from "../data/distribution.data.json";
import { DistributionList } from "../types";

dotenv.config();

async function distributeFunds() {
  const distributionData: DistributionList = data.calculatedPayouts;

  await _distributeFunds(distributionData);
}

const _distributeFunds = async (distributionList: DistributionList) => {
  const poolId = process.env.ALLO_POOL_ID as string;
  for (const recipientId of distributionList) {
    console.info(
      `Running distribution for pool ${poolId} and recipient ${recipientId}...`
    );
    try {
      // const createTx = await alloContract.distribute(
      //   poolId,
      //   distributionList,
      //   ""
      // );
      // const txReceipt = await createTx.wait();

      // const logs = txReceipt?.logs.map((log: any) => {
      //   return alloContract.interface.parseLog(log);
      // });

      // const distributionLog = logs.find((log: any) => {
      //   return log.name === "Distributed";
      // });

      // const { recipientAddress, amount } = distributionLog;
      console.info(
        `Distribution completed for pool ${poolId} to ${recipientId}`
      );
    } catch (error) {
      console.error(error);
    }
  }
};

distributeFunds().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
