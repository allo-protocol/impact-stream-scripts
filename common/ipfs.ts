import { Web3Storage } from "web3.storage";
import { RawFileData } from "../types";

export const storage = new Web3Storage({
 token: process.env.WEB3STORAGE_TOKEN as string,
});

export const createFileObject = (file: RawFileData): File => {
 const blob = new Blob([JSON.stringify(file.data)], {
  type: "application/json",
 });
 const fileObject = new File([blob], file.name);
 return fileObject;
};

export const storeFiles = async (files: File[]) => {
 const storage = new Web3Storage({
  token: process.env.WEB3STORAGE_TOKEN as string,
 });
 const cid = await storage.put(files);
 return cid;
};
