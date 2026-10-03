"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Utensils,
  Plus,
  Trash2,
  Sparkles,
  Save,
  TrendingUp,
  AlertCircle,
  Leaf,
  Coins,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import type { BEProduct, BERecipe } from "@/lib/api/types";
import { formatCurrency, formatNumber } from "@/lib/format";
import { getProductByIdAction, updateProductAction } from "@/actions/products";
import { predictProductWaste } from "@/lib/ai-waste-prediction";

interface IngredientFormItem {
  id?: string;
  name: string;
  amountPerPortion: number;
  unit: string;
  estimatedCost: number;
}

const COMMON_UNITS = [
  { value: "GRAM", label: "Gram" },
  { value: "KG", label: "Kilogram" },
  { value: "ML", label: "Mililiter" },
  { value: "LITER", label: "Liter" },
  { value: "BUTIR", label: "Butir" },
  { value: "SIUNG", label: "Siung" },
  { value: "BATANG", label: "Batang" },
  { value: "LEMBAR", label: "Lembar" },
  { value: "SDM", label: "Sendok Makan" },
  { value: "SDT", label: "Sendok Teh" },
  { value: "IKAT", label: "Ikat" },
  { value: "BUNGKUS", label: "Bungkus" },
];

const PRODUCT_UNIT_OPTIONS = [
  "PORSI",
  "KOTAK",
  "BUNGKUS",
  "PAKET",
  "LOYANG",
  "CUP",
  "BOTOL",
  "KG",
  "PCS",
];

interface ProdukEditViewProps {
  productId: string;
  initialProduct?: BEProduct | null;
}

