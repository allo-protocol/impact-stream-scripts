import { createClient } from "@supabase/supabase-js";

// Create a single supabase client with admin rights
export const supabaseAdmin = createClient(
 process.env.SUPABASE_URL as string,
 process.env.SUPABASE_SERVICE_ROLE_KEY as string,
 {
  auth: {
   persistSession: false,
  },
 },
);

export { SupabaseClient } from "@supabase/supabase-js";
