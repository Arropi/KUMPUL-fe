"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { BEProduct } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { deleteProductAction } from "@/actions/products";
import { getProductWastePrediction } from "@/lib/ai-waste-prediction";

interface MenuCardProps {
  product: BEProduct;
  onDeleted: (productId: string) => void;
  onRecipeUpdated?: (product: BEProduct) => void;
}

export function MenuCard({ product, onDeleted }: MenuCardProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const price =
    typeof product.target_selling_price_per_unit === "number"
      ? product.target_selling_price_per_unit
      : parseFloat(product.target_selling_price_per_unit || "0");

  const hpp =
    typeof product.calculated_hpp_per_unit === "number"
      ? product.calculated_hpp_per_unit
      : parseFloat(product.calculated_hpp_per_unit || "0");

  const marginPct =
    typeof product.projected_margin_percentage === "number"
      ? product.projected_margin_percentage
      : parseFloat(product.projected_margin_percentage || "0");

  const batchUnits = product.expected_batch_units || 1;
  const recipes = product.recipes || [];
  const estProfitPerBatch = Math.max(0, (price - hpp) * batchUnits);

  const wastePrediction = React.useMemo(() => {
    return getProductWastePrediction(product);
  }, [product]);

  const handleDeleteProduct = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Hapus produk "${product.product_name}" beserta resepnya?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteProductAction(product.id);
      if (res.success) {
        toast.success(`Produk "${product.product_name}" berhasil dihapus.`);
        onDeleted(product.id);
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
    <Card className="group flex flex-col justify-between rounded-2xl border-border bg-surface p-4 sm:p-5 shadow-elevation-1 transition-all duration-200 hover:shadow-elevation-2 hover:border-border-strong">
      <div>
        {/* Header: Meta Badge & Hapus */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="primary" className="text-[10px] uppercase font-bold tracking-wider">
              {product.unit || "Porsi"}
            </Badge>
            <span className="text-xs text-text-muted truncate">
              {recipes.length} bahan &bull; {batchUnits} unit/batch
            </span>
          </div>

          <button
            type="button"
            onClick={handleDeleteProduct}
            disabled={isDeleting}
            className="size-7 flex items-center justify-center rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            aria-label="Hapus produk"
            title="Hapus produk"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>

        {/* Nama Produk */}
        <Link
          href={`/produk/${product.id}`}
          className="block group-hover:text-primary transition-colors mt-2.5"
        >
          <h3
            className="font-heading font-bold text-base sm:text-lg text-text-primary line-clamp-1 leading-snug group-hover:text-primary transition-colors"
            title={product.product_name}
          >
            {product.product_name}
          </h3>
        </Link>

        {/* Snapshot Finansial: Harga Jual & Margin */}
        <div className="rounded-xl bg-background p-3.5 border border-border/80 space-y-2.5 mt-3">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-[11px] font-medium text-text-secondary block">
                Harga Jual
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-heading font-extrabold text-lg sm:text-xl text-primary tabular-nums">
                  {formatCurrency(price)}
                </span>
                <span className="text-xs font-semibold text-text-muted">
                  / {product.unit || "Porsi"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-medium text-text-secondary block">
                Margin
              </span>
              <span
                className={cn(
                  "text-sm font-bold tabular-nums inline-block mt-0.5",
                  marginPct >= 30
                    ? "text-emerald-700"
                    : marginPct > 0
                    ? "text-primary"
                    : "text-red-600"
                )}
              >
                {marginPct > 0 ? `+${marginPct.toFixed(0)}%` : `${marginPct.toFixed(0)}%`}
              </span>
            </div>
          </div>

          {/* Sub-metrik: HPP & Proyeksi Laba */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
            <div>
              <span className="text-[10px] text-text-muted block">HPP Satuan</span>
              <span className="font-semibold text-text-primary tabular-nums">
                {formatCurrency(hpp)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-text-muted block">Proyeksi Laba</span>
              <span className="font-semibold text-primary tabular-nums">
                +{formatCurrency(estProfitPerBatch)}
              </span>
            </div>
          </div>
        </div>

        {/* Potensi Residu Sirkular (Kompak & Bersih) */}
        <div className="rounded-xl bg-circular-waste-light/50 border border-circular-waste/20 px-3 py-2 flex items-center justify-between text-xs mt-3">
          <div>
            <span className="text-[10px] text-circular-waste font-semibold block">
              Potensi Residu Sirkular
            </span>
            <span className="text-xs font-medium text-text-secondary tabular-nums">
              ~{wastePrediction.totalVolumeKg} kg / batch
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-text-muted block">Valuasi</span>
            <span className="text-xs font-bold text-circular-waste tabular-nums">
              +{formatCurrency(wastePrediction.totalPotentialRevenuePerBatch)}
            </span>
          </div>
        </div>
      </div>

      {/* Aksi Navigasi: Rincian Produk & Edit */}
      <div className="flex items-center gap-2 pt-4 mt-auto">
        <Link href={`/produk/${product.id}`} className="flex-1">
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="w-full font-bold text-xs min-h-[40px] shadow-xs cursor-pointer"
          >
            Detail
          </Button>
        </Link>
        <Link href={`/produk/${product.id}/edit`}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="font-semibold text-xs min-h-[40px] px-4 cursor-pointer"
          >
            Edit
          </Button>
        </Link>
      </div>
    </Card>
  );
}
