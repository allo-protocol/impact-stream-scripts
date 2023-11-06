import * as dotenv from "dotenv";

dotenv.config();

async function setPayouts() {}

setPayouts().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
