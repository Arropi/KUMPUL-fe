import { cookies } from "next/headers";
import { UserSession } from "@/constants/auth";

/**
 * Menyimpan Custom JWT dari Backend Express KUMPUL ke cookie HTTP-Only dari sisi server
 */
export async function saveAuthCookies(params: {
  beToken: string;
  session: UserSession;
  maxAgeDays?: number;
}) {
  const maxAge = 60 * 60 * 24 * (params.maxAgeDays ?? 7);
  const cookieStore = await cookies();

  // 1. Simpan kumpul_token (Hanya Custom JWT resmi dari Backend Express KUMPUL)
  cookieStore.set("kumpul_token", params.beToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  // 2. Simpan kumpul_session dengan profil entitas & peran aktif
  cookieStore.set("kumpul_session", JSON.stringify(params.session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}

/**
 * Menghapus seluruh cookie autentikasi KUMPUL dari sisi server
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("kumpul_token");
  cookieStore.delete("kumpul_session");
}

/**
 * Membaca sesi pengguna aktif dari cookie server
 */
export async function getAuthSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("kumpul_session");
  const tokenCookie = cookieStore.get("kumpul_token");

  if (!sessionCookie?.value) return null;

  try {
    const session = JSON.parse(sessionCookie.value) as UserSession;
    if (tokenCookie?.value) {
      session.token = tokenCookie.value;
    }
    return session;
  } catch {
    return null;
  }
}

