"use client";

import * as React from "react";
import Link from "next/link";
import {
  Utensils,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Layers,
  Leaf,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { BEProduct } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import { deleteProductAction, deleteRecipeItemAction } from "@/actions/products";
import {
  SECTOR_OPTIONS,
  INGREDIENT_ALTERNATIVES,
  type SectorType,
} from "./menu-types";

interface MenuCardProps {
  product: BEProduct;
  onDeleted: (productId: string) => void;
  onEdit?: (product: BEProduct) => void;
}

export function MenuCard({ product, onDeleted, onEdit }: MenuCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [isAltExpanded, setIsAltExpanded] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const price =
    typeof product.target_selling_price_per_unit === "number"
      ? product.target_selling_price_per_unit
      : parseFloat(product.target_selling_price_per_unit || "0");

  const hpp =
    typeof product.calculated_hpp_per_unit === "number"
      ? product.calculated_hpp_per_unit
      : parseFloat(product.calculated_hpp_per_unit || "0");

  const pureMarginPct =
    typeof product.projected_margin_percentage === "number"
      ? product.projected_margin_percentage
      : parseFloat(product.projected_margin_percentage || "0");

  const pureMarginNominal = Math.max(0, price - hpp);

  // Iterasi Produksi Harian (Derived dari expected_batch_units)
  const batchTotal = product.expected_batch_units || 50;
  const iterationsPerDay = batchTotal >= 60 ? 2 : 1;
  const unitsPerIteration = Math.round(batchTotal / iterationsPerDay);

  // Estimasi pendapatan limbah per porsi (1000 - 1800 per unit tergantung bahan masakan)
  const recipes = product.recipes || [];
  const hasOilOrMeat = recipes.some((r) => {
    const n = r.ingredient_name.toLowerCase();
    return (
      n.includes("minyak") ||
      n.includes("ayam") ||
      n.includes("daging") ||
      n.includes("bebek") ||
      n.includes("ikan") ||
      n.includes("kedelai") ||
      n.includes("kopi")
    );
  });

  const estimatedWasteRevenuePerUnit = hasOilOrMeat ? 1200 : 600;
  const circularMarginNominal = pureMarginNominal + estimatedWasteRevenuePerUnit;
  const circularMarginPct = price > 0 ? (circularMarginNominal / price) * 100 : 0;
  const sirkularBoostPct = circularMarginPct - pureMarginPct;

  // Strategi Menu Engineering Matrix
  const strategyInfo = React.useMemo(() => {
    if (pureMarginPct >= 40) {
      return {
        badge: "⭐ Menu Bintang (Star)",
        color: "bg-emerald-100 text-emerald-800 border-emerald-300",
        advice: "Margin sangat tinggi & pasokan melimpah. Fokuskan promosi utama & bundling.",
      };
    } else if (pureMarginPct >= 25) {
      return {
        badge: "🐎 Kuda Beban (Plowhorse)",
        color: "bg-blue-100 text-blue-800 border-blue-300",
        advice: "Penjualan stabil namun margin moderat. Beli bahan via pooling bursa untuk pangkas HPP.",
      };
    } else if (pureMarginPct >= 15) {
      return {
        badge: "🧩 Teka-Teki (Puzzle)",
        color: "bg-amber-100 text-amber-800 border-amber-300",
        advice: "Margin cukup namun perlu dorongan volume. Jadikan menu rekomendasi kasir.",
      };
    } else {
      return {
        badge: "🐕 Menu Rentan (Dog)",
        color: "bg-red-100 text-red-800 border-red-300",
        advice: "Margin tipis. Pertimbangkan substitusi bahan alternatif untuk efisiensi.",
      };
    }
  }, [pureMarginPct]);

  // Cari Rekomendasi Bahan Alternatif yang Cocok
  const matchedAlternatives = React.useMemo(() => {
    const list: Array<{
      ingredient: string;
      alternative: typeof INGREDIENT_ALTERNATIVES["cabai"][0];
    }> = [];

    recipes.forEach((rec) => {
      const ingNameLower = rec.ingredient_name.toLowerCase();
      Object.keys(INGREDIENT_ALTERNATIVES).forEach((key) => {
        if (ingNameLower.includes(key)) {
          INGREDIENT_ALTERNATIVES[key].forEach((alt) => {
            list.push({ ingredient: rec.ingredient_name, alternative: alt });
          });
        }
      });
    });

    return list;
  }, [recipes]);

  const handleDeleteMenu = async () => {
    if (!window.confirm(`Hapus menu "${product.product_name}" beserta resepnya?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteProductAction(product.id);
      if (res.success) {
        toast.success(`Menu "${product.product_name}" berhasil dihapus.`);
        onDeleted(product.id);
      } else {
        toast.error(res.message || "Gagal menghapus menu.");
      }
    } catch {
      toast.error("Terjadi kendala saat menghapus menu.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteRecipe = async (recipeId: string, ingredientName: string) => {
    try {
      const res = await deleteRecipeItemAction(recipeId);
      if (res.success) {
        toast.success(`Bahan "${ingredientName}" dihapus dari resep.`);
        onDeleted(product.id);
      } else {
        toast.error(res.message || "Gagal menghapus bahan.");
      }
    } catch {
      toast.error("Terjadi kendala saat menghapus bahan.");
    }
  };

  // Helper Sektor Bahan
  const resolveSectorBadge = (ingName: string) => {
    const n = ingName.toLowerCase();
    let sec: SectorType = "PERTANIAN";
    if (n.includes("ayam") || n.includes("daging") || n.includes("telur") || n.includes("susu")) {
      sec = "PETERNAKAN";
    } else if (n.includes("ikan") || n.includes("udang") || n.includes("cumi")) {
      sec = "PERIKANAN";
    } else if (n.includes("kopi") || n.includes("teh") || n.includes("kelapa") || n.includes("aren")) {
      sec = "PERKEBUNAN";
    } else if (n.includes("minyak") || n.includes("tepung") || n.includes("saus") || n.includes("bumbu")) {
      sec = "FNB_PENGOLAHAN";
    } else if (n.includes("box") || n.includes("bowl") || n.includes("cup") || n.includes("kemasan")) {
      sec = "RITEL";
    }

    const match = SECTOR_OPTIONS.find((s) => s.value === sec);
    return match || SECTOR_OPTIONS[0];
  };

  return (
    <Card className="rounded-2xl border border-border shadow-elevation-1 hover:shadow-elevation-2 transition-all overflow-hidden bg-surface">
      <CardHeader className="pb-3 border-b border-border/50 bg-surface-subtle/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-primary-light text-primary">
                <Utensils className="w-4 h-4" />
              </span>
              <CardTitle className="text-base sm:text-lg font-bold text-text-primary">
                {product.product_name}
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                {product.unit || "PORSI"}
              </Badge>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${strategyInfo.color}`}
              >
                {strategyInfo.badge}
              </span>
            </div>

            <p className="text-xs text-text-secondary flex items-center gap-2 flex-wrap">
              <span>
                Iterasi Produksi:{" "}
                <strong className="text-text-primary">
                  {iterationsPerDay} Iterasi / Hari
                </strong>{" "}
                ({unitsPerIteration} {product.unit || "Unit"} / Sesi)
              </span>
              <span>&bull;</span>
              <span>
                Total Output:{" "}
                <strong className="text-text-primary">
                  {batchTotal} {product.unit || "Unit"}/Hari
                </strong>
              </span>
              <span>&bull;</span>
              <span>{recipes.length} Komponen Bahan</span>
            </p>
          </div>

          {/* Tombol Edit & Hapus */}
          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(product)}
                className="gap-1.5 text-xs font-semibold min-h-[36px] border-primary/30 text-primary hover:bg-primary-light"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Menu</span>
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDeleteMenu}
              disabled={isDeleting}
              className="text-text-muted hover:text-red-500 min-h-[36px] min-w-[36px] p-2"
              aria-label="Hapus menu"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tip Strategi Penjualan */}
        <div className="mt-2 text-[11px] p-2 rounded-lg bg-surface border border-border/80 flex items-start gap-2 text-text-secondary">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <span>
            <strong className="text-text-primary">Rekomendasi Strategi:</strong>{" "}
            {strategyInfo.advice}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* ANALISIS MARGIN KOMPARATIF: Tanpa vs Dengan Penjualan Limbah */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Analisis Margin Finansial Komparatif
            </span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Sirkular Boost: +{sirkularBoostPct.toFixed(1)}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Skenario A: Tanpa Penjualan Limbah */}
            <div className="p-3 rounded-xl bg-surface-subtle/60 border border-border space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-text-muted uppercase">
                  Skenario A: Konvensional
                </span>
                <span className="text-[10px] text-text-muted">Tanpa Jual Limbah</span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-text-secondary text-[11px]">Harga Jual:</span>
                <span className="font-bold text-text-primary">{formatCurrency(price)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-text-secondary text-[11px]">HPP Bahan Baku:</span>
                <span className="font-bold text-amber-600">{formatCurrency(hpp)}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-border/60 pt-1">
                <span className="text-text-secondary text-[11px]">Margin Murni:</span>
                <span className="font-bold text-primary">
                  {formatCurrency(pureMarginNominal)} ({pureMarginPct.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Skenario B: Dengan Penjualan Limbah */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase">
                  Skenario B: Sirkular KUMPUL
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Dengan Jual Limbah
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-emerald-950 text-[11px]">Cashflow Limbah/Unit:</span>
                <span className="font-bold text-emerald-800">
                  +{formatCurrency(estimatedWasteRevenuePerUnit)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-emerald-950 text-[11px]">Total Laba Bersih:</span>
                <span className="font-bold text-emerald-800">
                  {formatCurrency(circularMarginNominal)}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-emerald-500/30 pt-1">
                <span className="text-emerald-950 text-[11px]">Margin Ter-Boost:</span>
                <span className="font-bold text-emerald-800 text-sm">
                  {circularMarginPct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION ESTIMASI LIMBAH SIRKULAR & LINK BURSA */}
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              Prediksi Residu Limbah Dapur ({batchTotal} {product.unit || "Unit"}/Hari)
            </span>

            <Link href="/sirkular">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-[11px] h-7 gap-1 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/15"
              >
                <span>Daftarkan ke Bursa Limbah</span>
                <ExternalLink className="w-3 h-3" />
              </Button>
            </Link>
          </div>

          <p className="text-[11px] text-emerald-800">
            Potensi timbulan: Minyak jelantah (~1.5L/hari) &amp; residu bahan baku organik. Menghasilkan tambahan kas estimasi{" "}
            <strong>{formatCurrency(estimatedWasteRevenuePerUnit * batchTotal)} / hari</strong> jika dilepas ke mitra offtaker KUMPUL.
          </p>
        </div>

        {/* ACCORDION 1: KOMPOSISI RESEP BAHAN BAKU LINTAS 7 SEKTOR */}
        <div className="border-t border-border/60 pt-3">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-xs font-bold text-text-secondary hover:text-text-primary transition-colors py-1"
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Daftar Komposisi Resep (BOM) &amp; Asal 7 Sektor ({recipes.length})
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isExpanded && (
            <div className="mt-2.5 space-y-2">
              {recipes.length === 0 ? (
                <div className="p-3 text-center rounded-lg bg-surface text-xs text-text-muted flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Belum ada komponen resep yang didaftarkan.
                </div>
              ) : (
                <div className="divide-y divide-border/60 rounded-xl border border-border/70 overflow-hidden bg-surface">
                  {recipes.map((item) => {
                    const reqQty = Number(item.required_qty_per_unit) || 0;
                    const batchQty =
                      Number(item.total_batch_required_qty) || reqQty * batchTotal;
                    const cost = Number(item.estimated_cost_per_unit) || 0;
                    const sec = resolveSectorBadge(item.ingredient_name);

                    return (
                      <div
                        key={item.id}
                        className="p-2.5 sm:px-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-text-primary truncate">
                              {item.ingredient_name}
                            </p>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${sec.badgeClass}`}
                            >
                              {sec.label.split("&")[0]}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-secondary">
                            Takaran: <strong>{reqQty} {item.unit}</strong> per {product.unit || "unit"} &bull; Total Harian:{" "}
                            <strong>
                              {batchQty} {item.unit}
                            </strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {cost > 0 && (
                            <span className="text-[11px] font-bold text-text-primary">
                              {formatCurrency(cost)}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteRecipe(item.id, item.ingredient_name)}
                            className="text-text-muted hover:text-red-500 p-1"
                            title="Hapus bahan dari resep"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ACCORDION 2: REKOMENDASI BAHAN ALTERNATIF (KETERSEDIAAN PASAR & KESEHATAN) */}
        {matchedAlternatives.length > 0 && (
          <div className="border-t border-border/60 pt-3">
            <button
              type="button"
              onClick={() => setIsAltExpanded(!isAltExpanded)}
              className="w-full flex items-center justify-between text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors py-1"
            >
              <span className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Rekomendasi Alternatif Bahan (Pasar &amp; Kesehatan) ({matchedAlternatives.length})
              </span>
              {isAltExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isAltExpanded && (
              <div className="mt-2.5 space-y-2">
                {matchedAlternatives.map((altItem, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold text-amber-950">
                        {altItem.ingredient} &rarr;{" "}
                        <span className="text-primary underline">
                          {altItem.alternative.suggestedIngredientName}
                        </span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          altItem.alternative.category === "HEALTH_WELLNESS"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-blue-100 text-blue-800 border border-blue-300"
                        }`}
                      >
                        {altItem.alternative.badgeText}
                      </span>
                    </div>

                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      {altItem.alternative.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
