import { ethers } from "ethers";
import micrograntsStrategy from "../abi/MicroGrantsStrategy.json";

import dotenv from "dotenv";
dotenv.config();

async function main() {
  // Wait 10 blocks for re-org protection
  const blocksToWait = 2;

  const provider = new ethers.providers.JsonRpcProvider(
    "https://eth-goerli.g.alchemy.com/v2/tu9YGGbDa0Nx5UMQQXL3M7zbceDC7NZu",
  );

  const signer = new ethers.Wallet(
    process.env.SIGNER_PRIVATE_KEY as string,
    provider,
  );

  const strategyContractFactory = new ethers.ContractFactory(
    ["constructor(address,string)"],
    micrograntsStrategy.bytecode,
    signer,
  );

  const contract = await strategyContractFactory.deploy(
    process.env.ALLO_MAIN_ADDRESS as string,
    "MigroGrantsv1",
  );

  console.log(
    `Deploying MigroGrantsv1 to ${contract.address}`,
  );

  await contract.deployTransaction.wait(blocksToWait);
  console.log("✅ Deployed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
