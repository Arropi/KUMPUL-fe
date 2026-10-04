/**
 * Engine Intelijen Menu & Resep untuk Platform KUMPUL UMKM
 * Berdasarkan spesifikasi brief.md:
 * 1. Menu Engineering Matrix (Star, Plowhorse, Puzzle, Dog)
 * 2. Alternatif Bahan Cerdas (Ketersediaan Pasar & Upgrade Sehat)
 * 3. Analisis Finansial Komparatif (Margin Murni vs Sirkular Boost)
 * 4. Agregasi Ketahanan Stok Dapur
 */

import type { BEProduct, BERecipe } from "@/lib/api/types";
import { getProductWastePrediction } from "@/lib/ai-waste-prediction";

export type SectorType =
  | "PERTANIAN"
  | "PETERNAKAN"
  | "PERIKANAN"
  | "PERKEBUNAN"
  | "FNB_PENGOLAHAN"
  | "RITEL"
  | "LOGISTIK";

export interface IngredientAlternativeSuggestion {
  originalIngredientName: string;
  suggestedIngredientName: string;
  category: "MARKET_AVAILABILITY" | "HEALTH_WELLNESS";
  reason: string;
  estimatedCostImpactPercentage: number; // e.g. -35% (hemat) atau +15% (premium upgrade)
  healthBadges?: string[];              // ["Gluten-Free", "Low-GI", "Non-MSG"]
}

export interface MenuEngineeringInsight {
  classification: "STAR" | "PLOWHORSE" | "PUZZLE" | "DOG";
  label: string;
  badge: string;
  recommendedAction: string;
  actionPriority: "HIGH" | "MEDIUM" | "LOW";
  marketingTip: string;
  badgeVariant: "success" | "warning" | "info" | "neutral";
}

export interface CircularMarginComparison {
  sellingPrice: number;
  hppPerUnit: number;
  pureProfitPerUnit: number;
  pureMarginPercentage: number;
  wasteRevenuePerUnit: number;
  circularProfitPerUnit: number;
  circularMarginPercentage: number;
  circularBoostPercentage: number;
  dailyWasteRevenue: number;
  monthlyWasteRevenue: number;
}

export interface KitchenStockItem {
  id: string;
  ingredientName: string;
  sector: SectorType;
  unit: string;
  dailyConsumption: number;
  currentStock: number;
  daysRemaining: number;
  status: "KRITIS" | "MENIPIS" | "AMAN";
  linkedProducts: string[];
}

/**
 * 1. Analisis Finansial Komparatif (Murni vs Sirkular Boost)
 */
export function calculateCircularMargin(product: BEProduct): CircularMarginComparison {
  const sellingPrice =
    typeof product.target_selling_price_per_unit === "number"
      ? product.target_selling_price_per_unit
      : parseFloat(product.target_selling_price_per_unit || "0");

  const hpp =
    typeof product.calculated_hpp_per_unit === "number"
      ? product.calculated_hpp_per_unit
      : parseFloat(product.calculated_hpp_per_unit || "0");

  const batchUnits = Math.max(1, product.expected_batch_units || 1);
  const iterationsPerDay = Math.max(1, product.production_iterations_per_day || 2);
  const dailyOutputUnits = batchUnits * iterationsPerDay;

  // Prediksi limbah dari engine AI
  const waste = getProductWastePrediction(product);
  const wasteRevenuePerBatch = waste.totalPotentialRevenuePerBatch || 0;
  const wasteRevenuePerUnit = wasteRevenuePerBatch / batchUnits;

  const pureProfit = Math.max(0, sellingPrice - hpp);
  const pureMarginPct = sellingPrice > 0 ? (pureProfit / sellingPrice) * 100 : 0;

  const circularProfit = pureProfit + wasteRevenuePerUnit;
  const circularMarginPct = sellingPrice > 0 ? (circularProfit / sellingPrice) * 100 : 0;
  const circularBoostPct = Math.max(0, circularMarginPct - pureMarginPct);

  const dailyWasteRev = wasteRevenuePerUnit * dailyOutputUnits;
  const monthlyWasteRev = dailyWasteRev * 30;

  return {
    sellingPrice,
    hppPerUnit: hpp,
    pureProfitPerUnit: pureProfit,
    pureMarginPercentage: pureMarginPct,
    wasteRevenuePerUnit,
    circularProfitPerUnit: circularProfit,
    circularMarginPercentage: circularMarginPct,
    circularBoostPercentage: circularBoostPct,
    dailyWasteRevenue: dailyWasteRev,
    monthlyWasteRevenue: monthlyWasteRev,
  };
}

