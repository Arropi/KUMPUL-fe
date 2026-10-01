"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { UserRole, UserSession } from "@/constants/auth";
import {
  callBackendLogin,
  callBackendRegister,
  callBackendSwitchRole,
} from "@/lib/be-auth";
import { saveAuthCookies } from "@/lib/auth-cookies";

/**
 * Server Action: Beralih Peran (Switch Role) UMKM <-> Supplier tanpa harus login kembali.
 * Worst-case provisioning: Jika akun pada peran target belum pernah terdaftar di database,
 * sistem otomatis mendaftarkan entitas baru ke backend database & menyelaraskan metadata Supabase.
 */
export async function switchRoleAction(
  targetRole: UserRole
): Promise<{
  success: boolean;
  user?: UserSession;
  redirectTo: string;
  autoCreatedInDb?: boolean;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("kumpul_session");
    let currentSession: UserSession | null = null;

    if (sessionCookie?.value) {
      try {
        currentSession = JSON.parse(sessionCookie.value) as UserSession;
      } catch {
        // Fallback jika parsing gagal
      }
    }

    // 1. Dapatkan pengguna aktif dari Supabase Auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 2. Tentukan identitas pengguna (dari Supabase Auth atau cookie sesi sebelumnya)
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

    // Tetapkan nama usaha sesuai peran target
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
    let autoCreatedInDb = false;

    // 3. Database Check & Worst-case Auto-Provisioning ke Backend Database KUMPUL
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
        autoCreatedInDb = !!switchRes.data.auto_created;
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
            autoCreatedInDb = true;
          }
        } else if (beRes.success && beRes.data?.token) {
          beToken = beRes.data.token;
          entityId = beRes.data.entity_id;
        }
      }
    } catch {
      // Backend offline atau fallback
    }

    // 4. Fallback token jika backend belum tersedia
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

    // 5. Sinkronisasi metadata peran di Supabase Auth jika sesi Supabase aktif
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
        // Abaikan jika pembaruan metadata gagal
      }
    }

    // 6. Bangun sesi pengguna dengan peran target yang baru
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

    // 7. Simpan cookie sesi terautentikasi di server
    await saveAuthCookies({
      beToken,
      session: updatedSession,
      maxAgeDays: 7,
    });

    const redirectTo = "/home";

    return {
      success: true,
      user: updatedSession,
      redirectTo,
      autoCreatedInDb,
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : "Terjadi kesalahan saat beralih peran usaha.";
    return {
      success: false,
      redirectTo: "/home",
      error: errorMsg,
    };
  }
}
