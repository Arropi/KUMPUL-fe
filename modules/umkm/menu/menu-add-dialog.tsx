"use client";

import * as React from "react";
import { Plus, Trash2, Calculator, ChevronDown } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
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

export interface IngredientUnitOption {
  value: string;
  label: string;
  sectorTag: string;
}

export const SECTOR_INGREDIENT_UNITS: IngredientUnitOption[] = [
  // Sektor Pertanian & Agribisnis (Pangan Pokok, Sayuran, Umbi)
  { value: "KG", label: "Kilogram (Kg)", sectorTag: "Pertanian & Umum" },
  { value: "GRAM", label: "Gram (g)", sectorTag: "Pertanian & Bumbu" },
  { value: "IKAT", label: "Ikat", sectorTag: "Pertanian (Sayuran)" },
  { value: "KARUNG", label: "Karung (Grosir)", sectorTag: "Pertanian (Beras/Tepung)" },
  { value: "KUINTAL", label: "Kuintal (100 Kg)", sectorTag: "Pertanian & Agribisnis" },
  { value: "TON", label: "Ton (1.000 Kg)", sectorTag: "Pertanian & Agribisnis" },

  // Sektor Peternakan & Daging (Unggas, Sapi, Telur, Susu)
  { value: "EKOR", label: "Ekor", sectorTag: "Peternakan (Unggas/Karkas)" },
  { value: "BUTIR", label: "Butir", sectorTag: "Peternakan (Telur)" },
  { value: "PETI", label: "Peti Pendingin", sectorTag: "Peternakan & Daging" },

  // Sektor Perikanan & Hasil Laut (Ikan Segar, Udang, Cumi)
  { value: "KRAT", label: "Krat", sectorTag: "Perikanan & Tangkapan Laut" },

  // Sektor Perkebunan & Rempah (Kopi, Kakao, Rempah Kering)
  { value: "SAK", label: "Sak", sectorTag: "Perkebunan & Rempah" },

  // Sektor FnB & Pengolahan Bahan Baku (Cairan, Saus, Minyak, Olahan)
  { value: "LITER", label: "Liter (L)", sectorTag: "FnB / Minyak & Susu" },
  { value: "ML", label: "Mililiter (ml)", sectorTag: "FnB / Ekstrak & Saus" },
  { value: "BOTOL", label: "Botol", sectorTag: "FnB / Saus & Bumbu" },
  { value: "KALENG", label: "Kaleng", sectorTag: "FnB / Olahan Bahan Baku" },

  // Sektor Ritel (Kemasan, Eceran)
  { value: "PCS", label: "Pieces (Pcs)", sectorTag: "Ritel & Satuan" },
  { value: "PACK", label: "Pack / Bungkus", sectorTag: "Ritel & Kemasan" },
  { value: "LEMBAR", label: "Lembar", sectorTag: "Ritel (Kulit/Plastik)" },

  // Sektor Logistik & Distribusi (Karton, Bal)
  { value: "DUS", label: "Dus / Karton", sectorTag: "Logistik & Distribusi" },
  { value: "BAL", label: "Bal Grosir", sectorTag: "Logistik & Tekstil/Kemasan" },
];