/**
 * 2. Menu Engineering Matrix (Star, Plowhorse, Puzzle, Dog)
 */
export function getMenuEngineeringInsight(product: BEProduct): MenuEngineeringInsight {
  const { pureMarginPercentage, sellingPrice, hppPerUnit } = calculateCircularMargin(product);

  // Kriteria Klasifikasi Menu Matrix (brief.md Seksi 5)
  if (pureMarginPercentage >= 45) {
    if (hppPerUnit > 20000 && sellingPrice > 45000) {
      return {
        classification: "PUZZLE",
        label: "Teka-Teki (Puzzle)",
        badge: "Teka-Teki",
        recommendedAction: "Upselling & Menu Eksklusif",
        actionPriority: "MEDIUM",
        marketingTip: "Jadikan menu signature mingguan atau tawarkan bundling minuman untuk mendorong volume.",
        badgeVariant: "info",
      };
    }
    return {
      classification: "STAR",
      label: "Menu Bintang (Star)",
      badge: "Bintang",
      recommendedAction: "Push Penjualan Utama",
      actionPriority: "HIGH",
      marketingTip: "Jadikan menu unggulan di banner teratas etalase dan paket promo utama.",
      badgeVariant: "success",
    };
  } else if (pureMarginPercentage >= 25) {
    return {
      classification: "PLOWHORSE",
      label: "Kuda Beban (Plowhorse)",
      badge: "Kuda Beban",
      recommendedAction: "Optimasi Biaya Bahan",
      actionPriority: "HIGH",
      marketingTip: "Beli pasokan via pooling grosir KUMPUL untuk menekan HPP 10-15% atau naikkan harga bertahap 5%.",
      badgeVariant: "warning",
    };
  } else {
    return {
      classification: "DOG",
      label: "Margin Tipis (Dog)",
      badge: "Margin Tipis",
      recommendedAction: "Reformulasi atau Evaluasi",
      actionPriority: "LOW",
      marketingTip: "Pertimbangkan substitusi bahan alternatif bursa atau penyesuaian takaran modal resep.",
      badgeVariant: "neutral",
    };
  }
}

/**
 * 3. Deteksi Alternatif Bahan Baku Cerdas (Pasar & Sehat)
 */
