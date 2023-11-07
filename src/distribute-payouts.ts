import * as dotenv from "dotenv";
import { Payout } from "../types";
import { calculatePayouts } from "./calculate-payouts";
import { alloContract } from "../common/ethers-helpers";
import { supabaseAdmin } from "../common/supabase";

dotenv.config();

async function distributeFunds() {
  const payouts: Payout[] = await calculatePayouts();
  const recipients = payouts.map((payout) => payout.recipientId);

  await alloContract.distribute(process.env.ALLO_POOL_ID, recipients, "0x");

  console.log("\nFunds distributed 🎉");

  await markRecipientsAsPaid(payouts);
}

const markRecipientsAsPaid = async (recipients: Payout[]) => {
  for (const recipient of recipients) {
    try {
      // update the registered and funded flag in the database
      const { error: updateError } = await supabaseAdmin
        .from("proposals")
        .update({ funded: true })
        .eq("allo_recipient_id", recipient.recipientId);

      if (updateError) throw updateError;
      console.log("Marked Recipient", recipient.recipientId, "as funded");
    } catch (error) {
      console.error(`DB Update Failure. UserId: ${recipient.recipientId}`);
      console.error(error);
    }
  }
};
distributeFunds().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
