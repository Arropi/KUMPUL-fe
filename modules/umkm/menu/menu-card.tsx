"use client";

import * as React from "react";
import Link from "next/link";
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lightbulb,
  ArrowUpRight,
  Pencil,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog3 } from "@/components/ui/dialog-3";
import { toast } from "@/components/ui/toast";
import type { BEProduct } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import { deleteProductAction } from "@/actions/products";
import {
  calculateCircularMargin,
  getProductIngredientAlternatives,
} from "@/lib/menu-intelligence";

interface MenuCardProps {
  product: BEProduct;
  onDeleted: (productId: string) => void;
  onEdit?: (product: BEProduct) => void;
  onRecipeUpdated?: (product: BEProduct) => void;
}

export function MenuCard({ product, onDeleted, onEdit }: MenuCardProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [showAlternatives, setShowAlternatives] = React.useState(false);

  // Komputasi komparasi margin finansial sirkular
  const fin = React.useMemo(() => {
    return calculateCircularMargin(product);
  }, [product]);

  // Rekomendasi alternatif bahan cerdas
  const alternatives = React.useMemo(() => {
    return getProductIngredientAlternatives(product.recipes || []);
  }, [product.recipes]);

  const batchUnits = product.expected_batch_units || 50;
  const iterationsPerDay = product.production_iterations_per_day || 2;
  const dailyOutput = batchUnits * iterationsPerDay;

  const executeDeleteProduct = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteProductAction(product.id);
      if (res.success) {
        toast.success(`Produk "${product.product_name}" berhasil dihapus.`);
        onDeleted(product.id);
        setIsDeleteDialogOpen(false);
      } else {
        toast.error(res.message || "Gagal menghapus produk.");
      }
    } catch {
      toast.error("Terjadi kendala saat menghapus produk.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="group flex flex-col justify-between rounded-2xl border-border bg-surface p-4 sm:p-5 shadow-elevation-1 transition-all duration-200 hover:shadow-elevation-2 hover:border-border-strong gap-3.5">
        <div className="space-y-3">
          {/* 1. Header: Nama Produk & Tombol Hapus */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <Link
                href={`/produk/${product.id}`}
                className="block group-hover:text-primary transition-colors"
              >
                <h3
                  className="font-heading font-bold text-base sm:text-lg text-text-primary line-clamp-1 leading-snug group-hover:text-primary transition-colors"
                  title={product.product_name}
                >
                  {product.product_name}
                </h3>
              </Link>
              <span className="text-[11px] text-text-secondary block mt-0.5">
                {iterationsPerDay} sesi/hari &bull; {batchUnits} {product.unit || "unit"}/sesi ({dailyOutput} {product.unit || "unit"}/hari)
              </span>
            </div>

            {/* Tombol Hapus Jelas & Terlihat */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDeleteDialogOpen(true);
              }}
              disabled={isDeleting}
              className="size-8.5 rounded-xl flex items-center justify-center bg-red-50 text-red-600 border border-red-200/90 hover:bg-red-100 hover:border-red-300 hover:text-red-700 transition-all shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
              aria-label={`Hapus produk ${product.product_name}`}
              title={`Hapus produk ${product.product_name}`}
            >
              <Trash2 className="size-4 text-red-600" />
            </button>
          </div>

          {/* 2. Analisis Margin Finansial Komparatif (brief.md Seksi 3.2) */}
          <div className="rounded-xl bg-background border border-border/80 p-3 space-y-2.5">
            {/* Harga Jual Utama */}
            <div className="flex items-baseline justify-between gap-2 pb-2 border-b border-border/60">
              <div>
                <span className="text-[10px] font-medium text-text-secondary block">
                  Harga Jual
                </span>
                <span className="font-heading font-extrabold text-base sm:text-lg text-primary tabular-nums">
                  {formatCurrency(fin.sellingPrice)}
                </span>
                <span className="text-xs text-text-muted font-normal ml-1">
                  / {product.unit || "Porsi"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-medium text-text-secondary block">
                  HPP Pokok
                </span>
                <span className="text-xs font-bold text-text-primary tabular-nums">
                  {formatCurrency(fin.hppPerUnit)}
                </span>
              </div>
            </div>

            {/* Komparasi 2 Skenario Berdampingan */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Skenario A: Konvensional */}
              <div className="p-2 rounded-lg bg-surface-subtle/80 border border-border/50 space-y-0.5">
                <span className="text-[10px] text-text-muted block font-medium">
                  Margin Murni
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-text-primary tabular-nums text-xs sm:text-sm">
                    {fin.pureMarginPercentage.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-text-muted tabular-nums">
                    +{formatCurrency(fin.pureProfitPerUnit)}
                  </span>
                </div>
              </div>

              {/* Skenario B: Sirkular KUMPUL */}
              <div className="p-2 rounded-lg bg-circular-waste-light/60 border border-circular-waste/25 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-circular-waste font-semibold block">
                    Margin Sirkular
                  </span>
                  <span className="text-[9px] font-bold text-circular-waste bg-white/80 px-1 rounded">
                    +{fin.circularBoostPercentage.toFixed(1)}% Boost
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-circular-waste tabular-nums text-xs sm:text-sm">
                    {fin.circularMarginPercentage.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-circular-waste tabular-nums">
                    +{formatCurrency(fin.circularProfitPerUnit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cashflow Tambahan Limbah Dapur */}
            <div className="pt-1.5 border-t border-border/60 flex items-center justify-between text-[11px]">
              <span className="text-text-muted flex items-center gap-1">
                <Sparkles className="size-3 text-circular-waste" />
                <span>Cashflow Limbah:</span>
              </span>
              <span className="font-bold text-circular-waste tabular-nums">
                +{formatCurrency(fin.dailyWasteRevenue)} / hari
              </span>
            </div>
          </div>

          {/* 4. Rekomendasi Bahan Alternatif Cerdas (brief.md Seksi 6) */}
          {alternatives.length > 0 && (
            <div className="rounded-xl border border-border/80 bg-surface-subtle/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAlternatives(!showAlternatives)}
                className="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5 text-primary">
                  <Lightbulb className="size-3.5" />
                  <span>Alternatif Bahan Cerdas ({alternatives.length})</span>
                </span>
                {showAlternatives ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </button>

              {showAlternatives && (
                <div className="p-2.5 pt-1 space-y-2 border-t border-border/60 text-xs">
                  {alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-surface border border-border/70 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-primary text-[11px]">
                          {alt.suggestedIngredientName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            alt.estimatedCostImpactPercentage < 0
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {alt.estimatedCostImpactPercentage < 0
                            ? `Hemat ${Math.abs(alt.estimatedCostImpactPercentage)}%`
                            : `Premium +${alt.estimatedCostImpactPercentage}%`}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-secondary leading-snug">
                        {alt.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Aksi Navigasi: Rincian Produk & Edit Langsung (Modal Edit) */}
        <div className="flex items-center gap-2 pt-1 mt-auto">
          <Button
            asChild
            variant="primary"
            size="sm"
            className="flex-1 font-bold text-xs min-h-[42px] rounded-xl shadow-xs cursor-pointer"
          >
            <Link href={`/produk/${product.id}`}>
              Detail Produk
            </Link>
          </Button>

          {onEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(product)}
              className="font-semibold text-xs min-h-[42px] px-4 rounded-xl cursor-pointer"
            >
              Edit Menu
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="font-semibold text-xs min-h-[42px] px-4 rounded-xl cursor-pointer"
            >
              <Link href={`/produk/${product.id}/edit`}>
                Edit Menu
              </Link>
            </Button>
          )}
        </div>
      </Card>

      {/* Dialog 3 Destructive Confirmation dari Watermelon UI */}
      <Dialog3
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={`Hapus Produk "${product.product_name}"?`}
        description="Tindakan ini permanen dan tidak dapat dibatalkan. Seluruh spesifikasi resep dan kalkulasi HPP terkait akan dihapus."
        checkboxLabel="Saya paham bahwa tindakan ini tidak dapat dibatalkan"
        confirmLabel="Hapus Produk"
        cancelLabel="Batal"
        isLoading={isDeleting}
        onConfirm={executeDeleteProduct}
      />
    </>
  );
}
