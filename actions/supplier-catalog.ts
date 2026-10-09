"use server";

import { revalidatePath } from "next/cache";
import { beFetch } from "@/lib/api/be-client";
import { getAuthSession } from "@/lib/auth-cookies";
import type {
  BESupplierCommodity,
  BECommodityBatchTag,
  BEBusinessRole,
  BEWholesaleUnit,
  BEStorageTemperature,
  BEPriceTier,
} from "@/lib/api/types";

export interface CreateCommodityInput {
  name: string;
  wholesaleUnit: BEWholesaleUnit;
  basePrice: number;
  stock: number;
  baseMoq: number;
  leadTimeDays?: number;
  imageUrl?: string | null;
  description?: string | null;
  productionDate?: string | null;
  closedDate?: string | null;
  autoActivateMarketplace?: boolean;
  allowsUnderMoq?: boolean;
  underMoqPricePerKg?: number | null;
  isMarketplaceActive?: boolean;
  priceTiers?: BEPriceTier[];
  supplierRoleId?: string;
}

/**
 * Mendapatkan ID role Supplier aktif
 */
async function resolveSupplierRoleId(providedRoleId?: string): Promise<string | null> {
  if (providedRoleId) return providedRoleId;

  const session = await getAuthSession();
  if (session?.roleId && session.role === "supplier") {
    return session.roleId;
  }

  if (session?.entityId) {
    // 1. Coba dari endpoint /business/roles
    try {
      const rolesRes = await beFetch<BEBusinessRole[]>(
        `/business/roles?entity_id=${session.entityId}&role_type=SUPPLIER`
      );
      if (rolesRes.success && rolesRes.data && rolesRes.data.length > 0) {
        return rolesRes.data[0].id;
      }
    } catch {
      // lanjut ke fallback berikutnya
    }

    // 2. Coba dari endpoint profil entitas /profile/:id
    try {
      const profileRes = await beFetch<{
        roles?: Array<{ id: string; role_type: string; is_active: boolean }>;
      }>(`/profile/${session.entityId}`);
      if (profileRes.success && profileRes.data?.roles) {
        const supplierRole = profileRes.data.roles.find(
          (r) => r.role_type.toUpperCase() === "SUPPLIER"
        );
        if (supplierRole) {
          return supplierRole.id;
        }
      }
    } catch {
      // lanjut ke fallback dev
    }
  }

  // Fallback dev mode: ambil role Supplier pertama yang aktif di sistem
  try {
    const allRolesRes = await beFetch<BEBusinessRole[]>("/business/roles?role_type=SUPPLIER");
    if (allRolesRes.success && allRolesRes.data && allRolesRes.data.length > 0) {
      return allRolesRes.data[0].id;
    }
  } catch {
    // abaikan jika gagal
  }

  return null;
}

/**
 * Server Action: Mengambil katalog komoditas khusus milik entitas Supplier yang login
 * Endpoint: /supplier-catalogs/entity-id/{entityId}
 */
export async function getMySupplierCatalogsAction(): Promise<{
  success: boolean;
  data: BESupplierCommodity[];
  message?: string;
}> {
  try {
    const session = await getAuthSession();
    if (!session?.entityId) {
      return {
        success: true,
        data: [],
        message: "Entity ID tidak ditemukan pada sesi pengguna",
      };
    }

    const endpoint = `/supplier-catalogs/entity-id/${session.entityId}`;
    const res = await beFetch<BESupplierCommodity[]>(endpoint);

    if (!res.success) {
      return {
        success: false,
        data: [],
        message: res.message || "Gagal memuat katalog komoditas entitas Anda",
      };
    }

    return {
      success: true,
      data: res.data || [],
    };
  } catch (err: unknown) {
    return {
      success: false,
      data: [],
      message: err instanceof Error ? err.message : "Gagal memuat katalog komoditas",
    };
  }
}

/**
 * Server Action: Mengambil seluruh komoditas bursa/marketplace
 * Endpoint: /supplier-catalogs
 */
export async function getAllMarketplaceCatalogsAction(): Promise<{
  success: boolean;
  data: BESupplierCommodity[];
  message?: string;
}> {
  try {
    const res = await beFetch<BESupplierCommodity[]>("/supplier-catalogs");
    console.log("ini data", res.data)
    return {
      success: res.success,
      data: res.data || [],
      message: res.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      data: [],
      message: err instanceof Error ? err.message : "Gagal memuat katalog bursa",
    };
  }
}

