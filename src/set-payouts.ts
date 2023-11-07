import * as dotenv from "dotenv";
import { readFileSync, writeFileSync } from "fs";
import { Payout } from "../types";

dotenv.config();

async function setPayouts() {
  console.info(`Setting payouts...`);

  // get the addresses to set payouts for
  const payouts: Payout[] = [];

  // NOTE: test data - replace me!
  payouts.push({
    address: "0x0000789450270389",
    amount: 100,
  });
  payouts.push({
    address: "0x0000789450270389",
    amount: 200,
  });
  payouts.push({
    address: "0x0000789450270389",
    amount: 300,
  });

  _setPayouts(payouts);
}

async function _setPayouts(payouts: Payout[]) {
  try {
    // clear existing payout data
    clearPayoutData("./data/distribution.data.json");

    // set payout for each address in the `distribution.data.json` file
    for (const payout of payouts) {
      appendToCalculatedPayouts("./data/distribution.data.json", payout);
    }

    // set payout
    // const setPayoutTx = await alloContract.setPayouts(payouts);
    // const txReceipt = await setPayoutTx.wait();

    // console.info(`Payouts set at transaction ${txReceipt.transactionHash}`);
  } catch (error) {
    console.error(error);
  }
}

function clearPayoutData(filePath: string): void {
  const fileContent = readFileSync(filePath, "utf8");
  const jsonContent = JSON.parse(fileContent);

  jsonContent.calculatedPayouts = [];
  const newFileContent = JSON.stringify(jsonContent, null, 4);

  writeFileSync(filePath, newFileContent, "utf8");
}

function appendToCalculatedPayouts(
  filePath: string,
  newPayout: { address: string; amount: number }
): void {
  const fileContent = readFileSync(filePath, "utf8");
  const jsonContent = JSON.parse(fileContent);

  jsonContent.calculatedPayouts.push(newPayout);
  const newFileContent = JSON.stringify(jsonContent, null, 4);

  writeFileSync(filePath, newFileContent, "utf8");
}

setPayouts().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
