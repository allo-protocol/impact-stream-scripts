import { ethers } from "ethers";
import qvstrategy from "../abi/QVImpactStreamStrategy.json";

import dotenv from "dotenv";
dotenv.config();

async function main() {
  // Wait 10 blocks for re-org protection
  const blocksToWait = 2;

  const provider = new ethers.providers.JsonRpcProvider(
    process.env.INFURA_RPC_URL as string,
  );

  const signer = new ethers.Wallet(
    process.env.SIGNER_PRIVATE_KEY as string,
    provider,
  );

  const strategyContractFactory = new ethers.ContractFactory(
    ["constructor(address,string)"],
    qvstrategy.bytecode,
    signer,
  );

  const contract = await strategyContractFactory.deploy(
    process.env.ALLO_MAIN_ADDRESS as string,
    "Impact Stream Quadratic Voting Strategy",
  );

  console.log(
    `Deploying Impact Stream Quadratic Voting Strategy to ${contract.address}`,
  );

  await contract.deployTransaction.wait(blocksToWait);
  console.log("✅ Deployed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
