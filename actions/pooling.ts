"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { beFetch } from "@/lib/api/be-client";
import { getAuthSession } from "@/lib/auth-cookies";
import type { BEProcurementPool, BEBusinessRole } from "@/lib/api/types";

export interface JoinPoolInput {
  poolId: string;
  commodityId?: string;
  orderQty: number;
  deliveryMethod?: "HEMAT_HUB" | "DIRECT_DOOR_TO_DOOR";
  requiredDeliveryDate?: string | null;
  isUrgentAsap?: boolean;
  finalDeliveryAddress: string;
  finalDeliveryLat?: number;
  finalDeliveryLng?: number;
}

export interface CreatePoolOrDirectOrderInput {
  commodityId: string;
  orderQty: number;
  deliveryMethod?: "HEMAT_HUB" | "DIRECT_DOOR_TO_DOOR";
  requiredDeliveryDate: string;
  isUrgentAsap?: boolean;
  finalDeliveryAddress: string;
  finalDeliveryLat?: number;
  finalDeliveryLng?: number;
}

/**
 * Mendapatkan ID role UMKM aktif
 */
async function resolveUmkmRoleId(): Promise<string | null> {
  const session = await getAuthSession();
  if (session?.roleId && session.role === "umkm") {
    return session.roleId;
  }

  // Jika session memiliki entityId, cari role UMKM terkait
  if (session?.entityId) {
    try {
      const rolesRes = await beFetch<BEBusinessRole[]>(
        `/business/roles?entity_id=${session.entityId}&role_type=UMKM`
      );
      if (rolesRes.success && rolesRes.data && rolesRes.data.length > 0) {
        return rolesRes.data[0].id;
      }
    } catch {
      // lanjut fallback
    }
  }

  // Fallback dev mode: ambil role UMKM pertama yang aktif di sistem
  try {
    const allRolesRes = await beFetch<BEBusinessRole[]>("/business/roles?role_type=UMKM");
    if (allRolesRes.success && allRolesRes.data && allRolesRes.data.length > 0) {
      return allRolesRes.data[0].id;
    }
  } catch {
    // abaikan jika gagal
  }

  return null;
}

/**
 * Server Action: Mengambil daftar pooling kamar yang berjalan untuk komoditas tertentu
 */
export async function getCommodityPoolsAction(commodityId: string): Promise<{
  success: boolean;
  data: BEProcurementPool[];
  message?: string;
}> {
  try {
    const res = await beFetch<BEProcurementPool[]>(
      `/api/pre-orders/pools?commodity_id=${commodityId}&limit=50&offset=0`
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
      message: err instanceof Error ? err.message : "Gagal memuat kamar pool komoditas",
    };
  }
}

/**
 * Server Action: Mengambil rincian detail satu procurement pool beserta partisipan
 */
export async function getPoolDetailAction(poolId: string): Promise<{
  success: boolean;
  data?: BEProcurementPool;
  message?: string;
}> {
  try {
    const res = await beFetch<BEProcurementPool>(`/api/pre-orders/pools/${poolId}`);

    return {
      success: res.success,
      data: res.data,
      message: res.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal memuat detail pool",
    };
  }
}

/**
 * Server Action: Bergabung ke dalam pool yang sudah ada
 */
export async function joinPoolAction(payload: JoinPoolInput): Promise<{
  success: boolean;
  data?: any;
  message?: string;
}> {
  try {
    const roleId = await resolveUmkmRoleId();
    if (!roleId) {
      return {
        success: false,
        message: "ID Peran UMKM tidak ditemukan. Silakan masuk atau lengkapi profil UMKM Anda.",
      };
    }

    const res = await beFetch<any>("/api/pre-orders/join", {
      method: "POST",
      body: JSON.stringify({
        pool_id: payload.poolId,
        commodity_id: payload.commodityId || undefined,
        create_new_pool: false,
        umkm_role_id: roleId,
        order_qty: Number(payload.orderQty),
        delivery_method: payload.deliveryMethod || "HEMAT_HUB",
        required_delivery_date: payload.requiredDeliveryDate || undefined,
        is_urgent_asap: Boolean(payload.isUrgentAsap),
        final_delivery_address: payload.finalDeliveryAddress.trim(),
        final_delivery_lat: Number(payload.finalDeliveryLat) || -7.76,
        final_delivery_lng: Number(payload.finalDeliveryLng) || 110.39,
      }),
    });

    if (payload.commodityId) {
      revalidatePath(`/katalog/${payload.commodityId}`);
    }
    revalidatePath("/katalog");
    revalidatePath("/home");
    revalidatePath("/pesanan");
    revalidateTag("pools", "default");
    revalidateTag("marketplace", "default");
    revalidateTag("dashboard", "default");

    return {
      success: res.success,
      data: res.data,
      message: res.message || (res.success ? "Berhasil bergabung ke dalam kamar pool!" : "Gagal bergabung ke pool"),
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kesalahan saat bergabung ke pool",
    };
  }
}

/**
 * Server Action: Membuka kamar pool baru mandiri (atau beli langsung jika order_qty >= MOQ)
 */
export async function createPoolOrDirectOrderAction(
  payload: CreatePoolOrDirectOrderInput
): Promise<{
  success: boolean;
  data?: any;
  message?: string;
}> {
  try {
    const roleId = await resolveUmkmRoleId();
    if (!roleId) {
      return {
        success: false,
        message: "ID Peran UMKM tidak ditemukan. Silakan masuk atau lengkapi profil UMKM Anda.",
      };
    }

    const res = await beFetch<any>("/api/pre-orders/join", {
      method: "POST",
      body: JSON.stringify({
        commodity_id: payload.commodityId,
        create_new_pool: true,
        umkm_role_id: roleId,
        order_qty: Number(payload.orderQty),
        delivery_method: payload.deliveryMethod || "HEMAT_HUB",
        required_delivery_date: payload.requiredDeliveryDate,
        is_urgent_asap: Boolean(payload.isUrgentAsap),
        final_delivery_address: payload.finalDeliveryAddress.trim(),
        final_delivery_lat: Number(payload.finalDeliveryLat) || -7.76,
        final_delivery_lng: Number(payload.finalDeliveryLng) || 110.39,
      }),
    });

    revalidatePath(`/katalog/${payload.commodityId}`);
    revalidatePath("/katalog");
    revalidatePath("/home");
    revalidatePath("/pesanan");
    revalidateTag("pools", "default");
    revalidateTag("marketplace", "default");
    revalidateTag("dashboard", "default");

    return {
      success: res.success,
      data: res.data,
      message:
        res.message ||
        (res.success
          ? "Kamar patungan baru atau pesanan langsung berhasil dibuat!"
          : "Gagal memproses pesanan"),
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kesalahan saat memproses pesanan",
    };
  }
}
