import { ethers, strategyContractFactory } from "../common/ethers";

async function main() {
 // Wait 10 blocks for re-org protection
 const blocksToWait = 10;

 const contract = await strategyContractFactory.deploy(
  process.env.ALLO_ADDRESS as string,
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
