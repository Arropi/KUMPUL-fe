import { cookies } from 'next/headers';
import { beFetch } from '@/lib/api/be-client';

/**
 * Server-side beFetch that forwards cookies from the request.
 * This ensures the backend receives the same authentication context as the client.
 */
async function beFetchServer<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const cookieStore = await cookies();
  // Build cookie header from all cookies
  const cookieList = cookieStore.getAll();
  const cookieHeader = cookieList
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  const opts = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
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
  // Fetch catalog and recommendations in parallel
  const [catalogRes, recsRes] = await Promise.all([
    beFetchServer<any[]>(`/api/marketplace?limit=20&offset=0&ready_stock=true`),
    beFetchServer<any[]>(`/api/marketplace/recommendations`),
  ]);

  const catalog = catalogRes.success ? (catalogRes.data ?? []) : [];
  const recommendations = recsRes.success
    ? (recsRes.data ?? []).map((item: any) => ({
        // Map BE response to MatchedCommodity shape expected by UI
        commodity: {
          id: item.commodity_id ?? item.id ?? '',
          name: item.commodity_name ?? item.name ?? '',
          sector: item.sector ?? '',
          description: item.description ?? '',
          wholesaleUnit: item.wholesale_unit ?? 'KARUNG',
          unitWeightKg: Number(item.unit_weight_kg ?? 0),
          baseMoq: Number(item.base_moq ?? 0),
          availableStock: Number(item.available_stock ?? 0),
          leadTimeDays: Number(item.lead_time_days ?? 0),
          isActive: item.is_active ?? true,
          priceTiers: Array.isArray(item.price_tiers) ? item.price_tiers : [],
          batchTag:
            item.batchTag && typeof item.batchTag === 'object'
              ? {
                  id: item.batchTag.id ?? '',
                  licenseNumber: item.batchTag.licenseNumber ?? '',
                  productionDate: item.batchTag.productionDate ?? '',
                  expiryDate: item.batchTag.expiryDate ?? '',
                  storageTemperature: item.batchTag.storageTemperature ?? 'AMBIENT',
                  originLocation: item.batchTag.originLocation ?? '',
                  hygieneStatus: item.batchTag.hygieneStatus ?? 'TERVERIFIKASI',
                }
              : {
                  id: '',
                  licenseNumber: '',
                  productionDate: '',
                  expiryDate: '',
                  storageTemperature: 'AMBIENT',
                  originLocation: '',
                  hygieneStatus: 'TERVERIFIKASI',
                },
          imageUrl: item.image_url ?? null,
          createdAt: item.created_at ?? '',
          allowsUnderMoq: item.allows_under_moq ?? false,
          underMoqPricePerKg: item.under_moq_price_per_kg ?? null,
          productionDate: item.production_date ?? null,
          expiryDate: item.expiry_date ?? null,
          sku: item.sku ?? '',
        },
        recipeTag: item.recipeTag ?? '',
        benchmarkTag: item.benchmarkTag ?? '',
        criticalStockNotice: item.criticalStockNotice ?? undefined,
      }))
    : [];

  return {
    catalog,
    recommendations,
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