"use server";

import { revalidatePath } from "next/cache";
import { beFetch } from "@/lib/api/be-client";
import { getAuthSession } from "@/lib/auth-cookies";
import type { UMKMPurchaseHistory, WasteSaleOrder } from "@/constants/umkm";
import type { ConsolidatedPO } from "@/constants/supplier";

/**
 * Helper untuk mengambil headers otorisasi dari session aktif
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await getAuthSession();
  const headers: Record<string, string> = {};
  if (session?.token) {
    headers["Authorization"] = `Bearer ${session.token}`;
  }
  return headers;
}

// =========================================================================
// 1. UMKM PROCUREMENT ORDERS ACTIONS
// =========================================================================

/**
 * Mengambil seluruh daftar pesanan bahan baku UMKM aktif (dengan pemetaan 6 status standar)
 */
export async function getUmkmAllOrdersAction(): Promise<{
  success: boolean;
  data?: UMKMPurchaseHistory[];
  message?: string;
}> {
  try {
    const headers = await getAuthHeaders();
    const res = await beFetch<UMKMPurchaseHistory[]>("/orders/umkm/all", {
      headers,
    });

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Gagal memuat daftar pesanan UMKM",
        data: [],
      };
    }

    return {
      success: true,
      data: res.data || [],
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Terjadi kesalahan saat mengambil pesanan",
      data: [],
    };
  }
}

/**
 * Membatalkan keikutsertaan pesanan pool UMKM (selama status masih Pending)
 */
export async function cancelProcurementOrderAction(orderId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const headers = await getAuthHeaders();
    const res = await beFetch(`/orders/${orderId}/cancel`, {
      method: "POST",
      headers,
    });

    if (res.success) {
      revalidatePath("/pesanan");
      return { success: true, message: "Pesanan berhasil dibatalkan" };
    }

    return {
      success: false,
      message: res.message || "Gagal membatalkan pesanan",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Gagal membatalkan pesanan",
    };
  }
}

/**
 * Mengonfirmasi serah-terima fisik barang di hub dengan memasukkan PIN / Kode Pickup
 */
export async function confirmOrderPickupAction(
  orderId: string,
  pickupCode: string
): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  try {
    const headers = await getAuthHeaders();
    const res = await beFetch(`/orders/${orderId}/confirm-pickup`, {
      method: "POST",
      headers,
      body: JSON.stringify({ pickup_code: pickupCode }),
    });

    if (res.success) {
      revalidatePath("/pesanan");
      return {
        success: true,
        message: "Pengambilan barang berhasil diverifikasi. Pesanan selesai!",
        data: res.data,
      };
    }

    return {
      success: false,
      message: res.message || "Kode verifikasi / PIN serah-terima tidak sesuai",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Gagal mengonfirmasi pengambilan barang",
    };
  }
}

// =========================================================================
// 2. SUPPLIER PURCHASE ORDERS (PO) ACTIONS
// =========================================================================

/**
 * Mengambil daftar Consolidated PO untuk supplier aktif
 */
export async function getSupplierPosAction(supplierRoleId?: string): Promise<{
  success: boolean;
  data?: ConsolidatedPO[];
  message?: string;
}> {
  try {
    const headers = await getAuthHeaders();
    let effectiveRoleId = supplierRoleId;

    if (!effectiveRoleId) {
      const session = await getAuthSession();
      if (session?.roleId && session.role === "supplier") {
        effectiveRoleId = session.roleId;
      } else if (session?.entityId) {
        try {
          const rolesRes = await beFetch<any[]>(
            `/business/roles?entity_id=${session.entityId}&role_type=SUPPLIER`,
            { headers }
          );
          if (rolesRes.success && rolesRes.data && rolesRes.data.length > 0) {
            effectiveRoleId = rolesRes.data[0].id;
          }
        } catch {}
      }
    }

    const endpoint = effectiveRoleId
      ? `/orders/supplier/pos?supplier_role_id=${effectiveRoleId}`
      : `/orders/supplier/pos`;

    const res = await beFetch<ConsolidatedPO[]>(endpoint, { headers });

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Gagal memuat daftar PO supplier",
        data: [],
      };
    }

    return {
      success: true,
      data: res.data || [],
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Terjadi kesalahan saat memuat daftar PO",
      data: [],
    };
  }
}

/**
 * Mengambil detail Purchase Order (PO) konsolidasi beserta seluruh partisipan UMKM
 */
export async function getSupplierPoDetailAction(poId: string): Promise<{
  success: boolean;
  data?: {
    po: ConsolidatedPO;
    pool: any;
    commodity: any;
    participants: any[];
    hostParticipant?: any;
    totalHubVolume?: number;
  };
  message?: string;
}> {
  try {
    const headers = await getAuthHeaders();
    const res = await beFetch<any>(`/orders/supplier/pos/${poId}`, { headers });

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Gagal memuat rincian PO",
      };
    }

    return {
      success: true,
      data: res.data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Gagal memuat rincian PO",
    };
  }
}

/**
 * Memindahkan / menetapkan UMKM sebagai Titik Host Hub baru dengan validasi kapasitas gudang
 */
