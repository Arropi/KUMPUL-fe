import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { UserRole } from "@/constants/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const role = (searchParams.get("role") as UserRole) || "umkm";
  const next = searchParams.get("next") || "/home";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Jika otorisasi dibatalkan atau ditolak dari pihak Google
  if (error) {
    const message = errorDescription || error || "Otorisasi dibatalkan.";
    return NextResponse.redirect(`${origin}/login?oauth_error=${encodeURIComponent(message)}`);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && data.user) {
      const email = data.user.email || "";
      const name =
        (data.user.user_metadata?.full_name as string) ||
        (data.user.user_metadata?.name as string) ||
        email.split("@")[0] ||
        "Pengguna";
      const picture =
        (data.user.user_metadata?.avatar_url as string) ||
        (data.user.user_metadata?.picture as string) ||
        "";

      // Simpan peran aktif ke user_metadata Supabase jika belum terekam
      await supabase.auth.updateUser({
        data: { role },
      });

      const response = NextResponse.redirect(
        `${origin}${next}?login_success=true&role=${encodeURIComponent(role)}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`
      );

      // Simpan kumpul_session cookie untuk kompatibilitas penuh antar modul
      response.cookies.set(
        "kumpul_session",
        JSON.stringify({
          email,
          name,
          role,
          picture,
          provider: "google",
          supabaseUserId: data.user.id,
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        }
      );

      return response;
    }

    if (exchangeError) {
      return NextResponse.redirect(
        `${origin}/login?oauth_error=${encodeURIComponent(exchangeError.message)}`
      );
    }
  }

  return NextResponse.redirect(
    `${origin}/login?oauth_error=${encodeURIComponent("Kode otorisasi Supabase tidak ditemukan.")}`
  );
}
