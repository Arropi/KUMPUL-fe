"use server";

import { revalidatePath } from "next/cache";
import { beFetch } from "@/lib/api/be-client";
import { getAuthSession } from "@/lib/auth-cookies";
import type {
  BEWasteListing,
  BENearestOfftaker,
  BEWasteTransaction,
  BEWasteCategory,
} from "@/lib/api/types";

/**
 * Helper untuk menyisipkan Authorization header dari sesi JWT aktif
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  let session = null;
  try {
    session = await getAuthSession();
  } catch {
    // Di luar konteks request
  }

  if (session?.token) {
    return {
      Authorization: `Bearer ${session.token}`,
    };
  }

  return {};
}

export interface CreateWasteListingInput {
  title: string;
  availableWeight: number;
  pricePerKg: number;
  expiredAt: string;
  notes?: string;
  productId?: string;
  category?: BEWasteCategory;
}

/**
 * Server Action: Mengambil daftar listing limbah dari Bursa Sirkular Backend Express
 */
export async function getWasteListingsAction(params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  myListingsOnly?: boolean;
}): Promise<{
  success: boolean;
  data: BEWasteListing[];
  message?: string;
}> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status) searchParams.set("status", params.status);
    else searchParams.set("status", "ALL");
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    else searchParams.set("limit", "50");
    if (params?.myListingsOnly) searchParams.set("my_listings_only", "true");

    const qs = searchParams.toString();
    const endpoint = `/waste-listings${qs ? `?${qs}` : ""}`;
    const res = await beFetch<BEWasteListing[]>(endpoint);
    return {
      success: res.success,
      data: res.data || [],
      message: res.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      data: [],
      message: err instanceof Error ? err.message : "Gagal memuat listing limbah",
    };
  }
}

/**
 * Server Action: Publikasikan listing limbah baru ke Bursa P2P Backend Express
 * Catatan: UI limbah tidak memiliki pilihan kategori limbah,
 * sehingga kategori di-default secara otomatis ke 'ORGANIK_BASAH' untuk kepatuhan schema DB backend.
 */
export async function createWasteListingAction(
  payload: CreateWasteListingInput
): Promise<{
  success: boolean;
  data?: BEWasteListing;
  message?: string;
}> {
  try {
    const authHeaders = await getAuthHeaders();

    // Default ke ORGANIK_BASAH sesuai spesifikasi UI tanpa picker kategori
    const wasteCategory: BEWasteCategory = payload.category || "ORGANIK_BASAH";

    const bodyPayload = {
      listing_title: payload.title.trim(),
      waste_category: wasteCategory,
      available_weight: Number(payload.availableWeight),
      price_per_kg: Number(payload.pricePerKg),
      expired_at: new Date(payload.expiredAt).toISOString(),
      notes: payload.notes?.trim() || undefined,
      umkm_product_id: payload.productId || undefined,
      is_marketplace_visible: true,
    };

    const res = await beFetch<BEWasteListing>("/waste-listings", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(bodyPayload),
    });

    if (res.success && res.data) {
      try {
        revalidatePath("/limbah");
        revalidatePath("/dashboard");
      } catch {
        // Safe revalidation ignore
      }
      return {
        success: true,
        data: res.data,
        message: res.message || "Listing limbah berhasil dipublikasikan!",
      };
    }

    return {
      success: false,
      message: res.message || "Gagal membuat listing limbah di server",
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kendala saat menghubungi server",
    };
  }
}

export interface UpdateWasteListingInput {
  title?: string;
  category?: BEWasteCategory;
  availableWeight?: number;
  pricePerKg?: number;
  expiredAt?: string;
  notes?: string;
  isMarketplaceVisible?: boolean;
}

/**
 * Server Action: Memperbarui data listing limbah di Backend Express
 */
