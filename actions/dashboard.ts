"use server";

import { beFetch } from "@/lib/api/be-client";
import { getAuthSession } from "@/lib/auth-cookies";
import type { UserSession } from "@/constants/auth";
import type { BEProduct } from "@/lib/api/types";

export interface KitchenRunoutAlert {
  ingredient_name: string;
  current_stock: number;
  unit: string;
  daily_consumption_rate: number;
  days_until_runout: number;
  is_urgent: boolean;
}

export interface RecentOrderSummary {
  order_id: string;
  commodity_name: string;
  order_qty: number;
  grand_total: number;
  payment_status: string;
  delivery_method: string | null;
  pickup_code?: string | null;
  required_delivery_date: string | null;
}

export interface RecentWasteSummary {
  listing_id: string;
  listing_title: string;
  waste_category: string;
  available_weight: number;
  price_per_kg?: number;
  listing_status: string;
}

export interface ActivePoolRecord {
  id: string;
  commodity_id: string;
  commodity_name?: string;
  target_moq: number | string;
  accumulated_qty: number | string;
  pool_status: string;
  locked_tier_price: number | string;
  target_delivery_date: string | null;
  cutoff_date: string | null;
  is_asap_allowed: boolean;
  default_hub_address?: string | null;
}

export interface UmkmDashboardData {
  total_procurement_spent: number;
  estimated_procurement_savings: number;
  active_participations_count: number;
  waste_revenue_earned: number;
  waste_diverted_kg: number;
  kitchen_runout_alerts: KitchenRunoutAlert[];
  recent_orders: RecentOrderSummary[];
  recent_waste_listings: RecentWasteSummary[];
  pools: ActivePoolRecord[];
  session: UserSession | null;
}

export async function getUmkmDashboardDataAction(): Promise<{
  success: boolean;
  data: UmkmDashboardData;
  message?: string;
}> {
  let session: UserSession | null = null;
  try {
    session = await getAuthSession();
  } catch {
    // outside request scope
  }

  // 1. Fetch dashboard stats via BE endpoint if token is present
  const authHeaders: Record<string, string> = {};
  if (session?.token) {
    authHeaders["Authorization"] = `Bearer ${session.token}`;
  }

  const [dashboardRes, poolsRes, wasteRes, productsRes] = await Promise.all([
    beFetch<Partial<UmkmDashboardData>>("/dashboards/umkm", {
      headers: authHeaders,
    }),
    beFetch<ActivePoolRecord[]>("/pre-orders/pools?limit=20&offset=0"),
    beFetch<Array<{
      id: string;
      listing_title: string;
      waste_category: string;
      available_weight: string | number;
      price_per_kg: string | number;
      listing_status: string;
    }>>("/waste-listings?limit=5&offset=0"),
    beFetch<BEProduct[]>("/products"),
  ]);

  const rawDashboard = dashboardRes.data;

  // Build alerts: prefer backend alerts; fallback to computing from database product recipes
  let kitchenAlerts: KitchenRunoutAlert[] = [];
  if (
    rawDashboard?.kitchen_runout_alerts &&
    rawDashboard.kitchen_runout_alerts.length > 0
  ) {
    kitchenAlerts = rawDashboard.kitchen_runout_alerts;
  } else if (productsRes.data && productsRes.data.length > 0) {
    const seen = new Set<string>();
    productsRes.data.forEach((p) => {
      const batchUnits = p.expected_batch_units || 50;
      (p.recipes || []).forEach((r) => {
        const name = r.ingredient_name.trim();
        if (!name || seen.has(name.toLowerCase())) return;
        seen.add(name.toLowerCase());

        const qtyPerPortion = Number(r.required_qty_per_unit) || 0.1;
        const dailyRate = Math.round(qtyPerPortion * batchUnits * 2 * 10) / 10;
        kitchenAlerts.push({
          ingredient_name: name,
          current_stock: 0,
          unit: r.unit || "KG",
          daily_consumption_rate: dailyRate,
          days_until_runout: 0,
          is_urgent: true,
        });
      });
    });
  }

  // Build waste listings: prefer dashboard waste; fallback to bursa listings
  let wasteListings: RecentWasteSummary[] = [];
  if (
    rawDashboard?.recent_waste_listings &&
    rawDashboard.recent_waste_listings.length > 0
  ) {
    wasteListings = rawDashboard.recent_waste_listings;
  } else if (wasteRes.data && wasteRes.data.length > 0) {
    wasteListings = wasteRes.data.map((w) => ({
      listing_id: w.id,
      listing_title: w.listing_title,
      waste_category: w.waste_category,
      available_weight: Number(w.available_weight) || 0,
      price_per_kg: Number(w.price_per_kg) || 0,
      listing_status: w.listing_status,
    }));
  }

  const pools = poolsRes.data || [];

  const combinedData: UmkmDashboardData = {
    total_procurement_spent: rawDashboard?.total_procurement_spent || 0,
    estimated_procurement_savings:
      rawDashboard?.estimated_procurement_savings ||
      Math.round((rawDashboard?.total_procurement_spent || 0) * 0.12),
    active_participations_count:
      rawDashboard?.active_participations_count || pools.length,
    waste_revenue_earned: rawDashboard?.waste_revenue_earned || 0,
    waste_diverted_kg: rawDashboard?.waste_diverted_kg || 0,
    kitchen_runout_alerts: kitchenAlerts,
    recent_orders: rawDashboard?.recent_orders || [],
    recent_waste_listings: wasteListings,
    pools,
    session,
  };

  return {
    success: true,
    data: combinedData,
  };
}