/**
 * Server Action: Mengambil daftar komoditas katalog supplier (backward-compatible)
 */
export async function getSupplierCatalogsAction(supplierRoleId?: string): Promise<{
  success: boolean;
  data: BESupplierCommodity[];
  message?: string;
}> {
  try {
    const session = await getAuthSession();
    let endpoint = "/supplier-catalogs";

    if (session?.entityId) {
      endpoint = `/supplier-catalogs/entity-id/${session.entityId}`;
    } else if (supplierRoleId) {
      endpoint = `/supplier-catalogs?supplier_role_id=${supplierRoleId}`;
    }

    const res = await beFetch<BESupplierCommodity[]>(endpoint);
    return {
      success: res.success,
      data: res.data || [],
      message: res.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      data: [],
      message: err instanceof Error ? err.message : "Gagal memuat katalog komoditas",
    };
  }
}

/**
 * Server Action: Mengambil detail komoditas katalog berdasarkan ID
 */
export async function getSupplierCommodityDetailAction(id: string): Promise<{
  success: boolean;
  data?: BESupplierCommodity;
  message?: string;
}> {
  try {
    const res = await beFetch<BESupplierCommodity>(`/supplier-catalogs/${id}`);
    return {
      success: res.success,
      data: res.data,
      message: res.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal memuat detail komoditas",
    };
  }
}

/**
 * Server Action: Menambahkan komoditas baru ke katalog supplier dengan SKU otomatis
 */
export async function createSupplierCommodityAction(payload: CreateCommodityInput): Promise<{
  success: boolean;
  data?: BESupplierCommodity;
  message?: string;
}> {
  try {
    const roleId = await resolveSupplierRoleId(payload.supplierRoleId);
    if (!roleId) {
      return {
        success: false,
        message: "ID Peran Supplier tidak ditemukan. Silakan lengkapi profil usaha Anda.",
      };
    }

    const res = await beFetch<BESupplierCommodity>("/supplier-catalogs", {
      method: "POST",
      body: JSON.stringify({
        supplier_role_id: roleId,
        name: payload.name.trim(),
        wholesale_unit: payload.wholesaleUnit,
        base_price: Number(payload.basePrice),
        stock: Number(payload.stock),
        base_moq: Number(payload.baseMoq),
        lead_time_days: Number(payload.leadTimeDays) || 1,
        image_url: payload.imageUrl || null,
        description: payload.description?.trim() || null,
        production_date: payload.productionDate || null,
        closed_date: payload.closedDate || null,
        auto_activate_marketplace: Boolean(payload.autoActivateMarketplace),
        allows_under_moq: Boolean(payload.allowsUnderMoq),
        under_moq_price_per_kg: payload.allowsUnderMoq && payload.underMoqPricePerKg ? Number(payload.underMoqPricePerKg) : null,
        is_marketplace_active: payload.isMarketplaceActive !== undefined ? payload.isMarketplaceActive : true,
        price_tiers: payload.priceTiers || [],
      }),
    });

    revalidatePath("/katalog");
    revalidatePath("/home");
    return {
      success: res.success,
      data: res.data,
      message: res.message || (res.success ? "Komoditas berhasil disimpan" : "Gagal menyimpan komoditas"),
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal menambahkan komoditas",
    };
  }
}

/**
 * Server Action: Memperbarui data komoditas katalog supplier
 */
