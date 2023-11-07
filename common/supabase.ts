import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  {
    auth: {
      persistSession: false,
    },
  }
);

export const getApprovedProposalsWithoutRecipientId = async () => {
  const approvedProposalsWithoutRecipientId = await supabaseAdmin
    .from("proposals")
    .select("*")
    .eq("approved", true) // Filter for approved = true;
    .is("allo_recipient_id", null);

  return approvedProposalsWithoutRecipientId;
};

export const getApprovedProposals = async () => {
  // get all the recipients fromt the database with approved proposals
  const approvedProposals = await supabaseAdmin
    .from("proposals")
    .select("*")
    .eq("approved", true) // Filter for approved = true;
    .neq("allo_recipient_id", null);

  return approvedProposals;
};

export const getUnregisteredApprovedProposals = async () => {
  // get all the recipients fromt the database with approved proposals which have not been registered
  const unregisteredApprovedProposals = await supabaseAdmin
    .from("proposals")
    .select("*")
    .eq("approved", true) // Filter for approved = true;
    .is("registered", null);

  return unregisteredApprovedProposals;
};

export const getUsersWithSafe = async () => {
  const usersWithSafe = await supabaseAdmin
    .from("users")
    .select("*")
    .neq("safe_address", null);

  return usersWithSafe;
};

export const getAllUsers = async () => {
  const allUsers = await supabaseAdmin.from("users").select("*");
  return allUsers;
}