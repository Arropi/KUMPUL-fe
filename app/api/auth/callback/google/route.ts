import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Penanganan alur simulasi pengujian lokal saat belum ada kredensial resmi
  if (searchParams.get("simulated") === "true") {
    const role = searchParams.get("role") || "umkm";
    const email = searchParams.get("email") || "user@gmail.com";
    const name = searchParams.get("name") || "Pengguna Google";

    const redirectPath = role === "supplier" ? "/supplier" : "/umkm";
    const response = NextResponse.redirect(
      `${appUrl}${redirectPath}?login_success=true&role=${encodeURIComponent(role)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`
    );

    response.cookies.set(
      "kumpul_session",
      JSON.stringify({ email, name, role, provider: "google" }),
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

  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      `${appUrl}/login?oauth_error=${encodeURIComponent("Otorisasi akun Google dibatalkan atau tidak disetujui.")}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${appUrl}/login?oauth_error=${encodeURIComponent("Kode otorisasi Google tidak ditemukan.")}`
    );
  }

  let role = "umkm";
  if (stateRaw) {
    try {
      const parsed = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf-8"));
      if (parsed.role === "supplier" || parsed.role === "umkm") {
        role = parsed.role;
      }
    } catch {
      // Fallback peran bawaan
    }
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI || `${appUrl}/api/auth/callback/google`;

    if (!clientId || !clientSecret) {
      throw new Error("Kredensial GOOGLE_CLIENT_ID atau GOOGLE_CLIENT_SECRET belum dikonfigurasi.");
    }

    // Tukar authorization code dengan access token Google
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || "Gagal memperoleh token akses dari Google.");
    }

    // Ambil data profil terverifikasi dari Google API
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileResponse.json();

    if (!profileResponse.ok || !profile.email) {
      throw new Error("Gagal mengambil data profil email dari Google.");
    }

    const email = profile.email;
    const name = profile.name || email.split("@")[0];
    const picture = profile.picture || "";

    const redirectPath = role === "supplier" ? "/supplier" : "/umkm";
    const response = NextResponse.redirect(
      `${appUrl}${redirectPath}?login_success=true&role=${encodeURIComponent(role)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`
    );

    response.cookies.set(
      "kumpul_session",
      JSON.stringify({ email, name, role, picture, provider: "google" }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      }
    );

    return response;
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Terjadi kendala saat memproses login Google OAuth.";
    return NextResponse.redirect(`${appUrl}/login?oauth_error=${encodeURIComponent(errorMsg)}`);
  }
}
