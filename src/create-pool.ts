import * as dotenv from "dotenv";
import { ContractTransaction, ethers } from "ethers";
import { alloContract } from "../common/ethers";
import data from "../data/pool.data.json";

dotenv.config();

async function createPool() {
  const startTime = data.allocationStartTime;
  const endTime = data.allocationEndTime;

  const encodedInitData = ethers.utils.defaultAbiCoder.encode(
    ["bool", "bool", "uint64", "uint64", "uint256"],
    [
      data.useRegistry,
      data.metadataRequires,
      startTime,
      endTime,
      data.maxVoiceCredits,
    ]
  );

  try {
    console.info("Creating pool...");

    const staticCallResult =
      await alloContract.callStatic.createPoolWithCustomStrategy(
        data.profileId,
        data.strategyAddress,
        encodedInitData,
        data.poolToken,
        data.poolAmount,
        [data.metadata.protocol, data.metadata.pointer],
        data.poolManagers
      );

    const createTx: ContractTransaction =
      await alloContract.createPoolWithCustomStrategy(
        data.profileId,
        data.strategyAddress,
        encodedInitData,
        data.poolToken,
        data.poolAmount,
        [data.metadata.protocol, data.metadata.pointer],
        data.poolManagers
      );
    await createTx.wait();

    console.log("✅ Pool created with id: ", staticCallResult.toString());
  } catch (error) {
    console.error(error);
  }
}

createPool().catch((error) => {
  console.error(error);
  process.exit(1);
});
