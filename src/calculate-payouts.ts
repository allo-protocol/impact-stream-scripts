import * as dotenv from "dotenv";
import { Contract } from "ethers";
import { getEthBalance, strategyContract } from "../common/ethers-helpers";
import { getApprovedProposals, getUsersWithSafe } from "../common/supabase";
import { Payout } from "../types";

dotenv.config();

async function calculatePayouts() {
  await _calculatePayouts(strategyContract);
}

const _calculatePayouts = async (strategyContract: Contract) => {
  // get total votes casted
  // get count the votes for each proposal
  // X = find out % of the votes for each proposal from total votes
  // X% of pool balance is the payout for the proposal

  // NOTE: should we check if the pool is active?
  // const isPoolActive = await strategyContract.isPoolActive();

  // if (!isPoolActive) {
  //   console.log("Not ready for payout");
  //   return;
  // }
  const poolBalance = await getEthBalance(strategyContract.address);
  console.log("poolBalance", poolBalance);

  //
  let recipients: Payout[] = [];
  let totalVotesCastedByAllocators = 0;

  const usersWithSafe = await getUsersWithSafe();
  const approvedProposals = await getApprovedProposals();

  for (const user of usersWithSafe.data!) {
    // filter approvedProposals where user is the author
    const proposalsByUser = approvedProposals.data!.filter(
      (proposal: any) => proposal.author_id === user.id
    );

    if (proposalsByUser.length > 0) {
      console.info(`User ${user.id} has approved proposals`);

      for (const proposal of proposalsByUser) {
        const onChainRecipient = await strategyContract.callStatic.getRecipient(
          proposal.allo_recipient_id
        );

        console.log("onChainRecipient", onChainRecipient);

        console.log(
          "onChainRecipient.recipientStatus",
          onChainRecipient.recipientStatus
        );

        const totalVotesReceived: number =
          await strategyContract.getTotalVotesForRecipient(
            proposal.allo_recipient_id
          );

        console.log("totalVotesReceived", totalVotesReceived.toString());

        if (onChainRecipient.recipientStatus === 2) {
          recipients.push({
            address: proposal.allo_recipient_id,
            // todo: update this to use the actual amount calculated
            amount: 0,
          });

          console.log("proposal", proposal);

          totalVotesCastedByAllocators += totalVotesReceived;
        }

        console.log("total votes cast so far", totalVotesCastedByAllocators);
      }

    }
  }

  const maxVoiceCreditsPerAllocator =
    await strategyContract.maxVoiceCreditsPerAllocator();

  console.log(
    "maxVoiceCreditsPerAllocator",
    maxVoiceCreditsPerAllocator.toString()
  );

  console.log("approvedProposals", approvedProposals.data!.length);
};

calculatePayouts().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
