import * as dotenv from "dotenv";
import { Payout } from "../types";
import { calculatePayouts } from "./calculate-payouts";
import { strategyContract } from "../common/ethers-helpers";

dotenv.config();

async function setPayouts() {
  const payouts: Payout[] = await calculatePayouts();

  await strategyContract.setPayouts(payouts);

  console.log("\nPayouts set 🎉");
}

setPayouts().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
