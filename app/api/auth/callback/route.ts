import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { UserRole } from "@/constants/auth";
import { callBackendLogin, callBackendRegister } from "@/lib/be-auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const role = (searchParams.get("role") as UserRole) || "umkm";
  const defaultPath = "/home";
  const next = searchParams.get("next") || defaultPath;
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

      // Tukar user.id dengan Custom JWT KUMPUL dari Backend Express (Opsi A)
      let beToken = "";
      let beEntityId = "";
      let effectiveRole = role;

      const beRes = await callBackendLogin({
        user_id: data.user.id,
      });

      if (
        !beRes.success &&
        (beRes.errorCode === "ROLE_NOT_REGISTERED" ||
          beRes.errorCode === "BUSINESS_PROFILE_INCOMPLETE" ||
          beRes.errorCode === "ENTITY_NOT_FOUND")
      ) {
        return NextResponse.redirect(`${origin}/register?step=business`);
      }

      if (beRes.success && beRes.data?.token) {
        beToken = beRes.data.token;
        beEntityId = beRes.data.entity_id;
        const beRoleType = beRes.data.active_role?.role_type;
        if (beRoleType) {
          effectiveRole = beRoleType === "SUPPLIER" ? "supplier" : "umkm";
        }
      }

      const redirectPath = "/home";
      const response = NextResponse.redirect(
        `${origin}${redirectPath}?login_success=true&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`
      );

      // Simpan kumpul_token jika BE token tersedia
      if (beToken) {
        response.cookies.set("kumpul_token", beToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });
      }

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
          token: beToken || undefined,
          entityId: beEntityId || undefined,
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