export const SMART_INGREDIENT_DATABASE: Record<string, IngredientAlternativeSuggestion[]> = {
  cabai: [
    {
      originalIngredientName: "Cabai Rawit Segar",
      suggestedIngredientName: "Pasta Cabai Fermentasi / Kering Giling",
      category: "MARKET_AVAILABILITY",
      reason: "Harga cabai segar di bursa sedang fluktuatif. Opsi pasta/kering memangkas modal dan tahan lebih lama.",
      estimatedCostImpactPercentage: -30,
    },
  ],
  sapi: [
    {
      originalIngredientName: "Daging Sapi Segar",
      suggestedIngredientName: "Jamur Tiram Olahan / Ayam Afkir Petelur",
      category: "MARKET_AVAILABILITY",
      reason: "Menstabilkan HPP saat harga daging sapi melonjak dengan tekstur serat yang serupa.",
      estimatedCostImpactPercentage: -40,
    },
  ],
  terigu: [
    {
      originalIngredientName: "Tepung Terigu",
      suggestedIngredientName: "Tepung MOCAF Lokal (Singkong Modifikasi)",
      category: "HEALTH_WELLNESS",
      reason: "Bebas Gluten (Gluten-Free), ramah pencernaan, dan mendukung petani lokal.",
      estimatedCostImpactPercentage: 15,
      healthBadges: ["Gluten-Free", "Low-GI"],
    },
  ],
  gula: [
    {
      originalIngredientName: "Gula Pasir Rafinasi",
      suggestedIngredientName: "Gula Aren Organik Cair",
      category: "HEALTH_WELLNESS",
      reason: "Indeks glikemik rendah (Low GI) dengan cita rasa karamel alami yang lebih legit.",
      estimatedCostImpactPercentage: 10,
      healthBadges: ["Low-GI", "Alami"],
    },
  ],
  minyak: [
    {
      originalIngredientName: "Minyak Sawit Jenuh",
      suggestedIngredientName: "Minyak Kelapa Murni (VCO) / Canola",
      category: "HEALTH_WELLNESS",
      reason: "Mengurangi kolesterol jahat (LDL) dan tidak cepat gosong pada suhu penggorengan tinggi.",
      estimatedCostImpactPercentage: 20,
      healthBadges: ["Rendah Lemak Jenuh"],
    },
  ],
  penyedap: [
    {
      originalIngredientName: "Penyedap Sintetis (MSG)",
      suggestedIngredientName: "Kaldu Jamur Tiram Alami",
      category: "HEALTH_WELLNESS",
      reason: "Kaya asam amino bebas alami (umami alami) tanpa bahan pengawet kimia sintetis.",
      estimatedCostImpactPercentage: 10,
      healthBadges: ["Non-MSG", "Alami"],
    },
  ],
};

export function getProductIngredientAlternatives(recipes: BERecipe[] = []): IngredientAlternativeSuggestion[] {
  const results: IngredientAlternativeSuggestion[] = [];
  const seen = new Set<string>();

  recipes.forEach((rec) => {
    const lower = (rec.ingredient_name || "").toLowerCase();
    for (const [key, suggestions] of Object.entries(SMART_INGREDIENT_DATABASE)) {
      if (lower.includes(key)) {
        suggestions.forEach((s) => {
          if (!seen.has(s.suggestedIngredientName)) {
            seen.add(s.suggestedIngredientName);
            results.push(s);
          }
        });
      }
    }
  });

  return results;
}

/**
 * 4. Komputasi Agregasi Stok Dapur dari Seluruh Menu Aktif
 */
