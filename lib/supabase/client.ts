import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const rawUrl =
    process.env.SUPABASE_URL || "https://zsjngncoabcormesxrtj.supabase.co";
  // Menghilangkan trailing /rest/v1/ jika ada pada file env
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