export function MenuAddDialog({ isOpen, onClose, onSuccess }: MenuAddDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form Fields
  const [productName, setProductName] = React.useState("");
  const [productionIterations, setProductionIterations] = React.useState<number>(10);
  const [batchUnits, setBatchUnits] = React.useState<number>(100);
  const [sellingPrice, setSellingPrice] = React.useState<number>(25000);

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
      toast.error("Nama produk wajib diisi.");
      return;
    }

    const validIngredients = ingredients.filter((ing) => ing.name.trim().length > 0);
    if (validIngredients.length === 0) {
      toast.error("Masukkan minimal 1 bahan baku kebutuhan produk.");
      return;
    }

    const totalExpectedUnits = Math.max(
      1,
      (Number(batchUnits) || 1) * (Number(productionIterations) || 1)
    );

    setIsSubmitting(true);
    try {
      const res = await createProductWithRecipesAction({
        productName: productName.trim(),
        unit: "PORSI",
        targetSellingPricePerUnit: Number(sellingPrice) || 0,
        expectedBatchUnits: totalExpectedUnits,
        ingredients: validIngredients,
      });

      if (res.success && res.data) {
        toast.success(res.message || "Produk dan resep berhasil ditambahkan!");
        onSuccess(res.data);
        onClose();
        // Reset form
        setProductName("");
        setProductionIterations(10);
        setBatchUnits(100);
        setSellingPrice(25000);
        setIngredients([
          { name: "", amountPerPortion: 0.1, unit: "KG", estimatedCost: 0 },
        ]);
      } else {
        toast.error(res.message || "Gagal menyimpan produk ke sistem.");
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
            Tambah Produk &amp; Komposisi Resep (BOM)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Bagian 1: Data Produk Utama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-surface-subtle/50 border border-border">
            <div className="sm:col-span-2">
              <Input
                label="Nama Produk Usaha *"
                type="text"
                placeholder="Contoh: Bebek Goreng Kremes, Roti Cokelat, Kopi Susu"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Estimasi Iterasi Produksi *"
                type="number"
                min={1}
                placeholder="Contoh: 10"
                helperText="Berapa kali jumlah iterasi memproduksi barangnya"
                value={productionIterations}
                onChange={(e) =>
                  setProductionIterations(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                required
              />
            </div>

            <div>
              <Input
                label="Target Produksi per Batch (Porsi) *"
                type="number"
                min={1}
                placeholder="Contoh: 100"
                helperText="Jumlah porsi yang diproduksi dalam 1 kali batch"
                value={batchUnits}
                onChange={(e) =>
                  setBatchUnits(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                required
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Target Harga Jual per PORSI (Rp) *"
                type="number"
                min={0}
                step="any"
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
                  Detail Kebutuhan Bahan Baku per 1 PORSI
                </h4>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddIngredientRow}
                className="text-xs font-semibold gap-1 min-h-[36px] rounded-xl border-border bg-surface hover:bg-surface-subtle cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Bahan
              </Button>
            </div>

            {/* Desktop Column Header */}
            <div className="hidden sm:grid grid-cols-12 gap-2 px-3 text-[11px] font-semibold text-text-secondary">
              <div className="col-span-5">Nama Bahan Baku *</div>
              <div className="col-span-2">Takaran *</div>
              <div className="col-span-2">Satuan (7 Sektor)</div>
              <div className="col-span-2">Biaya Est (Rp)</div>
              <div className="col-span-1 text-center">Aksi</div>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 p-2.5 rounded-xl border border-border bg-surface items-center shadow-xs"
                >
                  <div className="col-span-12 sm:col-span-5">
                    <label className="text-[11px] font-medium text-text-secondary sm:hidden mb-1 block">
                      Nama Bahan Baku *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Daging Ayam Fillet"
                      value={ing.name}
                      onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                      className="w-full min-h-[40px] text-xs font-sans rounded-xl border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="text-[11px] font-medium text-text-secondary sm:hidden mb-1 block">
                      Takaran *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      placeholder="0.1"
                      value={ing.amountPerPortion}
                      onChange={(e) =>
                        handleIngredientChange(
                          idx,
                          "amountPerPortion",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full min-h-[40px] text-xs font-sans rounded-xl border border-border bg-surface px-3 py-2 text-text-primary tabular-nums placeholder:text-text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="text-[11px] font-medium text-text-secondary sm:hidden mb-1 block">
                      Satuan
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-subtle text-xs font-semibold text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all flex items-center justify-between cursor-pointer"
                          aria-label={`Pilih satuan bahan: ${ing.unit}`}
                        >
                          <span className="truncate">{ing.unit}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-56 max-h-60 overflow-y-auto">
                        <DropdownMenuRadioGroup
                          value={ing.unit}
                          onValueChange={(val) => handleIngredientChange(idx, "unit", val)}
                        >
                          {SECTOR_INGREDIENT_UNITS.map((u) => (
                            <DropdownMenuRadioItem key={u.value} value={u.value}>
                              <div className="flex flex-col py-0.5 text-left">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-text-primary">{u.value}</span>
                                  <span className="text-[11px] text-text-muted">({u.label})</span>
                                </div>
                                <span className="text-[10px] text-text-muted/80">{u.sectorTag}</span>
                              </div>
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="col-span-3 sm:col-span-2">
                    <label className="text-[11px] font-medium text-text-secondary sm:hidden mb-1 block">
                      Biaya Est (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={ing.estimatedCost}
                      onChange={(e) =>
                        handleIngredientChange(
                          idx,
                          "estimatedCost",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full min-h-[40px] text-xs font-sans rounded-xl border border-border bg-surface px-3 py-2 text-text-primary tabular-nums placeholder:text-text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="col-span-1 flex items-end sm:items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredientRow(idx)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-error hover:text-red-700 hover:bg-error/10 transition-colors cursor-pointer"
                      aria-label="Hapus bahan dari komposisi"
                    >
                      <Trash2 className="w-4 h-4 text-error" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bagian 3: Ringkasan Margin & HPP */}
          <div className="p-4 rounded-2xl bg-primary-light/40 border border-primary/20 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Calculator className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="font-semibold text-text-primary block text-xs sm:text-sm">
                  Simulasi HPP Terhitung: {formatCurrency(totalEstimatedHpp)} / PORSI
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-text-secondary">Proyeksi Margin:</span>
              <span className="text-sm sm:text-base font-bold text-primary tabular-nums">
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
              className="rounded-xl px-5 min-h-[44px] cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="font-semibold px-6 min-h-[44px] rounded-xl cursor-pointer"
            >
              {isSubmitting ? "Menyimpan ke Backend..." : "Simpan Produk & Resep"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
