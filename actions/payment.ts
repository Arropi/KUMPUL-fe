"use server";

import { revalidatePath } from "next/cache";
import { beFetch } from "@/lib/api/be-client";
import { getAuthSession } from "@/lib/auth-cookies";

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

export interface SnapTokenResult {
  success: boolean;
  snapToken?: string;
  snapRedirectUrl?: string;
  orderId?: string;
  grossAmount?: string;
  message?: string;
}

/**
 * Server Action: Menginisialisasi token pembayaran Midtrans Snap untuk pesanan pengadaan UMKM
 */
export async function createPaymentSnapTokenAction(
  orderId: string,
  deliveryMethod?: "HEMAT_HUB" | "DIRECT_DOOR_TO_DOOR"
): Promise<SnapTokenResult> {
  try {
    const headers = await getAuthHeaders();
    const payload: { order_id: string; delivery_method?: string } = {
      order_id: orderId,
    };
    if (deliveryMethod) {
      payload.delivery_method = deliveryMethod;
    }

    const res = await beFetch<{
      order_id: string;
      midtrans_order_id: string;
      snap_token: string;
      snap_redirect_url: string;
      gross_amount: string;
    }>("/payments/snap-token", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (res.success && res.data) {
      revalidatePath("/pesanan");
      return {
        success: true,
        snapToken: res.data.snap_token,
        snapRedirectUrl: res.data.snap_redirect_url,
        orderId: res.data.order_id,
        grossAmount: res.data.gross_amount,
        message: "Token pembayaran Midtrans Snap berhasil dibuat",
      };
    }

    return {
      success: false,
      message: res.message || "Gagal membuat sesi pembayaran Midtrans Snap",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Terjadi kendala saat menghubungi gateway pembayaran",
    };
  }
}

/**
 * Server Action: Mengecek dan menyinkronkan status transaksi pembayaran pesanan dengan Midtrans & Escrow
 */
export async function checkPaymentStatusAction(orderId: string): Promise<{
  success: boolean;
  isSettled?: boolean;
  status?: string;
  data?: any;
  message?: string;
}> {
  try {
    const headers = await getAuthHeaders();
    const res = await beFetch<any>(`/payments/status/${orderId}`, {
      headers,
    });

    if (res.success && res.data) {
      revalidatePath("/pesanan");
      const isSettled =
        res.data.transaction_status === "settlement" ||
        res.data.payment_status === "SETTLED" ||
        res.data.transaction_status === "capture";

      return {
        success: true,
        isSettled,
        status: res.data.transaction_status,
        data: res.data,
        message: res.message || "Status transaksi berhasil diverifikasi",
      };
    }

    return {
      success: false,
      message: res.message || "Gagal memverifikasi status pembayaran",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Terjadi kendala saat memeriksa status transaksi",
    };
  }
}

/**
 * Server Action: Mensimulasikan pembayaran Sandbox (Dummy Payment) langsung selesai tanpa uang riil
 */
export async function simulatePaymentAction(orderId: string): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  try {
    const headers = await getAuthHeaders();
    const res = await beFetch<any>(`/payments/simulate-sandbox-pay`, {
      method: "POST",
      headers,
      body: JSON.stringify({ order_id: orderId }),
    });

    if (res.success) {
      revalidatePath("/pesanan");
      return {
        success: true,
        data: res.data,
        message: "Simulasi pembayaran Sandbox berhasil diselesaikan!",
      };
    }

    return {
      success: false,
      message: res.message || "Gagal mensimulasikan pembayaran Sandbox",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Terjadi kendala saat mensimulasikan pembayaran",
    };
  }
}
