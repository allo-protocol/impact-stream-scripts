import * as dotenv from "dotenv";
import { BigNumber, Contract } from "ethers";
import { strategyContract } from "../common/ethers-helpers";
import { getApprovedProposals } from "../common/supabase";
import { Payout } from "../types";

dotenv.config();

export async function calculatePayouts(): Promise<Payout[]> {
  return await _calculatePayouts(strategyContract);
}

const _calculatePayouts = async (
  strategyContract: Contract,
): Promise<Payout[]> => {
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
  // get poolAmount instead of balance
  const poolBalance = await strategyContract.getPoolAmount();

  // get totalAllocations
  // get allocations for each proposal
  // allocations/totalAllocations = % of poolBalance

  let recipients: Payout[] = [];
  let totalVotesCastedByAllocators = BigNumber.from(0);
  const approvedProposals = await getApprovedProposals();

  type PayoutProposal = {
    proposalId: string;
    recipientId: string;
    votes: BigNumber;
    payoutAmount: BigNumber;
  };

  const payoutProposals: PayoutProposal[] = [];

  for (const prop of approvedProposals.data!) {
    const totalVotesReceived: BigNumber =
      await strategyContract.getTotalVotesForRecipient(prop.allo_recipient_id);
    totalVotesCastedByAllocators =
      totalVotesCastedByAllocators.add(totalVotesReceived);

    if (!totalVotesReceived.eq(0))
      payoutProposals.push({
        proposalId: prop.id,
        recipientId: prop.allo_recipient_id,
        votes: BigNumber.from(totalVotesReceived),
        payoutAmount: BigNumber.from(0),
      });
  }

  for (const prop of payoutProposals) {
    const payoutAmount = prop.votes
      .mul(poolBalance)
      .div(totalVotesCastedByAllocators);
    prop.payoutAmount = payoutAmount;
    recipients.push({
      recipientId: prop.recipientId,
      amount: payoutAmount,
    });
  }
  console.log("=====================");
  for (const prop of payoutProposals) {
    console.log("ProposalId: ", prop.proposalId);
    console.log("RecipientId: ", prop.recipientId);
    console.log("Votes: ", prop.votes.toString());
    console.log("PayoutAmount: ", prop.payoutAmount.toString());
    console.log("=====================");
  }

  console.log(
    "TotalVotesCastedByAllocators: ",
    totalVotesCastedByAllocators.toString(),
  );
  console.log("PoolAmount: ", poolBalance.toString());

  return recipients;
};

if (require.main === module) {
  calculatePayouts().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
