"use client";

import * as React from "react";
import { Plus, Trash2, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  createProductWithRecipesAction,
  type CreateProductRecipeItemInput,
} from "@/actions/products";
import type { BEProduct } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";

interface MenuAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: BEProduct) => void;
}

const COMMON_INGREDIENT_UNITS = [
  "GRAM",
  "KG",
  "ML",
  "LITER",
  "PCS",
  "PACK",
  "LEMBAR",
  "SDM",
] as const;

const PRODUCT_UNITS = ["PORSI", "PCS", "PACK", "DUS", "BOTOL", "KG"] as const;

export function MenuAddDialog({ isOpen, onClose, onSuccess }: MenuAddDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form Fields
  const [productName, setProductName] = React.useState("");
  const [unit, setUnit] = React.useState("PORSI");
  const [sellingPrice, setSellingPrice] = React.useState<number>(25000);
  const [batchUnits, setBatchUnits] = React.useState<number>(100);

  // Bill of Materials / Resep Items
  const [ingredients, setIngredients] = React.useState<CreateProductRecipeItemInput[]>([
    { name: "Daging Ayam Fillet", amountPerPortion: 0.2, unit: "KG", estimatedCost: 7000 },
    { name: "Minyak Goreng Sawit", amountPerPortion: 0.05, unit: "LITER", estimatedCost: 1000 },
    { name: "Cabai Rawit Merah", amountPerPortion: 0.03, unit: "KG", estimatedCost: 1500 },
  ]);

  // Kalkulasi instan HPP & Margin
  const totalEstimatedHpp = React.useMemo(() => {
    return ingredients.reduce((sum, item) => sum + (Number(item.estimatedCost) || 0), 0);
  }, [ingredients]);

  const projectedMarginPct = React.useMemo(() => {
    if (sellingPrice <= 0) return 0;
    return Math.max(0, ((sellingPrice - totalEstimatedHpp) / sellingPrice) * 100);
  }, [sellingPrice, totalEstimatedHpp]);

  const handleAddIngredientRow = () => {
    setIngredients((prev) => [
      ...prev,
      { name: "", amountPerPortion: 0.1, unit: "KG", estimatedCost: 0 },
    ]);
  };

  const handleRemoveIngredientRow = (index: number) => {
    if (ingredients.length <= 1) {
      toast.error("Minimal harus ada 1 komponen bahan resep.");
      return;
    }
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (
    index: number,
    field: keyof CreateProductRecipeItemInput,
    value: string | number
  ) => {
    setIngredients((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      toast.error("Nama menu masakan/produk wajib diisi.");
      return;
    }

    const validIngredients = ingredients.filter((ing) => ing.name.trim().length > 0);
    if (validIngredients.length === 0) {
      toast.error("Masukkan minimal 1 bahan baku kebutuhan menu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createProductWithRecipesAction({
        productName: productName.trim(),
        unit,
        targetSellingPricePerUnit: Number(sellingPrice) || 0,
        expectedBatchUnits: Number(batchUnits) || 1,
        ingredients: validIngredients,
      });

      if (res.success && res.data) {
        toast.success(res.message || "Menu dan resep berhasil ditambahkan!");
        onSuccess(res.data);
        onClose();
        // Reset form
        setProductName("");
        setSellingPrice(25000);
        setBatchUnits(100);
        setIngredients([
          { name: "", amountPerPortion: 0.1, unit: "KG", estimatedCost: 0 },
        ]);
      } else {
        toast.error(res.message || "Gagal menyimpan menu ke sistem.");
      }
    } catch {
      toast.error("Terjadi kendala saat menghubungi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Tambah Menu &amp; Komposisi Resep (BOM)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Daftarkan menu usaha Anda beserta bahan baku kebutuhan produksinya. HPP dan margin keuntungan akan dihitung otomatis oleh sistem backend.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Bagian 1: Data Menu Utama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-subtle/50 border border-border">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Nama Menu Masakan / Produk *
              </label>
              <Input
                type="text"
                placeholder="Contoh: Bebek Goreng Kremes Sambal Korek"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Satuan Produk Jadi
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full text-xs font-medium rounded-lg border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {PRODUCT_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Target Produksi per Batch (Unit)
              </label>
              <Input
                type="number"
                min={1}
                value={batchUnits}
                onChange={(e) => setBatchUnits(Math.max(1, Number(e.target.value)))}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Target Harga Jual per {unit} (Rp) *
              </label>
              <Input
                type="number"
                min={100}
                step={500}
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Math.max(0, Number(e.target.value)))}
                required
              />
            </div>
          </div>

          {/* Bagian 2: Daftar Kebutuhan Bahan (Recipe Items) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-text-primary">
                  Detail Kebutuhan Bahan Baku per 1 {unit}
                </h4>
                <p className="text-xs text-text-secondary">
                  Tentukan bahan dan takaran untuk 1 porsi/unit.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddIngredientRow}
                className="text-xs font-semibold gap-1 min-h-[36px]"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Bahan
              </Button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 p-2.5 rounded-lg border border-border bg-surface items-center text-xs"
                >
                  <div className="col-span-12 sm:col-span-5">
                    <input
                      type="text"
                      placeholder="Nama bahan (cth: Daging Ayam)"
                      value={ing.name}
                      onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                      className="w-full text-xs rounded border border-border px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      placeholder="Kebutuhan"
                      value={ing.amountPerPortion}
                      onChange={(e) =>
                        handleIngredientChange(
                          idx,
                          "amountPerPortion",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full text-xs rounded border border-border px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <select
                      value={ing.unit}
                      onChange={(e) => handleIngredientChange(idx, "unit", e.target.value)}
                      className="w-full text-xs rounded border border-border px-2 py-1.5 bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {COMMON_INGREDIENT_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      placeholder="Biaya (Rp)"
                      value={ing.estimatedCost}
                      onChange={(e) =>
                        handleIngredientChange(
                          idx,
                          "estimatedCost",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full text-xs rounded border border-border px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredientRow(idx)}
                      className="text-text-muted hover:text-red-500 transition-colors p-1"
                      aria-label="Hapus bahan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bagian 3: Ringkasan Margin & HPP */}
          <div className="p-3.5 rounded-xl bg-primary-light/30 border border-primary/20 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" />
              <div>
                <span className="font-semibold text-text-primary block">
                  Simulasi HPP Terhitung: {formatCurrency(totalEstimatedHpp)} / {unit}
                </span>
                <span className="text-[11px] text-text-secondary">
                  Total kebutuhan batch ({batchUnits} unit) akan dihitung otomatis oleh backend.
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-text-secondary block text-[11px]">Proyeksi Margin:</span>
              <span className="text-sm font-bold text-primary">
                {projectedMarginPct.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="font-semibold px-6 min-h-[44px]"
            >
              {isSubmitting ? "Menyimpan ke Backend..." : "Simpan Menu & Resep"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
