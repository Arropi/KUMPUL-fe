"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, Utensils, BarChart2, ArrowRight } from "lucide-react";
import { SupplierCommodity } from "@/constants/supplier";
import { CommodityCatalogCard } from "@/components/katalog/commodity-catalog-card";
import { getUmkmProductsAction } from "@/actions/products";
import type { BEProduct } from "@/lib/api/types";

interface HomeRecommendationSectionProps {
  role: "umkm" | "supplier";
  commodities: SupplierCommodity[];
  onPurchase?: (item: SupplierCommodity) => void;
}

interface MatchedCommodity {
  commodity: SupplierCommodity;
  recipeTag?: string;
  benchmarkTag?: string;
}

export function HomeRecommendationSection({
  role,
  commodities,
  onPurchase,
}: HomeRecommendationSectionProps) {
  const isUmkm = role === "umkm";
  const [umkmProducts, setUmkmProducts] = React.useState<BEProduct[]>([]);
  const [criticalStockItems, setCriticalStockItems] = React.useState<
    Array<{
      name: string;
      status: "KRITIS" | "MENIPIS";
      daysRemaining: number;
    }>
  >([]);

  React.useEffect(() => {
    if (!isUmkm) return;
    async function loadProducts() {
      try {
        const res = await getUmkmProductsAction();
        if (res.success && res.data && res.data.length > 0) {
          setUmkmProducts(res.data);
        }
      } catch {
        // Fallback default recipes
      }
    }
    loadProducts();

    // Muat data status stok kritis dapur dari localStorage
    try {
      const saved = localStorage.getItem("kumpul_kitchen_critical_items");
      if (saved) {
        setCriticalStockItems(JSON.parse(saved));
      }
    } catch {
      // Ignore storage error
    }
  }, [isUmkm]);

  // Compute recommendations for UMKM based on Recipe Ingredients & Critical Kitchen Stocks
  const umkmRecommendations: MatchedCommodity[] = React.useMemo(() => {
    if (!isUmkm) return [];

    const matches: MatchedCommodity[] = [];
    const seenCommodityIds = new Set<string>();

    // 0. PRIORITAS UTAMA: Bahan Baku dengan Stok Dapur Kritis & Menipis
    if (criticalStockItems.length > 0) {
      for (const crit of criticalStockItems) {
        const cName = crit.name.toLowerCase();
        const found = commodities.find(
          (c) =>
            !seenCommodityIds.has(c.id) &&
            (c.name.toLowerCase().includes(cName) ||
              cName.includes(c.name.toLowerCase().split(" ")[0]))
        );
        if (found) {
          seenCommodityIds.add(found.id);
          matches.push({
            commodity: found,
            recipeTag:
              crit.status === "KRITIS"
                ? `⚠️ Stok Kritis Dapur (Sisa ${crit.daysRemaining} Hari) • Segera Restock`
                : `⚡ Stok Dapur Menipis (Sisa ${crit.daysRemaining} Hari) • Restock`,
          });
        }
      }
    }

    // 1. If products exist with recipes in DB
    if (umkmProducts.length > 0) {
      for (const prod of umkmProducts) {
        if (prod.recipes && prod.recipes.length > 0) {
          for (const rec of prod.recipes) {
            const ingName = rec.ingredient_name.toLowerCase();
            const found = commodities.find(
              (c) =>
                !seenCommodityIds.has(c.id) &&
                (c.name.toLowerCase().includes(ingName) ||
                  ingName.includes(c.name.toLowerCase().split(" ")[0]))
            );
            if (found) {
              seenCommodityIds.add(found.id);
              matches.push({
                commodity: found,
                recipeTag: `Bahan: ${rec.ingredient_name} (${prod.product_name})`,
              });
            }
          }
        }
      }
    }

    // 2. Fallback / supplementary matching against popular F&B recipes
    const defaultRecipeRules = [
      { keyword: "beras", label: "Kebutuhan Menu Nasi Kotak & Kuliner" },
      { keyword: "ayam", label: "Kebutuhan Menu Olahan Ayam & Unggas" },
      { keyword: "bawang", label: "Kebutuhan Bumbu Dasar & Sambal" },
      { keyword: "kedelai", label: "Kebutuhan Olahan Tahu & Tempe" },
      { keyword: "telur", label: "Kebutuhan Menu Sarapan & Olahan Telur" },
      { keyword: "minyak", label: "Kebutuhan Penggorengan Dapur Usaha" },
    ];

    for (const rule of defaultRecipeRules) {
      if (matches.length >= 4) break;
      const found = commodities.find(
        (c) => !seenCommodityIds.has(c.id) && c.name.toLowerCase().includes(rule.keyword)
      );
      if (found) {
        seenCommodityIds.add(found.id);
        matches.push({
          commodity: found,
          recipeTag: rule.label,
        });
      }
    }

    // If still less than 3, add first available commodities
    if (matches.length < 3) {
      for (const c of commodities) {
        if (matches.length >= 3) break;
        if (!seenCommodityIds.has(c.id)) {
          seenCommodityIds.add(c.id);
          matches.push({
            commodity: c,
            recipeTag: `Rekomendasi Bahan Pokok Sektor ${c.sector}`,
          });
        }
      }
    }

    return matches;
  }, [isUmkm, umkmProducts, commodities]);

  // Compute recommendations for Supplier based on Similar Commodities & Sector Benchmarks
  const supplierRecommendations: MatchedCommodity[] = React.useMemo(() => {
    if (isUmkm) return [];

    // Filter commodities matching key sectors for market comparison
    const matches: MatchedCommodity[] = [];
    const targetSectors = ["Pertanian", "FnB / Pengolahan", "Peternakan"];

    for (const c of commodities) {
      if (targetSectors.includes(c.sector)) {
        matches.push({
          commodity: c,
          benchmarkTag: `Tolok Ukur Pasar: Sektor ${c.sector}`,
        });
      }
      if (matches.length >= 3) break;
    }

    if (matches.length === 0) {
      return commodities.slice(0, 3).map((c) => ({
        commodity: c,
        benchmarkTag: "Tolok Ukur Harga Bursa",
      }));
    }

    return matches;
  }, [isUmkm, commodities]);

  const activeRecommendations = isUmkm ? umkmRecommendations : supplierRecommendations;

  if (activeRecommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Header Rekomendasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-border/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-700">
              {isUmkm ? <Utensils className="w-4 h-4" /> : <BarChart2 className="w-4 h-4" />}
            </span>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {isUmkm ? "Sesuai Kebutuhan Resep Dapur" : "Tolok Ukur Pasar Serupa"}
            </span>
          </div>
          <h2 className="font-heading font-bold text-lg sm:text-xl text-text-primary">
            {isUmkm
              ? "Rekomendasi Bahan Baku Sesuai Resep Menu Anda"
              : "Rekomendasi Komoditas Serupa dengan Portofolio Anda"}
          </h2>
          <p className="text-xs text-text-secondary max-w-2xl">
            {isUmkm
              ? "Bahan pangan pokok yang terhubung dengan menu UMKM Anda untuk memotong HPP via pooling kuota grosir. Klik beli untuk masuk ke detail."
              : "Pantau komoditas sejenis di bursa untuk tolok ukur harga pasokan (benchmark) dan peluang pasokan konsolidasi."}
          </p>
        </div>

        {isUmkm && (
          <Link
            href="/menu"
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 shrink-0 self-start sm:self-center"
          >
            <span>Kelola Daftar Menu &amp; Resep</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Grid Kartu Rekomendasi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeRecommendations.map(({ commodity, recipeTag, benchmarkTag }) => (
          <div key={`rec-${commodity.id}`} className="relative">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-primary/20 blur-[2px] opacity-75 pointer-events-none" />
            <div className="relative">
              <CommodityCatalogCard
                item={commodity}
                role={role}
                recipeTag={recipeTag}
                benchmarkTag={benchmarkTag}
                onPurchase={onPurchase}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
