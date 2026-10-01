/**
 * Helper komunikasi dengan Backend Express KUMPUL
 * Sesuai arsitektur Opsi A: Login Token Exchange & Register Complete
 */

const BACKEND_API_URL = (
  process.env.BACKEND_API_URL || "http://localhost:3030/api"
).replace(/\/$/, "");

export interface BERegisterResult {
  token?: string;
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

export interface BERegisterCompletePayload {
  user_id: string;
  legal_name: string;
  npwp_nib: string;
  default_address: string;
  latitude: number | string;
  longitude: number | string;
  role: "SUPPLIER" | "UMKM";
  sector: BESectorType;
  storage_capacity?: number;
  bank_account_info?: Record<string, unknown>;
  profile_picture_url?: string | null;
}

export interface BERegisterCompleteResult {
  token?: string;
  user_id: string;
  entity_id: string;
  business_entity?: Record<string, unknown>;
  available_roles?: Array<{ role_type: "SUPPLIER" | "UMKM" }>;
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
      let msg = json?.message || `Login token exchange di backend gagal (HTTP ${res.status}).`;
      if (Array.isArray(json?.error_details) && json.error_details.length > 0) {
        const issues = json.error_details.map((d: any) => d.issue || d.message).filter(Boolean);
        if (issues.length > 0) msg = issues.join(". ");
      }
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
 * Hit POST /api/auth/register-complete ke Backend Express KUMPUL
 */
export async function callBackendRegister(
  payload: BERegisterCompletePayload
): Promise<{ success: boolean; data?: BERegisterCompleteResult; error?: string; errorCode?: string }> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || json?.status === "error") {
      let msg =
        json?.message || `Gagal melengkapi data profil usaha di backend (HTTP ${res.status}).`;
      if (Array.isArray(json?.error_details) && json.error_details.length > 0) {
        const issues = json.error_details.map((d: any) => d.issue || d.message).filter(Boolean);
        if (issues.length > 0) msg = issues.join(". ");
      }
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
