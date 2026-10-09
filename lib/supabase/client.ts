import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const rawUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://zsjngncoabcormesxrtj.supabase.co";
  // Menghilangkan trailing /rest/v1/ jika ada pada file env
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpzam5nbmNvYWJjb3JtZXN4cnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0OTEzOTQsImV4cCI6MjEwNjA2NzM5NH0.Lfn0pIO0pJTmXo7kuN321NFmG2PFtnt8nUw-_FSVN2U";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
