"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { UserRole, UserSession } from "@/constants/auth";
import { callBackendLogin } from "@/lib/be-auth";
import { saveAuthCookies } from "@/lib/auth-cookies";

export interface SwitchRoleActionResult {
  success: boolean;
  requiresBusinessStep?: boolean;
  user?: UserSession;
  redirectTo: string;
  error?: string;
  autoCreatedInDb?: boolean;
}

/**
 * Server Action: Beralih Peran (Switch Role) UMKM <-> Supplier.
 * Jika peran target belum terdaftar di backend, sistem mengalihkan pengguna
 * ke business-step pengisian data resmi usaha (tidak membuat peran otomatis dengan data dummy).
 */
export async function switchRoleAction(
  targetRole: UserRole
): Promise<SwitchRoleActionResult> {
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

    // 2. Tentukan identitas pengguna
    const supabaseUserId =
      user?.id ||
      currentSession?.supabaseUserId ||
      "";

    const email =
      user?.email ||
      currentSession?.email ||
      "";

    if (!supabaseUserId) {
      return {
        success: false,
        redirectTo: "/login",
        error: "Sesi pengguna tidak valid. Silakan login kembali.",
      };
    }

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

    let beToken = "";
    let entityId = "";

    // 3. Database Check ke Backend Database KUMPUL melalui /auth/login
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
        // Alihkan ke business step dengan email & role agar pengguna mengisi data resmi
        const destination = `/register?step=business&role=${targetRole}&email=${encodeURIComponent(email)}&userId=${supabaseUserId}`;
        return {
          success: false,
          requiresBusinessStep: true,
          redirectTo: destination,
          error: `Peran ${targetRole.toUpperCase()} belum terdaftar. Silakan lengkapi profil usaha Anda terlebih dahulu.`,
        };
      } else if (beRes.success && beRes.data?.token) {
        beToken = beRes.data.token;
        entityId = beRes.data.entity_id;
      }
    } catch {
      // Backend offline atau error jaringan
      const destination = `/register?step=business&role=${targetRole}&email=${encodeURIComponent(email)}&userId=${supabaseUserId}`;
      return {
        success: false,
        requiresBusinessStep: true,
        redirectTo: destination,
        error: "Gagal memeriksa peran usaha di backend. Silakan lengkapi data profil usaha.",
      };
    }

    // Jika tidak memperoleh token backend yang valid, alihkan ke business-step
    if (!beToken || !entityId) {
      const destination = `/register?step=business&role=${targetRole}&email=${encodeURIComponent(email)}&userId=${supabaseUserId}`;
      return {
        success: false,
        requiresBusinessStep: true,
        redirectTo: destination,
        error: `Peran ${targetRole.toUpperCase()} belum terdaftar di sistem.`,
      };
    }

    // 4. Sinkronisasi metadata peran di Supabase Auth jika sesi Supabase aktif
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

    // 5. Bangun sesi pengguna dengan peran target yang baru
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

    // 6. Simpan cookie sesi terautentikasi di server
    await saveAuthCookies({
      beToken,
      session: updatedSession,
      maxAgeDays: 7,
    });

    return {
      success: true,
      user: updatedSession,
      redirectTo: "/home",
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