export function aggregateKitchenInventory(
  products: BEProduct[],
  storedStock: Record<string, number> = {}
): KitchenStockItem[] {
  const map: Record<
    string,
    {
      ingredientName: string;
      sector: SectorType;
      unit: string;
      dailyConsumption: number;
      linkedProducts: Set<string>;
    }
  > = {};

  products.forEach((prod) => {
    const batchUnits = Math.max(1, prod.expected_batch_units || 50);
    const iterationsPerDay = Math.max(1, prod.production_iterations_per_day || 2);
    const dailyProdCount = batchUnits * iterationsPerDay;

    (prod.recipes || []).forEach((rec) => {
      const name = rec.ingredient_name.trim();
      if (!name) return;

      const key = `${name.toLowerCase()}_${(rec.unit || "KG").toUpperCase()}`;
      const reqPerUnit = Number(rec.required_qty_per_unit) || 0;
      const dailyUse = reqPerUnit * dailyProdCount;

      // Asosiasikan sektor berdasarkan nama atau unit
      let sector: SectorType = "PERTANIAN";
      const lower = name.toLowerCase();
      if (lower.includes("ayam") || lower.includes("telur") || lower.includes("daging") || lower.includes("bebek") || lower.includes("susu")) {
        sector = "PETERNAKAN";
      } else if (lower.includes("ikan") || lower.includes("udang") || lower.includes("cumi")) {
        sector = "PERIKANAN";
      } else if (lower.includes("kopi") || lower.includes("teh") || lower.includes("cokelat") || lower.includes("kakao")) {
        sector = "PERKEBUNAN";
      } else if (lower.includes("minyak") || lower.includes("saus") || lower.includes("kecap") || lower.includes("keju") || lower.includes("terigu")) {
        sector = "FNB_PENGOLAHAN";
      } else if (lower.includes("box") || lower.includes("cup") || lower.includes("plastik") || lower.includes("kemasan")) {
        sector = "RITEL";
      }

      if (!map[key]) {
        map[key] = {
          ingredientName: name,
          sector,
          unit: (rec.unit || "KG").toUpperCase(),
          dailyConsumption: 0,
          linkedProducts: new Set(),
        };
      }

      map[key].dailyConsumption += dailyUse;
      map[key].linkedProducts.add(prod.product_name);
    });
  });

  // Hitung ketahanan stok
  return Object.entries(map).map(([key, item]) => {
    // Ambil stok dari local storage atau default mockup realistis sesuai brief.md
    let currentStock = storedStock[key];
    if (typeof currentStock !== "number") {
      const lower = item.ingredientName.toLowerCase();
      if (lower.includes("bebek")) {
        currentStock = 18.0;
      } else if (lower.includes("cabai")) {
        currentStock = 3.5;
      } else if (lower.includes("minyak")) {
        currentStock = 8.0;
      } else if (lower.includes("beras")) {
        currentStock = 75.0;
      } else if (lower.includes("paper") || lower.includes("box")) {
        currentStock = 420;
      } else {
        const hash = key.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const ratio = 0.5 + (hash % 40) / 10;
        currentStock = Math.round(item.dailyConsumption * ratio * 10) / 10;
      }
    }

    const daysRemaining = item.dailyConsumption > 0 ? currentStock / item.dailyConsumption : 99;
    let status: "KRITIS" | "MENIPIS" | "AMAN" = "AMAN";
    if (daysRemaining <= 1.0) {
      status = "KRITIS";
    } else if (daysRemaining <= 2.5) {
      status = "MENIPIS";
    }

    return {
      id: key,
      ingredientName: item.ingredientName,
      sector: item.sector,
      unit: item.unit,
      dailyConsumption: Math.round(item.dailyConsumption * 100) / 100,
      currentStock: Math.round(currentStock * 100) / 100,
      daysRemaining: Math.round(daysRemaining * 10) / 10,
      status,
      linkedProducts: Array.from(item.linkedProducts),
    };
  }).sort((a, b) => a.daysRemaining - b.daysRemaining); // Urutkan dari yang paling kritis
}

/**
 * 5. Mock Data Awal Realistis Sesuai brief.md
 * (Bila backend / local storage belum memiliki produk)
 */
