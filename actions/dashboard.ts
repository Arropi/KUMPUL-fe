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

  const [dashboardRes, poolsRes] = await Promise.all([
    beFetch<Partial<UmkmDashboardData>>("/dashboards/umkm", {
      headers: authHeaders,
    }),
    beFetch<ActivePoolRecord[]>("/pre-orders/pools?limit=20&offset=0"),
  ]);

  const rawDashboard = dashboardRes.data;

  // Build alerts: gunakan data resmi backend untuk akun UMKM ini (bernilai [] jika belum ada produk)
  let kitchenAlerts: KitchenRunoutAlert[] = [];
  if (dashboardRes.success && Array.isArray(rawDashboard?.kitchen_runout_alerts)) {
    kitchenAlerts = rawDashboard.kitchen_runout_alerts;
  } else if (!dashboardRes.success && session?.entityId) {
    // Fallback darurat HANYA jika endpoint dashboard backend gagal dan HANYA untuk produk milik akun ini sendiri
    const userProductsRes = await beFetch<BEProduct[]>(`/products/entity-id/${session.entityId}`);
    if (userProductsRes.success && userProductsRes.data && userProductsRes.data.length > 0) {
      const seen = new Set<string>();
      userProductsRes.data.forEach((p) => {
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
  }

  // Build waste listings: gunakan data resmi akun dari backend
  let wasteListings: RecentWasteSummary[] = [];
  if (dashboardRes.success && Array.isArray(rawDashboard?.recent_waste_listings)) {
    wasteListings = rawDashboard.recent_waste_listings;
  }

  const pools = poolsRes.data || [];

  const combinedData: UmkmDashboardData = {
    total_procurement_spent: Number(rawDashboard?.total_procurement_spent) || 0,
    estimated_procurement_savings:
      Number(rawDashboard?.estimated_procurement_savings) ||
      Math.round((Number(rawDashboard?.total_procurement_spent) || 0) * 0.12),
    active_participations_count: Number(rawDashboard?.active_participations_count) || 0,
    waste_revenue_earned: Number(rawDashboard?.waste_revenue_earned) || 0,
    waste_diverted_kg: Number(rawDashboard?.waste_diverted_kg) || 0,
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

export interface SupplierActivePoolItem {
  pool_id: string;
  commodity_name: string;
  target_moq: number;
  accumulated_qty: number;
  progress_percentage: number;
  pool_status: string;
  target_delivery_date: string | null;
}

export interface SupplierTopCommodityItem {
  commodity_id: string;
  name: string;
  total_sold_qty: number;
  total_revenue: number;
}

export interface SupplierCompetitivenessBenchmarkItem {
  commodity_name: string;
  your_price: number;
  market_average: number;
  status: "COMPETITIVE" | "AVERAGE" | "EXPENSIVE";
}

export interface SupplierDashboardPOItem {
  id: string;
  po_number: string;
  commodity_name?: string;
  total_quantity: number | string;
  wholesale_unit: string;
  total_weight_kg?: number;
  grand_total_amount: number | string;
  po_status: string;
  delivery_method?: string;
  created_at: string;
}

export interface SupplierDashboardCommodityItem {
  id: string;
  name: string;
  sku: string;
  wholesale_unit: string;
  base_price: number | string;
  stock: number | string;
  base_moq: number | string;
  is_active: boolean;
}

export interface SupplierDashboardData {
  total_commodities: number;
  total_orders_received: number;
  total_revenue: number;
  active_pools_count: number;
  escrow_balance_held: number;
  active_pools: SupplierActivePoolItem[];
  top_commodities: SupplierTopCommodityItem[];
  competitiveness_benchmarks: SupplierCompetitivenessBenchmarkItem[];
  recent_pos: SupplierDashboardPOItem[];
  commodities: SupplierDashboardCommodityItem[];
  session: UserSession | null;
}

export async function getSupplierDashboardDataAction(): Promise<{
  success: boolean;
  data: SupplierDashboardData;
  message?: string;
}> {
  let session: UserSession | null = null;
  try {
    session = await getAuthSession();
  } catch {
    // outside request scope
  }

  const authHeaders: Record<string, string> = {};
  if (session?.token) {
    authHeaders["Authorization"] = `Bearer ${session.token}`;
  }

  // Resolve supplier role and entity id
  let supplierRoleId = session?.roleId;
  let entityId = session?.entityId;

  if (!supplierRoleId || !entityId) {
    const rolesRes = await beFetch<Array<{ id: string; entity_id: string }>>(
      "/business/roles?role_type=SUPPLIER"
    );
    if (rolesRes.success && rolesRes.data && rolesRes.data.length > 0) {
      supplierRoleId = supplierRoleId || rolesRes.data[0].id;
      entityId = entityId || rolesRes.data[0].entity_id;
    }
  }

  const [dashboardRes, posRes, catalogsRes] = await Promise.all([
    beFetch<Partial<SupplierDashboardData>>("/dashboards/supplier", {
      headers: authHeaders,
    }),
    beFetch<SupplierDashboardPOItem[]>(
      supplierRoleId
        ? `/orders/supplier/pos?supplier_role_id=${supplierRoleId}`
        : "/orders/supplier/pos"
    ),
    beFetch<SupplierDashboardCommodityItem[]>(
      entityId
        ? `/supplier-catalogs/entity-id/${entityId}`
        : "/supplier-catalogs"
    ),
  ]);

  const rawDashboard = dashboardRes.data;
  const commodities = catalogsRes.data || [];
  const recentPos = posRes.data || [];

  const combinedData: SupplierDashboardData = {
    total_commodities: rawDashboard?.total_commodities ?? commodities.length,
    total_orders_received: rawDashboard?.total_orders_received ?? recentPos.length,
    total_revenue: rawDashboard?.total_revenue ?? 0,
    active_pools_count: rawDashboard?.active_pools_count ?? (rawDashboard?.active_pools?.length ?? 0),
    escrow_balance_held: rawDashboard?.escrow_balance_held ?? 0,
    active_pools: rawDashboard?.active_pools ?? [],
    top_commodities: rawDashboard?.top_commodities ?? [],
    competitiveness_benchmarks: rawDashboard?.competitiveness_benchmarks ?? [],
    recent_pos: recentPos,
    commodities,
    session,
  };

  return {
    success: true,
    data: combinedData,
  };
}
