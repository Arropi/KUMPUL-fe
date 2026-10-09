"use client";

import * as React from "react";
import Link from "next/link";
import {
  Utensils,
  BarChart2,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  MapPin,
  TrendingDown,
  TrendingUp,
  Flame,
  Recycle,
  ShieldCheck,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { SupplierCommodity } from "@/constants/supplier";
import {
  CommodityCatalogCard,
  type CriticalStockNotice,
} from "@/components/katalog/commodity-catalog-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export interface MatchedCommodity {
  commodity: SupplierCommodity;
  recipeTag?: string;
  benchmarkTag?: string;
  criticalStockNotice?: CriticalStockNotice;
}

export interface RawRecommendationsData {
  low_stock_recommendations?: Array<{
    ingredient_name: string;
    current_stock: number;
    unit: string;
    matching_commodities: Array<{
      commodity_id: string;
      commodity_name: string;
      base_price: number;
      supplier_name: string;
      stock: number;
    }>;
  }>;
  healthy_verified_alternatives?: Array<{
    commodity_id: string;
    commodity_name: string;
    base_price: number;
    wholesale_unit: string;
    supplier_name: string;
    seller_city: string;
    storage_temp: string;
    is_verified: boolean;
    verification_notes?: string | null;
    image_url?: string | null;
  }>;
  nearest_suppliers?: Array<{
    commodity_id: string;
    commodity_name: string;
    base_price: number;
    wholesale_unit: string;
    supplier_name: string;
    seller_city: string;
    distance_km?: number | null;
    stock: number;
    image_url?: string | null;
  }>;
  circular_waste_matches?: Array<{
    listing_id: string;
    listing_title: string;
    waste_category: string;
    available_weight: number;
    price_per_kg: number;
    seller_name: string;
    distance_km?: number | null;
  }>;
  cost_saving_active_pools?: Array<{
    pool_id: string;
    commodity_id: string;
    commodity_name: string;
    target_moq: number;
    accumulated_qty: number;
    target_delivery_date: string | null;
    estimated_savings_percentage: number;
  }>;
  price_benchmarks?: Array<{
    commodity_id: string;
    commodity_name: string;
    your_base_price: number;
    market_average_price: number;
    price_competitiveness: "COMPETITIVE" | "AVERAGE" | "EXPENSIVE";
  }>;
  high_demand_ingredients?: Array<{
    ingredient_name: string;
    recipe_occurrences: number;
  }>;
}

interface HomeRecommendationSectionProps {
  role: "umkm" | "supplier";
  commodities: SupplierCommodity[];
  onPurchase?: (item: SupplierCommodity) => void;
  recommendations: MatchedCommodity[];
  rawRecommendations?: RawRecommendationsData | null;
  recsError: boolean;
}

