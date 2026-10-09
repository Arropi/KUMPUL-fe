/**
 * CATATAN KEAMANAN:
 * Client-side Supabase dinonaktifkan secara penuh demi keamanan arsitektur Zero-Trust.
 * Seluruh interaksi otentikasi & database Supabase wajib dijalankan melalui Server Actions / Route Handlers
 * (menggunakan `@/lib/supabase/server`), sehingga kredensial API Supabase tidak pernah diekspos ke browser
 * melalui variabel `NEXT_PUBLIC_*`.
 */
export function createClient() {
  throw new Error(
    "Client-side Supabase is disabled for security. Gunakan Server Actions via `@/lib/supabase/server`."
  );
}
