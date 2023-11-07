import dotenv from "dotenv";
import { Contract, ethers } from "ethers";
import allo from "../abi/Allo.json";
import qvstrategy from "../abi/QVImpactStreamStrategy.json";
import registry from "../abi/Registry.json";

dotenv.config();

export const provider = new ethers.providers.JsonRpcProvider(
  process.env.INFURA_RPC_URL as string
);

export const signer = new ethers.Wallet(
  process.env.SIGNER_PRIVATE_KEY as string,
  provider
);

export const registryContract = new ethers.Contract(
  process.env.ALLO_REGISTRY_ADDRESS as string,
  registry.abi,
  signer
);

export const alloContract: Contract = new ethers.Contract(
  process.env.ALLO_MAIN_ADDRESS as string,
  allo.abi,
  signer
);

export const strategyContractFactory = new ethers.ContractFactory(
  ["constructor(address,string)"],
  qvstrategy.bytecode,
  signer
);

export const strategyContract = new ethers.Contract(
  process.env.ALLO_STRATEGY_ADDRESS as string,
  qvstrategy.abi,
  signer
);

export const abiEncoder = ethers.utils.defaultAbiCoder;

// Async function to get the balance
export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string
) {
  const tokenAbi = ["function balanceOf(address owner) view returns (uint256)"];
  const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
  const balance = await tokenContract.balanceOf(walletAddress);

  console.log(`Balance of wallet ${walletAddress} is:`, balance.toString());

  return balance;
}

export async function getEthBalance(address: string): Promise<string> {
  const balanceBigInt = await provider.getBalance(address);
  const balanceInEth = ethers.utils.formatEther(balanceBigInt);

  return balanceInEth;
}
