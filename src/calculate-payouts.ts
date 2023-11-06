import * as dotenv from "dotenv";
import { Contract } from "ethers";
import { strategyContract } from "../common/ethers";
import { supabaseAdmin } from "../common/supabase";

dotenv.config();

async function calculatePayouts() {
  await _calculatePayouts(strategyContract);
}

const _calculatePayouts = async (strategyContract: Contract) => {
  // get total votes casted
  // get count the votes for each proposal
  // X = find out % of the votes for each proposal from total votes
  // X% of total pot

  let totalVotesCastedByAllocators = 0;

  const maxVoiceCreditsPerAllocator =
    await strategyContract.maxVoiceCreditsPerAllocator();

  console.log(
    "maxVoiceCreditsPerAllocator",
    maxVoiceCreditsPerAllocator.toString()
  );

  const approvedProposals = await supabaseAdmin
    .from("proposals")
    .select("*")
    .eq("approved", true) // Filter for approved = true;
    .neq("allo_recipient_id", null);

  console.log("approvedProposals", approvedProposals.data!.length);
};

calculatePayouts().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
