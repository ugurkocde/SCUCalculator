import { createClient } from "@supabase/supabase-js";

import { env } from "~/env";

const getSupabaseServiceConfig = (): {
  url: string;
  serviceRoleKey: string;
} => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase service role environment is not configured.");
  }

  return {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
};

export const createSupabaseServiceRoleClient = () => {
  const { url, serviceRoleKey } = getSupabaseServiceConfig();

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};
