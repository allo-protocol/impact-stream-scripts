import * as dotenv from "dotenv";
import { strategyContract } from "../common/ethers";
import data from "../data/allocators.data.json";
import { AddressList } from "../types";

dotenv.config();

async function registerAllocators() {
  const addresses: AddressList = data.addresses;

  console.info(`Registering ${addresses} as allocators...`);

  try {
    const addTx = await strategyContract.batchAddAllocator(addresses);
    const txReceipt = await addTx.wait();

    console.info(
      `${addresses} registered as an allocators at transaction ${txReceipt.transactionHash}`
    );
  } catch (error) {
    console.error(error);
  }
}

registerAllocators().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
