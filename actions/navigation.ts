"use server";

import { beFetch } from "@/lib/api/be-client";
import { getAuthSession } from "@/lib/auth-cookies";
import type { UserRole } from "@/constants/auth";

export interface SidebarBadges {
  [navId: string]: string | undefined;
  pesanan?: string;
  dashboard?: string;
  limbah?: string;
  katalog?: string;
}

export async function getSidebarBadgesAction(
  role: UserRole
): Promise<SidebarBadges> {
  let session = null;
  try {
    session = await getAuthSession();
  } catch {
    return {};
  }

  if (!session?.token) {
    return {};
  }

  const authHeaders = { Authorization: `Bearer ${session.token}` };

  if (role === "supplier") {
    try {
      const posRes = await beFetch<Array<{ status: string }>>("/orders/supplier/pos", {
        headers: authHeaders,
      });

      const badges: SidebarBadges = {};

      if (posRes.success && Array.isArray(posRes.data)) {
        const newCount = posRes.data.filter(
          (po) => po.status === "PAID_TO_ESCROW" || po.status === "ISSUED"
        ).length;
        if (newCount > 0) {
          badges.pesanan = `${newCount} Baru`;
        }
      }

      return badges;
    } catch {
      return {};
    }
  }

  // Role UMKM
  try {
    const [ordersRes, dashboardRes] = await Promise.all([
      beFetch<Array<{ status: string }>>("/orders/umkm/all", { headers: authHeaders }),
      beFetch<{ active_participations_count?: number }>("/dashboards/umkm", {
        headers: authHeaders,
      }),
    ]);

    const badges: SidebarBadges = {};

    // 1. Pesanan: hitung pesanan bahan baku yang siap diambil di Hub (READY_FOR_PICKUP)
    if (ordersRes.success && Array.isArray(ordersRes.data)) {
      const readyCount = ordersRes.data.filter(
        (o) => o.status === "READY_FOR_PICKUP"
      ).length;
      if (readyCount > 0) {
        badges.pesanan = `${readyCount} Siap`;
      }
    }

    // 2. Dashboard: hitung partisipasi kamar pooling yang sedang aktif
    if (dashboardRes.success && dashboardRes.data) {
      const activeCount = Number(dashboardRes.data.active_participations_count) || 0;
      if (activeCount > 0) {
        badges.dashboard = `${activeCount} Aktif`;
      }
    }

    return badges;
  } catch {
    return {};
  }
}
