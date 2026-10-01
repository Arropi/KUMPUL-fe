"use server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  UserRole,
  UserSession,
  AuthLogEvent,
  AuthActionResult,
} from "@/constants/auth";
import {
  callBackendLogin,
  callBackendRegister,
  normalizeSectorForBE,
} from "@/lib/be-auth";
import { saveAuthCookies, clearAuthCookies } from "@/lib/auth-cookies";



/**
 * Server Action: Login dengan Email & Password (Opsi A: Token Exchange)
 * FE signIn Supabase -> Supabase issue user.id -> BE issue Custom JWT KUMPUL
 */
export async function loginWithCredentialsAction(payload: {
  email: string;
  password: string;
  role: UserRole;
  rememberMe?: boolean;
}): Promise<AuthActionResult> {
  const email = payload.email.trim();
  const password = payload.password;
  const role = payload.role;

  // 1. Validasi format input di server. Jika gagal, JANGAN DI-REDIRECT
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const errorMsg = "Format alamat email tidak valid.";
    return { success: false, error: errorMsg, };
  }

  if (!password || password.length < 6) {
    const errorMsg = "Kata sandi minimal 6 karakter.";
    return { success: false, error: errorMsg};
  }

  // 2. Autentikasi identitas dengan Supabase Auth
  const supabase = await createClient();
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Jika kredensial salah, JANGAN DI-REDIRECT
  if (signInError || !data.user?.id) {
    const errorMsg = "Email atau kata sandi yang Anda masukkan salah. Silakan coba kembali.";
    return { success: false, error: errorMsg };
  }

  const supabaseUserId = data.user.id;
  const userName =
    (data.user.user_metadata?.full_name as string) ||
    (data.user.user_metadata?.name as string) ||
    (data.user.user_metadata?.business_name as string) ||
    email.split("@")[0];

  // 3. Token Exchange ke Backend Express KUMPUL (Opsi A)
  const beRole = role === "supplier" ? "SUPPLIER" : "UMKM";
  let beRes = await callBackendLogin({
    user_id: supabaseUserId,
    role: beRole,
  });

  // Auto-registrasi jika role belum pernah terdaftar di database backend
  if (
    !beRes.success &&
    (beRes.errorCode === "ENTITY_NOT_FOUND" || beRes.errorCode === "ROLE_NOT_REGISTERED")
  ) {
    const regRes = await callBackendRegister({
      user_id: supabaseUserId,
      role: beRole,
    });
    if (regRes.success && regRes.data?.token) {
      beRes = {
        success: true,
        data: {
          token: regRes.data.token,
          user_id: regRes.data.user_id,
          entity_id: regRes.data.entity_id,
          active_role: { role_type: regRes.data.role },
        },
      };
    }
  }

  // Jika backend gagal menerbitkan token, JANGAN DI-REDIRECT
  if (!beRes.success || !beRes.data?.token) {
    const errorMsg = beRes.error || "Gagal memperoleh token kustom dari backend KUMPUL.";
    return { success: false, error: errorMsg };
  }

  const beToken = beRes.data.token;
  const entityId = beRes.data.entity_id;

  // 4. Bangun sesi pengguna dengan Custom JWT KUMPUL
  const session: UserSession = {
    email,
    name: userName,
    role,
    provider: "credentials",
    supabaseUserId,
    token: beToken,
    entityId,
  };

  // 5. Simpan HANYA token dari backend KUMPUL di HTTP-Only cookie server
  const maxAgeDays = payload.rememberMe ? 30 : 7;
  await saveAuthCookies({ beToken, session, maxAgeDays });

  const redirectTo = role === "supplier" ? "/supplier" : "/home";


  return { success: true, user: session, redirectTo };
}

/**
 * Server Action: Registrasi Akun Baru
 * Verifikasi Supabase -> JIKA EMAIL SUDAH ADA JANGAN REDIRECT -> Hit BE /api/auth/register -> Simpan BE Token
 */
export async function registerWithCredentialsAction(payload: {
  role: UserRole;
  email: string;
  password: string;
  businessName: string;
  sector?: string;
  storageCapacity?: number;
  taxId?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}): Promise<AuthActionResult> {
  const email = payload.email.trim();
  const password = payload.password;
  const role = payload.role;
  const businessName = payload.businessName.trim();

  // 1. Validasi input form di sisi server
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const errorMsg = "Alamat email operasional belum valid.";
    return { success: false, error: errorMsg};
  }

  if (!businessName) {
    const errorMsg = "Nama usaha atau perusahaan wajib diisi.";
    return { success: false, error: errorMsg};
  }

  if (!password || password.length < 6) {
    const errorMsg = "Kata sandi minimal 6 karakter.";
    return { success: false, error: errorMsg };
  }

  // 2. Hubungkan ke Supabase Auth untuk inisiasi akun baru
  const supabase = await createClient();
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        business_name: businessName,
        full_name: businessName,
        name: businessName,
        tax_id: payload.taxId || "",
        address: payload.address || "",
        latitude: payload.latitude,
        longitude: payload.longitude,
        location_name: payload.locationName || "",
        profile_completed: false,
      },
    },
  });

  // 3. JIKA EMAIL SUDAH ADA / SIGNUP GAGAL -> BERSIHKAN SESI & JANGAN DI-REDIRECT
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

    const errorMsg = isDuplicateEmail
      ? "Alamat email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda."
      : signUpError?.message || "Gagal membuat akun di Supabase Auth.";

    return { success: false, error: errorMsg };
  }

  const supabaseUserId = data.user.id;

  // 4. Hit endpoint Backend Express KUMPUL: POST /api/auth/register
  const beRole = role === "supplier" ? "SUPPLIER" : "UMKM";
  const beSector = normalizeSectorForBE(payload.sector);

  const beRes = await callBackendRegister({
    user_id: supabaseUserId,
    role: beRole,
    sector_type: beSector,
    storage_capacity: payload.storageCapacity ?? 0,
  });

  if (!beRes.success || !beRes.data?.token) {
    const errorMsg = beRes.error || "Gagal mendaftarkan role entitas usaha di backend KUMPUL.";
    return { success: false, error: errorMsg };
  }

  // 5. Ambil token kustom dari respon /api/auth/register Backend
  const beToken = beRes.data.token;
  const entityId = beRes.data.entity_id;

  const session: UserSession = {
    email,
    name: businessName,
    role,
    provider: "credentials",
    supabaseUserId,
    token: beToken,
    entityId,
  };

  // 6. Simpan token dari /register BE saja ke dalam cookie HTTP-Only server-side
  await saveAuthCookies({ beToken, session, maxAgeDays: 7 });

  const redirectTo =
    role === "supplier" ? "/supplier?onboarding=pending" : "/home?onboarding=pending";

  return { success: true, user: session, redirectTo };
}

/**
 * Server Action: Inisiasi Google OAuth dari sisi server
 */
export async function initiateGoogleAuthAction(payload: {
  role: UserRole;
  origin?: string;
}): Promise<{ success: boolean; url?: string; error?: string; log?: AuthLogEvent }> {
  try {
    const supabase = await createClient();
    const headerList = await headers();
    const host = headerList.get("host") || "localhost:3000";
    const proto = headerList.get("x-forwarded-proto") || "http";
    const appOrigin = payload.origin || `${proto}://${host}`;
    const redirectTo = `${appOrigin}/api/auth/callback?role=${payload.role}`;

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
    const errorMsg =
      err instanceof Error ? err.message : "Gagal menginisiasi OAuth dari server.";
    return { success: false, error: errorMsg };
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
