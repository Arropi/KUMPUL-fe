import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { UserRole } from "@/constants/auth";
import { printAuthLog } from "@/actions/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const role = searchParams.get("role") as UserRole | null;
  const target = role ? `${origin}/login?role=${encodeURIComponent(role)}` : `${origin}/login`;

  const supabase = await createClient();
  await supabase.auth.signOut();

  await printAuthLog({
    timestamp: new Date().toISOString(),
    action: "LOGOUT",
    provider: "credentials",
    status: "SUCCESS",
    role: role || "umkm",
    email: "session_cleared",
    redirectTo: target,
  });

  const response = NextResponse.redirect(target);
  response.cookies.delete("kumpul_token");
  response.cookies.delete("kumpul_session");
  return response;
}

export async function POST(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const role = searchParams.get("role") as UserRole | null;
  const target = role ? `${origin}/login?role=${encodeURIComponent(role)}` : `${origin}/login`;

  const supabase = await createClient();
  await supabase.auth.signOut();

  await printAuthLog({
    timestamp: new Date().toISOString(),
    action: "LOGOUT",
    provider: "credentials",
    status: "SUCCESS",
    role: role || "umkm",
    email: "session_cleared",
    redirectTo: target,
  });

  const response = NextResponse.redirect(target);
  response.cookies.delete("kumpul_token");
  response.cookies.delete("kumpul_session");
  return response;
}
