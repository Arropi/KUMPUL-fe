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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SupplierCommodity, WholesaleUnit } from "@/constants/supplier";
import {
  CommodityCatalogCard,
  type CriticalStockNotice,
} from "@/components/katalog/commodity-catalog-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { BEBusinessEntity } from "@/lib/api/types";
import type { UserSession } from "@/constants/auth";

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
    supplier_role_id?: string;
    supplier_entity_id?: string;
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
    supplier_role_id?: string;
    supplier_entity_id?: string;
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
  initialSession?: UserSession | null;
  commodities: SupplierCommodity[];
  onPurchase?: (item: SupplierCommodity) => void;
  recommendations: MatchedCommodity[];
  rawRecommendations?: RawRecommendationsData | null;
  recsError: boolean;
  userProfile?: BEBusinessEntity | null;
}

interface HorizontalScrollContainerProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

function HorizontalScrollContainer({ children, id, className = "" }: HorizontalScrollContainerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(checkScroll, 100);
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, children]);

  const scroll = (direction: "left" | "right") => {
    const el = containerRef.current;
    if (!el) return;
    const cardWidth = 340;
    el.scrollBy({
      left: direction === "left" ? -cardWidth : cardWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative group/carousel">
      {/* Tombol Geser Kiri */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-surface border border-border shadow-elevation-2 flex items-center justify-center text-text-primary hover:bg-surface-subtle transition-all cursor-pointer opacity-95 hover:opacity-100 hover:scale-105 active:scale-95"
          aria-label="Geser ke kiri"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Kontainer Satu Baris Horisontal */}
      <div
        id={id}
        ref={containerRef}
        className={`flex flex-row items-stretch gap-4 overflow-x-auto pb-4 pt-1.5 scroll-smooth snap-x snap-mandatory focus:outline-none [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-surface-subtle/70 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-text-muted/40 ${className}`}
      >
        {children}
      </div>

      {/* Tombol Geser Kanan */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-surface border border-border shadow-elevation-2 flex items-center justify-center text-text-primary hover:bg-surface-subtle transition-all cursor-pointer opacity-95 hover:opacity-100 hover:scale-105 active:scale-95"
          aria-label="Geser ke kanan"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

function getCommodityForHealthy(
  alt: NonNullable<RawRecommendationsData["healthy_verified_alternatives"]>[number],
  commodities: SupplierCommodity[]
): SupplierCommodity {
  const found = commodities.find((c) => c.id === alt.commodity_id);
  if (found) return found;

  return {
    id: alt.commodity_id,
    sku: `SUP-${alt.commodity_id.slice(0, 4).toUpperCase()}`,
    name: alt.commodity_name,
    sector: "Pertanian",
    description: alt.verification_notes || "Bahan baku pangan mutu terverifikasi resmi.",
    wholesaleUnit: (alt.wholesale_unit as WholesaleUnit) || "KG",
    unitWeightKg: 1,
    baseMoq: 10,
    availableStock: 500,
    leadTimeDays: 1,
    isActive: true,
    priceTiers: [
      { id: `tier-${alt.commodity_id}`, minQty: 10, maxQty: null, pricePerUnit: alt.base_price, label: "Grosir" },
    ],
    batchTag: {
      id: `batch-${alt.commodity_id}`,
      licenseNumber: "VERIFIED-MUI-BPOM",
      verificationNotes: alt.verification_notes,
      productionDate: new Date().toISOString().slice(0, 10),
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      storageTemperature: (alt.storage_temp as any) || "AMBIENT",
      originLocation: alt.seller_city || "D.I. Yogyakarta",
      hygieneStatus: "TERVERIFIKASI",
    },
    imageUrl: alt.image_url || undefined,
    createdAt: new Date().toISOString(),
    sourceType: "SUPPLIER",
    sellerCity: alt.seller_city,
    sellerName: alt.supplier_name,
    hasTieringPrice: false,
    hasOpenPools: false,
  };
}

function getCommodityForNearest(
  near: NonNullable<RawRecommendationsData["nearest_suppliers"]>[number],
  commodities: SupplierCommodity[]
): SupplierCommodity {
  const found = commodities.find((c) => c.id === near.commodity_id);
  if (found) {
    return {
      ...found,
      distanceKm: near.distance_km ?? found.distanceKm,
      sellerCity: near.seller_city || found.sellerCity,
      sellerName: near.supplier_name || found.sellerName,
    };
  }

  return {
    id: near.commodity_id,
    sku: `SUP-${near.commodity_id.slice(0, 4).toUpperCase()}`,
    name: near.commodity_name,
    sector: "Pertanian",
    description: `Pemasok pangan lokal di area ${near.seller_city}.`,
    wholesaleUnit: (near.wholesale_unit as WholesaleUnit) || "KG",
    unitWeightKg: 1,
    baseMoq: 10,
    availableStock: near.stock || 500,
    leadTimeDays: 1,
    isActive: true,
    priceTiers: [
      { id: `tier-${near.commodity_id}`, minQty: 10, maxQty: null, pricePerUnit: near.base_price, label: "Grosir" },
    ],
    batchTag: {
      id: `batch-${near.commodity_id}`,
      licenseNumber: "VERIFIED-SPASIAL",
      productionDate: new Date().toISOString().slice(0, 10),
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      storageTemperature: "AMBIENT",
      originLocation: near.seller_city || "D.I. Yogyakarta",
      hygieneStatus: "TERVERIFIKASI",
    },
    imageUrl: near.image_url || undefined,
    createdAt: new Date().toISOString(),
    sourceType: "SUPPLIER",
    sellerCity: near.seller_city,
    sellerName: near.supplier_name,
    distanceKm: near.distance_km,
    hasTieringPrice: false,
    hasOpenPools: false,
  };
}

function getCommodityForPool(
  pool: NonNullable<RawRecommendationsData["cost_saving_active_pools"]>[number],
  commodities: SupplierCommodity[]
): SupplierCommodity {
  const found = commodities.find((c) => c.id === pool.commodity_id);
  if (found) {
    return {
      ...found,
      hasOpenPools: true,
      openPoolsCount: 1,
      activePools: [
        {
          id: pool.pool_id,
          targetMoq: pool.target_moq,
          accumulatedQty: pool.accumulated_qty,
          poolStatus: "OPEN",
          progressPercentage:
            pool.target_moq > 0
              ? Math.min(100, Math.round((pool.accumulated_qty / pool.target_moq) * 100))
              : 0,
        },
      ],
    };
  }

  return {
    id: pool.commodity_id,
    sku: `POOL-${pool.commodity_id.slice(0, 4).toUpperCase()}`,
    name: pool.commodity_name,
    sector: "Pertanian",
    description: `Pengadaan bersama (Pooling) dengan kuota target ${pool.target_moq}.`,
    wholesaleUnit: "KG",
    unitWeightKg: 1,
    baseMoq: pool.target_moq,
    availableStock: pool.target_moq,
    leadTimeDays: 2,
    isActive: true,
    priceTiers: [
      { id: `tier-${pool.pool_id}`, minQty: 10, maxQty: null, pricePerUnit: 25000, label: "Harga Pool" },
    ],
    batchTag: {
      id: `batch-${pool.pool_id}`,
      licenseNumber: "POOL-ACTIVE",
      productionDate: new Date().toISOString().slice(0, 10),
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      storageTemperature: "AMBIENT",
      originLocation: "D.I. Yogyakarta",
      hygieneStatus: "TERVERIFIKASI",
    },
    createdAt: new Date().toISOString(),
    sourceType: "SUPPLIER",
    hasTieringPrice: true,
    hasOpenPools: true,
    openPoolsCount: 1,
    activePools: [
      {
        id: pool.pool_id,
        targetMoq: pool.target_moq,
        accumulatedQty: pool.accumulated_qty,
        poolStatus: "OPEN",
        progressPercentage:
          pool.target_moq > 0
            ? Math.min(100, Math.round((pool.accumulated_qty / pool.target_moq) * 100))
            : 0,
      },
    ],
  };
}

function getCommodityForBenchmark(
  b: NonNullable<RawRecommendationsData["price_benchmarks"]>[number],
  commodities: SupplierCommodity[]
): SupplierCommodity {
  const found = commodities.find((c) => c.id === b.commodity_id);
  if (found) return found;

  return {
    id: b.commodity_id,
    sku: `BENCH-${b.commodity_id.slice(0, 4).toUpperCase()}`,
    name: b.commodity_name,
    sector: "Pertanian",
    description: `Komparasi harga komoditas grosir di pasar Yogyakarta.`,
    wholesaleUnit: "KG",
    unitWeightKg: 1,
    baseMoq: 10,
    availableStock: 500,
    leadTimeDays: 1,
    isActive: true,
    priceTiers: [
      { id: `tier-${b.commodity_id}`, minQty: 10, maxQty: null, pricePerUnit: b.your_base_price, label: "Harga Anda" },
    ],
    batchTag: {
      id: `batch-${b.commodity_id}`,
      licenseNumber: "MARKET-BENCHMARK",
      productionDate: new Date().toISOString().slice(0, 10),
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      storageTemperature: "AMBIENT",
      originLocation: "D.I. Yogyakarta",
      hygieneStatus: "TERVERIFIKASI",
    },
    createdAt: new Date().toISOString(),
    sourceType: "SUPPLIER",
    hasTieringPrice: false,
    hasOpenPools: false,
  };
}

export function HomeRecommendationSection({
  role,
  initialSession,
  commodities,
  recommendations,
  rawRecommendations,
  recsError,
  userProfile,
  onPurchase,
}: HomeRecommendationSectionProps) {
  const isUmkm = role === "umkm";
  const [umkmTab, setUmkmTab] = React.useState<"LOW_STOCK" | "HEALTHY" | "NEAREST" | "SAVINGS">("LOW_STOCK");

  // Helper untuk mengecualikan komoditas milik akun sendiri
  const isOwnCommodity = (sellerName?: string, roleId?: string, entityId?: string) => {
    const profileName = userProfile?.legal_name?.toLowerCase().trim();
    const sessionName = initialSession?.name?.toLowerCase().trim();
    const seller = sellerName?.toLowerCase().trim();

    if (seller && (seller === profileName || seller === sessionName)) {
      return true;
    }

    if (entityId) {
      if (userProfile?.id && entityId === userProfile.id) {
        return true;
      }
      if (initialSession?.entityId && entityId === initialSession.entityId) {
        return true;
      }
    }

    if (roleId && initialSession?.roleId && roleId === initialSession.roleId) {
      return true;
    }

    return false;
  };

  const healthyAlternatives = (rawRecommendations?.healthy_verified_alternatives || []).filter(
    (alt) => !isOwnCommodity(alt.supplier_name, alt.supplier_role_id, alt.supplier_entity_id)
  );
  const nearestSuppliers = (rawRecommendations?.nearest_suppliers || []).filter(
    (near) => !isOwnCommodity(near.supplier_name, near.supplier_role_id, near.supplier_entity_id)
  );
  const costSavingPools = (rawRecommendations?.cost_saving_active_pools || [])
    .filter((pool) => Number(pool.accumulated_qty) < Number(pool.target_moq))
    .filter((pool) => {
      const matched = commodities.find((c) => c.id === pool.commodity_id);
      return !isOwnCommodity(matched?.sellerName, matched?.supplierRoleId, matched?.supplierEntityId);
    });

  const filteredRecommendations = recommendations.filter(
    (r) => !isOwnCommodity(r.commodity.sellerName, r.commodity.supplierRoleId, r.commodity.supplierEntityId)
  );

  const hasContent =
    filteredRecommendations.length > 0 ||
    healthyAlternatives.length > 0 ||
    nearestSuppliers.length > 0 ||
    costSavingPools.length > 0;

  if (recsError && !hasContent) {
    return (
      <div className="text-center py-8 border border-dashed border-border rounded-2xl bg-surface-subtle">
        <p className="text-xs font-medium text-text-muted">
          Saat ini tidak ada yang tepat untuk direkomendasikan pada Anda.
        </p>
      </div>
    );
  }

  const criticalCount = filteredRecommendations.filter((r) => r.criticalStockNotice).length;

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
              Mesin Rekomendasi Cerdas
            </span>
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold">
                <AlertTriangle className="w-3 h-3 text-red-600 animate-pulse" />
                <span>{criticalCount} Bahan Kritis</span>
              </span>
            )}
          </div>
          <h2 className="font-heading font-bold text-lg sm:text-xl text-text-primary">
            Mesin Rekomendasi Cerdas
          </h2>
          <p className="text-xs text-text-secondary max-w-2xl">
            Kurasi bahan baku terpadu otomatis: analisis stok kritis inventaris resep, alternatif bahan pengganti terverifikasi sehat (Halal, BPOM, COA), rekomendasi penyedia terdekat di D.I. Yogyakarta, dan peluang hemat kolam patungan aktif.
          </p>
        </div>

        {/* Tab Sub-kategori UMKM */}
        <div className="flex items-center gap-1 p-1 bg-surface-subtle border border-border rounded-xl overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setUmkmTab("LOW_STOCK")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              umkmTab === "LOW_STOCK"
                ? "bg-primary text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Deteksi Stok Kritis {criticalCount > 0 ? `(${criticalCount})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setUmkmTab("HEALTHY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              umkmTab === "HEALTHY"
                ? "bg-primary text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Alternatif Bersertifikasi Sehat {healthyAlternatives.length > 0 ? `(${healthyAlternatives.length})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setUmkmTab("NEAREST")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              umkmTab === "NEAREST"
                ? "bg-primary text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Pemasok Terdekat {nearestSuppliers.length > 0 ? `(${nearestSuppliers.length})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setUmkmTab("SAVINGS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              umkmTab === "SAVINGS"
                ? "bg-primary text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Peluang Hemat Patungan {costSavingPools.length > 0 ? `(${costSavingPools.length})` : ""}
          </button>
        </div>
      </div>

      {/* Tab 1: Deteksi Stok Kritis */}
      {umkmTab === "LOW_STOCK" && (
        <div className="space-y-3">
          {filteredRecommendations.length === 0 ? (
            <Card className="p-8 text-center bg-surface border-border rounded-2xl">
              <p className="text-xs font-semibold text-text-muted">
                Saat ini tidak ada yang tepat untuk direkomendasikan pada Anda.
              </p>
            </Card>
          ) : (
            <HorizontalScrollContainer>
              {filteredRecommendations.map(({ commodity, recipeTag, benchmarkTag, criticalStockNotice }) => {
                const reason = criticalStockNotice
                  ? `Stok bahan baku ini di dapur Anda tersisa ${criticalStockNotice.daysRemaining} hari untuk menu "${criticalStockNotice.linkedMenu}". Segera lakukan pengadaan ${
                      criticalStockNotice.suggestedQty
                        ? `${criticalStockNotice.suggestedQty} ${criticalStockNotice.unit || commodity.wholesaleUnit}`
                        : ""
                    } untuk mencegah hambatan operasional produksi.`
                  : `Bahan baku ini sering digunakan dalam resep Anda (${recipeTag || commodity.name}) dan dianjurkan untuk selalu dipantau ketersediaannya di inventaris dapur.`;

                return (
                  <div
                    key={`rec-stock-${commodity.id}`}
                    className="w-[280px] sm:w-[310px] md:w-[325px] shrink-0 snap-start flex flex-col"
                  >
                    <CommodityCatalogCard
                      item={commodity}
                      role={role}
                      pageContext="home"
                      recipeTag={recipeTag}
                      benchmarkTag={benchmarkTag}
                      criticalStockNotice={criticalStockNotice}
                      recommendationReason={reason}
                      onPurchase={onPurchase}
                    />
                  </div>
                );
              })}
            </HorizontalScrollContainer>
          )}
        </div>
      )}

      {/* Tab 2: Alternatif Bersertifikasi Sehat */}
      {umkmTab === "HEALTHY" && (
        <div className="space-y-3">
          {healthyAlternatives.length === 0 ? (
            <Card className="p-8 text-center bg-surface border-border rounded-2xl">
              <p className="text-xs font-semibold text-text-muted">
                Saat ini tidak ada yang tepat untuk direkomendasikan pada Anda.
              </p>
            </Card>
          ) : (
            <HorizontalScrollContainer>
              {healthyAlternatives.map((alt) => {
                const item = getCommodityForHealthy(alt, commodities);
                const reason = alt.verification_notes
                  ? `Alternatif bahan pangan bermutu tinggi: ${alt.verification_notes}. Memiliki sertifikasi resmi (Halal MUI/BPOM/COA) untuk menjamin standar higienis usaha Anda.`
                  : `Bahan pangan ini telah terverifikasi mutunya melalui dokumen sertifikasi resmi (Halal MUI, BPOM MD, atau COA Bebas Kontaminan).`;

                return (
                  <div
                    key={`healthy-${alt.commodity_id}`}
                    className="w-[280px] sm:w-[310px] md:w-[325px] shrink-0 snap-start flex flex-col"
                  >
                    <CommodityCatalogCard
                      item={item}
                      role={role}
                      pageContext="home"
                      recipeTag="Sertifikasi Mutu Terverifikasi"
                      recommendationReason={reason}
                      onPurchase={onPurchase}
                    />
                  </div>
                );
              })}
            </HorizontalScrollContainer>
          )}
        </div>
      )}

      {/* Tab 3: Pemasok Terdekat */}
      {umkmTab === "NEAREST" && (
        <div className="space-y-3">
          {nearestSuppliers.length === 0 ? (
            <Card className="p-8 text-center bg-surface border-border rounded-2xl">
              <p className="text-xs font-semibold text-text-muted">
                Saat ini tidak ada yang tepat untuk direkomendasikan pada Anda.
              </p>
            </Card>
          ) : (
            <HorizontalScrollContainer>
              {nearestSuppliers.map((near) => {
                const item = getCommodityForNearest(near, commodities);
                const distText =
                  near.distance_km != null ? `jarak ~${near.distance_km} km` : "radius terdekat";
                const reason = `Pemasok komoditas lokal terdekat di ${near.seller_city} (${distText}). Memilih pemasok terdekat menekan ongkos logistik dan mempercepat lead time pengiriman ke dapur Anda.`;

                return (
                  <div
                    key={`near-${near.commodity_id}`}
                    className="w-[280px] sm:w-[310px] md:w-[325px] shrink-0 snap-start flex flex-col"
                  >
                    <CommodityCatalogCard
                      item={item}
                      role={role}
                      pageContext="home"
                      recipeTag={`Pemasok Terdekat: ${near.seller_city}`}
                      recommendationReason={reason}
                      onPurchase={onPurchase}
                    />
                  </div>
                );
              })}
            </HorizontalScrollContainer>
          )}
        </div>
      )}

      {/* Tab 4: Peluang Hemat Patungan */}
      {umkmTab === "SAVINGS" && (
        <div className="space-y-3">
          {costSavingPools.length === 0 ? (
            <Card className="p-8 text-center bg-surface border-border rounded-2xl">
              <p className="text-xs font-semibold text-text-muted">
                Saat ini tidak ada yang tepat untuk direkomendasikan pada Anda.
              </p>
            </Card>
          ) : (
            <HorizontalScrollContainer>
              {costSavingPools.map((pool) => {
                const item = getCommodityForPool(pool, commodities);
                const reason = `Peluang patungan aktif untuk ${pool.commodity_name}. Gabung pengadaan bersama sekarang untuk menghemat ${pool.estimated_savings_percentage}% harga grosir supplier (Terkumpul: ${pool.accumulated_qty}/${pool.target_moq} ${item.wholesaleUnit}).`;

                return (
                  <div
                    key={`savings-${pool.pool_id}`}
                    className="w-[280px] sm:w-[310px] md:w-[325px] shrink-0 snap-start flex flex-col"
                  >
                    <CommodityCatalogCard
                      item={item}
                      role={role}
                      pageContext="home"
                      recipeTag={`Hemat ${pool.estimated_savings_percentage}% Patungan`}
                      recommendationReason={reason}
                      onPurchase={onPurchase}
                    />
                  </div>
                );
              })}
            </HorizontalScrollContainer>
          )}
        </div>
      )}
    </div>
  );
}