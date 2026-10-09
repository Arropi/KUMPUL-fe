import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { UserRole, UserSession } from "@/constants/auth";
import { callBackendLogin } from "@/lib/be-auth";
import { cookies } from "next/headers";
import { getRequestOrigin } from "@/lib/url-helper";

async function handleSwitchRole(
  request: Request,
  targetRole: UserRole,
  customRedirect?: string | null
) {
  const origin = getRequestOrigin(request);
  const normalizedRole: UserRole = targetRole === "supplier" ? "supplier" : "umkm";

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("kumpul_session");
  let currentSession: UserSession | null = null;

  if (sessionCookie?.value) {
    try {
      currentSession = JSON.parse(sessionCookie.value) as UserSession;
    } catch {
      // Abaikan jika parsing gagal
    }
  }

  // 1. Supabase Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const supabaseUserId =
    user?.id ||
    currentSession?.supabaseUserId ||
    "";

  const email =
    user?.email ||
    currentSession?.email ||
    "";

  if (!supabaseUserId) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const baseName =
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    currentSession?.name ||
    (email ? email.split("@")[0] : "") ||
    "Mitra";

  let activeName: string;
  if (normalizedRole === "supplier") {
    activeName =
      (user?.user_metadata?.supplier_business_name as string) ||
      (currentSession?.role === "supplier"
        ? currentSession.name
        : user?.user_metadata?.business_name && !user.user_metadata.business_name.startsWith("Warung")
          ? user.user_metadata.business_name
          : `PT ${baseName} Nusantara`);
  } else {
    activeName =
      (user?.user_metadata?.umkm_business_name as string) ||
      (currentSession?.role === "umkm"
        ? currentSession.name
        : user?.user_metadata?.business_name && !user.user_metadata.business_name.startsWith("PT")
          ? user.user_metadata.business_name
          : `Warung Makan ${baseName}`);
  }

  const beRole = normalizedRole === "supplier" ? "SUPPLIER" : "UMKM";
  let beToken = "";
  let entityId = "";

  // 2. Verifikasi ketersediaan peran di Backend (tanpa auto-provision dummy)
  try {
    const beRes = await callBackendLogin({
      user_id: supabaseUserId,
      role: beRole,
    });

    if (
      !beRes.success &&
      (beRes.errorCode === "ENTITY_NOT_FOUND" ||
        beRes.errorCode === "ROLE_NOT_REGISTERED" ||
        !beRes.data?.token)
    ) {
      // Peran belum terdaftar di database backend: alihkan ke step business agar pengguna mengisi data resmi
      const businessUrl = `${origin}/register?step=business&role=${normalizedRole}&email=${encodeURIComponent(email)}&userId=${supabaseUserId}`;
      return NextResponse.redirect(businessUrl);
    } else if (beRes.success && beRes.data?.token) {
      beToken = beRes.data.token;
      entityId = beRes.data.entity_id;
      if (beRes.data.business_entity?.legal_name) {
        activeName = beRes.data.business_entity.legal_name as string;
      }
    }
  } catch {
    // Backend offline / error koneksi: alihkan ke formulir pendaftaran peran usaha
    const businessUrl = `${origin}/register?step=business&role=${normalizedRole}&email=${encodeURIComponent(email)}&userId=${supabaseUserId}`;
    return NextResponse.redirect(businessUrl);
  }

  // Jika tidak memperoleh token backend yang valid, alihkan ke business-step
  if (!beToken || !entityId) {
    const businessUrl = `${origin}/register?step=business&role=${normalizedRole}&email=${encodeURIComponent(email)}&userId=${supabaseUserId}`;
    return NextResponse.redirect(businessUrl);
  }

  // 3. Sinkronisasi metadata di Supabase Auth
  if (user) {
    try {
      await supabase.auth.updateUser({
        data: {
          role: normalizedRole,
          active_role: normalizedRole,
          ...(normalizedRole === "supplier"
            ? {
                has_supplier_profile: true,
                supplier_entity_id: entityId,
                supplier_business_name: activeName,
              }
            : {
                has_umkm_profile: true,
                umkm_entity_id: entityId,
                umkm_business_name: activeName,
              }),
        },
      });
    } catch {
      // Abaikan jika update metadata gagal
    }
  }

  // 4. Perbarui sesi pengguna
  const updatedSession: UserSession = {
    email,
    name: activeName,
    role: normalizedRole,
    picture:
      (user?.user_metadata?.avatar_url as string) ||
      (user?.user_metadata?.picture as string) ||
      currentSession?.picture ||
      "",
    provider: currentSession?.provider || (user ? "google" : "credentials"),
    supabaseUserId,
    token: beToken,
    entityId,
  };

  const defaultDestination = "/home";
  const destination = customRedirect || defaultDestination;
  const redirectUrl = destination.startsWith("http") ? destination : `${origin}${destination}`;

  const response = NextResponse.redirect(redirectUrl);
  const maxAge = 60 * 60 * 24 * 7;

  response.cookies.set("kumpul_token", beToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  response.cookies.set("kumpul_session", JSON.stringify(updatedSession), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  return response;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const to = (searchParams.get("to") as UserRole) || "umkm";
  const next = searchParams.get("next");
  return handleSwitchRole(request, to, next);
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  let targetRole: UserRole = "umkm";
  let next: string | null = searchParams.get("next");

  try {
    const body = await request.json();
    if (body.role === "supplier" || body.role === "umkm") {
      targetRole = body.role;
    }
    if (body.next) {
      next = body.next;
    }
  } catch {
    targetRole = (searchParams.get("to") as UserRole) || "umkm";
  }

  return handleSwitchRole(request, targetRole, next);
}
