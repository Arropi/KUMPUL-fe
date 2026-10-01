/**
 * Helper komunikasi dengan Backend Express KUMPUL (/api/auth/register & /api/auth/login)
 * Sesuai arsitektur Opsi A: Login Token Exchange
 */

const BACKEND_API_URL = (
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

export interface BERegisterResult {
  token: string;
  user_id: string;
  entity_id: string;
  role: "SUPPLIER" | "UMKM";
  business_role?: Record<string, unknown>;
  business_entity?: Record<string, unknown>;
}

export interface BELoginResult {
  token: string;
  user_id: string;
  entity_id: string;
  active_role?: { role_type: "SUPPLIER" | "UMKM" };
  available_roles?: Array<{ role_type: "SUPPLIER" | "UMKM" }>;
  business_entity?: Record<string, unknown>;
}

export type BESectorType =
  | "PERTANIAN"
  | "PETERNAKAN"
  | "PERIKANAN"
  | "PERKEBUNAN"
  | "FNB_PENGOLAHAN"
  | "RITEL"
  | "LOGISTIK";

/**
 * Normalisasi nama sektor dari format Frontend ke format yang divalidasi oleh Backend Express
 */
export function normalizeSectorForBE(sector?: string): BESectorType | undefined {
  if (!sector) return undefined;
  const s = sector.toUpperCase().replace(/\s*&\s*|\s*\/\s*|\s+/g, "_");
  if (s.includes("FNB") || s.includes("OLAH")) return "FNB_PENGOLAHAN";
  if (s.includes("TANI")) return "PERTANIAN";
  if (s.includes("TERNAK")) return "PETERNAKAN";
  if (s.includes("IKAN")) return "PERIKANAN";
  if (s.includes("KEBUN")) return "PERKEBUNAN";
  if (s.includes("RITEL")) return "RITEL";
  if (s.includes("LOGISTIK")) return "LOGISTIK";
  return undefined;
}

/**
 * Hit POST /api/auth/register ke Backend Express KUMPUL
 */
export async function callBackendRegister(payload: {
  user_id: string;
  role: "SUPPLIER" | "UMKM";
  sector_type?: BESectorType;
  storage_capacity?: number;
}): Promise<{ success: boolean; data?: BERegisterResult; error?: string; errorCode?: string }> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || json?.status === "error") {
      const msg = json?.message || `Registrasi role di backend gagal (HTTP ${res.status}).`;
      return { success: false, error: msg, errorCode: json?.error_code };
    }

    return { success: true, data: json.data };
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? `Gagal terhubung ke backend: ${err.message}`
        : "Tidak dapat terhubung ke server backend KUMPUL.";
    return { success: false, error: msg };
  }
}

/**
 * Hit POST /api/auth/login ke Backend Express KUMPUL (Token Exchange)
 */
export async function callBackendLogin(payload: {
  user_id: string;
  role?: "SUPPLIER" | "UMKM";
}): Promise<{ success: boolean; data?: BELoginResult; error?: string; errorCode?: string }> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || json?.status === "error") {
      const msg = json?.message || `Login token exchange di backend gagal (HTTP ${res.status}).`;
      return { success: false, error: msg, errorCode: json?.error_code };
    }

    return { success: true, data: json.data };
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? `Gagal terhubung ke backend: ${err.message}`
        : "Tidak dapat terhubung ke server backend KUMPUL.";
    return { success: false, error: msg };
  }
}

export interface BESwitchRoleResult {
  token: string;
  user_id: string;
  entity_id: string;
  active_role: { id: string; role_type: "SUPPLIER" | "UMKM"; sector_type?: string };
  available_roles: Array<{ id: string; role_type: "SUPPLIER" | "UMKM"; sector_type?: string }>;
  business_entity?: Record<string, unknown>;
  auto_created?: boolean;
}

/**
 * Hit POST /auth/switch-role ke Backend Express KUMPUL
 */
export async function callBackendSwitchRole(payload: {
  user_id: string;
  role: "SUPPLIER" | "UMKM";
  sector_type?: BESectorType;
  storage_capacity?: number;
  daily_capacity?: number;
}): Promise<{ success: boolean; data?: BESwitchRoleResult; error?: string; errorCode?: string }> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/auth/switch-role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || json?.status === "error") {
      const msg = json?.message || `Switch role di backend gagal (HTTP ${res.status}).`;
      return { success: false, error: msg, errorCode: json?.error_code };
    }

    return { success: true, data: json.data };
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? `Gagal terhubung ke backend: ${err.message}`
        : "Tidak dapat terhubung ke server backend KUMPUL.";
    return { success: false, error: msg };
  }
}

