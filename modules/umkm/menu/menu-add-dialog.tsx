"use client";

import * as React from "react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
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
  updateProductAction,
  type CreateProductRecipeItemInput,
} from "@/actions/products";
import type { BEProduct } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import {
  PRODUCT_UNITS,
  COMMON_INGREDIENT_UNITS,
  WASTE_PRESETS,
  type WasteItemInput,
  type SectorType,
} from "./menu-types";

interface MenuAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: BEProduct) => void;
  productToEdit?: BEProduct | null;
}

export interface IngredientUnitOption {
  value: string;
  label: string;
  sectorTag: string;
}

// 11 Opsi Satuan Riil UMKM Sesuai brief.md Seksi 2.2
export const PRODUCT_UNIT_OPTIONS = [
  { value: "PORSI", label: "Porsi (Piring / Sajian Standar)" },
  { value: "BOWL", label: "Bowl (Mangkuk Kertas / Rice Bowl)" },
  { value: "BOX", label: "Box (Kotak Bento / Nasi Katering)" },
  { value: "CUP", label: "Cup (Gelas Minuman Dingin/Panas)" },
  { value: "PAX", label: "Pax (Paket Prasmanan / Rombongan)" },
  { value: "BOTOL", label: "Botol (Kemasan Cairan / Cold Brew)" },
  { value: "LOYANG", label: "Loyang (Cetakan Kue / Roti)" },
  { value: "BUNGKUS", label: "Bungkus (Tradisional Daun / Kertas)" },
  { value: "PACK", label: "Pack (Pouch / Plastik Sealer)" },
  { value: "PCS", label: "Pcs (Satuan Lepasan / Gorengan)" },
  { value: "KG", label: "Kilogram (Penjualan Curah Kiloan)" },
];

export const SECTOR_OPTIONS = [
  { value: "PERTANIAN", label: "Pertanian & Tanaman Pangan" },
  { value: "PETERNAKAN", label: "Peternakan & Unggas" },
  { value: "PERIKANAN", label: "Perikanan & Hasil Laut" },
  { value: "PERKEBUNAN", label: "Perkebunan & Rempah" },
  { value: "FNB_PENGOLAHAN", label: "F&B / Bahan Olahan" },
  { value: "RITEL", label: "Ritel & Kemasan" },
  { value: "LOGISTIK", label: "Logistik & Distribusi" },
];

export const SECTOR_INGREDIENT_UNITS: IngredientUnitOption[] = [
  { value: "KG", label: "Kilogram (Kg)", sectorTag: "Pertanian & Umum" },
  { value: "GRAM", label: "Gram (g)", sectorTag: "Pertanian & Bumbu" },
  { value: "IKAT", label: "Ikat", sectorTag: "Pertanian (Sayuran)" },
  { value: "KARUNG", label: "Karung (Grosir)", sectorTag: "Pertanian (Beras/Tepung)" },
  { value: "EKOR", label: "Ekor", sectorTag: "Peternakan (Unggas/Karkas)" },
  { value: "BUTIR", label: "Butir", sectorTag: "Peternakan (Telur)" },
  { value: "KRAT", label: "Krat", sectorTag: "Perikanan & Tangkapan Laut" },
  { value: "LITER", label: "Liter (L)", sectorTag: "FnB / Minyak & Susu" },
  { value: "ML", label: "Mililiter (ml)", sectorTag: "FnB / Ekstrak & Saus" },
  { value: "BOTOL", label: "Botol", sectorTag: "FnB / Saus & Bumbu" },
  { value: "PCS", label: "Pieces (Pcs)", sectorTag: "Ritel & Kemasan" },
  { value: "PACK", label: "Pack / Bungkus", sectorTag: "Ritel & Bumbu Racik" },
  { value: "DUS", label: "Dus / Karton", sectorTag: "Logistik & Grosir" },
];

