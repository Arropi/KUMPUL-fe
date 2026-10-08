"use server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { UserRole, UserSession, AuthActionResult } from "@/constants/auth";
import {
  callBackendLogin,
  callBackendRegister,
  normalizeSectorForBE,
  BESectorType,
} from "@/lib/be-auth";
import { saveAuthCookies, clearAuthCookies } from "@/lib/auth-cookies";
import {
  switchRoleAction as executeSwitchRole,
  type SwitchRoleActionResult,
} from "./switch-role";

export async function switchRoleAction(
  targetRole: UserRole
): Promise<SwitchRoleActionResult> {
  return executeSwitchRole(targetRole);
}

// Server Action: Login dengan Email & Password (Token Exchange Opsi A)
export async function loginWithCredentialsAction(payload: {
  email: string;
  password: string;
  role?: UserRole;
  rememberMe?: boolean;
}): Promise<AuthActionResult> {
  const email = payload.email.trim();
  const password = payload.password;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Format alamat email tidak valid." };
  }
  if (!password || password.length < 6) {
    return { success: false, error: "Kata sandi minimal 6 karakter." };
  }

  const supabase = await createClient();
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !data.user?.id) {
    return {
      success: false,
      error: "Email atau kata sandi yang Anda masukkan salah. Silakan coba kembali.",
    };
  }

  const supabaseUserId = data.user.id;
  const userName =
    (data.user.user_metadata?.full_name as string) ||
    (data.user.user_metadata?.name as string) ||
    (data.user.user_metadata?.business_name as string) ||
    email.split("@")[0];

  const beRole = payload.role ? (payload.role === "supplier" ? "SUPPLIER" : "UMKM") : undefined;
  const beRes = await callBackendLogin({
    user_id: supabaseUserId,
    role: beRole,
  });

  // Jika belum REGISTERED / profil belum lengkap: alihkan ke business-step (JANGAN REDIRECT)
  if (
    !beRes.success &&
    (beRes.errorCode === "ROLE_NOT_REGISTERED" ||
      beRes.errorCode === "BUSINESS_PROFILE_INCOMPLETE")
  ) {
    return {
      success: false,
      requiresBusinessStep: true,
      errorCode: beRes.errorCode,
      userId: supabaseUserId,
      email,
      role: payload.role || "umkm",
      error: beRes.error || "Profil atau role bisnis belum lengkap.",
    };
  }

  if (!beRes.success || !beRes.data?.token) {
    return {
      success: false,
      error: beRes.error || "Gagal memperoleh token kustom dari backend KUMPUL.",
      errorCode: beRes.errorCode,
    };
  }

  const beToken = beRes.data.token;
  const entityId = beRes.data.entity_id;
  const activeRoleType = beRes.data.active_role?.role_type;
  const activeRoleId = beRes.data.active_role?.id;
  const effectiveRole: UserRole = activeRoleType === "SUPPLIER" ? "supplier" : "umkm";

  const session: UserSession = {
    email,
    name: userName,
    role: effectiveRole,
    roleId: activeRoleId,
    provider: "credentials",
    supabaseUserId,
    token: beToken,
    entityId,
  };

  const maxAgeDays = payload.rememberMe ? 30 : 7;
  await saveAuthCookies({ beToken, session, maxAgeDays });

  const redirectTo = "/home";

  return { success: true, user: session, redirectTo };
}

// Server Action: Inisiasi Registrasi Akun Baru (cek token login, jika belum REGISTERED masuk business-step)
export async function registerWithCredentialsAction(payload: {
  email: string;
  password: string;
  role?: UserRole;
}): Promise<AuthActionResult> {
  const email = payload.email.trim();
  const password = payload.password;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Alamat email operasional belum valid." };
  }
  if (!password || password.length < 6) {
    return { success: false, error: "Kata sandi minimal 6 karakter." };
  }

  const supabase = await createClient();
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  const isDuplicateEmail =
    (signUpError &&
      (signUpError.message.toLowerCase().includes("already registered") ||
        signUpError.message.toLowerCase().includes("already in use") ||
        signUpError.message.toLowerCase().includes("already exists"))) ||
    (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0);

  if (isDuplicateEmail || signUpError || !data.user?.id) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Abaikan
    }
    return {
      success: false,
      error: isDuplicateEmail
        ? "Alamat email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda."
        : signUpError?.message || "Gagal membuat akun di Supabase Auth.",
    };
  }

  const supabaseUserId = data.user.id;
  const beRole = payload.role ? (payload.role === "supplier" ? "SUPPLIER" : "UMKM") : undefined;

  // Cek login route backend untuk cek token (jika belum REGISTERED, masuk business-step)
  const beLoginRes = await callBackendLogin({
    user_id: supabaseUserId,
    role: beRole,
  });

  // Jika akun sudah memiliki role lengkap dan mengembalikan token:
  if (beLoginRes.success && beLoginRes.data?.token) {
    const beToken = beLoginRes.data.token;
    const entityId = beLoginRes.data.entity_id;
    const activeRoleType = beLoginRes.data.active_role?.role_type;
    const activeRoleId = beLoginRes.data.active_role?.id;
    const effectiveRole: UserRole = activeRoleType === "SUPPLIER" ? "supplier" : "umkm";
    const session: UserSession = {
      email,
      name: email.split("@")[0],
      role: effectiveRole,
      roleId: activeRoleId,
      provider: "credentials",
      supabaseUserId,
      token: beToken,
      entityId,
    };
    await saveAuthCookies({ beToken, session, maxAgeDays: 7 });
    return {
      success: true,
      user: session,
      redirectTo: "/home",
    };
  }

  // Jika belum REGISTERED atau profil belum lengkap: masuk ke business-step
  return {
    success: false,
    requiresBusinessStep: true,
    errorCode: beLoginRes.errorCode || "ROLE_NOT_REGISTERED",
    userId: supabaseUserId,
    email,
    role: payload.role || "umkm",
  };
}

