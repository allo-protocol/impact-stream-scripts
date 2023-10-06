import { ethers, Contract } from "ethers";
import allo from "../abi/Allo.json";
import registry from "../abi/Registry.json";

export const provider = new ethers.providers.JsonRpcProvider(
 process.env.INFURA_RPC_URL as string,
);
export const signer = new ethers.Wallet(
 process.env.DEPLOYER_PRIVATE_KEY as string,
 provider,
);

export const registryContract = new ethers.Contract(
 process.env.REGISTRY_ADDRESS as string,
 registry.abi,
 signer,
);
export const alloContract: Contract = new ethers.Contract(
 process.env.ALLO_ADDRESS as string,
 allo.abi,
 signer,
);
export const abiEncoder = ethers.utils.defaultAbiCoder;
export { ethers, Contract, ContractTransaction } from "ethers";
