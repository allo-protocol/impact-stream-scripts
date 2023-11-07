import { SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { Contract, ethers } from "ethers";
import { alloContract, strategyContract } from "../common/ethers-helpers";
import {
  getUnregisteredApprovedProposals,
  getUsersWithSafe,
  supabaseAdmin,
} from "../common/supabase";
import { Recipient } from "../types";

dotenv.config();

const EMPTY_METADATA = [0, ""];

async function registerRecipient() {
  const usersWithSafe = await getUsersWithSafe();
  const unregisteredApprovedProposals =
    await getUnregisteredApprovedProposals();

  console.log(
    "Unregistered Approved Proposals: ",
    unregisteredApprovedProposals.data!.length
  );

  let recipients: any = [];
  let recipientRegisterData: any = [];
  let poolIds: any = [];

  for (const user of usersWithSafe.data!) {
    // filter unregisteredApprovedProposals where user is the author
    const proposalsByUser = unregisteredApprovedProposals.data!.filter(
      (proposal: any) => proposal.author_id === user.id
    );

    if (proposalsByUser.length > 0) {
      for (const proposal of proposalsByUser) {
        const recipient = {
          proposalId: proposal.id,
          userId: user.id,
          recipientAddress: user.safe_address,
          requestedAmount: proposal.minimum_budget,
        };

        const onChainRecipient = await strategyContract.callStatic.getRecipient(
          proposal.allo_recipient_id
        );

        if (onChainRecipient.recipientStatus != 0) {
          console.log(
            "Skipping as Proposal already registered: ",
            proposal.id,
            "with recipientId: ",
            proposal.allo_recipient_id
          );
        }

        if (onChainRecipient.recipientStatus === 0) {
          recipientRegisterData.push(
            ethers.utils.defaultAbiCoder.encode(
              ["address", "address", "uint256", "tuple(uint256, string)"],
              [
                proposal.allo_recipient_id,
                recipient.recipientAddress,
                recipient.requestedAmount,
                EMPTY_METADATA,
              ]
            )
          );
          poolIds.push(Number(process.env.ALLO_POOL_ID));
          console.log("Recipients to be created: ", recipients.length);
        }

        recipients.push(recipient);
      }
    }
  }

  if (recipients.length === 0) return;

  if (recipientRegisterData.length > 0) {
    // Bulk Register Recipients
    await batchRegisterRecipients(poolIds, recipientRegisterData, alloContract);
  }
  await markRecipientsAsRegistered(recipients, supabaseAdmin);
}

const batchRegisterRecipients = async (
  poolIds: number[],
  recipientRegisterData: any[],
  alloContract: any
) => {
  try {
    console.log(
      "Registering Recipients onchain ...",
      poolIds,
      recipientRegisterData
    );

    const staticCallResult =
      await alloContract!.callStatic.batchRegisterRecipient(
        poolIds,
        recipientRegisterData
      );

    const createTx = await alloContract.batchRegisterRecipient(
      poolIds,
      recipientRegisterData
    );

    await createTx.wait();

    console.log("Recipients registered: ", staticCallResult);
  } catch (error) {
    console.error(error);
  }
};

const markRecipientsAsRegistered = async (
  recipients: Recipient[],
  supabaseClient: SupabaseClient
) => {
  for (const recipient of recipients) {
    try {
      // update the registered and funded flag in the database
      const { error: updateError } = await supabaseClient
        .from("proposals")
        .update({ registered: true, funded: false })
        .eq("author_id", recipient.userId)
        .neq("allo_recipient_id", null);

      if (updateError) throw updateError;
      console.log("Marked proposal", recipient.proposalId, "as registered");
    } catch (error) {
      console.error(`DB Update Failure. UserId: ${recipient.proposalId}`);
      console.error(error);
    }
  }
};

registerRecipient().catch((error) => {
  console.error(error);
  process.exit(1);
});