export function MenuAddDialog({
  isOpen,
  onClose,
  onSuccess,
  productToEdit,
}: MenuAddDialogProps) {
  const isEditMode = Boolean(productToEdit);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // 1. Data Utama Produk
  const [productName, setProductName] = React.useState("");
  const [productUnit, setProductUnit] = React.useState("PORSI");
  const [productionIterations, setProductionIterations] = React.useState<number>(2);
  const [batchUnits, setBatchUnits] = React.useState<number>(50);
  const [sellingPrice, setSellingPrice] = React.useState<number>(25000);

// 4. Limbah Sirkular
  const [wastes, setWastes] = React.useState<WasteItemInput[]>([]);

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

  // Sinkronisasi saat productToEdit berganti
  React.useEffect(() => {
    if (productToEdit) {
      setProductName(productToEdit.product_name || "");
      setProductUnit(productToEdit.unit || "PORSI");
      setProductionIterations(productToEdit.production_iterations_per_day || 2);
      setBatchUnits(productToEdit.expected_batch_units || 50);
      setSellingPrice(
        typeof productToEdit.target_selling_price_per_unit === "number"
          ? productToEdit.target_selling_price_per_unit
          : parseFloat(productToEdit.target_selling_price_per_unit || "25000")
      );
      if (productToEdit.recipes && productToEdit.recipes.length > 0) {
        setIngredients(
          productToEdit.recipes.map((r) => ({
            id: r.id,
            name: r.ingredient_name,
            amountPerPortion: Number(r.required_qty_per_unit) || 0.1,
            unit: r.unit || "KG",
            estimatedCost: Number(r.estimated_cost_per_unit) || 0,
          }))
        );
      }
      // Reset wastes when editing a product (since we don't have waste data from BE)
      setWastes([]);
    } else {
      setProductName("");
      setProductUnit("PORSI");
      setProductionIterations(2);
      setBatchUnits(50);
      setSellingPrice(25000);
      setIngredients([
        { name: "Daging Ayam Fillet", amountPerPortion: 0.2, unit: "KG", estimatedCost: 7000 },
        { name: "Minyak Goreng Sawit", amountPerPortion: 0.05, unit: "LITER", estimatedCost: 1000 },
        { name: "Cabai Rawit Merah", amountPerPortion: 0.03, unit: "KG", estimatedCost: 1500 },
      ]);
      // Reset wastes when creating a new product
      setWastes([]);
    }
  }, [productToEdit, isOpen]);

  // Kalkulasi instan HPP & Output Harian
  const totalDailyOutput = (Number(productionIterations) || 1) * (Number(batchUnits) || 1);

  const totalEstimatedHpp = React.useMemo(() => {
    return ingredients.reduce(
      (sum, item) => sum + (Number(item.estimatedCost) || 0),
      0
    );
  }, [ingredients]);

  const projectedPureMarginPct = React.useMemo(() => {
    if (sellingPrice <= 0) return 0;
    return Math.max(0, ((sellingPrice - totalEstimatedHpp) / sellingPrice) * 100);
  }, [sellingPrice, totalEstimatedHpp]);

  // Estimasi residu limbah (sekitar 5-8% dari modal bahan)
  const estimatedWasteRevenuePerPortion = Math.round(totalEstimatedHpp * 0.08);
  const projectedCircularMarginPct = React.useMemo(() => {
    if (sellingPrice <= 0) return 0;
    const totalEarnings = (sellingPrice - totalEstimatedHpp) + estimatedWasteRevenuePerPortion;
    return Math.max(0, (totalEarnings / sellingPrice) * 100);
  }, [sellingPrice, totalEstimatedHpp, estimatedWasteRevenuePerPortion]);

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
      toast.error("Minimal harus ada 1 komponen bahan baku resep.");
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      toast.error("Nama produk usaha wajib diisi.");
      return;
    }

    const validIngredients = ingredients.filter((ing) => ing.name.trim().length > 0);
    if (validIngredients.length === 0) {
      toast.error("Masukkan minimal 1 bahan baku kebutuhan produk.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && productToEdit) {
        const res = await updateProductAction({
          productId: productToEdit.id,
          productName: productName.trim(),
          unit: productUnit,
          targetSellingPricePerUnit: Number(sellingPrice) || 0,
          expectedBatchUnits: Number(batchUnits) || 50,
          ingredients: validIngredients,
        });

        if (res.success && res.data) {
          const updatedWithDaily = {
            ...res.data,
            production_iterations_per_day: Number(productionIterations) || 2,
          };
          toast.success(res.message || "Spesifikasi produk berhasil diperbarui!");
          onSuccess(updatedWithDaily);
          onClose();
        } else {
          toast.error(res.message || "Gagal memperbarui produk.");
        }
      } else {
        const res = await createProductWithRecipesAction({
          productName: productName.trim(),
          unit: productUnit,
          targetSellingPricePerUnit: Number(sellingPrice) || 0,
          expectedBatchUnits: Number(batchUnits) || 50,
          ingredients: validIngredients,
        });

        if (res.success && res.data) {
          const createdWithDaily = {
            ...res.data,
            production_iterations_per_day: Number(productionIterations) || 2,
          };
          toast.success(res.message || "Produk dan formulasi resep berhasil ditambahkan!");
          onSuccess(createdWithDaily);
          onClose();
        } else {
          toast.error(res.message || "Gagal menyimpan produk ke sistem.");
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
      <DialogContent className="max-w-2xl sm:max-w-3xl p-0 overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 pr-16 border-b border-border/80 bg-surface shrink-0">
          <DialogTitle className="text-base sm:text-lg font-heading font-bold text-text-primary leading-tight">
            {isEditMode ? "Edit Spesifikasi Menu & Resep" : "Tambah Produk & Resep Bahan Baku"}
          </DialogTitle>
          <DialogDescription className="text-xs text-text-secondary mt-1">
            Konfigurasi ritme produksi harian, takaran resep bahan baku, dan komparasi margin sirkular.
          </DialogDescription>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6 custom-scrollbar">
            {/* Bagian 1: Informasi Produk & Ritme Operasional */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="text-xs font-heading font-bold text-text-primary uppercase tracking-wider">
                  1. Informasi Produk &amp; Ritme Produksi Harian
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 p-4 rounded-2xl bg-surface-subtle/50 border border-border">
                {/* Nama Produk */}
                <div className="sm:col-span-8">
                  <Input
                    label="Nama Produk Usaha *"
                    type="text"
                    placeholder="Contoh: Bebek Goreng Kremes, Rice Bowl Ayam, Kopi Susu"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                  />
                </div>

                {/* Satuan Produk (11 Opsi Riil) */}
                <div className="sm:col-span-4 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-primary">
                    Satuan Output *
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="w-full min-h-[44px] h-[44px] px-3.5 rounded-xl border border-border bg-surface hover:bg-surface-subtle text-xs sm:text-sm font-medium text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all flex items-center justify-between cursor-pointer shadow-elevation-1"
                      >
                        <span className="truncate">
                          {PRODUCT_UNIT_OPTIONS.find((o) => o.value === productUnit)?.label || productUnit}
                        </span>
                        <ChevronDown className="w-4 h-4 text-text-muted shrink-0 ml-1" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 max-h-60 overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-elevation-2 custom-scrollbar">
                      <DropdownMenuRadioGroup value={productUnit} onValueChange={setProductUnit}>
                        {PRODUCT_UNIT_OPTIONS.map((opt) => (
                          <DropdownMenuRadioItem
                            key={opt.value}
                            value={opt.value}
                            className="rounded-lg text-xs py-2 px-3 font-medium cursor-pointer"
                          >
                            {opt.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Frekuensi Iterasi Harian */}
                <div className="sm:col-span-4">
                  <Input
                    label="Frekuensi Masak / Hari *"
                    type="number"
                    min={1}
                    value={productionIterations}
                    onChange={(e) => setProductionIterations(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                  />
                  <span className="text-[10px] text-text-muted mt-0.5 block">Sesi produksi per hari</span>
                </div>

                {/* Kapasitas per Iterasi */}
                <div className="sm:col-span-4">
                  <Input
                    label={`Kapasitas per Sesi (${productUnit}) *`}
                    type="number"
                    min={1}
                    value={batchUnits}
                    onChange={(e) => setBatchUnits(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                  />
                  <span className="text-[10px] text-text-muted mt-0.5 block">Output tiap kali masak</span>
                </div>

                {/* Harga Jual per Unit */}
                <div className="sm:col-span-4">
                  <Input
                    label={`Target Harga Jual / ${productUnit} *`}
                    type="number"
                    min={0}
                    step={500}
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    required
                  />
                  <span className="text-[10px] text-text-muted mt-0.5 block">
                    Total Output: <strong>{totalDailyOutput} {productUnit} / hari</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Bagian 2: Resep Komposisi Bahan Baku */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <h3 className="text-xs font-heading font-bold text-text-primary uppercase tracking-wider">
                    2. Rincian Resep Bahan Baku (BOM per {productUnit})
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddIngredientRow}
                  className="rounded-xl text-xs font-semibold gap-1.5 h-8 px-3 border-primary/30 text-primary hover:bg-primary-light"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Bahan</span>
                </Button>
              </div>

              {/* Label Kolom Tabel (Desktop) */}
              <div className="hidden sm:grid grid-cols-12 gap-2 px-3 text-[11px] font-semibold text-text-secondary">
                <span className="col-span-5">Nama Bahan Baku *</span>
                <span className="col-span-2 text-right">Takaran / {productUnit} *</span>
                <span className="col-span-2">Satuan</span>
                <span className="col-span-2 text-right">Biaya Modal (Rp)</span>
                <span className="col-span-1 text-center">Hapus</span>
              </div>

              {/* Tabel Input Resep */}
              <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 p-2.5 sm:p-2 rounded-xl border border-border bg-surface items-center hover:border-border-strong transition-all shadow-xs"
                  >
                    {/* Nama Bahan */}
                    <div className="col-span-12 sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Nama bahan (contoh: Daging Bebek, Minyak Goreng)"
                        value={ing.name}
                        onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                        className="w-full h-10 px-3 text-xs rounded-lg border border-border bg-surface-subtle/50 text-text-primary focus:outline-none focus:border-primary focus:bg-surface"
                        required
                      />
                    </div>

                    {/* Takaran per Porsi */}
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        step="any"
                        min="0.001"
                        placeholder="Takaran"
                        value={ing.amountPerPortion}
                        onChange={(e) => handleIngredientChange(idx, "amountPerPortion", parseFloat(e.target.value) || 0)}
                        className="w-full h-10 px-2.5 text-xs text-right rounded-lg border border-border bg-surface-subtle/50 text-text-primary focus:outline-none focus:border-primary focus:bg-surface tabular-nums"
                        required
                      />
                    </div>

                    {/* Satuan Bahan */}
                    <div className="col-span-4 sm:col-span-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="w-full h-10 px-2 text-xs rounded-lg border border-border bg-surface-subtle/50 flex items-center justify-between text-text-primary hover:bg-surface-subtle focus:border-primary cursor-pointer"
                          >
                            <span className="truncate">{ing.unit}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-48 max-h-56 overflow-y-auto rounded-xl p-1 bg-surface border border-border shadow-elevation-2 custom-scrollbar">
                          <DropdownMenuRadioGroup
                            value={ing.unit}
                            onValueChange={(val) => handleIngredientChange(idx, "unit", val)}
                          >
                            {SECTOR_INGREDIENT_UNITS.map((unitOpt) => (
                              <DropdownMenuRadioItem
                                key={unitOpt.value}
                                value={unitOpt.value}
                                className="text-xs py-1.5 px-2.5 rounded-lg cursor-pointer"
                              >
                                {unitOpt.label}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Estimasi Biaya Modal per Porsi */}
                    <div className="col-span-3 sm:col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="100"
                        placeholder="Biaya Rp"
                        value={ing.estimatedCost || ""}
                        onChange={(e) => handleIngredientChange(idx, "estimatedCost", parseInt(e.target.value) || 0)}
                        className="w-full h-10 px-2 text-xs text-right rounded-lg border border-border bg-surface-subtle/50 text-text-primary focus:outline-none focus:border-primary focus:bg-surface tabular-nums"
                      />
                    </div>

                    {/* Tombol Hapus */}
                    <div className="col-span-1 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredientRow(idx)}
                        disabled={ingredients.length <= 1}
                        className="size-8 flex items-center justify-center rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 disabled:opacity-25 transition-colors cursor-pointer"
                        title="Hapus baris bahan"
                        aria-label="Hapus baris bahan"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bagian 3: Komparasi Margin Sirkular Live Preview (brief.md Seksi 3.2) */}
            <div className="p-4 rounded-2xl bg-surface-subtle/70 border border-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-heading text-text-primary uppercase tracking-wider">
                  3. Analisis Finansial Komparatif (Live Preview)
                </span>
                <span className="text-[11px] font-bold text-circular-waste bg-circular-waste-light px-2 py-0.5 rounded-md border border-circular-waste/20">
                  +{(projectedCircularMarginPct - projectedPureMarginPct).toFixed(1)}% Sirkular Boost
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Skenario A: Konvensional */}
                <div className="p-3 rounded-xl bg-surface border border-border space-y-1.5">
                  <span className="text-[11px] font-bold text-text-secondary block">
                    Skenario A: Konvensional
                  </span>
                  <div className="flex justify-between text-text-muted">
                    <span>HPP Bahan Pokok:</span>
                    <span className="font-semibold text-text-primary">{formatCurrency(totalEstimatedHpp)}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Laba Bersih per Unit:</span>
                    <span className="font-semibold text-text-primary">{formatCurrency(Math.max(0, sellingPrice - totalEstimatedHpp))}</span>
                  </div>
                  <div className="pt-1 border-t border-border flex justify-between font-bold">
                    <span>Margin Murni:</span>
                    <span className="text-primary">{projectedPureMarginPct.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Skenario B: Sirkular KUMPUL */}
                <div className="p-3 rounded-xl bg-circular-waste-light/40 border border-circular-waste/25 space-y-1.5">
                  <span className="text-[11px] font-bold text-circular-waste block">
                    Skenario B: Sirkular KUMPUL
                  </span>
                  <div className="flex justify-between text-text-muted">
                    <span>Pendapatan Residu:</span>
                    <span className="font-semibold text-circular-waste">+{formatCurrency(estimatedWasteRevenuePerPortion)} / {productUnit}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Laba Bersih Ter-Boost:</span>
                    <span className="font-semibold text-circular-waste">{formatCurrency(Math.max(0, sellingPrice - totalEstimatedHpp) + estimatedWasteRevenuePerPortion)}</span>
                  </div>
                  <div className="pt-1 border-t border-circular-waste/20 flex justify-between font-bold">
                    <span>Margin Sirkular:</span>
                    <span className="text-circular-waste">{projectedCircularMarginPct.toFixed(1)}%</span>
                  </div>
                </div>
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
          </div>

          {/* Sticky Modal Footer */}
          <div className="px-6 py-4 border-t border-border/80 bg-surface flex items-center justify-end gap-3 shrink-0">
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
              {isSubmitting
                ? "Menyimpan ke Sistem..."
                : isEditMode
                ? "Simpan Perubahan Menu"
                : "Simpan Produk & Resep"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
