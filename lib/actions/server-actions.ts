import { cookies } from 'next/headers';
import { beFetch } from '@/lib/api/be-client';
import { mapBEToSupplierCommodity, mapBEWasteToSupplierCommodity } from '@/modules/supplier/helpers';
import type { SupplierCommodity } from '@/constants/supplier';
import type { MatchedCommodity } from '@/modules/home/home-recommendation-section';

function extractSearchKeywords(name: string): string[] {
  const synonyms: Record<string, string[]> = {
    cabe: ["cabe", "cabai", "rawit"],
    cabai: ["cabe", "cabai", "rawit"],
    rawit: ["cabe", "cabai", "rawit"],
    ayam: ["ayam", "unggas"],
    minyak: ["minyak", "goreng"],
    beras: ["beras", "padi"],
    bawang: ["bawang"],
    kopi: ["kopi"],
    kedelai: ["kedelai", "soya"],
    bebek: ["bebek"],
    telur: ["telur", "telor"],
    gula: ["gula"],
    tepung: ["tepung"],
    ikan: ["ikan"],
    susu: ["susu"],
    daging: ["daging"],
    garam: ["garam"],
  };
  const ignored = new Set([
    "fillet",
    "mentah",
    "segar",
    "super",
    "grade",
    "pack",
    "biji",
    "curah",
    "pilihan",
    "kering",
    "halus",
    "bubuk",
    "potong",
  ]);

  const words = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !ignored.has(w));

  const keywords = new Set<string>();
  for (const w of words) {
    if (synonyms[w]) {
      synonyms[w].forEach((s) => keywords.add(s));
    } else {
      keywords.add(w);
    }
  }
  return Array.from(keywords);
}
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

  // Bangun rekomendasi MatchedCommodity untuk UMKM dari data kebutuhan stok yang menipis
  const recommendations: MatchedCommodity[] = [];
  interface RawLowStockItem {
    ingredient_name: string;
    current_stock: number | string;
    unit: string;
    matching_commodities?: Array<{
      commodity_id: string;
      commodity_name: string;
      base_price: number;
      supplier_name: string;
      stock: number;
    }>;
  }

  const rawLowStocks: RawLowStockItem[] =
    rawRecs && Array.isArray(rawRecs.low_stock_recommendations)
      ? (rawRecs.low_stock_recommendations as RawLowStockItem[])
      : [];

  if (rawLowStocks.length > 0) {
    for (const ls of rawLowStocks) {
      const stockNum = typeof ls.current_stock === "number" ? ls.current_stock : parseFloat(String(ls.current_stock)) || 0;
      const daysLeft = stockNum <= 2 ? 1 : stockNum <= 5 ? 2 : stockNum <= 10 ? 3 : 5;
      const suggestedQty = Math.max(10, Math.round(50 - stockNum));

      // 1. Cek matching_commodities dari response API
      const matchedItems: SupplierCommodity[] = [];
      if (Array.isArray(ls.matching_commodities) && ls.matching_commodities.length > 0) {
        for (const mc of ls.matching_commodities) {
          const found = filteredCatalog.find((c) => c.id === mc.commodity_id);
          if (found && !matchedItems.some((item) => item.id === found.id)) {
            matchedItems.push(found);
          }
        }
      }

      // 2. Jika matching_commodities kosong atau belum ada yang cocok di filteredCatalog, cari via keyword matching di katalog
      if (matchedItems.length === 0) {
        const keywords = extractSearchKeywords(ls.ingredient_name || "");
        if (keywords.length > 0) {
          const found = filteredCatalog.filter((c) => {
            const cName = c.name.toLowerCase();
            return keywords.some((kw) => cName.includes(kw));
          });
          matchedItems.push(...found);
        }
      }

      // 3. Tambahkan ke recommendations dengan criticalStockNotice yang jelas
      for (const commodity of matchedItems) {
        if (!recommendations.some((r) => r.commodity.id === commodity.id)) {
          recommendations.push({
            commodity,
            criticalStockNotice: {
              daysRemaining: daysLeft,
              linkedMenu: ls.ingredient_name,
              suggestedQty,
              unit: ls.unit || commodity.wholesaleUnit || "KG",
              currentStock: stockNum,
            },
          });
        }
      }
    }
  }

  // Jika recommendations masih kosong, fallback ke 3 komoditas bursa terverifikasi pertama
  if (recommendations.length === 0 && filteredCatalog.length > 0) {
    recommendations.push(
      ...filteredCatalog.slice(0, 3).map((c) => ({
        commodity: c,
        recipeTag:
          c.batchTag.hygieneStatus === "TERVERIFIKASI" ? "Rekomendasi Mutu AI" : undefined,
      }))
    );
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