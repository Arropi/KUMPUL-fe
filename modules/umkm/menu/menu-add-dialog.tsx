"use client";

import * as React from "react";
import { Plus, Trash2, Calculator, Sparkles, Leaf, ArrowRight } from "lucide-react";
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
  updateProductWithRecipesAction,
  type CreateProductRecipeItemInput,
} from "@/actions/products";
import type { BEProduct } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import {
  PRODUCT_UNITS,
  SECTOR_OPTIONS,
  COMMON_INGREDIENT_UNITS,
  WASTE_PRESETS,
  type WasteItemInput,
  type SectorType,
} from "./menu-types";

interface MenuAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: BEProduct) => void;
  initialProduct?: BEProduct | null;
}

export function MenuAddDialog({
  isOpen,
  onClose,
  onSuccess,
  initialProduct,
}: MenuAddDialogProps) {
  const isEditMode = Boolean(initialProduct);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // 1. Data Utama Produk
  const [productName, setProductName] = React.useState("");
  const [category, setCategory] = React.useState("Makanan Utama");
  const [unit, setUnit] = React.useState("PORSI");
  const [sellingPrice, setSellingPrice] = React.useState<number>(25000);

  // 2. Parameter Produksi: Iterasi Hari Produksi
  const [iterationsPerDay, setIterationsPerDay] = React.useState<number>(1);
  const [unitsPerIteration, setUnitsPerIteration] = React.useState<number>(50);

  // 3. Bill of Materials (BOM) Resep Lintas 7 Sektor
  const [ingredients, setIngredients] = React.useState<CreateProductRecipeItemInput[]>([
    {
      name: "Daging Ayam Fillet",
      sector: "PETERNAKAN",
      amountPerPortion: 0.2,
      unit: "KG",
      estimatedCost: 7500,
    },
    {
      name: "Minyak Goreng Sawit",
      sector: "FNB_PENGOLAHAN",
      amountPerPortion: 0.05,
      unit: "LITER",
      estimatedCost: 1000,
    },
    {
      name: "Cabai Rawit Merah",
      sector: "PERTANIAN",
      amountPerPortion: 0.03,
      unit: "KG",
      estimatedCost: 1500,
    },
    {
      name: "Kemasan Paper Bowl",
      sector: "RITEL",
      amountPerPortion: 1,
      unit: "PCS",
      estimatedCost: 1200,
    },
  ]);

  // 4. Estimasi Limbah Sirkular
  const [wastes, setWastes] = React.useState<WasteItemInput[]>([
    {
      wasteName: "Minyak Jelantah (UCO)",
      volumePerIteration: 1.2,
      unit: "LITER",
      potentialPricePerUnit: 8000,
    },
    {
      wasteName: "Sisa Tulang & Residu Organik",
      volumePerIteration: 2.0,
      unit: "KG",
      potentialPricePerUnit: 2500,
    },
  ]);

  // Pre-fill ketika mode Edit
  React.useEffect(() => {
    if (initialProduct && isOpen) {
      setProductName(initialProduct.product_name || "");
      setUnit(initialProduct.unit || "PORSI");
      setSellingPrice(
        Number(initialProduct.target_selling_price_per_unit) || 25000
      );

      const batch = Number(initialProduct.expected_batch_units) || 50;
      setUnitsPerIteration(batch >= 50 ? Math.round(batch / 2) : batch);
      setIterationsPerDay(batch >= 50 ? 2 : 1);

      if (initialProduct.recipes && initialProduct.recipes.length > 0) {
        setIngredients(
          initialProduct.recipes.map((r) => ({
            name: r.ingredient_name,
            sector: "PERTANIAN",
            amountPerPortion: Number(r.required_qty_per_unit) || 0.1,
            unit: r.unit || "KG",
            estimatedCost: Number(r.estimated_cost_per_unit) || 0,
          }))
        );
      }
    } else if (!initialProduct && isOpen) {
      // Reset default saat tambah baru
      setProductName("");
      setCategory("Makanan Utama");
      setUnit("PORSI");
      setSellingPrice(25000);
      setIterationsPerDay(1);
      setUnitsPerIteration(50);
      setIngredients([
        {
          name: "Daging Ayam Fillet",
          sector: "PETERNAKAN",
          amountPerPortion: 0.2,
          unit: "KG",
          estimatedCost: 7500,
        },
        {
          name: "Minyak Goreng Sawit",
          sector: "FNB_PENGOLAHAN",
          amountPerPortion: 0.05,
          unit: "LITER",
          estimatedCost: 1000,
        },
        {
          name: "Cabai Rawit Merah",
          sector: "PERTANIAN",
          amountPerPortion: 0.03,
          unit: "KG",
          estimatedCost: 1500,
        },
        {
          name: "Kemasan Paper Bowl",
          sector: "RITEL",
          amountPerPortion: 1,
          unit: "PCS",
          estimatedCost: 1200,
        },
      ]);
    }
  }, [initialProduct, isOpen]);

  // Output harian total
  const dailyTotalUnits = React.useMemo(() => {
    return Math.max(1, iterationsPerDay) * Math.max(1, unitsPerIteration);
  }, [iterationsPerDay, unitsPerIteration]);

  // Kalkulasi instan HPP & Margin Murni
  const totalEstimatedHpp = React.useMemo(() => {
    return ingredients.reduce(
      (sum, item) => sum + (Number(item.estimatedCost) || 0),
      0
    );
  }, [ingredients]);

  const pureMarginNominal = React.useMemo(() => {
    return Math.max(0, sellingPrice - totalEstimatedHpp);
  }, [sellingPrice, totalEstimatedHpp]);

  const pureMarginPct = React.useMemo(() => {
    if (sellingPrice <= 0) return 0;
    return (pureMarginNominal / sellingPrice) * 100;
  }, [sellingPrice, pureMarginNominal]);

  // Kalkulasi Pendapatan Limbah & Margin Ter-boost
  const dailyWasteRevenue = React.useMemo(() => {
    return wastes.reduce((sum, w) => {
      const volDaily = (Number(w.volumePerIteration) || 0) * Math.max(1, iterationsPerDay);
      const price = Number(w.potentialPricePerUnit) || 0;
      return sum + volDaily * price;
    }, 0);
  }, [wastes, iterationsPerDay]);

  const wasteRevenuePerUnit = React.useMemo(() => {
    if (dailyTotalUnits <= 0) return 0;
    return dailyWasteRevenue / dailyTotalUnits;
  }, [dailyWasteRevenue, dailyTotalUnits]);

  const circularBoostedMarginNominal = pureMarginNominal + wasteRevenuePerUnit;
  const circularBoostedMarginPct = React.useMemo(() => {
    if (sellingPrice <= 0) return 0;
    return (circularBoostedMarginNominal / sellingPrice) * 100;
  }, [sellingPrice, circularBoostedMarginNominal]);

  const circularUpliftPct = circularBoostedMarginPct - pureMarginPct;

  // Handlers Bahan Baku
  const handleAddIngredientRow = () => {
    setIngredients((prev) => [
      ...prev,
      {
        name: "",
        sector: "PERTANIAN",
        amountPerPortion: 0.1,
        unit: "KG",
        estimatedCost: 0,
      },
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

  // Handlers Limbah Sirkular
  const handleAddWasteRow = () => {
    setWastes((prev) => [
      ...prev,
      {
        wasteName: "",
        volumePerIteration: 1.0,
        unit: "KG",
        potentialPricePerUnit: 1500,
      },
    ]);
  };

  const handleRemoveWasteRow = (index: number) => {
    setWastes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleWasteChange = (
    index: number,
    field: keyof WasteItemInput,
    value: string | number
  ) => {
    setWastes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleApplyWastePreset = (preset: typeof WASTE_PRESETS[0]) => {
    setWastes((prev) => [
      ...prev,
      {
        wasteName: preset.name,
        volumePerIteration: 1.5,
        unit: preset.unit,
        potentialPricePerUnit: preset.defaultPricePerUnit,
      },
    ]);
    toast.success(`Preset "${preset.name}" ditambahkan ke estimasi limbah.`);
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
      if (isEditMode && initialProduct) {
        const res = await updateProductWithRecipesAction({
          productId: initialProduct.id,
          productName: productName.trim(),
          unit,
          targetSellingPricePerUnit: Number(sellingPrice) || 0,
          expectedBatchUnits: dailyTotalUnits,
          productionIterationsPerDay: iterationsPerDay,
          unitsPerIteration,
          ingredients: validIngredients,
        });

        if (res.success && res.data) {
          toast.success(res.message || "Menu dan resep berhasil diperbarui!");
          onSuccess(res.data);
          onClose();
        } else {
          toast.error(res.message || "Gagal memperbarui menu.");
        }
      } else {
        const res = await createProductWithRecipesAction({
          productName: productName.trim(),
          unit,
          targetSellingPricePerUnit: Number(sellingPrice) || 0,
          expectedBatchUnits: dailyTotalUnits,
          productionIterationsPerDay: iterationsPerDay,
          unitsPerIteration,
          ingredients: validIngredients,
        });

        if (res.success && res.data) {
          toast.success(res.message || "Menu dan resep berhasil ditambahkan!");
          onSuccess(res.data);
          onClose();
        } else {
          toast.error(res.message || "Gagal menyimpan menu ke sistem.");
        }
      }
    } catch {
      toast.error("Terjadi kendala saat menghubungi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary-light text-primary">
              <Calculator className="w-4 h-4" />
            </span>
            <DialogTitle className="text-lg font-bold">
              {isEditMode ? "Edit Menu & Resep Produksi" : "Tambah Menu & Resep Produksi"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Daftarkan menu dengan Bill of Materials (BOM) lintas 7 sektor, atur iterasi hari produksi, dan evaluasi potensi margin sirkular dari penjualan residu limbah.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* BAGIAN 1: Identitas Menu & Kategori */}
          <div className="p-4 rounded-xl bg-surface-subtle/60 border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                1. Data Identitas Menu &amp; Penjualan
              </h3>
              <span className="text-[11px] text-text-muted">Langkah 1 dari 4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="sm:col-span-8">
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

              <div className="sm:col-span-4">
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Kategori Menu
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Makanan Utama">Makanan Utama</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Snack & Camilan">Snack &amp; Camilan</option>
                  <option value="Paket Katering">Paket Katering</option>
                  <option value="Produk Olahan">Produk Olahan</option>
                </select>
              </div>

              <div className="sm:col-span-6">
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Satuan Produk Jadi *
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full text-xs font-medium rounded-lg border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {PRODUCT_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-6">
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Target Harga Jual per {unit} (Rp) *
                </label>
                <Input
                  type="number"
                  min={500}
                  step={500}
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Math.max(0, Number(e.target.value)))}
                  required
                />
              </div>
            </div>
          </div>

          {/* BAGIAN 2: Siklus Produksi & Iterasi Hari Produksi */}
          <div className="p-4 rounded-xl bg-surface-subtle/60 border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                2. Parameter Iterasi Hari Produksi Dapur
              </h3>
              <span className="text-[11px] text-text-muted">Langkah 2 dari 4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Frekuensi Iterasi per Hari (Siklus Dapur)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={iterationsPerDay}
                    onChange={(e) =>
                      setIterationsPerDay(Math.max(1, Number(e.target.value)))
                    }
                    required
                  />
                  <span className="text-xs text-text-secondary shrink-0 font-medium">
                    Siklus / Hari
                  </span>
                </div>
                <p className="text-[11px] text-text-muted mt-1">
                  Contoh: 1 kali masak pagi, atau 2 kali (pagi &amp; sore).
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Target Output per 1 Iterasi
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={unitsPerIteration}
                    onChange={(e) =>
                      setUnitsPerIteration(Math.max(1, Number(e.target.value)))
                    }
                    required
                  />
                  <span className="text-xs text-text-secondary shrink-0 font-medium">
                    {unit} / Iterasi
                  </span>
                </div>
                <p className="text-[11px] text-text-muted mt-1">
                  Kapasitas wajan/panggangan dalam satu kali proses masak.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-primary-light/30 border border-primary/20 flex items-center justify-between text-xs">
              <span className="text-text-secondary">
                Estimasi Total Output Produksi Harian:
              </span>
              <span className="font-bold text-primary text-sm">
                {dailyTotalUnits} {unit} / Hari ({iterationsPerDay} Iterasi)
              </span>
            </div>
          </div>

          {/* BAGIAN 3: Komposisi Resep (BOM) Lintas 7 Sektor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-text-primary">
                  3. Komponen Resep (BOM) per 1 {unit}
                </h4>
                <p className="text-xs text-text-secondary">
                  Pilih sektor asal bahan baku untuk kemudahan agregasi pengadaan grosir di Bursa.
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

            <div className="space-y-2.5">
              {ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 p-2.5 rounded-xl border border-border bg-surface items-center text-xs shadow-sm"
                >
                  {/* Sektor Bahan Baku (7 Sektor) */}
                  <div className="col-span-12 sm:col-span-3">
                    <select
                      value={ing.sector || "PERTANIAN"}
                      onChange={(e) =>
                        handleIngredientChange(idx, "sector", e.target.value as SectorType)
                      }
                      className="w-full text-[11px] rounded border border-border px-2 py-1.5 bg-surface-subtle font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {SECTOR_OPTIONS.map((sec) => (
                        <option key={sec.value} value={sec.value}>
                          {sec.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nama Bahan Baku */}
                  <div className="col-span-12 sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Nama bahan baku..."
                      value={ing.name}
                      onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                      className="w-full text-xs rounded border border-border px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  {/* Takaran per unit */}
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      step="any"
                      min="0.0001"
                      placeholder="Takaran"
                      value={ing.amountPerPortion}
                      onChange={(e) =>
                        handleIngredientChange(
                          idx,
                          "amountPerPortion",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full text-xs rounded border border-border px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  {/* Satuan Bahan */}
                  <div className="col-span-3 sm:col-span-1">
                    <select
                      value={ing.unit}
                      onChange={(e) => handleIngredientChange(idx, "unit", e.target.value)}
                      className="w-full text-[11px] rounded border border-border px-1 py-1.5 bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {COMMON_INGREDIENT_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Estimasi Biaya */}
                  <div className="col-span-4 sm:col-span-2">
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
                      className="w-full text-xs rounded border border-border px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Tombol Hapus */}
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

          {/* BAGIAN 4: Prediksi Timbulan Limbah Sirkular */}
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                    4. Prediksi Limbah Sirkular &amp; Potensi Monetisasi
                  </h4>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Estimasi residu yang dihasilkan dari bahan baku yang dapat dijual ke offtaker bursa.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddWasteRow}
                className="text-xs font-semibold gap-1 border-emerald-500/30 text-emerald-800 hover:bg-emerald-500/10 min-h-[32px]"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Residu
              </Button>
            </div>

            {/* Preset Cepat Limbah */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-text-muted shrink-0">Preset Cepat:</span>
              {WASTE_PRESETS.slice(0, 4).map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyWastePreset(preset)}
                  className="px-2 py-0.5 rounded-full bg-surface border border-emerald-500/30 text-emerald-800 hover:bg-emerald-500/10 shrink-0 font-medium transition-colors"
                >
                  + {preset.name}
                </button>
              ))}
            </div>

            {/* List Limbah */}
            <div className="space-y-2">
              {wastes.map((waste, wIdx) => (
                <div
                  key={wIdx}
                  className="grid grid-cols-12 gap-2 p-2 rounded-lg bg-surface border border-emerald-500/20 items-center text-xs"
                >
                  <div className="col-span-12 sm:col-span-5">
                    <input
                      type="text"
                      placeholder="Jenis residu (cth: Minyak Jelantah)"
                      value={waste.wasteName}
                      onChange={(e) => handleWasteChange(wIdx, "wasteName", e.target.value)}
                      className="w-full text-xs rounded border border-border px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="Vol/Iterasi"
                        value={waste.volumePerIteration}
                        onChange={(e) =>
                          handleWasteChange(
                            wIdx,
                            "volumePerIteration",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full text-xs rounded border border-border px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <select
                        value={waste.unit}
                        onChange={(e) =>
                          handleWasteChange(
                            wIdx,
                            "unit",
                            e.target.value as "KG" | "LITER" | "PCS"
                          )
                        }
                        className="text-[11px] rounded border border-border px-1 py-1.5 bg-surface"
                      >
                        <option value="LITER">LITER</option>
                        <option value="KG">KG</option>
                        <option value="PCS">PCS</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <input
                      type="number"
                      step="100"
                      placeholder="Harga Bursa / Satuan"
                      value={waste.potentialPricePerUnit}
                      onChange={(e) =>
                        handleWasteChange(
                          wIdx,
                          "potentialPricePerUnit",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full text-xs rounded border border-border px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveWasteRow(wIdx)}
                      className="text-text-muted hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BAGIAN 5: Komparasi Margin Finansial (Tanpa vs Dengan Penjualan Limbah) */}
          <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Analisis Finansial Komparatif
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Sirkular Uplift: +{circularUpliftPct.toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Skenario A: Tanpa Penjualan Limbah */}
              <div className="p-3 rounded-lg bg-surface-subtle/80 border border-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-muted text-[11px]">
                    Skenario A: Tanpa Jual Limbah
                  </span>
                  <span className="text-[10px] text-text-muted">Konvensional</span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-text-secondary">HPP Bahan Pokok:</span>
                  <span className="font-bold text-amber-600">{formatCurrency(totalEstimatedHpp)}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-text-secondary">Margin Laba Murni:</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(pureMarginNominal)} ({pureMarginPct.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Skenario B: Dengan Penjualan Limbah */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-900 text-[11px]">
                    Skenario B: Dengan Jual Limbah
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                    Sirkular KUMPUL
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-text-secondary">Cashflow Limbah/Unit:</span>
                  <span className="font-bold text-emerald-700">
                    +{formatCurrency(Math.round(wasteRevenuePerUnit))}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-text-secondary">Total Margin Bersih:</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {formatCurrency(Math.round(circularBoostedMarginNominal))} (
                    {circularBoostedMarginPct.toFixed(1)}%)
                  </span>
                </div>
              </div>
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
              {isSubmitting
                ? "Menyimpan ke Sistem..."
                : isEditMode
                ? "Perbarui Menu & Resep"
                : "Simpan Menu & Resep"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