export async function updateSupplierCommodityAction(
  id: string,
  payload: Partial<CreateCommodityInput>
): Promise<{
  success: boolean;
  data?: BESupplierCommodity;
  message?: string;
}> {
  try {
    const res = await beFetch<BESupplierCommodity>(`/supplier-catalogs/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: payload.name?.trim(),
        wholesale_unit: payload.wholesaleUnit,
        base_price: payload.basePrice !== undefined ? Number(payload.basePrice) : undefined,
        stock: payload.stock !== undefined ? Number(payload.stock) : undefined,
        base_moq: payload.baseMoq !== undefined ? Number(payload.baseMoq) : undefined,
        lead_time_days: payload.leadTimeDays,
        image_url: payload.imageUrl,
        description: payload.description,
        production_date: payload.productionDate !== undefined ? (payload.productionDate || null) : undefined,
        closed_date: payload.closedDate !== undefined ? (payload.closedDate || null) : undefined,
        auto_activate_marketplace: payload.autoActivateMarketplace,
        allows_under_moq: payload.allowsUnderMoq !== undefined ? Boolean(payload.allowsUnderMoq) : undefined,
        under_moq_price_per_kg: payload.allowsUnderMoq && payload.underMoqPricePerKg ? Number(payload.underMoqPricePerKg) : null,
        is_marketplace_active: payload.isMarketplaceActive,
        price_tiers: payload.priceTiers,
      }),
    });

    revalidatePath("/katalog");
    revalidatePath("/home");
    return {
      success: res.success,
      data: res.data,
      message: res.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal memperbarui komoditas",
    };
  }
}

/**
 * Server Action: Menghapus komoditas dari katalog
 */
export async function deleteSupplierCommodityAction(id: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const res = await beFetch(`/supplier-catalogs/${id}`, {
      method: "DELETE",
    });

    revalidatePath("/katalog");
    revalidatePath("/home");
    return {
      success: res.success,
      message: res.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal menghapus komoditas",
    };
  }
}

/**
 * Server Action: Menyimpan batch tag & verifikasi kepatuhan AI
 */
export async function createCommodityBatchTagAction(payload: {
  commodityId: string;
  supportingFileUrl?: string | null;
  storageTemperatureType?: BEStorageTemperature;
  isVerified?: boolean;
}): Promise<{
  success: boolean;
  data?: BECommodityBatchTag;
  message?: string;
}> {
  try {
    const res = await beFetch<BECommodityBatchTag>("/commodity-batch-tags", {
      method: "POST",
      body: JSON.stringify({
        commodity_id: payload.commodityId,
        supporting_file_url: payload.supportingFileUrl || null,
        storage_temperature_type: payload.storageTemperatureType || "AMBIENT",
        is_verified: payload.isVerified !== undefined ? payload.isVerified : undefined,
      }),
    });

    revalidatePath("/katalog");
    revalidatePath(`/katalog/${payload.commodityId}`);
    revalidatePath(`/katalog/${payload.commodityId}/verifikasi`);
    return {
      success: res.success,
      data: res.data,
      message: res.message || (res.success ? "Verifikasi kepatuhan mutu berhasil disimpan" : "Gagal menyimpan verifikasi"),
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal menyimpan verifikasi kepatuhan",
    };
  }
}

/**
 * Server Action: Mengambil riwayat batch tag dokumen komoditas
 * Endpoint: /commodity-batch-tags/commodity/:commodity_id
 */
export async function getCommodityBatchTagsAction(commodityId: string): Promise<{
  success: boolean;
  data: BECommodityBatchTag[];
  message?: string;
}> {
  try {
    const res = await beFetch<BECommodityBatchTag[]>(
      `/commodity-batch-tags/commodity/${commodityId}`
    );
    return {
      success: res.success,
      data: res.data || [],
      message: res.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      data: [],
      message: err instanceof Error ? err.message : "Gagal memuat batch tag komoditas",
    };
  }
}

/**
 * Server Action: Mempublikasikan komoditas ke etalase bursa marketplace
 */
export async function publishSupplierCommodityAction(
  commodityId: string,
  dates?: { productionDate?: string; closedDate?: string }
): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  try {
    if (dates?.productionDate || dates?.closedDate) {
      await updateSupplierCommodityAction(commodityId, {
        productionDate: dates.productionDate,
        closedDate: dates.closedDate,
      });
    }

    const res = await beFetch(`/supplier-catalogs/${commodityId}/publish`, {
      method: "POST",
    });

    revalidatePath("/katalog");
    revalidatePath(`/katalog/${commodityId}`);
    revalidatePath("/home");

    return {
      success: res.success,
      data: res.data,
      message:
        res.message ||
        (res.success
          ? "Komoditas berhasil dipublikasikan ke etalase bursa"
          : "Gagal mempublikasikan komoditas"),
    };
  } catch (err: unknown) {
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Gagal mempublikasikan komoditas ke bursa",
    };
  }
}

/**
 * Server Action: Menarik komoditas dari etalase bursa marketplace
 */
export async function unpublishSupplierCommodityAction(
  commodityId: string
): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  try {
    const res = await beFetch(`/supplier-catalogs/${commodityId}/unpublish`, {
      method: "POST",
    });

    revalidatePath("/katalog");
    revalidatePath(`/katalog/${commodityId}`);
    revalidatePath("/home");

    return {
      success: res.success,
      data: res.data,
      message:
        res.message ||
        (res.success
          ? "Komoditas berhasil ditarik dari etalase bursa"
          : "Gagal menarik komoditas"),
    };
  } catch (err: unknown) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Gagal menarik komoditas dari etalase",
    };
  }
}

