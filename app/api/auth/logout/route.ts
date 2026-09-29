import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const role = searchParams.get("role");
  const target = role ? `${origin}/login?role=${encodeURIComponent(role)}` : `${origin}/login`;

  const supabase = await createClient();
  await supabase.auth.signOut();

  const response = NextResponse.redirect(target);
  response.cookies.delete("kumpul_session");
  return response;
}

export async function POST(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const role = searchParams.get("role");
  const target = role ? `${origin}/login?role=${encodeURIComponent(role)}` : `${origin}/login`;

  const supabase = await createClient();
  await supabase.auth.signOut();

  const response = NextResponse.redirect(target);
  response.cookies.delete("kumpul_session");
  return response;
}
