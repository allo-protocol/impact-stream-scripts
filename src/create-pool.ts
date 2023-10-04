import * as dotenv from "dotenv";

import { ethers } from "ethers";

dotenv.config();

async function main() {
 if (process.argv.length < 3) {
  console.error("Please provide the CSV file path as an argument");
  process.exit(1); // Exit the script with an error code
 }
 const filePath = process.argv[2];

 const provider = new ethers.providers.JsonRpcProvider(
  process.env.INFURA_RPC_URL as string,
 );
 const poolOwner = new ethers.Wallet(
  process.env.DEPLOYER_PRIVATE_KEY as string,
  provider,
 );
}
