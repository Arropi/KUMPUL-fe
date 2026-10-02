"use client";

import * as React from "react";
import { Utensils, Trash2, ChevronDown, ChevronUp, Layers, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { BEProduct } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import { deleteProductAction, deleteRecipeItemAction } from "@/actions/products";

interface MenuCardProps {
  product: BEProduct;
  onDeleted: (productId: string) => void;
  onRecipeUpdated?: (product: BEProduct) => void;
}

export function MenuCard({ product, onDeleted }: MenuCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const price = typeof product.target_selling_price_per_unit === "number"
    ? product.target_selling_price_per_unit
    : parseFloat(product.target_selling_price_per_unit || "0");

  const hpp = typeof product.calculated_hpp_per_unit === "number"
    ? product.calculated_hpp_per_unit
    : parseFloat(product.calculated_hpp_per_unit || "0");

  const marginPct = typeof product.projected_margin_percentage === "number"
    ? product.projected_margin_percentage
    : parseFloat(product.projected_margin_percentage || "0");

  const recipes = product.recipes || [];

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
        onDeleted(product.id); // Trigger refetch
      } else {
        toast.error(res.message || "Gagal menghapus bahan.");
      }
    } catch {
      toast.error("Terjadi kendala saat menghapus bahan.");
    }
  };

  return (
    <Card className="rounded-2xl border border-border shadow-elevation-1 hover:shadow-elevation-2 transition-all">
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
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
          </div>
          <p className="text-xs text-text-secondary flex items-center gap-2">
            <span>Siklus Batch: <strong>{product.expected_batch_units} {product.unit || "Unit"}</strong></span>
            <span>&bull;</span>
            <span>{recipes.length} Komponen Resep</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDeleteMenu}
            disabled={isDeleting}
            className="text-text-muted hover:text-red-500 min-h-[36px] min-w-[36px] p-1.5"
            aria-label="Hapus menu"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metrik Finansial Hasil Kalkulasi Backend */}
        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-surface-subtle/60 border border-border/80 text-xs">
          <div>
            <span className="text-[11px] text-text-secondary block">Harga Jual</span>
            <span className="font-bold text-text-primary text-sm sm:text-base">
              {formatCurrency(price)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-text-secondary block">HPP Terhitung</span>
            <span className="font-bold text-amber-600 text-sm sm:text-base">
              {formatCurrency(hpp)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-text-secondary block">Margin Laba</span>
            <span className={`font-bold text-sm sm:text-base flex items-center gap-1 ${
              marginPct >= 30 ? "text-emerald-600" : marginPct > 0 ? "text-primary" : "text-red-500"
            }`}>
              <TrendingUp className="w-3.5 h-3.5" />
              {marginPct.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Collapsible Section Daftar Resep & Kebutuhan Bahan */}
        <div className="border-t border-border/60 pt-3">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-xs font-bold text-text-secondary hover:text-text-primary transition-colors py-1"
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Daftar Komposisi Resep &amp; Kebutuhan Batch ({recipes.length})
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
                    const batchQty = Number(item.total_batch_required_qty) || (reqQty * product.expected_batch_units);
                    const cost = Number(item.estimated_cost_per_unit) || 0;

                    return (
                      <div
                        key={item.id}
                        className="p-2.5 sm:px-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-text-primary truncate">
                            {item.ingredient_name}
                          </p>
                          <p className="text-[11px] text-text-secondary">
                            Kebutuhan: <strong>{reqQty} {item.unit}</strong> per unit &bull; Total Batch: <strong>{batchQty} {item.unit}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {cost > 0 && (
                            <span className="text-[11px] font-medium text-text-muted">
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
      </CardContent>
    </Card>
  );
}
