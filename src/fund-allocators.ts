import * as dotenv from "dotenv";
import { ethers } from "ethers";
import data from "../common/data.json";
import { signer } from "../common/ethers-helpers";
import { getAllUsers } from "../common/supabase";

dotenv.config();

const amountToSend = data.amountToSendAllocators || "0.00000000000001";

async function fundAllocators() {
  console.log("Funding allocators");

  const users = await getAllUsers();

  for (const user of users.data!) {
    console.log(`Funding ${user.address}`);

    // fund each user... with .005 Celo
    await signer.sendTransaction({
      to: user.address,
      value: ethers.utils.parseEther(amountToSend.toString()),
    });
  }
}

fundAllocators().catch((e) => {
  console.error(e);
  process.exit(1);
});