export function HomeRecommendationSection({
  role,
  commodities,
  recommendations,
  rawRecommendations,
  recsError,
  onPurchase,
}: HomeRecommendationSectionProps) {
  const isUmkm = role === "umkm";
  const [umkmTab, setUmkmTab] = React.useState<"LOW_STOCK" | "HEALTHY" | "NEAREST" | "SAVINGS">("LOW_STOCK");
  const [supplierTab, setSupplierTab] = React.useState<"BENCHMARK" | "DEMAND">("BENCHMARK");

  if (recsError) {
    return (
      <div className="text-center py-6 border border-dashed border-border rounded-2xl bg-surface-subtle">
        <p className="text-xs text-text-muted">Gagal memuat rekomendasi cerdas dari bursa.</p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // TAMPILAN KHUSUS SUPPLIER
  // -------------------------------------------------------------
  if (!isUmkm) {
    const benchmarks = rawRecommendations?.price_benchmarks || [];
    const highDemand = rawRecommendations?.high_demand_ingredients || [];

    return (
      <div className="space-y-4 pt-2">
        {/* Header Supplier */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border/70">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-primary-light text-primary">
                <BarChart2 className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Intelijen Pasar Pemasok
              </span>
            </div>
            <h2 className="font-heading font-bold text-lg sm:text-xl text-text-primary">
              Pemantauan Harga Pasar &amp; Kebutuhan UMKM
            </h2>
            <p className="text-xs text-text-secondary max-w-2xl">
              Pantau daya saing harga komoditas Anda dibanding rata-rata bursa dan temukan bahan baku yang paling banyak dicari resep UMKM.
            </p>
          </div>

          {/* Switcher Tab Supplier */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-subtle border border-border rounded-xl self-start sm:self-center">
            <button
              type="button"
              onClick={() => setSupplierTab("BENCHMARK")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                supplierTab === "BENCHMARK"
                  ? "bg-primary text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Daya Saing Harga ({benchmarks.length})
            </button>
            <button
              type="button"
              onClick={() => setSupplierTab("DEMAND")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                supplierTab === "DEMAND"
                  ? "bg-primary text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Bahan Paling Dicari ({highDemand.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Price Benchmarks */}
        {supplierTab === "BENCHMARK" && (
          <div className="space-y-3">
            {benchmarks.length === 0 ? (
              <Card className="p-8 text-center bg-surface border-border rounded-2xl">
                <p className="text-xs font-semibold text-text-secondary">
                  Belum ada komoditas aktif untuk dibandingkan. Tambahkan katalog komoditas Anda untuk melihat analisis perbandingan harga pasar.
                </p>
                <Link href="/katalog/tambah" className="mt-3 inline-block">
                  <Button variant="primary" size="sm" className="font-semibold text-xs">
                    + Tambah Komoditas Sekarang
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {benchmarks.map((b) => {
                  const isCompetitive = b.price_competitiveness === "COMPETITIVE";
                  const isExpensive = b.price_competitiveness === "EXPENSIVE";
                  const diffPrice = b.your_base_price - b.market_average_price;
                  const diffPct = b.market_average_price > 0
                    ? Math.round((Math.abs(diffPrice) / b.market_average_price) * 100)
                    : 0;

                  return (
                    <Card
                      key={b.commodity_id}
                      className="p-4 bg-surface border-border rounded-2xl shadow-elevation-1 space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-heading font-bold text-sm text-text-primary line-clamp-1">
                            {b.commodity_name}
                          </h3>
                          {isCompetitive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-800 text-[10px] font-bold px-2 py-0.5 border border-emerald-500/25 shrink-0">
                              <TrendingDown className="w-3 h-3 text-emerald-600" />
                              Kompetitif
                            </span>
                          ) : isExpensive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-800 text-[10px] font-bold px-2 py-0.5 border border-amber-500/25 shrink-0">
                              <TrendingUp className="w-3 h-3 text-amber-600" />
                              Di Atas Rata-rata
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 text-blue-800 text-[10px] font-bold px-2 py-0.5 border border-blue-500/25 shrink-0">
                              Rata-rata Pasar
                            </span>
                          )}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-surface-subtle border border-border/60">
                          <div>
                            <span className="text-[10px] text-text-muted block">Harga Anda</span>
                            <span className="font-heading font-bold text-sm text-primary">
                              {formatCurrency(b.your_base_price)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-text-muted block">Rata-rata Pasar</span>
                            <span className="font-heading font-bold text-sm text-text-primary">
                              {formatCurrency(b.market_average_price)}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-text-secondary mt-2">
                          {isCompetitive
                            ? `Harga Anda ${diffPct}% lebih terjangkau. Peluang besar menarik agregasi pesanan UMKM.`
                            : isExpensive
                            ? `Harga Anda ${diffPct}% lebih tinggi. Pertimbangkan fasilitas diskon tiering / pooling.`
                            : "Harga Anda sejalan dengan pasar saat ini."}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                        <Link
                          href={`/katalog/${b.commodity_id}`}
                          className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <span>Kelola Pasokan</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: High Demand Ingredients */}
        {supplierTab === "DEMAND" && (
          <div className="space-y-3">
            {highDemand.length === 0 ? (
              <Card className="p-8 text-center bg-surface border-border rounded-2xl">
                <p className="text-xs font-semibold text-text-secondary">
                  Belum ada data permintaan resep UMKM yang tercatat.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {highDemand.map((d, idx) => (
                  <Card
                    key={`${d.ingredient_name}-${idx}`}
                    className="p-4 bg-surface border-border rounded-2xl shadow-elevation-1 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-primary uppercase block">
                        Paling Banyak Dicari #{idx + 1}
                      </span>
                      <h4 className="font-heading font-bold text-sm text-text-primary truncate">
                        {d.ingredient_name}
                      </h4>
                      <p className="text-xs text-text-muted mt-0.5">
                        Digunakan di <strong className="text-text-primary">{d.recipe_occurrences}</strong> resep menu UMKM
                      </p>
                    </div>

                    <Link href={`/katalog/tambah?name=${encodeURIComponent(d.ingredient_name)}`}>
                      <Button variant="secondary" size="sm" className="shrink-0 text-xs font-semibold gap-1">
                        <Plus className="w-3 h-3 text-primary" />
                        <span>Sediakan</span>
                      </Button>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // TAMPILAN KHUSUS UMKM
  // -------------------------------------------------------------
  const criticalCount = recommendations.filter((r) => r.criticalStockNotice).length;
  const healthyAlternatives = rawRecommendations?.healthy_verified_alternatives || [];
  const nearestSuppliers = rawRecommendations?.nearest_suppliers || [];
  const costSavingPools = (rawRecommendations?.cost_saving_active_pools || []).filter(
    (pool) => Number(pool.accumulated_qty) < Number(pool.target_moq)
  );

  return (
    <div className="space-y-4 pt-2">
      {/* Header Rekomendasi UMKM */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-700">
              <Utensils className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Mesin Rekomendasi Bahan Baku
            </span>
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold">
                <AlertTriangle className="w-3 h-3 text-red-600 animate-pulse" />
                <span>{criticalCount} Bahan Kritis Dapur</span>
              </span>
            )}
          </div>
          <h2 className="font-heading font-bold text-lg sm:text-xl text-text-primary">
            Rekomendasi Cerdas Pengadaan Bahan Dapur
          </h2>
          <p className="text-xs text-text-secondary max-w-2xl">
            Dioptimalkan untuk menjaga stok dapur UMKM Anda, alternatif bahan lebih sehat bersertifikasi mutu AI, serta efisiensi jarak pengiriman.
          </p>
        </div>

        {/* Tab Sub-kategori UMKM */}
        <div className="flex items-center gap-1 p-1 bg-surface-subtle border border-border rounded-xl overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setUmkmTab("LOW_STOCK")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              umkmTab === "LOW_STOCK"
                ? "bg-primary text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Stok Dapur {criticalCount > 0 ? `(${criticalCount})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setUmkmTab("HEALTHY")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              umkmTab === "HEALTHY"
                ? "bg-primary text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Mutu AI {healthyAlternatives.length > 0 ? `(${healthyAlternatives.length})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setUmkmTab("NEAREST")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              umkmTab === "NEAREST"
                ? "bg-primary text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Pemasok Terdekat
          </button>
          {costSavingPools.length > 0 && (
            <button
              type="button"
              onClick={() => setUmkmTab("SAVINGS")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                umkmTab === "SAVINGS"
                  ? "bg-primary text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Hemat Pool ({costSavingPools.length})
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Stok Kritis / Resep Dapur */}
      {umkmTab === "LOW_STOCK" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recommendations.slice(0, 6).map(({ commodity, recipeTag, benchmarkTag, criticalStockNotice }) => (
            <div key={`rec-stock-${commodity.id}`} className="relative">
              <div
                className={`absolute -inset-0.5 rounded-2xl blur-[2px] opacity-75 pointer-events-none ${
                  criticalStockNotice
                    ? "bg-gradient-to-r from-red-500/25 to-amber-500/25"
                    : "bg-gradient-to-r from-emerald-500/20 to-primary/20"
                }`}
              />
              <div className="relative">
                <CommodityCatalogCard
                  item={commodity}
                  role={role}
                  pageContext="home"
                  recipeTag={recipeTag}
                  benchmarkTag={benchmarkTag}
                  criticalStockNotice={criticalStockNotice}
                  onPurchase={onPurchase}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Alternatif Lebih Sehat (Paspor Mutu AI) */}
      {umkmTab === "HEALTHY" && (
        <div className="space-y-3">
          {healthyAlternatives.length === 0 ? (
            <Card className="p-8 text-center bg-surface border-border rounded-2xl">
              <p className="text-xs text-text-secondary">
                Belum ada komoditas terverifikasi mutu tambahan saat ini. Seluruh komoditas bursa terverifikasi dapat dilihat pada daftar di bawah.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {healthyAlternatives.map((alt) => {
                const matched = commodities.find((c) => c.id === alt.commodity_id);
                if (matched) {
                  return (
                    <div key={`healthy-${alt.commodity_id}`} className="relative">
                      <div className="absolute -inset-0.5 rounded-2xl blur-[2px] opacity-75 pointer-events-none bg-gradient-to-r from-emerald-500/25 to-teal-500/25" />
                      <div className="relative">
                        <CommodityCatalogCard
                          item={matched}
                          role={role}
                          pageContext="home"
                          recipeTag="Uji Mutu AI Lolos"
                          onPurchase={onPurchase}
                        />
                      </div>
                    </div>
                  );
                }

                // Fallback card sederhana jika belum ada di state catalog
                return (
                  <Card
                    key={`healthy-card-${alt.commodity_id}`}
                    className="p-4 bg-surface border-border rounded-2xl shadow-elevation-1 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-[11px] font-bold text-emerald-800 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg w-fit">
                        <span>Paspor Mutu Gemini AI</span>
                      </div>
                      <h3 className="font-heading font-bold text-base text-text-primary mt-2">
                        {alt.commodity_name}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1">
                        Pemasok: {alt.supplier_name} &bull; {alt.seller_city}
                      </p>
                      <div className="mt-2 text-sm font-extrabold text-primary">
                        {formatCurrency(alt.base_price)} / {alt.wholesale_unit}
                      </div>
                    </div>
                    <Link href={`/katalog/${alt.commodity_id}`}>
                      <Button variant="primary" size="sm" className="w-full text-xs font-bold">
                        Lihat Paspor Mutu &amp; Pesan
                      </Button>
                    </Link>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Supplier Terdekat */}
      {umkmTab === "NEAREST" && (
        <div className="space-y-3">
          {nearestSuppliers.length === 0 ? (
            <Card className="p-8 text-center bg-surface border-border rounded-2xl">
              <p className="text-xs text-text-secondary">
                Belum ada data jarak pemasok terdekat yang tercatat.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {nearestSuppliers.map((near) => {
                const matched = commodities.find((c) => c.id === near.commodity_id);
                if (matched) {
                  return (
                    <div key={`near-${near.commodity_id}`} className="relative">
                      <div className="absolute -inset-0.5 rounded-2xl blur-[2px] opacity-75 pointer-events-none bg-gradient-to-r from-primary/20 to-emerald-500/20" />
                      <div className="relative">
                        <CommodityCatalogCard
                          item={matched}
                          role={role}
                          pageContext="home"
                          recipeTag={`Hub Logistik: ${near.seller_city}`}
                          onPurchase={onPurchase}
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <Card
                    key={`near-card-${near.commodity_id}`}
                    className="p-4 bg-surface border-border rounded-2xl shadow-elevation-1 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 border border-primary/25 px-2.5 py-0.5 rounded-lg w-fit">
                        <MapPin className="w-3 h-3 text-primary" />
                        <span>{near.seller_city}</span>
                      </div>
                      <h3 className="font-heading font-bold text-base text-text-primary mt-2">
                        {near.commodity_name}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1">
                        Pemasok: {near.supplier_name} &bull; Stok: {near.stock} {near.wholesale_unit}
                      </p>
                      <div className="mt-2 text-sm font-extrabold text-primary">
                        {formatCurrency(near.base_price)} / {near.wholesale_unit}
                      </div>
                    </div>
                    <Link href={`/katalog/${near.commodity_id}`}>
                      <Button variant="primary" size="sm" className="w-full text-xs font-bold">
                        Pesan dari Hub Ini
                      </Button>
                    </Link>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Penghematan Pool */}
      {umkmTab === "SAVINGS" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {costSavingPools.map((pool) => (
            <Card
              key={pool.pool_id}
              className="p-4 bg-surface border-border rounded-2xl shadow-elevation-1 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-md">
                    Hemat {pool.estimated_savings_percentage}%
                  </span>
                  {pool.target_delivery_date && (
                    <span className="text-[10px] text-text-muted font-medium">
                      Est. Tiba: {pool.target_delivery_date}
                    </span>
                  )}
                </div>

                <h3 className="font-heading font-bold text-sm text-text-primary mt-2">
                  {pool.commodity_name}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Target Pool: {pool.target_moq} &bull; Terkumpul: {pool.accumulated_qty}
                </p>
              </div>

              <Link href={`/katalog/${pool.commodity_id}`}>
                <Button variant="primary" size="sm" className="w-full text-xs font-bold">
                  Gabung Pool Hemat Ini
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}