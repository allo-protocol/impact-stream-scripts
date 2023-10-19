import { Web3Storage, getFilesFromPath } from "web3.storage";

async function main() {
 if (process.argv.length < 3) {
  console.error("Please supply the path to a file or directory");
  process.exit(1);
 }
 const token = process.env.WEB3STORAGE_TOKEN as string;

 const storage = new Web3Storage({ token });
 const files = [];

 for (const path of process.argv.slice(2)) {
  const pathFiles = await getFilesFromPath(path);
  files.push(...pathFiles);
 }

 console.log(`Uploading ${files.length} files`);
 const cid = await storage.put(files);
 console.log("Content added with CID:", cid);
}

main();