// Server Action: Penyelesaian Data Usaha (POST /api/auth/register-complete)
export async function completeBusinessRegistrationAction(payload: {
  userId: string;
  email?: string;
  legalName: string;
  npwpNib: string;
  defaultAddress: string;
  latitude: number | string;
  longitude: number | string;
  role: UserRole;
  sectorType?: string;
  storageCapacity?: number;
}): Promise<AuthActionResult> {
  const {
    userId,
    email = "",
    legalName,
    npwpNib,
    defaultAddress,
    latitude,
    longitude,
    role,
    sectorType,
    storageCapacity = 0,
  } = payload;

  let targetUserId = userId;
  let targetEmail = email;

  if (!targetUserId || !targetEmail) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        if (!targetUserId && data.user.id) targetUserId = data.user.id;
        if (!targetEmail && data.user.email) targetEmail = data.user.email;
      }
    } catch {
      // Abaikan jika auth client gagal
    }
  }

  if (!targetUserId) {
    return { success: false, error: "Identitas pengguna (user_id) tidak valid. Silakan login atau daftar ulang." };
  }
  if (!legalName || legalName.trim().length < 2) {
    return { success: false, error: "Nama legal usaha minimal 2 karakter." };
  }
  if (!npwpNib || npwpNib.trim().length < 5) {
    return { success: false, error: "Nomor NPWP/NIB minimal 5 karakter." };
  }
  if (!defaultAddress || defaultAddress.trim().length < 3) {
    return { success: false, error: "Alamat operasional lengkap wajib diisi." };
  }

  const latNum = typeof latitude === "number" ? latitude : parseFloat(latitude);
  const lngNum = typeof longitude === "number" ? longitude : parseFloat(longitude);
  if (isNaN(latNum) || isNaN(lngNum) || (latNum === 0 && lngNum === 0)) {
    return {
      success: false,
      error: "Pilih titik lokasi valid pada peta (koordinat tidak boleh 0, 0).",
    };
  }

  const beRole = role === "supplier" ? "SUPPLIER" : "UMKM";
  const beSector = normalizeSectorForBE(sectorType) as BESectorType;

  const completeRes = await callBackendRegister({
    user_id: targetUserId,
    legal_name: legalName.trim(),
    npwp_nib: npwpNib.trim(),
    default_address: defaultAddress.trim(),
    latitude: latNum,
    longitude: lngNum,
    role: beRole,
    sector: beSector,
    storage_capacity: Number(storageCapacity) || 0,
  });

  if (!completeRes.success || !completeRes.data) {
    return {
      success: false,
      error: completeRes.error || "Gagal melengkapi data profil usaha di backend KUMPUL.",
      errorCode: completeRes.errorCode,
    };
  }

  let beToken = completeRes.data.token;
  const entityId = completeRes.data.entity_id;

  if (!beToken) {
    const loginAfter = await callBackendLogin({ user_id: targetUserId, role: beRole });
    if (loginAfter.success && loginAfter.data?.token) {
      beToken = loginAfter.data.token;
    }
  }

  if (!beToken) {
    return {
      success: false,
      error: "Profil usaha berhasil disimpan, namun gagal menerbitkan token akses sesi.",
    };
  }

  // Dapatkan active role ID dari respons registrasi atau login
  let activeRoleId: string | undefined =
    completeRes.data.active_role?.id || completeRes.data.business_role?.id;
  if (!activeRoleId) {
    const loginAfter = await callBackendLogin({ user_id: targetUserId, role: beRole });
    if (loginAfter.success && loginAfter.data?.active_role?.id) {
      activeRoleId = loginAfter.data.active_role.id;
    }
  }

  // 5. Bangun sesi pengguna
  const session: UserSession = {
    email: targetEmail,
    name: legalName.trim(),
    role,
    roleId: activeRoleId,
    provider: "credentials",
    supabaseUserId: targetUserId,
    token: beToken,
    entityId,
  };

  await saveAuthCookies({ beToken, session, maxAgeDays: 7 });

  const redirectTo = "/home";

  return { success: true, user: session, redirectTo };
}

/**
 * Server Action: Inisiasi Google OAuth dari sisi server
 */
export async function initiateGoogleAuthAction(payload?: {
  role?: UserRole;
  origin?: string;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const headerList = await headers();
    const host = headerList.get("host") || "localhost:3000";
    const proto = headerList.get("x-forwarded-proto") || "http";
    const appOrigin = payload?.origin || `${proto}://${host}`;
    const redirectTo = payload?.role
      ? `${appOrigin}/api/auth/callback?role=${payload.role}`
      : `${appOrigin}/api/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, url: data.url };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menginisiasi OAuth dari server.",
    };
  }
}

/**
 * Server Action: Keluar Akun (Logout)
 */
export async function logoutAction(
  role?: UserRole
): Promise<{ success: boolean; redirectTo: string }> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Abaikan jika tidak ada sesi Supabase aktif
  }

  await clearAuthCookies();
  const redirectTo = role ? `/login?role=${encodeURIComponent(role)}` : "/login";
  return { success: true, redirectTo };
}


