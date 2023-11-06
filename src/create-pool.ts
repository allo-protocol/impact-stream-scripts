import * as dotenv from "dotenv";
import { parse } from "csv";
import { finished } from "stream/promises";
import fs from "fs";

import { ContractTransaction, ethers, Contract } from "ethers";
import allo from "../abi/Allo.json";

dotenv.config();

import data from "../data/pool.data.json";

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.INFURA_RPC_URL as string,
  );

  const signer = new ethers.Wallet(
    process.env.SIGNER_PRIVATE_KEY as string,
    provider,
  );

  const alloContract: Contract = new ethers.Contract(
    process.env.ALLO_MAIN_ADDRESS as string,
    allo.abi,
    signer,
  );

  // const _currentTimestamp = (
  //   await provider.getBlock(await provider.getBlockNumber())
  // ).timestamp;
  // const startTime = _currentTimestamp + 3600; // 1 hour later   appStartTime
  // const endTime = _currentTimestamp + 864000; // 10 days later  roundEndTime

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
    ],
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
        data.poolManagers,
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
      );
    await createTx.wait();

    console.log("✅ Pool created with id: ", staticCallResult.toString());
  } catch (error) {
    console.error(error);
  }
}

main();
