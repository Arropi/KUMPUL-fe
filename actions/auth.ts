"use server";
import { headers, cookies } from "next/headers";
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
  callBackendSwitchRole,
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

  // 3. Tentukan peran aktif pengguna (dari metadata akun atau tab yang dipilih)
  const metadataRole = data.user.user_metadata?.role as UserRole | undefined;
  const activeRole: UserRole = metadataRole || role;
  const beRole = activeRole === "supplier" ? "SUPPLIER" : "UMKM";

  // 4. Token Exchange ke Backend Express KUMPUL (Opsi A) dengan fallback aman
  let beToken = "";
  let entityId = "";

  try {
    const beRes = await callBackendLogin({
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
        beToken = regRes.data.token;
        entityId = regRes.data.entity_id;
      }
    } else if (beRes.success && beRes.data?.token) {
      beToken = beRes.data.token;
      entityId = beRes.data.entity_id;
    }
  } catch {
    // Backend offline / dalam pengembangan
  }

  // Fallback token sesi jika backend Express belum aktif / port 5000 diblokir sistem
  if (!beToken) {
    beToken = data.session?.access_token || `session-${supabaseUserId}`;
    entityId = `entity-${supabaseUserId}`;
  }

  // 5. Bangun sesi pengguna dengan token aktif
  const session: UserSession = {
    email,
    name: userName,
    role: activeRole,
    provider: "credentials",
    supabaseUserId,
    token: beToken,
    entityId,
  };

  // 6. Simpan cookie sesi di HTTP-Only cookie server
  const maxAgeDays = payload.rememberMe ? 30 : 7;
  await saveAuthCookies({ beToken, session, maxAgeDays });

  // 7. Arahkan pengguna langsung ke portal yang sesuai perannya
  const redirectTo = activeRole === "supplier" ? "/supplier" : "/umkm";

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

  // 4. Hit endpoint Backend Express KUMPUL: POST /api/auth/register dengan fallback aman
  const beRole = role === "supplier" ? "SUPPLIER" : "UMKM";
  const beSector = normalizeSectorForBE(payload.sector);

  let beToken = "";
  let entityId = "";

  try {
    const beRes = await callBackendRegister({
      user_id: supabaseUserId,
      role: beRole,
      sector_type: beSector,
      storage_capacity: payload.storageCapacity ?? 0,
    });

    if (beRes.success && beRes.data?.token) {
      beToken = beRes.data.token;
      entityId = beRes.data.entity_id;
    }
  } catch {
    // Backend offline / dalam pengembangan
  }

  // Fallback token jika backend belum tersedia
  if (!beToken) {
    beToken = data.session?.access_token || `session-${supabaseUserId}`;
    entityId = `entity-${supabaseUserId}`;
  }

  // 5. Bangun sesi pengguna
  const session: UserSession = {
    email,
    name: businessName,
    role,
    provider: "credentials",
    supabaseUserId,
    token: beToken,
    entityId,
  };

  // 6. Simpan token ke dalam cookie HTTP-Only server-side
  await saveAuthCookies({ beToken, session, maxAgeDays: 7 });

  const redirectTo =
    role === "supplier" ? "/supplier?onboarding=pending" : "/umkm?onboarding=pending";

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
            sector_type: beSector,
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

    const redirectTo = targetRole === "supplier" ? "/supplier" : "/umkm";

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
      redirectTo: targetRole === "supplier" ? "/supplier" : "/umkm",
      error: errorMsg,
    };
  }
}

