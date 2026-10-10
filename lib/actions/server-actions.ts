import { cookies } from 'next/headers';
import { beFetch } from '@/lib/api/be-client';
import { mapBEToSupplierCommodity, mapBEWasteToSupplierCommodity } from '@/modules/supplier/helpers';

/**
 * Server-side beFetch that forwards cookies from the request.
 * This ensures the backend receives the same authentication context as the client.
 */
async function beFetchServer<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  let cookieHeader = '';
  let token: string | undefined = undefined;

  try {
    const cookieStore = await cookies();
    // Build cookie header from all cookies
    const cookieList = cookieStore.getAll();
    cookieHeader = cookieList
      .map(({ name, value }) => `${name}=${value}`)
      .join('; ');

    const tokenCookie = cookieStore.get('kumpul_token');
    token = tokenCookie?.value;

    if (!token) {
      const sessionCookie = cookieStore.get('kumpul_session');
      if (sessionCookie?.value) {
        try {
          const parsed = JSON.parse(sessionCookie.value);
          if (parsed.token) token = parsed.token;
        } catch {}
      }
    }
  } catch {
    // Abaikan jika dipanggil di luar konteks request Next.js
  }

  const opts = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    // Important: disable caching for mutable data or when auth is required
    cache: 'no-store' as RequestCache,
  };

  return beFetch<T>(endpoint, opts);
}

/**
 * Fetch data for the home page: catalog and recommendations.
 */
export async function fetchHomeData() {
  // Fetch catalog, recommendations, and circular waste in parallel
  const [catalogRes, recsRes, wasteRes] = await Promise.all([
    beFetchServer<any[]>(`/api/marketplace?limit=50`),
    beFetchServer<any>(`/api/marketplace/recommendations`),
    beFetchServer<any[]>(`/waste-listings?limit=50`),
  ]);

  const rawCatalog = catalogRes.success && Array.isArray(catalogRes.data) ? catalogRes.data : [];
  const supplierCommodities = rawCatalog.map(mapBEToSupplierCommodity);

  const rawWaste = wasteRes.success && Array.isArray(wasteRes.data) ? wasteRes.data : [];
  const wasteCommodities = rawWaste
    .filter((w: any) => w.listing_status === "AVAILABLE")
    .map(mapBEWasteToSupplierCommodity);

  // Satukan komoditas pemasok dan bursa limbah sirkular UMKM
  const catalog = [...supplierCommodities, ...wasteCommodities];

  // Identifikasi akun sesi aktif untuk mengecualikan komoditas milik akun sendiri
  let sessionUser: { entityId?: string; roleId?: string; name?: string } | null = null;
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('kumpul_session');
    if (sessionCookie?.value) {
      const parsed = JSON.parse(sessionCookie.value);
      sessionUser = {
        entityId: parsed.entityId,
        roleId: parsed.roleId,
        name: parsed.name,
      };
    }
  } catch {}

  const isOwnItem = (c: any) => {
    if (!sessionUser) return false;
    if (sessionUser.entityId && c.supplierEntityId && sessionUser.entityId === c.supplierEntityId) {
      return true;
    }
    if (sessionUser.roleId && c.supplierRoleId && sessionUser.roleId === c.supplierRoleId) {
      return true;
    }
    if (
      sessionUser.name &&
      c.sellerName &&
      sessionUser.name.toLowerCase().trim() === c.sellerName.toLowerCase().trim()
    ) {
      return true;
    }
    return false;
  };

  const filteredCatalog = catalog.filter((c) => !isOwnItem(c));

  const rawRecs = recsRes.success && recsRes.data ? recsRes.data : null;

  // Bangun rekomendasi MatchedCommodity untuk UMKM dari data rekomendasi jika ada
  let recommendations: any[] = [];
  if (rawRecs && Array.isArray(rawRecs.low_stock_recommendations)) {
    rawRecs.low_stock_recommendations.forEach((ls: any) => {
      if (Array.isArray(ls.matching_commodities)) {
        ls.matching_commodities.forEach((mc: any) => {
          const found = filteredCatalog.find((c) => c.id === mc.commodity_id);
          if (found && !recommendations.some((r) => r.commodity.id === found.id)) {
            recommendations.push({
              commodity: found,
              recipeTag: `Kebutuhan Dapur: ${ls.ingredient_name}`,
              criticalStockNotice:
                Number(ls.current_stock) <= 10
                  ? {
                      daysRemaining: Number(ls.current_stock) <= 5 ? 1 : 3,
                      linkedMenu: ls.ingredient_name,
                      suggestedQty: 25,
                      unit: ls.unit,
                    }
                  : undefined,
            });
          }
        });
      }
    });
  }

  // Jika recommendations masih kosong, fallback ke 3 komoditas bursa terverifikasi pertama (HANYA DARI NON-OWN CATALOG)
  if (recommendations.length === 0 && filteredCatalog.length > 0) {
    recommendations = filteredCatalog.slice(0, 3).map((c) => ({
      commodity: c,
      recipeTag:
        c.batchTag.hygieneStatus === "TERVERIFIKASI" ? "Rekomendasi Mutu AI" : undefined,
    }));
  }

  return {
    catalog: filteredCatalog,
    recommendations,
    rawRecommendations: rawRecs,
    catalogError: !catalogRes.success,
    recsError: !recsRes.success,
  };
}

/**
 * Fetch UMKM purchase history and sales.
 */
export async function fetchUmkmTransactions() {
  const [purchasesRes, salesRes] = await Promise.all([
    beFetchServer<any[]>(`/api/orders/umkm/all`),
    beFetchServer<any[]>(`/api/orders/umkm/waste-sales`), // adjust endpoint if needed
  ]);

  return {
    purchases: purchasesRes.success ? (purchasesRes.data ?? []) : [],
    sales: salesRes.success ? (salesRes.data ?? []) : [],
    loadingPurchases: false, // data is already fetched
    loadingSales: false,
    errorPurchases: purchasesRes.success ? null : (purchasesRes.message ?? 'Failed to load purchases'),
    errorSales: salesRes.success ? null : (salesRes.message ?? 'Failed to load sales'),
  };
}

/**
 * Fetch supplier purchase orders ( consolidated PO list ).
 */
export async function fetchSupplierPOList() {
  const res = await beFetchServer<any[]>(`/api/orders/supplier/pos?limit=20&offset=0`);
  return {
    orders: res.success ? (res.data ?? []) : [],
    loading: false,
    error: res.success ? null : (res.message ?? 'Failed to load PO list'),
  };
}

/**
 * Fetch a single supplier PO detail by ID.
 */
export async function fetchSupplierPODetail(poId: string) {
  const res = await beFetchServer<any>(`/api/orders/supplier/pos/${poId}`);
  return {
    po: res.success && res.data ? res.data : null,
    loading: false,
    error: res.success ? null : (res.message ?? 'Failed to load PO detail'),
  };
}

/**
 * Fetch UMKM pools (for dashboard).
 */
export async function fetchUmkmPools() {
  const res = await beFetchServer<any[]>(`/api/pre-orders/pools?limit=20&offset=0`);
  return {
    pools: res.success ? (res.data ?? []) : [],
    loading: false,
    error: res.success ? null : (res.message ?? 'Failed to load pools'),
  };
}