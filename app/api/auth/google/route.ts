import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") || "umkm";

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback/google`;

  // Simulasi alur OAuth lokal jika kredensial Google belum diisi pada .env.local
  if (!clientId || clientId.includes("your-google-client-id")) {
    const mockEmail = role === "umkm" ? "mitra.umkm@gmail.com" : "pemasok.agro@gmail.com";
    const mockName = role === "umkm" ? "Budi Santoso (UMKM)" : "Hendra Kusuma (Supplier)";
    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set("simulated", "true");
    callbackUrl.searchParams.set("role", role);
    callbackUrl.searchParams.set("email", mockEmail);
    callbackUrl.searchParams.set("name", mockName);
    return NextResponse.redirect(callbackUrl.toString());
  }

  const statePayload = Buffer.from(
    JSON.stringify({
      role,
      csrf: crypto.randomUUID(),
      timestamp: Date.now(),
    })
  ).toString("base64url");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("state", statePayload);
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(googleAuthUrl.toString());
}