export const DEFAULT_SEED_PRODUCTS: BEProduct[] = [
  {
    id: "mock-seed-bebek-goreng",
    umkm_role_id: "umkm-demo-1",
    product_name: "Bebek Goreng Kremes Sambal Korek",
    unit: "PORSI",
    target_selling_price_per_unit: 30000,
    expected_batch_units: 50,
    production_iterations_per_day: 2,
    calculated_hpp_per_unit: 18500,
    projected_margin_percentage: 38.3,
    recipes: [
      {
        id: "rec-seed-1",
        umkm_product_id: "mock-seed-bebek-goreng",
        ingredient_name: "Daging Bebek Segar",
        required_qty_per_unit: 0.25,
        unit: "EKOR",
        estimated_cost_per_unit: 12500,
      },
      {
        id: "rec-seed-2",
        umkm_product_id: "mock-seed-bebek-goreng",
        ingredient_name: "Minyak Sawit",
        required_qty_per_unit: 0.06,
        unit: "LITER",
        estimated_cost_per_unit: 1200,
      },
      {
        id: "rec-seed-3",
        umkm_product_id: "mock-seed-bebek-goreng",
        ingredient_name: "Beras Pandan",
        required_qty_per_unit: 0.15,
        unit: "KG",
        estimated_cost_per_unit: 2400,
      },
      {
        id: "rec-seed-4",
        umkm_product_id: "mock-seed-bebek-goreng",
        ingredient_name: "Cabai Rawit Merah",
        required_qty_per_unit: 0.04,
        unit: "KG",
        estimated_cost_per_unit: 1400,
      },
      {
        id: "rec-seed-5",
        umkm_product_id: "mock-seed-bebek-goreng",
        ingredient_name: "Paper Box Makanan",
        required_qty_per_unit: 1,
        unit: "PCS",
        estimated_cost_per_unit: 1000,
      },
    ],
  },
  {
    id: "mock-seed-rice-bowl-sapi",
    umkm_role_id: "umkm-demo-1",
    product_name: "Rice Bowl Daging Sapi Lada Hitam",
    unit: "BOWL",
    target_selling_price_per_unit: 38000,
    expected_batch_units: 40,
    production_iterations_per_day: 2,
    calculated_hpp_per_unit: 22000,
    projected_margin_percentage: 42.1,
    recipes: [
      {
        id: "rec-seed-6",
        umkm_product_id: "mock-seed-rice-bowl-sapi",
        ingredient_name: "Daging Sapi Segar",
        required_qty_per_unit: 0.15,
        unit: "KG",
        estimated_cost_per_unit: 16000,
      },
      {
        id: "rec-seed-7",
        umkm_product_id: "mock-seed-rice-bowl-sapi",
        ingredient_name: "Beras Pandan",
        required_qty_per_unit: 0.15,
        unit: "KG",
        estimated_cost_per_unit: 2400,
      },
      {
        id: "rec-seed-8",
        umkm_product_id: "mock-seed-rice-bowl-sapi",
        ingredient_name: "Minyak Sawit",
        required_qty_per_unit: 0.04,
        unit: "LITER",
        estimated_cost_per_unit: 800,
      },
      {
        id: "rec-seed-9",
        umkm_product_id: "mock-seed-rice-bowl-sapi",
        ingredient_name: "Bawang Bombay & Bumbu Rempah",
        required_qty_per_unit: 0.05,
        unit: "KG",
        estimated_cost_per_unit: 1300,
      },
      {
        id: "rec-seed-10",
        umkm_product_id: "mock-seed-rice-bowl-sapi",
        ingredient_name: "Paper Bowl Kemasan",
        required_qty_per_unit: 1,
        unit: "PCS",
        estimated_cost_per_unit: 1500,
      },
    ],
  },
  {
    id: "mock-seed-kopi-aren",
    umkm_role_id: "umkm-demo-1",
    product_name: "Kopi Susu Gula Aren Artisan",
    unit: "CUP",
    target_selling_price_per_unit: 22000,
    expected_batch_units: 35,
    production_iterations_per_day: 3,
    calculated_hpp_per_unit: 9500,
    projected_margin_percentage: 56.8,
    recipes: [
      {
        id: "rec-seed-11",
        umkm_product_id: "mock-seed-kopi-aren",
        ingredient_name: "Biji Kopi Robusta",
        required_qty_per_unit: 0.02,
        unit: "KG",
        estimated_cost_per_unit: 3000,
      },
      {
        id: "rec-seed-12",
        umkm_product_id: "mock-seed-kopi-aren",
        ingredient_name: "Susu Segar Pasteurisasi",
        required_qty_per_unit: 0.15,
        unit: "LITER",
        estimated_cost_per_unit: 3500,
      },
      {
        id: "rec-seed-13",
        umkm_product_id: "mock-seed-kopi-aren",
        ingredient_name: "Gula Aren Organik Cair",
        required_qty_per_unit: 0.03,
        unit: "LITER",
        estimated_cost_per_unit: 1500,
      },
      {
        id: "rec-seed-14",
        umkm_product_id: "mock-seed-kopi-aren",
        ingredient_name: "Cup Plastik & Seal",
        required_qty_per_unit: 1,
        unit: "PCS",
        estimated_cost_per_unit: 1500,
      },
    ],
  },
];

