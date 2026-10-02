"use server";

import { revalidatePath } from "next/cache";
import { beFetch } from "@/lib/api/be-client";
import { getAuthSession } from "@/lib/auth-cookies";
import type {
  BEBusinessEntity,
  BEBusinessRole,
  BEBankAccountInfo,
} from "@/lib/api/types";
import type { UserSession } from "@/constants/auth";

export interface UpdateBusinessProfileInput {
  entityId?: string;
  legalName?: string;
  npwpNib?: string;
  defaultAddress?: string;
  latitude?: number | string;
  longitude?: number | string;
  bankAccountInfo?: BEBankAccountInfo;
  profilePictureUrl?: string | null;
}

/**
 * Server Action: Mengambil data profil entitas bisnis dan role dari backend
 */
export async function getBusinessProfileAction(): Promise<{
  success: boolean;
  entity?: BEBusinessEntity;
  roles?: BEBusinessRole[];
  session?: UserSession | null;
  message?: string;
}> {
  try {
    const session = await getAuthSession();
    let entityId = session?.entityId;

    // Jika entityId tidak ada pada sesi, cari entitas pertama yang tersedia
    if (!entityId) {
      const listRes = await beFetch<BEBusinessEntity[]>("/business/entities");
      if (listRes.success && listRes.data && listRes.data.length > 0) {
        entityId = listRes.data[0].id;
      }
    }

    if (!entityId) {
      return {
        success: false,
        session,
        message: "Identitas entitas bisnis tidak ditemukan pada sesi.",
      };
    }

    const [entityRes, rolesRes] = await Promise.all([
      beFetch<BEBusinessEntity>(`/business/entities/${entityId}`),
      beFetch<BEBusinessRole[]>(`/business/roles?entity_id=${entityId}`),
    ]);

    if (!entityRes.success || !entityRes.data) {
      return {
        success: false,
        session,
        message: entityRes.message || "Gagal mengambil data entitas bisnis",
      };
    }

    return {
      success: true,
      entity: entityRes.data,
      roles: rolesRes.data || [],
      session,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kesalahan saat memuat profil",
    };
  }
}

/**
 * Server Action: Memperbarui profil legalitas, alamat, koordinat, dan rekening bank
 */
export async function updateBusinessEntityProfileAction(
  payload: UpdateBusinessProfileInput
): Promise<{
  success: boolean;
  entity?: BEBusinessEntity;
  message?: string;
}> {
  try {
    const session = await getAuthSession();
    const entityId = payload.entityId || session?.entityId;

    if (!entityId) {
      return {
        success: false,
        message: "ID Entitas Bisnis tidak ditemukan untuk memperbarui profil.",
      };
    }

    const updatePayload: Record<string, unknown> = {};
    if (payload.legalName !== undefined) updatePayload.legal_name = payload.legalName.trim();
    if (payload.npwpNib !== undefined) updatePayload.npwp_nib = payload.npwpNib.trim();
    if (payload.defaultAddress !== undefined) updatePayload.default_address = payload.defaultAddress.trim();
    if (payload.latitude !== undefined) updatePayload.latitude = Number(payload.latitude);
    if (payload.longitude !== undefined) updatePayload.longitude = Number(payload.longitude);
    if (payload.bankAccountInfo !== undefined) updatePayload.bank_account_info = payload.bankAccountInfo;
    if (payload.profilePictureUrl !== undefined) updatePayload.profile_picture_url = payload.profilePictureUrl;

    const endpoint = payload.npwpNib !== undefined
      ? `/business/entities/${entityId}`
      : `/business/entities/${entityId}/profile`;
    const method = payload.npwpNib !== undefined ? "PUT" : "PATCH";

    const res = await beFetch<BEBusinessEntity>(endpoint, {
      method,
      body: JSON.stringify(updatePayload),
    });

    revalidatePath("/profil");
    return {
      success: res.success,
      entity: res.data,
      message: res.message || (res.success ? "Profil usaha berhasil diperbarui" : "Gagal memperbarui profil"),
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui profil usaha",
    };
  }
}

/**
 * Server Action: Memperbarui konfigurasi role bisnis (sektor, kapasitas penyimpanan, keaktifan)
 */
export async function updateBusinessRoleAction(
  roleId: string,
  payload: {
    sector_type?: string;
    storage_capacity?: number;
    is_active?: boolean;
  }
): Promise<{
  success: boolean;
  data?: BEBusinessRole;
  message?: string;
}> {
  try {
    const res = await beFetch<BEBusinessRole>(`/business/roles/${roleId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    revalidatePath("/profil");
    return {
      success: res.success,
      data: res.data,
      message: res.message || (res.success ? "Role usaha berhasil diperbarui" : "Gagal memperbarui role"),
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal memperbarui role usaha",
    };
  }
}

/**
 * Server Action: Menambahkan peran usaha baru (SUPPLIER atau UMKM)
 */
export async function createBusinessRoleAction(payload: {
  entityId: string;
  role_type: "SUPPLIER" | "UMKM";
  sector_type?: string;
  storage_capacity?: number;
}): Promise<{
  success: boolean;
  data?: BEBusinessRole;
  message?: string;
}> {
  try {
    const res = await beFetch<BEBusinessRole>("/business/roles", {
      method: "POST",
      body: JSON.stringify({
        entity_id: payload.entityId,
        role_type: payload.role_type,
        sector_type: payload.sector_type || (payload.role_type === "SUPPLIER" ? "PERTANIAN" : "FNB_PENGOLAHAN"),
        storage_capacity: payload.storage_capacity ?? 0,
        is_active: true,
      }),
    });
    revalidatePath("/profil");
    return {
      success: res.success,
      data: res.data,
      message: res.message || (res.success ? "Peran usaha baru berhasil ditambahkan" : "Gagal menambahkan peran usaha"),
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal menambahkan peran usaha",
    };
  }
}

/**
 * Server Action: Menghapus peran usaha
 */
export async function deleteBusinessRoleAction(roleId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const res = await beFetch(`/business/roles/${roleId}`, {
      method: "DELETE",
    });
    revalidatePath("/profil");
    return {
      success: res.success,
      message: res.message || (res.success ? "Peran usaha berhasil dihapus" : "Gagal menghapus peran usaha"),
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal menghapus peran usaha",
    };
  }
}
