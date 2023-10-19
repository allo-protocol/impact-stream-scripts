import { ethers, Contract } from "ethers";
import allo from "../abi/Allo.json";
import registry from "../abi/Registry.json";
import qvstrategy from "../abi/QVImpactStreamStrategy.json";

export const provider = new ethers.providers.JsonRpcProvider(
 process.env.INFURA_RPC_URL as string,
);

export const signer = new ethers.Wallet(
 process.env.SIGNER_PRIVATE_KEY as string,
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

export const strategyContractFactory = new ethers.ContractFactory(
 ["constructor(address,string)"],
 qvstrategy.bytecode.object,
 signer,
);

export const strategyContract = new ethers.Contract(
 process.env.STRATEGY_ADDRESS as string,
 qvstrategy.abi,
 signer,
);

export const abiEncoder = ethers.utils.defaultAbiCoder;
export { ethers, Contract, ContractTransaction } from "ethers";
