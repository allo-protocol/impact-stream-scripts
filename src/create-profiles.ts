import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

import { Contract, ethers } from "ethers";
import registry from "../abi/Registry.json";

dotenv.config();

const EMPTY_METADATA = [0, ""];

async function main() {
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    {
      auth: {
        persistSession: false,
      },
    }
  );

  const approvedProposalsWithoutRecipientId = await supabaseAdmin
    .from("proposals")
    .select("*")
    .eq("approved", true) // Filter for approved = true;
    .is("allo_recipient_id", null);

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

  await createProfiles(users, supabaseAdmin);
}

const createProfiles = async (users: any[], supabaseClient: SupabaseClient) => {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.INFURA_RPC_URL as string
  );

  const signer = new ethers.Wallet(
    process.env.SIGNER_PRIVATE_KEY as string,
    provider
  );

  const registryContract: Contract = new ethers.Contract(
    process.env.ALLO_REGISTRY_ADDRESS as string,
    registry.abi,
    signer
  );

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
main();