export async function updateWasteListingAction(
  listingId: string,
  payload: UpdateWasteListingInput
): Promise<{
  success: boolean;
  data?: BEWasteListing;
  message?: string;
}> {
  try {
    const authHeaders = await getAuthHeaders();
    const bodyPayload: Record<string, unknown> = {};
    if (payload.title !== undefined) bodyPayload.listing_title = payload.title.trim();
    if (payload.category !== undefined) bodyPayload.waste_category = payload.category;
    if (payload.availableWeight !== undefined) bodyPayload.available_weight = Number(payload.availableWeight);
    if (payload.pricePerKg !== undefined) bodyPayload.price_per_kg = Number(payload.pricePerKg);
    if (payload.expiredAt !== undefined) bodyPayload.expired_at = new Date(payload.expiredAt).toISOString();
    if (payload.notes !== undefined) bodyPayload.notes = payload.notes.trim();
    if (payload.isMarketplaceVisible !== undefined) bodyPayload.is_marketplace_visible = payload.isMarketplaceVisible;

    const res = await beFetch<BEWasteListing>(`/waste-listings/${listingId}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify(bodyPayload),
    });

    if (res.success && res.data) {
      try {
        revalidatePath("/limbah");
        revalidatePath("/dashboard");
      } catch {
        // Safe revalidation ignore
      }
      return {
        success: true,
        data: res.data,
        message: res.message || "Listing limbah berhasil diperbarui!",
      };
    }

    return {
      success: false,
      message: res.message || "Gagal memperbarui listing limbah",
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kendala saat menghubungi server",
    };
  }
}

/**
 * Server Action: Menghapus listing limbah dari Backend Express
 */
export async function deleteWasteListingAction(
  listingId: string
): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const authHeaders = await getAuthHeaders();
    const res = await beFetch(`/waste-listings/${listingId}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    if (res.success) {
      try {
        revalidatePath("/limbah");
        revalidatePath("/dashboard");
      } catch {
        // Safe revalidation ignore
      }
      return {
        success: true,
        message: res.message || "Listing limbah berhasil dihapus!",
      };
    }

    return {
      success: false,
      message: res.message || "Gagal menghapus listing limbah",
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kendala saat menghapus listing",
    };
  }
}

/**
 * Server Action: Mengambil 5 Bank Sampah / TPS3R terdekat via Backend Express (Haversine Formula)
 */
export async function getNearestOfftakersAction(query?: {
  latitude?: number;
  longitude?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  data: BENearestOfftaker[];
  message?: string;
}> {
  try {
    const authHeaders = await getAuthHeaders();
    const searchParams = new URLSearchParams();
    if (query?.latitude !== undefined) searchParams.set("latitude", String(query.latitude));
    if (query?.longitude !== undefined) searchParams.set("longitude", String(query.longitude));
    searchParams.set("limit", String(query?.limit || 5));

    const endpoint = `/waste-listings/recommendations/offtakers?${searchParams.toString()}`;

    const res = await beFetch<BENearestOfftaker[]>(endpoint, {
      headers: authHeaders,
    });

    return {
      success: res.success,
      data: res.data || [],
      message: res.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      data: [],
      message: err instanceof Error ? err.message : "Gagal memuat rekomendasi Bank Sampah terdekat",
    };
  }
}

/**
 * Server Action: Merujuk limbah kedaluwarsa ke Bank Sampah terdaftar
 */
export async function referWasteToOfftakerAction(
  listingId: string,
  offtakerId: string
): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const authHeaders = await getAuthHeaders();
    const res = await beFetch(`/waste-listings/${listingId}/refer-offtaker`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ offtaker_id: offtakerId }),
    });

    if (res.success) {
      try {
        revalidatePath("/limbah");
      } catch {
        // Safe revalidation ignore
      }
      return {
        success: true,
        message: res.message || "Limbah berhasil dirujuk ke Bank Sampah mitra!",
      };
    }

    return {
      success: false,
      message: res.message || "Gagal merujuk limbah ke Bank Sampah",
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kendala saat merujuk limbah",
    };
  }
}

export interface DepositWasteToBankSampahInput {
  listingId: string;
  bankSampahName: string;
  revenueAmount: number;
  weightKg?: number;
  notes?: string;
}

/**
 * Server Action: Mencatat penyetoran limbah ke Bank Sampah beserta pendapatan hasil penjualan
 */
export async function depositWasteToBankSampahAction(
  payload: DepositWasteToBankSampahInput
): Promise<{
  success: boolean;
  data?: unknown;
  message?: string;
}> {
  try {
    const authHeaders = await getAuthHeaders();
    const res = await beFetch(`/waste-listings/${payload.listingId}/bank-sampah`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        bank_sampah_name: payload.bankSampahName.trim(),
        revenue_amount: Number(payload.revenueAmount),
        weight_kg: payload.weightKg ? Number(payload.weightKg) : undefined,
        notes: payload.notes?.trim(),
      }),
    });

    if (res.success) {
      try {
        revalidatePath("/limbah");
        revalidatePath("/dashboard");
      } catch {
        // Safe revalidation ignore
      }
      return {
        success: true,
        data: res.data,
        message: res.message || "Limbah berhasil disetor ke Bank Sampah dan pendapatan tercatat!",
      };
    }

    return {
      success: false,
      message: res.message || "Gagal mencatat penyetoran ke Bank Sampah",
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kendala saat menyetor ke Bank Sampah",
    };
  }
}
/**
 * Server Action: Mengambil transaksi penjualan limbah dapur UMKM (seller)
 */
