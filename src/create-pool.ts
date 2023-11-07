import * as dotenv from "dotenv";
import { ContractTransaction, ethers } from "ethers";
import { alloContract } from "../common/ethers-helpers";
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

    // parse pool amount from ether to wei
    const poolAmount = ethers.utils.parseEther(data.poolAmount.toString());
    const staticCallResult =
      await alloContract.callStatic.createPoolWithCustomStrategy(
        data.profileId,
        data.strategyAddress,
        encodedInitData,
        data.poolToken,
        poolAmount,
        [data.metadata.protocol, data.metadata.pointer],
        data.poolManagers,
        {value: poolAmount}
      );

    const createTx: ContractTransaction =
      await alloContract.createPoolWithCustomStrategy(
        data.profileId,
        data.strategyAddress,
        encodedInitData,
        data.poolToken,
        data.poolAmount,
        [data.metadata.protocol, data.metadata.pointer],
        data.poolManagers,
        {value: poolAmount}
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
