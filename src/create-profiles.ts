import { SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { ethers } from "ethers";
import { registryContract } from "../common/ethers-helpers";
import {
  getApprovedProposalsWithoutRecipientId,
  supabaseAdmin,
} from "../common/supabase";

dotenv.config();

const EMPTY_METADATA = [0, ""];

async function createProfiles() {
  const approvedProposalsWithoutRecipientId =
    await getApprovedProposalsWithoutRecipientId();

  const allUsers = await supabaseAdmin.from("users").select("*");

  let users = [];

  for (const proposal of approvedProposalsWithoutRecipientId.data!) {
    const user = allUsers.data!.find(
      (user: any) => user.id === proposal.author_id
    );

    users.push({
      nonce: ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(proposal.id + new Date())
      ),
      name: proposal.title,
      metadata: EMPTY_METADATA,
      proposalId: proposal.id,
      owner: user.address,
      members: [], // note: members are not added to the profile
      userId: user.id,
    });
  }

  console.log("Profiles to be created: ", users.length);

  await _createProfiles(users, supabaseAdmin);
}

const _createProfiles = async (
  users: any[],
  supabaseClient: SupabaseClient
) => {
  console.log("Creating Profiles ...", users.length);

  for (const user of users) {
    try {
      const { nonce, name, metadata, owner, members } = user;

      const staticCallResult = await registryContract.callStatic.createProfile(
        nonce,
        name,
        metadata,
        owner,
        members
      );

      const createTx = await registryContract.createProfile(
        nonce,
        name,
        metadata,
        owner,
        members
      );

      await createTx.wait();

      console.log("Profile:", staticCallResult.toString());

      const onchainProfileData = await registryContract.getProfileById(
        staticCallResult.toString()
      );

      try {
        const { error } = await supabaseClient
          .from("proposals")
          .update({ allo_recipient_id: onchainProfileData.anchor })
          .eq("id", user.proposalId);

        if (error) {
          console.error(`DB Update Failure. UserId: ${user.proposalId}`);
          throw error;
        }
      } catch (error) {
        console.info(`Create Failure: UserId: ${user.proposalId}`);
        console.error(error);
      }
    } catch (error) {
      console.error(error);
    }
  }
};

createProfiles().catch((error) => {
  console.error(error);
  process.exit(1);
});