export async function getWasteSalesTransactionsAction(): Promise<{
  success: boolean;
  data: BEWasteTransaction[];
  message?: string;
}> {
  try {
    const authHeaders = await getAuthHeaders();
    const res = await beFetch<BEWasteTransaction[]>("/waste-listings/transactions/sales", {
      headers: authHeaders,
    });

    return {
      success: res.success,
      data: res.data || [],
      message: res.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      data: [],
      message: err instanceof Error ? err.message : "Gagal memuat riwayat penjualan limbah",
    };
  }
}

/**
 * Server Action: Konfirmasi serah terima penjemputan limbah dengan kode OTP pickup
 */
export async function confirmWastePickupAction(
  transactionId: string,
  pickupCode: string
): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const authHeaders = await getAuthHeaders();
    const res = await beFetch(`/waste-listings/${transactionId}/confirm-pickup`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ pickup_code: pickupCode.trim() }),
    });

    if (res.success) {
      try {
        revalidatePath("/pesanan");
        revalidatePath("/limbah");
      } catch {
        // Safe revalidation ignore
      }
      return {
        success: true,
        message: res.message || "Pengambilan limbah berhasil diverifikasi!",
      };
    }

    return {
      success: false,
      message: res.message || "Gagal mengonfirmasi penjemputan limbah",
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kendala saat konfirmasi serah terima",
    };
  }
}

/**
 * Server Action: Beli listing limbah langsung P2P antar-UMKM (tanpa batas MOQ)
 */
export async function buyWasteListingAction(
  listingId: string,
  purchasedWeight: number,
  pickupDate?: string
): Promise<{
  success: boolean;
  data?: any;
  message?: string;
}> {
  try {
    const authHeaders = await getAuthHeaders();
    const targetPickupDate = pickupDate || new Date().toISOString().slice(0, 10);
    const res = await beFetch<{
      snap_redirect_url?: string;
      pickup_code?: string;
      order_id?: string;
    }>(`/waste-listings/${listingId}/buy`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        purchased_weight: purchasedWeight,
        pickup_date: targetPickupDate,
      }),
    });

    if (res.success) {
      try {
        revalidatePath("/limbah");
        revalidatePath("/pesanan");
        revalidatePath("/home");
      } catch {
        // Safe ignore
      }
      return {
        success: true,
        data: res.data,
        message: res.message || "Pesanan limbah sirkular berhasil diproses!",
      };
    }

    return {
      success: false,
      message: res.message || "Gagal melakukan pembelian limbah",
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kendala saat pembelian limbah",
    };
  }
}

export interface AiWastePriceInput {
  title: string;
  category?: string;
  volume?: number;
  unit?: string;
  description?: string;
  expiryDate?: string;
}

export interface AiWastePriceResult {
  suggested_price: number;
  price_range: string;
  min_price: number;
  max_price: number;
  target_industry: string;
  recommended_category: string;
  quality_grade: "PREMIUM" | "STANDAR" | "EKONOMI";
  reasoning: string;
  carbon_offset_kg_estimate?: number;
}

/**
 * Server Action: Estimasi harga pasar wajar dan valuasi ekonomi sirkular berbasis Gemini AI
 */
export async function getAiWastePriceRecommendationAction(
  payload: AiWastePriceInput
): Promise<{
  success: boolean;
  data?: AiWastePriceResult;
  message?: string;
}> {
  try {
    const authHeaders = await getAuthHeaders();
    const res = await beFetch<AiWastePriceResult>(
      "/waste-listings/ai/price-recommendation",
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          title: payload.title,
          category: payload.category,
          volume: payload.volume,
          unit: payload.unit,
          description: payload.description,
          expiry_date: payload.expiryDate,
        }),
      }
    );

    if (res.success && res.data) {
      return {
        success: true,
        data: res.data,
        message: res.message || "Rekomendasi harga wajar AI berhasil dihitung",
      };
    }

    return {
      success: false,
      message: res.message || "Gagal memperoleh rekomendasi harga AI",
    };
  } catch (err: unknown) {
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memproses rekomendasi harga AI",
    };
  }
}
