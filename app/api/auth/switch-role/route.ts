import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { UserRole, UserSession } from "@/constants/auth";
import {
  callBackendLogin,
  callBackendRegister,
  callBackendSwitchRole,
} from "@/lib/be-auth";
import { cookies } from "next/headers";

async function handleSwitchRole(request: Request, targetRole: UserRole, customRedirect?: string | null) {
  const { origin } = new URL(request.url);
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("kumpul_session");
  let currentSession: UserSession | null = null;

  if (sessionCookie?.value) {
    try {
      currentSession = JSON.parse(sessionCookie.value) as UserSession;
    } catch {
      // Abaikan jika gagal parse
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
    `usr-kumpul-${Date.now().toString(36)}`;

  const email =
    user?.email ||
    currentSession?.email ||
    (targetRole === "supplier" ? "supplier@kumpul.id" : "umkm@kumpul.id");

  const baseName =
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    currentSession?.name ||
    email.split("@")[0] ||
    "Mitra";

  let activeName: string;
  if (targetRole === "supplier") {
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

  const beRole = targetRole === "supplier" ? "SUPPLIER" : "UMKM";
  const beSector = targetRole === "supplier" ? "PERTANIAN" : "FNB_PENGOLAHAN";

  let beToken = "";
  let entityId = "";

  // 2. Worst-case auto-provision ke database backend
  try {
    const switchRes = await callBackendSwitchRole({
      user_id: supabaseUserId,
      role: beRole,
      sector_type: beSector,
      storage_capacity: targetRole === "supplier" ? 5000 : 0,
    });

    if (switchRes.success && switchRes.data?.token) {
      beToken = switchRes.data.token;
      entityId = switchRes.data.entity_id;
    } else {
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
        const regRes = await callBackendRegister({
          user_id: supabaseUserId,
          role: beRole,
          sector: beSector,
          legal_name: activeName,
          storage_capacity: targetRole === "supplier" ? 5000 : 0,
        });

        if (regRes.success && regRes.data?.token) {
          beToken = regRes.data.token;
          entityId = regRes.data.entity_id;
        }
      } else if (beRes.success && beRes.data?.token) {
        beToken = beRes.data.token;
        entityId = beRes.data.entity_id;
      }
    }
  } catch {
    // Backend offline / fallback
  }

  if (!beToken) {
    beToken = user?.id
      ? `session-${user.id}-${targetRole}`
      : `session-${supabaseUserId}-${targetRole}`;
  }
  if (!entityId) {
    entityId =
      targetRole === "supplier"
        ? `sup-ent-${supabaseUserId.slice(-6)}`
        : `umkm-ent-${supabaseUserId.slice(-6)}`;
  }

  // 3. Update Supabase metadata jika ada sesi Supabase
  if (user) {
    try {
      await supabase.auth.updateUser({
        data: {
          role: targetRole,
          active_role: targetRole,
          ...(targetRole === "supplier"
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
      // Abaikan
    }
  }

  const updatedSession: UserSession = {
    email,
    name: activeName,
    role: targetRole,
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
