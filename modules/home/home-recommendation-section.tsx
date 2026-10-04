"use client";

import * as React from "react";
import Link from "next/link";
import { Utensils, BarChart2, ArrowRight, AlertTriangle } from "lucide-react";
import { SupplierCommodity } from "@/constants/supplier";
import {
  CommodityCatalogCard,
  type CriticalStockNotice,
} from "@/components/katalog/commodity-catalog-card";
import { getUmkmProductsAction } from "@/actions/products";
import type { BEProduct } from "@/lib/api/types";
import {
  aggregateKitchenInventory,
  DEFAULT_SEED_PRODUCTS,
  type KitchenStockItem,
} from "@/lib/menu-intelligence";

interface HomeRecommendationSectionProps {
  role: "umkm" | "supplier";
  commodities: SupplierCommodity[];
  onPurchase?: (item: SupplierCommodity) => void;
}

interface MatchedCommodity {
  commodity: SupplierCommodity;
  recipeTag?: string;
  benchmarkTag?: string;
  criticalStockNotice?: CriticalStockNotice;
}

export function HomeRecommendationSection({
  role,
  commodities,
  onPurchase,
}: HomeRecommendationSectionProps) {
  const isUmkm = role === "umkm";
  const [umkmProducts, setUmkmProducts] = React.useState<BEProduct[]>([]);
  const [criticalNeeds, setCriticalNeeds] = React.useState<KitchenStockItem[]>([]);

  React.useEffect(() => {
    if (!isUmkm) return;
    async function loadProducts() {
      try {
        const res = await getUmkmProductsAction();
        let loaded: BEProduct[] = [];
        if (res.success && res.data && res.data.length > 0) {
          loaded = res.data;
        } else {
          try {
            const saved = localStorage.getItem("kumpul_mock_products");
            if (saved) loaded = JSON.parse(saved);
          } catch {}
          if (!loaded || loaded.length === 0) {
            loaded = DEFAULT_SEED_PRODUCTS;
          }
        }
        setUmkmProducts(loaded);
      } catch {
        try {
          const saved = localStorage.getItem("kumpul_mock_products");
          if (saved) setUmkmProducts(JSON.parse(saved));
          else setUmkmProducts(DEFAULT_SEED_PRODUCTS);
        } catch {
          setUmkmProducts(DEFAULT_SEED_PRODUCTS);
        }
      }
    }
    loadProducts();
  }, [isUmkm]);

  // Muat status stok kritis dapur secara reaktif
  React.useEffect(() => {
    if (!isUmkm) return;
    try {
      const savedCritical = localStorage.getItem("kumpul_critical_kitchen_needs");
      if (savedCritical) {
        const parsed: KitchenStockItem[] = JSON.parse(savedCritical);
        if (parsed.length > 0) {
          setCriticalNeeds(parsed);
          return;
        }
      }
    } catch {}

    // Fallback: komputasi dari umkmProducts jika belum ada di localStorage
    if (umkmProducts.length > 0) {
      let savedStock: Record<string, number> = {};
      try {
        const s = localStorage.getItem("kumpul_kitchen_inventory_stock");
        if (s) savedStock = JSON.parse(s);
      } catch {}
      const items = aggregateKitchenInventory(umkmProducts, savedStock);
      const critical = items.filter((i) => i.status === "KRITIS" || i.status === "MENIPIS");
      setCriticalNeeds(critical);
    }
  }, [isUmkm, umkmProducts]);

  // Compute recommendations for UMKM based on Critical Kitchen Needs & Recipe Ingredients
  const umkmRecommendations: MatchedCommodity[] = React.useMemo(() => {
    if (!isUmkm) return [];

    const matches: MatchedCommodity[] = [];
    const seenCommodityIds = new Set<string>();

    // 1. PRIORITAS SLOT #1: Bahan Berstatus KRITIS / MENIPIS dari Dapur (brief.md Seksi 4.2)
    if (criticalNeeds.length > 0) {
      for (const crit of criticalNeeds) {
        const ingName = crit.ingredientName.toLowerCase();
        const firstWord = ingName.split(" ")[0];
        const secondWord = ingName.split(" ")[1] || "";

        const found = commodities.find((c) => {
          if (seenCommodityIds.has(c.id)) return false;
          const cName = c.name.toLowerCase();
          return (
            cName.includes(ingName) ||
            ingName.includes(cName) ||
            cName.includes(firstWord) ||
            (secondWord && cName.includes(secondWord))
          );
        });

        if (found) {
          seenCommodityIds.add(found.id);
          matches.push({
            commodity: found,
            criticalStockNotice: {
              daysRemaining: crit.daysRemaining,
              linkedMenu: crit.linkedProducts[0] || "Menu Usaha",
              suggestedQty: Math.ceil(crit.dailyConsumption * 7),
              unit: crit.unit,
            },
            recipeTag: `Stok Dapur ${crit.status}: ${crit.ingredientName}`,
          });
        }
      }
    }

    // 2. Rekomendasi Sesuai Bahan Resep Aktif (Non-Kritis)
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

    // 3. Fallback / supplementary matching against popular F&B recipes
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

    // 4. Pastikan minimal 3 rekomendasi tampil
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
  }, [isUmkm, criticalNeeds, umkmProducts, commodities]);

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
            {isUmkm && criticalNeeds.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold">
                <AlertTriangle className="w-3 h-3 text-red-600 animate-pulse" />
                <span>{criticalNeeds.length} Bahan Kritis Dapur</span>
              </span>
            )}
          </div>
          <h2 className="font-heading font-bold text-lg sm:text-xl text-text-primary">
            {isUmkm
              ? "Rekomendasi Bahan Baku Sesuai Resep Menu Anda"
              : "Rekomendasi Komoditas Serupa dengan Portofolio Anda"}
          </h2>
          <p className="text-xs text-text-secondary max-w-2xl">
            {isUmkm
              ? "Bahan pangan pokok yang terhubung dengan produk UMKM Anda. Pasokan kritis dapur otomatis diposisikan teratas dengan estimasi saran kuota 7 hari."
              : "Pantau komoditas sejenis di bursa untuk tolok ukur harga pasokan (benchmark) dan peluang pasokan konsolidasi."}
          </p>
        </div>

        {isUmkm && (
          <Link
            href="/produk"
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 shrink-0 self-start sm:self-center"
          >
            <span>Kelola Daftar Produk &amp; Resep</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Grid Kartu Rekomendasi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeRecommendations.map(({ commodity, recipeTag, benchmarkTag, criticalStockNotice }) => (
          <div key={`rec-${commodity.id}`} className="relative">
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
                recipeTag={recipeTag}
                benchmarkTag={benchmarkTag}
                criticalStockNotice={criticalStockNotice}
                onPurchase={onPurchase}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
