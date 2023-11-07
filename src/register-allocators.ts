import * as dotenv from "dotenv";
import { ContractTransaction } from "ethers";
import { strategyContract } from "../common/ethers-helpers";
import { AddressList } from "../types";
import { getAllUsers } from "../common/supabase";

dotenv.config();

async function registerAllocators() {

  const users = await getAllUsers();
  const addresses: AddressList = users.data!.map(user => user.address);

  console.info(`Registering ${addresses.length} allocators...`);

  try {
    const addTx: ContractTransaction = await strategyContract.batchAddAllocator(
      addresses
    );
    const txReceipt = await addTx.wait();

    console.info(
      `${addresses.length} registered as an allocators at transaction ${txReceipt.transactionHash}`
    );
  } catch (error) {
    console.error(error);
  }
}

registerAllocators().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
