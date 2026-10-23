import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

let clientInstance: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = "https://zsjngncoabcormesxrtj.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpzam5nbmNvYWJjb3JtZXN4cnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0OTEzOTQsImV4cCI6MjEwNjA2NzM5NH0.Lfn0pIO0pJTmXo7kuN321NFmG2PFtnt8nUw-_FSVN2U";

/**
 * Browser-Safe Supabase Realtime Client
 * Digunakan khusus untuk langganan WebSocket Realtime (Postgres Changes / Broadcast)
 * pada 4 modul utama:
 * 1. Marketplace (Live ketersediaan & perubahan stok komoditas)
 * 2. MOQ (Live progress bar akumulasi kuota patungan & status locked)
 * 3. Alert (Live notifikasi darurat kitchen runout & status transaksi)
 * 4. Dashboard (Live sinkronisasi metrik operasional UMKM & Supplier)
 */
export function createClient(): SupabaseClient {
  const rawUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;

  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_ANON_KEY;

  if (typeof window === "undefined") {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey);
  }

  if (!clientInstance) {
    clientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return clientInstance;
}
