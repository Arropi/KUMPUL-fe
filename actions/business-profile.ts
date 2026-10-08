"use server";

import { revalidatePath } from "next/cache";
import { beFetch } from "@/lib/api/be-client";
import { getAuthSession, clearAuthCookies } from "@/lib/auth-cookies";
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
  phoneNumber?: string;
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
  total_sales?: number;
  products?: any[];
  message?: string;
}> {
  try {
    const session = await getAuthSession();
    let entityId = session?.entityId;
    console.log(entityId, session);

    // Jika entityId tidak ada pada sesi, cari entitas pertama yang tersedia
    if (!entityId) {
      // Use /profile endpoint to get list of profiles
      const listRes = await beFetch<any[]>("/profile");
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

    // Fetch single profile data
    const profileRes = await beFetch<any>(`/profile/${entityId}`);

    if (!profileRes.success || !profileRes.data) {
      return {
        success: false,
        session,
        message: profileRes.message || "Gagal mengambil data profil entitas bisnis",
      };
    }

    const data = profileRes.data;

    // Map to entity shape (BEBusinessEntity)
    const entity: BEBusinessEntity = {
      id: data.id,
      auth_user_id: data.auth_user_id,
      legal_name: data.legal_name,
      npwp_nib: data.npwp_nib,
      default_address: data.default_address,
      latitude: data.latitude,
      longitude: data.longitude,
      phone_number: data.phone_number || null,
      bank_account_info: data.bank_account_info as BEBankAccountInfo | undefined,
      profile_picture_url: data.profile_picture_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    // Map roles to BEBusinessRole array
    const roles: BEBusinessRole[] = (data.roles || []).map((role: any) => ({
      id: role.id,
      entity_id: role.entity_id,
      role_type: role.role_type as "SUPPLIER" | "UMKM",
      sector_type: role.sector_type,
      storage_capacity: role.storage_capacity,
      is_active: role.is_active,
      created_at: role.created_at,
      updated_at: role.updated_at,
      // Optional fields: capacity_monthly, capacity_unit, storage_type left as undefined
    }));

    const total_sales = data.total_sales ?? 0;
    const products = data.products ?? [];

    return {
      success: true,
      entity,
      roles,
      session,
      total_sales,
      products,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kesalahan saat memuat profil",
    };
  }
}

/**
 * Server Action: Memperbarui profil legalitas, alamat, nomor telepon, koordinat, dan rekening bank
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
    if (payload.phoneNumber !== undefined) updatePayload.phone_number = payload.phoneNumber.trim();
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

/**
 * Server Action: Menghapus profil entitas bisnis secara permanen (menghapus seluruh akun usaha)
 */
export async function deleteBusinessAccountAction(entityId?: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const session = await getAuthSession();
    const targetEntityId = entityId || session?.entityId;

    if (!targetEntityId) {
      return {
        success: false,
        message: "ID Entitas Bisnis tidak ditemukan untuk menghapus akun.",
      };
    }

    const res = await beFetch(`/business/entities/${targetEntityId}`, {
      method: "DELETE",
    });

    if (res.success) {
      await clearAuthCookies();
    }

    revalidatePath("/profil");
    return {
      success: res.success,
      message:
        res.message ||
        (res.success
          ? "Akun profil usaha berhasil dihapus secara permanen."
          : "Gagal menghapus akun bisnis."),
    };
  } catch (err: unknown) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus akun bisnis.",
    };
  }
}