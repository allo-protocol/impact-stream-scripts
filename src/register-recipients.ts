import { SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { Contract, ethers } from "ethers";
import { alloContract, strategyContract } from "../common/ethers";
import { supabaseAdmin } from "../common/supabase";
import { Recipient } from "../types";

dotenv.config();

const EMPTY_METADATA = [0, "0x000123456789"];
const EMPTY_RECIPIENT_ID = "0x0000000000000000000000000000000000000000";

async function registerRecipient() {
  const approvedProposals = await supabaseAdmin
    .from("proposals")
    .select("*")
    .eq("approved", true) // Filter for approved = true;
    .neq("allo_recipient_id", null);

  const usersWithSafe = await supabaseAdmin
    .from("users")
    .select("*")
    .neq("safe_address", null);

  let recipients: any = [];
  let recipientRegisterData: any = [];
  let poolIds: any = [];

  for (const user of usersWithSafe.data!) {
    // filter approvedProposals where user is the author
    const proposalsByUser = approvedProposals.data!.filter(
      (proposal: any) => proposal.author_id === user.id
    );

    if (proposalsByUser.length > 0) {
      console.info(`User ${user.id} has approved proposals`);

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

        console.log("onChainRecipient", onChainRecipient);

        console.log(
          "onChainRecipient.recipientStatus",
          onChainRecipient.recipientStatus
        );
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
      }

      console.log("Creating Recipients ...");
    }
  }

  await createRecipients(recipients, alloContract, supabaseAdmin);
  await registerOnchain(poolIds, recipientRegisterData, alloContract);
}

const registerOnchain = async (
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

const createRecipients = async (
  recipients: Recipient[],
  alloContract: Contract,
  supabaseClient: SupabaseClient
) => {
  for (const recipient of recipients) {
    console.info(`Creating Allo recipient for ${recipient.proposalId}...`);

    try {
      const recipientAddress = recipient.recipientAddress;
      const requestedAmount = recipient.requestedAmount;

      const recipientRegisterData = ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "uint256", "tuple(uint256, string)"],
        [EMPTY_RECIPIENT_ID, recipientAddress, requestedAmount, EMPTY_METADATA]
      );

      const staticCallResult = await alloContract.registerRecipient(
        process.env.ALLO_POOL_ID,
        recipientRegisterData
      );

      const createTx = await alloContract.registerRecipient(
        process.env.ALLO_POOL_ID,
        recipientRegisterData
      );

      await createTx.wait();

      // get recipientId after registering
      const recipientId = staticCallResult.toString();

      console.info(`Allo recipient created with id ${recipientId}`);

      try {
        // TODO: check if this is needed
        // const { error } = await supabaseClient
        //   .from("users")
        //   .update({ allo_recipient_id: recipientId })
        //   .eq("author_id", userId);

        // make sure proposal is linked to recipientId

        const { error } = await supabaseClient
          .from("proposals")
          .update({ allo_recipient_id: recipientId })
          .eq("id", recipient.proposalId);

        if (error) throw error;
      } catch (error) {
        console.error(`DB Update Failure. UserId: ${recipient.proposalId}`);
        console.error(error);
      }
    } catch (error) {
      console.info(`Register Failure: UserId: ${recipient.proposalId}`);
      console.error(error);
    }
  }
};

registerRecipient().catch((error) => {
  console.error(error);
  process.exit(1);
});