export function ProdukEditView({ productId, initialProduct }: ProdukEditViewProps) {
  const router = useRouter();
  const [product, setProduct] = React.useState<BEProduct | null>(initialProduct || null);
  const [isLoading, setIsLoading] = React.useState(!initialProduct);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [productName, setProductName] = React.useState("");
  const [unit, setUnit] = React.useState("PORSI");
  const [sellingPrice, setSellingPrice] = React.useState<number>(0);
  const [batchUnits, setBatchUnits] = React.useState<number>(100);
  const [ingredients, setIngredients] = React.useState<IngredientFormItem[]>([]);

  // Muat data produk dari backend atau mock localStorage
  React.useEffect(() => {
    let ignore = false;

    const resolveProduct = async () => {
      // 1. Cek localStorage terlebih dahulu (mock testing FE)
      try {
        const saved = localStorage.getItem("kumpul_mock_products");
        if (saved) {
          const mocks: BEProduct[] = JSON.parse(saved);
          const found = mocks.find((m) => m.id === productId);
          if (found && !ignore) {
            populateForm(found);
            setIsLoading(false);
            return;
          }
        }
      } catch {}

      // 2. Fetch dari backend via server action
      try {
        const res = await getProductByIdAction(productId);
        if (!ignore) {
          if (res.success && res.data) {
            populateForm(res.data);
          } else {
            toast.error(res.message || "Produk tidak ditemukan");
          }
        }
      } catch {
        if (!ignore) toast.error("Gagal memuat produk");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    resolveProduct();

    return () => {
      ignore = true;
    };
  }, [productId]);

  const populateForm = (data: BEProduct) => {
    setProduct(data);
    setProductName(data.product_name);
    setUnit(data.unit || "PORSI");
    setSellingPrice(
      typeof data.target_selling_price_per_unit === "number"
        ? data.target_selling_price_per_unit
        : parseFloat(data.target_selling_price_per_unit || "0")
    );
    setBatchUnits(data.expected_batch_units || 100);

    if (data.recipes && data.recipes.length > 0) {
      setIngredients(
        data.recipes.map((r) => ({
          id: r.id,
          name: r.ingredient_name,
          amountPerPortion: Number(r.required_qty_per_unit) || 0,
          unit: r.unit || "GRAM",
          estimatedCost: Number(r.estimated_cost_per_unit) || 0,
        }))
      );
    } else {
      setIngredients([
        { name: "Bahan Baku Utama", amountPerPortion: 1, unit: "KG", estimatedCost: 10000 },
      ]);
    }
  };

  // Kalkulasi Realtime HPP & Margin
  const totalHpp = React.useMemo(() => {
    return ingredients.reduce((sum, item) => sum + (Number(item.estimatedCost) || 0), 0);
  }, [ingredients]);

  const projectedMarginPct = React.useMemo(() => {
    if (sellingPrice <= 0) return 0;
    return Math.max(0, ((sellingPrice - totalHpp) / sellingPrice) * 100);
  }, [sellingPrice, totalHpp]);

  // Kalkulasi Realtime Prediksi Limbah AI
  const wastePrediction = React.useMemo(() => {
    const pseudoRecipes: BERecipe[] = ingredients.map((ing, idx) => ({
      id: ing.id || `tmp-${idx}`,
      umkm_product_id: productId,
      ingredient_name: ing.name,
      required_qty_per_unit: ing.amountPerPortion,
      unit: ing.unit,
      total_batch_required_qty: ing.amountPerPortion * batchUnits,
      estimated_cost_per_unit: ing.estimatedCost,
      created_at: "",
      updated_at: "",
    }));

    return predictProductWaste(productName || "Produk", batchUnits, pseudoRecipes);
  }, [productName, batchUnits, ingredients, productId]);

  // Handler Bahan Baku
  const handleAddIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { name: "", amountPerPortion: 0.1, unit: "KG", estimatedCost: 1000 },
    ]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (
    index: number,
    field: keyof IngredientFormItem,
    value: string | number
  ) => {
    setIngredients((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Submit Perubahan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName.trim()) {
      toast.error("Nama produk tidak boleh kosong.");
      return;
    }

    if (ingredients.length === 0) {
      toast.error("Tambahkan minimal 1 komponen bahan baku resep.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        productId,
        productName: productName.trim(),
        unit: unit.toUpperCase(),
        targetSellingPricePerUnit: Number(sellingPrice),
        expectedBatchUnits: Math.max(1, Number(batchUnits) || 1),
        ingredients: ingredients.map((ing) => ({
          id: ing.id,
          name: ing.name.trim(),
          amountPerPortion: Number(ing.amountPerPortion) || 0,
          unit: ing.unit.toUpperCase(),
          estimatedCost: Number(ing.estimatedCost) || 0,
        })),
      };

      const res = await updateProductAction(payload);

      if (res.success && res.data) {
        // Update mock localStorage jika ada
        try {
          const saved = localStorage.getItem("kumpul_mock_products");
          if (saved) {
            const mocks: BEProduct[] = JSON.parse(saved);
            const idx = mocks.findIndex((m) => m.id === productId);
            if (idx >= 0) {
              mocks[idx] = res.data;
            } else {
              mocks.unshift(res.data);
            }
            localStorage.setItem("kumpul_mock_products", JSON.stringify(mocks));
          }
        } catch {}

        toast.success(res.message || "Spesifikasi produk berhasil disimpan!");
        router.push("/produk");
      } else {
        toast.error(res.message || "Gagal memperbarui produk.");
      }
    } catch {
      toast.error("Terjadi kendala saat menyimpan perubahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs text-text-secondary font-medium">
          Memuat formulir edit spesifikasi produk...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-1">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl w-fit cursor-pointer gap-2 font-medium mb-1"
          >
            <Link href="/produk">
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar Produk</span>
            </Link>
          </Button>

          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary">
            Edit Spesifikasi Produk &amp; Resep
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary">
            Perbarui parameter harga jual, siklus iterasi batch produksi, dan komposisi bill of materials.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            asChild
            variant="outline"
            size="md"
            className="rounded-xl cursor-pointer"
          >
            <Link href="/produk">Batal</Link>
          </Button>

          <Button
            type="submit"
            form="edit-product-form"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="rounded-xl font-bold cursor-pointer gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </Button>
        </div>
      </div>

      <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-6">
        {/* 2. Kartu Master Data Produk */}
        <Card className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-elevation-1 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/70">
            <span className="p-2 rounded-xl bg-primary-light text-primary">
              <Utensils className="w-4 h-4" />
            </span>
            <CardTitle className="text-base font-bold text-text-primary">
              Parameter Utama Produk
            </CardTitle>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Nama Produk Olahan *"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Contoh: Ayam Goreng Lengkuas Gurih"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Satuan Jual Produk *
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-border bg-surface hover:bg-surface-subtle text-xs font-semibold text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>{unit}</span>
                    <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-44">
                  <DropdownMenuRadioGroup value={unit} onValueChange={setUnit}>
                    {PRODUCT_UNIT_OPTIONS.map((u) => (
                      <DropdownMenuRadioItem key={u} value={u} className="text-xs font-medium">
                        {u}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <Input
                label="Estimasi Iterasi / Batch *"
                type="number"
                min={1}
                value={batchUnits}
                onChange={(e) => setBatchUnits(Math.max(1, parseInt(e.target.value, 10) || 1))}
                helperText="Jumlah porsi dalam 1 kali masak"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                label={`Target Harga Jual per ${unit} (Rp) *`}
                type="number"
                min={0}
                step="any"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Math.max(0, Number(e.target.value)))}
                helperText="Harga jual eceran ke konsumen"
                required
              />
            </div>

            <div className="sm:col-span-2 p-3 rounded-xl bg-surface-subtle border border-border/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] text-text-muted block">Estimasi Omzet 1 Batch:</span>
                <span className="font-heading text-sm font-bold text-text-primary tabular-nums">
                  {formatCurrency(sellingPrice * batchUnits)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-text-muted block">Total Biaya Modal 1 Batch:</span>
                <span className="font-heading text-sm font-bold text-amber-700 tabular-nums">
                  {formatCurrency(totalHpp * batchUnits)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* 3. Kartu Komposisi Resep Bahan Baku */}
        <Card className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-elevation-1 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/70">
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                Komposisi Resep Bahan Baku per 1 {unit}
              </CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">
                Rincian takaran dan estimasi modal bahan untuk menghitung HPP otomatis.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddIngredient}
              className="rounded-xl font-bold cursor-pointer gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>Tambah Bahan</span>
            </Button>
          </div>

          <div className="space-y-3">
            <div className="hidden sm:grid grid-cols-12 gap-3 text-xs font-semibold text-text-secondary px-2">
              <div className="col-span-5">Nama Bahan Baku</div>
              <div className="col-span-2">Takaran / {unit}</div>
              <div className="col-span-2">Satuan</div>
              <div className="col-span-2">Biaya Est (Rp)</div>
              <div className="col-span-1 text-center">Aksi</div>
            </div>

            {ingredients.map((ing, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-3 rounded-xl border border-border bg-surface-subtle/50"
              >
                <div className="sm:col-span-5">
                  <label className="text-[11px] font-medium text-text-secondary sm:hidden mb-1 block">
                    Nama Bahan Baku
                  </label>
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                    placeholder="Contoh: Daging Ayam Broiler"
                    className="w-full min-h-[40px] text-xs rounded-xl border border-border bg-surface px-3 py-2 text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-text-secondary sm:hidden mb-1 block">
                    Takaran / {unit}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={ing.amountPerPortion}
                    onChange={(e) =>
                      handleIngredientChange(
                        idx,
                        "amountPerPortion",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full min-h-[40px] text-xs rounded-xl border border-border bg-surface px-3 py-2 text-text-primary tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-text-secondary sm:hidden mb-1 block">
                    Satuan
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-subtle text-xs font-semibold text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate">{ing.unit}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-44 max-h-56 overflow-y-auto">
                      <DropdownMenuRadioGroup
                        value={ing.unit}
                        onValueChange={(val) => handleIngredientChange(idx, "unit", val)}
                      >
                        {COMMON_UNITS.map((u) => (
                          <DropdownMenuRadioItem key={u.value} value={u.value} className="text-xs">
                            <span className="font-semibold">{u.value}</span>{" "}
                            <span className="text-text-muted">({u.label})</span>
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-text-secondary sm:hidden mb-1 block">
                    Biaya Est (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={ing.estimatedCost}
                    onChange={(e) =>
                      handleIngredientChange(
                        idx,
                        "estimatedCost",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full min-h-[40px] text-xs rounded-xl border border-border bg-surface px-3 py-2 text-text-primary tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                    required
                  />
                </div>

                <div className="sm:col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(idx)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-error hover:bg-error/10 transition-colors cursor-pointer"
                    title="Hapus bahan"
                    disabled={ingredients.length <= 1}
                  >
                    <Trash2 className="w-4 h-4 text-error" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 4. Live Ringkasan Finansial & Prediksi Limbah AI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Box Kiri: HPP & Margin Realtime */}
          <div className="p-5 rounded-2xl bg-primary-light/40 border border-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-heading text-xs font-bold text-text-primary uppercase tracking-wider">
                Simulasi Finansial Terkalkulasi
              </span>
              <Badge variant="primary" className="text-[10px]">
                Otomatis
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-surface rounded-xl border border-primary/15">
                <span className="text-[11px] text-text-muted block">HPP Terhitung / {unit}:</span>
                <span className="font-heading text-base font-bold text-amber-700 tabular-nums">
                  {formatCurrency(totalHpp)}
                </span>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-primary/15">
                <span className="text-[11px] text-text-muted block">Proyeksi Margin:</span>
                <span
                  className={`font-heading text-base font-bold tabular-nums flex items-center gap-1 ${
                    projectedMarginPct >= 30
                      ? "text-emerald-700"
                      : projectedMarginPct > 0
                      ? "text-primary"
                      : "text-red-600"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  {projectedMarginPct.toFixed(1)}%
                </span>
              </div>
            </div>

            <p className="text-[11px] text-text-secondary leading-relaxed">
              Target laba kotor per porsi:{" "}
              <strong className="text-primary">{formatCurrency(Math.max(0, sellingPrice - totalHpp))}</strong>{" "}
              (atau {formatCurrency(Math.max(0, (sellingPrice - totalHpp) * batchUnits))} per 1 siklus batch).
            </p>
          </div>

          {/* Box Kanan: Prediksi Limbah Sirkular AI Terkini */}
          <div className="p-5 rounded-2xl bg-circular-waste-light/70 border border-circular-waste/25 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-circular-waste">
                <Sparkles className="w-4 h-4" />
                <span className="font-heading text-xs font-bold tracking-tight">
                  Prediksi Limbah Sirkular AI
                </span>
              </div>
              <Badge variant="waste" className="text-[10px] gap-1 font-semibold">
                <Leaf className="w-3 h-3" />
                {wastePrediction.aiConfidencePct}% Akurasi
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-surface rounded-xl border border-circular-waste/20">
                <span className="text-[11px] text-text-muted block">Residu per Batch:</span>
                <span className="font-heading text-base font-bold text-text-primary tabular-nums">
                  ~{wastePrediction.totalVolumeKg} {wastePrediction.items[0]?.unit || "Kg"}
                </span>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-circular-waste/20">
                <span className="text-[11px] text-text-muted block flex items-center gap-1">
                  <Coins className="w-3 h-3 text-accent" />
                  Potensi Valuasi:
                </span>
                <span className="font-heading text-base font-bold text-circular-waste tabular-nums">
                  +{formatCurrency(wastePrediction.totalPotentialRevenuePerBatch)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-text-secondary truncate">
              Offtaker Rekomendasi: <strong>{wastePrediction.items[0]?.recommendedOfftaker || "Mitra KUMPUL"}</strong>
            </p>

            {/* Rincian Spesifikasi Fraksi Residu Terdeteksi */}
            {wastePrediction.items.length > 0 && (
              <div className="pt-2 space-y-2 border-t border-circular-waste/20">
                <span className="text-[11px] font-bold text-circular-waste block uppercase tracking-wider">
                  Rincian Spesifikasi Residu &amp; Offtaker:
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {wastePrediction.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-surface border border-circular-waste/20 shadow-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-text-primary block truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-text-muted block truncate">
                          {item.offtakerType} &bull; {item.recommendedOfftaker}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-text-primary block tabular-nums">
                          {item.estimatedVolumePerBatch} {item.unit}
                        </span>
                        <span className="font-semibold text-circular-waste text-[11px] tabular-nums block">
                          +{formatCurrency(item.potentialRevenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button Simpan di Bawah */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            asChild
            variant="outline"
            size="md"
            className="rounded-xl px-5 min-h-[44px] cursor-pointer"
          >
            <Link href="/produk">Batal</Link>
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="font-bold px-7 min-h-[44px] rounded-xl cursor-pointer gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Spesifikasi</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