export async function assignPoolHostAction(
  poolId: string,
  hostUmkmRoleId: string
): Promise<{
  success: boolean;
  message?: string;
  warning?: string | null;
  data?: any;
}> {
  try {
    const headers = await getAuthHeaders();
    const res = await beFetch<any>(
      `/orders/supplier/pools/${poolId}/assign-host`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({ host_umkm_role_id: hostUmkmRoleId }),
      }
    );

    if (res.success) {
      revalidatePath("/pesanan");
      revalidatePath(`/pesanan/${poolId}`);
      return {
        success: true,
        message: res.message || "Titik Host Hub berhasil diperbarui",
        warning: res.data?.warning || null,
        data: res.data,
      };
    }

    return {
      success: false,
      message: res.message || "Gagal mengubah titik Host Hub",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Gagal mengubah titik Host Hub",
    };
  }
}

/**
 * Mengirim barang untuk Purchase Order (PO) dengan input pengemudi, resi/plat, dan bukti foto
 */
export async function shipSupplierPoAction(
  poId: string,
  data: {
    driver_name: string;
    tracking_number: string;
    delivery_proof_url?: string | null;
  }
): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  try {
    const headers = await getAuthHeaders();
    const res = await beFetch<any>(`/orders/supplier/pos/${poId}/ship`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (res.success) {
      revalidatePath("/pesanan");
      revalidatePath(`/pesanan/${poId}`);
      return {
        success: true,
        message: "Status PO berhasil diperbarui menjadi SHIPPED (Dalam Pengiriman)",
        data: res.data,
      };
    }

    return {
      success: false,
      message: res.message || "Gagal memperbarui status pengiriman PO",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Gagal memperbarui status pengiriman PO",
    };
  }
}

/**
 * Memperbarui status Purchase Order (PO) konsolidasi (misal ke DELIVERED)
 */
export async function updateSupplierPoStatusAction(
  poId: string,
  status: "SHIPPED" | "DELIVERED"
): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  try {
    const headers = await getAuthHeaders();
    const res = await beFetch<any>(`/orders/supplier/pos/${poId}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status }),
    });

    if (res.success) {
      revalidatePath("/pesanan");
      revalidatePath(`/pesanan/${poId}`);
      return {
        success: true,
        message: res.message || `Status PO berhasil diperbarui menjadi ${status}`,
        data: res.data,
      };
    }

    return {
      success: false,
      message: res.message || "Gagal memperbarui status PO",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Gagal memperbarui status PO",
    };
  }
}

// =========================================================================
// 3. WASTE TRANSACTIONS (PENJUALAN LIMBAH) ACTIONS
// =========================================================================

/**
 * Mengambil riwayat transaksi penjualan limbah untuk penjual aktif (UMKM)
 */
export async function getSellerWasteTransactionsAction(): Promise<{
  success: boolean;
  data?: WasteSaleOrder[];
  message?: string;
}> {
  try {
    const headers = await getAuthHeaders();
    const res = await beFetch<any[]>("/waste-listings/transactions/sales", {
      headers,
    });

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Gagal memuat transaksi penjualan limbah",
        data: [],
      };
    }

    const formatted: WasteSaleOrder[] = (res.data || []).map((t: any) => ({
      id: t.id,
      orderNumber: t.midtrans_order_id || `WST-${t.id.slice(0, 8).toUpperCase()}`,
      listingId: t.listing_id || t.id,
      listingTitle: t.listing_title || "Residu Limbah Produktif",
      listingCategory: t.waste_category || "Residu Dapur",
      buyerName: t.buyer_name || "Pembeli Terverifikasi",
      buyerType: t.buyer_type || "Pelaku Usaha Sirkular",
      buyerPhone: t.buyer_phone || "-",
      orderedVolume: parseFloat(t.purchased_weight || "0"),
      orderedUnit: "kg",
      totalPrice: parseFloat(t.total_amount || "0"),
      orderDate: t.created_at ? new Date(t.created_at).toISOString().slice(0, 10) : "",
      pickupScheduledDate: t.pickup_date || "Sesuai Perjanjian",
      status: t.fulfillment_status === "ACCEPTED_COMPLETED" ? "SELESAI" : "MENUNGGU_DIAMBIL",
      notes: t.notes || "",
      location: t.pickup_address || "Dapur UMKM",
    }));

    return {
      success: true,
      data: formatted,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Gagal memuat transaksi penjualan limbah",
      data: [],
    };
  }
}

/**
 * Mengonfirmasi serah-terima penjualan limbah oleh UMKM penjual dengan kode pickup
 */
export async function confirmWastePickupAction(
  transactionId: string,
  pickupCode: string
): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  try {
    const headers = await getAuthHeaders();
    const res = await beFetch(`/waste-listings/${transactionId}/confirm-pickup`, {
      method: "POST",
      headers,
      body: JSON.stringify({ pickup_code: pickupCode }),
    });

    if (res.success) {
      revalidatePath("/pesanan");
      return {
        success: true,
        message: "Serah-terima residu tuntas! Dana escrow dicairkan ke saldo kas.",
        data: res.data,
      };
    }

    return {
      success: false,
      message: res.message || "Kode pickup tidak valid atau tidak cocok",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Gagal mengonfirmasi serah-terima limbah",
    };
  }
}
