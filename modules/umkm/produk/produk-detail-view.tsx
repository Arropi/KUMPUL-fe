"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Utensils,
  Trash2,
  Plus,
  Sparkles,
  Leaf,
  Coins,
  TrendingUp,
  AlertCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
  RefreshCw,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type { BEProduct, BERecipe } from "@/lib/api/types";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";
import { getProductByIdAction, deleteProductAction, addRecipeItemAction, deleteRecipeItemAction } from "@/actions/products";
import { getProductWastePrediction } from "@/lib/ai-waste-prediction";

interface ProdukDetailViewProps {
  productId: string;
  initialProduct?: BEProduct | null;
}

export function ProdukDetailView({ productId, initialProduct }: ProdukDetailViewProps) {
  const router = useRouter();
  const [product, setProduct] = React.useState<BEProduct | null>(initialProduct || null);
  const [isLoading, setIsLoading] = React.useState(!initialProduct);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Form tambah bahan baku baru
  const [newIngName, setNewIngName] = React.useState("");
  const [newIngQty, setNewIngQty] = React.useState<number>(0.1);
  const [newIngUnit, setNewIngUnit] = React.useState("KG");
  const [newIngCost, setNewIngCost] = React.useState<number>(1000);
  const [isAddingIngredient, setIsAddingIngredient] = React.useState(false);

  // Simulasi Pengganda Batch
  const [simulatedBatches, setSimulatedBatches] = React.useState<number>(5);

  // Muat data produk (jika belum ada atau jika berupa mock di localStorage)
  React.useEffect(() => {
    let ignore = false;

    const resolveProduct = async () => {
      // 1. Cek localStorage terlebih dahulu (untuk mock data testing FE)
      try {
        const saved = localStorage.getItem("kumpul_mock_products");
        if (saved) {
          const mocks: BEProduct[] = JSON.parse(saved);
          const foundMock = mocks.find((m) => m.id === productId);
          if (foundMock && !ignore) {
            setProduct(foundMock);
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
            setProduct(res.data);
          } else if (!product) {
            // Jika tidak ditemukan di BE maupun mock, periksa lagi localStorage
            toast.error(res.message || "Produk tidak ditemukan");
          }
        }
      } catch {
        if (!ignore) toast.error("Gagal memuat detail produk");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    resolveProduct();

    return () => {
      ignore = true;
    };
  }, [productId]);

  const sellingPrice = Number(product?.target_selling_price_per_unit) || 0;
  const hpp = Number(product?.calculated_hpp_per_unit) || 0;
  const marginPct = Number(product?.projected_margin_percentage) || 0;
  const batchUnits = product?.expected_batch_units || 1;
  const recipes = product?.recipes || [];

  // Hitung AI Waste Prediction
  const wastePrediction = React.useMemo(() => {
    if (!product) return null;
    return getProductWastePrediction(product);
  }, [product]);

  // Kalkulasi Finansial Batch
  const revenuePerBatch = sellingPrice * batchUnits;
  const costPerBatch = hpp * batchUnits;
  const grossProfitPerBatch = Math.max(0, revenuePerBatch - costPerBatch);

  // Aksi Hapus Produk
  const handleDeleteProduct = async () => {
    if (!product) return;
    if (!window.confirm(`Hapus produk "${product.product_name}" beserta seluruh resepnya?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteProductAction(product.id);
      if (res.success) {
        // Hapus dari localStorage jika mock
        try {
          const saved = localStorage.getItem("kumpul_mock_products");
          if (saved) {
            const mocks: BEProduct[] = JSON.parse(saved);
            const updated = mocks.filter((m) => m.id !== product.id);
            localStorage.setItem("kumpul_mock_products", JSON.stringify(updated));
          }
        } catch {}

        toast.success(`Produk "${product.product_name}" berhasil dihapus.`);
        router.push("/produk");
      } else {
        toast.error(res.message || "Gagal menghapus produk");
      }
    } catch {
      toast.error("Terjadi kendala saat menghapus produk");
    } finally {
      setIsDeleting(false);
    }
  };

  // Aksi Hapus Bahan
  const handleDeleteRecipe = async (recipeId: string, ingredientName: string) => {
    if (!product) return;
    try {
      const res = await deleteRecipeItemAction(recipeId);
      if (res.success) {
        toast.success(`Bahan "${ingredientName}" dihapus.`);
        const updatedRecipes = recipes.filter((r) => r.id !== recipeId);
        const newHpp = updatedRecipes.reduce(
          (sum, item) => sum + (Number(item.estimated_cost_per_unit) || 0),
          0
        );
        const newMargin =
          sellingPrice > 0 ? Math.max(0, ((sellingPrice - newHpp) / sellingPrice) * 100) : 0;

        const updatedProduct: BEProduct = {
          ...product,
          calculated_hpp_per_unit: newHpp,
          projected_margin_percentage: newMargin,
          recipes: updatedRecipes,
        };

        setProduct(updatedProduct);

        // Update di localStorage jika mock
        try {
          const saved = localStorage.getItem("kumpul_mock_products");
          if (saved) {
            const mocks: BEProduct[] = JSON.parse(saved);
            const idx = mocks.findIndex((m) => m.id === product.id);
            if (idx >= 0) {
              mocks[idx] = updatedProduct;
              localStorage.setItem("kumpul_mock_products", JSON.stringify(mocks));
            }
          }
        } catch {}
      } else {
        toast.error(res.message || "Gagal menghapus bahan");
      }
    } catch {
      toast.error("Gagal menghapus bahan");
    }
  };

  // Aksi Tambah Bahan ke Resep
  const handleAddRecipeItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !newIngName.trim()) return;

    setIsAddingIngredient(true);
    try {
      const res = await addRecipeItemAction(product.id, {
        name: newIngName.trim(),
        amountPerPortion: newIngQty,
        unit: newIngUnit.toUpperCase(),
        estimatedCost: newIngCost,
      });

      if (res.success && res.data) {
        toast.success(`Bahan "${newIngName}" berhasil ditambahkan ke resep.`);
        const updatedRecipes = [...recipes, res.data];
        const newHpp = updatedRecipes.reduce(
          (sum, item) => sum + (Number(item.estimated_cost_per_unit) || 0),
          0
        );
        const newMargin =
          sellingPrice > 0 ? Math.max(0, ((sellingPrice - newHpp) / sellingPrice) * 100) : 0;

        const updatedProduct: BEProduct = {
          ...product,
          calculated_hpp_per_unit: newHpp,
          projected_margin_percentage: newMargin,
          recipes: updatedRecipes,
        };

        setProduct(updatedProduct);

        // Update di localStorage jika mock
        try {
          const saved = localStorage.getItem("kumpul_mock_products");
          if (saved) {
            const mocks: BEProduct[] = JSON.parse(saved);
            const idx = mocks.findIndex((m) => m.id === product.id);
            if (idx >= 0) {
              mocks[idx] = updatedProduct;
              localStorage.setItem("kumpul_mock_products", JSON.stringify(mocks));
            }
          }
        } catch {}

        setNewIngName("");
        setNewIngQty(0.1);
        setNewIngCost(1000);
      } else {
        toast.error(res.message || "Gagal menambahkan bahan");
      }
    } catch {
      toast.error("Terjadi kendala saat menambahkan bahan");
    } finally {
      setIsAddingIngredient(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs text-text-secondary font-medium">
          Memuat rincian produk &amp; kalkulasi prediksi AI...
        </span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link href="/produk">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Produk
          </Link>
        </Button>

        <Card className="p-8 text-center rounded-2xl border-dashed border-border max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-text-primary">Produk Tidak Ditemukan</h2>
          <p className="text-xs text-text-secondary mt-1">
            Produk dengan ID ini tidak tersedia atau telah dihapus dari sistem.
          </p>
          <Button asChild variant="primary" size="md" className="mt-5 rounded-xl font-bold">
            <Link href="/produk">Kembali ke Katalog Produk</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-xl w-fit cursor-pointer gap-2 font-medium"
        >
          <Link href="/produk">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Produk</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl cursor-pointer gap-1.5 font-bold text-primary border-primary/20"
          >
            <Link href={`/produk/${product.id}/edit`}>
              <Pencil className="w-3.5 h-3.5 text-primary" />
              <span>Edit Spesifikasi</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="soft"
            size="sm"
            className="rounded-xl cursor-pointer gap-1.5"
          >
            <Link href="/limbah">
              <Leaf className="w-4 h-4 text-circular-waste" />
              <span>Buka Bursa Limbah</span>
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDeleteProduct}
            disabled={isDeleting}
            className="text-error hover:bg-error/10 rounded-xl cursor-pointer gap-1.5"
          >
            <Trash2 className="w-4 h-4 text-error" />
            <span>Hapus Produk</span>
          </Button>
        </div>
      </div>

      {/* 2. Hero Header Card */}
      <Card className="rounded-2xl border border-border bg-surface p-6 shadow-elevation-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center text-primary shrink-0 shadow-sm">
              <Utensils className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary">
                  {product.product_name}
                </h1>
                <Badge variant="primary" className="text-xs uppercase font-bold tracking-wider">
                  {product.unit || "PORSI"}
                </Badge>
                <Badge variant="secondary" className="text-xs font-semibold">
                  Iterasi: {batchUnits} {product.unit || "Porsi"} / Batch
                </Badge>
              </div>

              <p className="text-xs text-text-secondary flex items-center gap-2 flex-wrap">
                <span>Didaftarkan: {formatDate(product.created_at || new Date())}</span>
                <span>&bull;</span>
                <span>{recipes.length} Komposisi Bahan Baku</span>
                <span>&bull;</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Kalkulasi HPP Aktif
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-surface-subtle p-3 rounded-2xl border border-border/80 self-start md:self-auto shrink-0">
            <div className="text-right">
              <span className="text-[11px] text-text-secondary block font-medium">
                Estimasi Laba per Batch
              </span>
              <span className="text-base sm:text-lg font-bold text-primary tabular-nums">
                {formatCurrency(grossProfitPerBatch)}
              </span>
              <span className="text-[10px] text-text-muted block">
                dari omzet {formatCurrency(revenuePerBatch)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. 4-Grid Key Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-surface shadow-elevation-1 space-y-1">
          <span className="text-xs font-medium text-text-secondary block">
            Target Harga Jual
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-heading text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
              {formatCurrency(sellingPrice)}
            </span>
            <span className="text-xs text-text-muted font-medium">
              /{product.unit || "porsi"}
            </span>
          </div>
          <p className="text-[11px] text-text-secondary">
            Patokan harga retail konsumen
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-surface shadow-elevation-1 space-y-1">
          <span className="text-xs font-medium text-text-secondary block">
            HPP Terhitung (BOM)
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-heading text-xl sm:text-2xl font-bold text-amber-700 tabular-nums">
              {formatCurrency(hpp)}
            </span>
            <span className="text-xs text-text-muted font-medium">
              /{product.unit || "porsi"}
            </span>
          </div>
          <p className="text-[11px] text-text-secondary">
            Total biaya bahan baku porsi
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-surface shadow-elevation-1 space-y-1">
          <span className="text-xs font-medium text-text-secondary block">
            Proyeksi Margin Laba
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`font-heading text-xl sm:text-2xl font-bold tabular-nums flex items-center gap-1 ${
                marginPct >= 30
                  ? "text-emerald-700"
                  : marginPct > 0
                  ? "text-primary"
                  : "text-red-600"
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              {marginPct.toFixed(1)}%
            </span>
          </div>
          <p className="text-[11px] text-text-secondary">
            {marginPct >= 30 ? "Margin sehat & kompetitif" : "Pertimbangkan efisiensi bahan"}
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-surface shadow-elevation-1 space-y-1">
          <span className="text-xs font-medium text-text-secondary block">
            Total Biaya 1 Batch
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-heading text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
              {formatCurrency(costPerBatch)}
            </span>
          </div>
          <p className="text-[11px] text-text-secondary">
            Kebutuhan modal untuk {batchUnits} porsi
          </p>
        </div>
      </div>

      {/* 4. Bagian Analisis Prediksi Limbah Sirkular AI */}
      {wastePrediction && (
        <Card className="rounded-2xl border border-circular-waste/30 bg-gradient-to-br from-circular-waste-light/80 to-surface p-6 shadow-elevation-1 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-circular-waste/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="p-2 rounded-xl bg-circular-waste/15 text-circular-waste">
                  <Sparkles className="w-5 h-5 text-circular-waste" />
                </span>
                <h3 className="font-heading font-bold text-base sm:text-lg text-text-primary">
                  Analisis Prediksi Limbah Sirkular (AI Eco-Engine)
                </h3>
                <Badge variant="waste" className="text-xs font-bold gap-1">
                  <Leaf className="w-3.5 h-3.5" />
                  {wastePrediction.aiConfidencePct}% Akurasi Prediksi
                </Badge>
              </div>
              <p className="text-xs text-text-secondary">
                Estimasi residu produktif yang dihasilkan dari bahan baku menu ini dan potensi monetisasinya di Bursa Limbah KUMPUL.
              </p>
            </div>

            <Button
              asChild
              variant="primary"
              size="sm"
              className="rounded-xl shrink-0 cursor-pointer font-bold gap-2"
            >
              <Link href="/limbah">
                <span>Daftarkan ke Bursa Limbah</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* 3 Metric Card Dampak & Valuasi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-surface rounded-xl p-4 border border-circular-waste/20 shadow-sm space-y-1">
              <span className="text-[11px] text-text-secondary font-medium block">
                Total Estimasi Limbah per Batch
              </span>
              <span className="text-lg sm:text-xl font-bold text-text-primary tabular-nums">
                ~{wastePrediction.totalVolumeKg} {wastePrediction.items[0]?.unit || "Kg"}
              </span>
              <p className="text-[11px] text-text-muted">
                Untuk siklus {batchUnits} porsi produksi
              </p>
            </div>

            <div className="bg-surface rounded-xl p-4 border border-circular-waste/20 shadow-sm space-y-1">
              <span className="text-[11px] text-text-secondary font-medium block flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-accent" />
                Potensi Pendapatan Tambahan
              </span>
              <span className="text-lg sm:text-xl font-bold text-circular-waste tabular-nums">
                +{formatCurrency(wastePrediction.totalPotentialRevenuePerBatch)} / batch
              </span>
              <p className="text-[11px] text-text-muted">
                Setara ~{formatCurrency(wastePrediction.annualPotentialRevenue)} / tahun (4 batch/bln)
              </p>
            </div>

            <div className="bg-surface rounded-xl p-4 border border-circular-waste/20 shadow-sm space-y-1">
              <span className="text-[11px] text-text-secondary font-medium block">
                Dampak Lingkungan (ESG)
              </span>
              <span className="text-lg sm:text-xl font-bold text-emerald-700 tabular-nums">
                {wastePrediction.environmentalSummary.co2SavedKg} kg CO2e
              </span>
              <p className="text-[11px] text-text-muted">
                Emisi dicegah jika dialihkan dari TPA
              </p>
            </div>
          </div>

          {/* Tabel Rincian Residu Terdeteksi */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Rincian Fraksi Limbah &amp; Rekomendasi Offtaker
            </h4>

            <div className="rounded-xl border border-circular-waste/25 bg-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-circular-waste-light/50 border-b border-circular-waste/20 text-text-secondary font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Jenis Limbah Terprediksi</th>
                      <th className="py-2.5 px-3">Est. Volume / Batch</th>
                      <th className="py-2.5 px-3">Harga Patokan Offtaker</th>
                      <th className="py-2.5 px-3">Potensi Nilai</th>
                      <th className="py-2.5 px-3">Rekomendasi Mitra Penerima</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {wastePrediction.items.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-text-primary">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-circular-waste shrink-0" />
                            <span>{item.name}</span>
                          </div>
                          <span className="text-[10px] text-text-muted font-normal block pl-4 mt-0.5">
                            {item.handlingNote}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-text-primary tabular-nums">
                          {item.estimatedVolumePerBatch} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-text-secondary tabular-nums">
                          {formatCurrency(item.pricePerUnit)} / {item.unit}
                        </td>
                        <td className="py-3 px-3 font-bold text-circular-waste tabular-nums">
                          +{formatCurrency(item.potentialRevenue)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 font-medium text-[11px] text-text-primary">
                            <Building2 className="w-3 h-3 text-text-muted shrink-0" />
                            {item.recommendedOfftaker}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Recommendation Alert */}
            <div className="p-3.5 rounded-xl bg-surface border border-circular-waste/20 flex items-start gap-2.5 text-xs">
              <Sparkles className="w-4 h-4 text-circular-waste shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-text-primary">
                  Rekomendasi Optimalisasi AI:
                </span>
                <p className="text-text-secondary leading-relaxed">
                  {wastePrediction.aiRecommendation}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 5. Bill of Materials (BOM) / Resep Bahan Baku */}
      <Card className="rounded-2xl border border-border bg-surface p-6 shadow-elevation-1 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-text-primary flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Komposisi Resep &amp; Bill of Materials (BOM)
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Kebutuhan bahan baku per 1 porsi dan kalkulasi otomatis untuk 1 batch ({batchUnits} unit).
            </p>
          </div>
        </div>

        {recipes.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-surface-subtle text-xs text-text-muted border border-dashed border-border space-y-1">
            <AlertCircle className="w-6 h-6 mx-auto text-amber-600 mb-1" />
            <p className="font-semibold text-text-primary">Belum ada bahan baku terdaftar</p>
            <p>Tambahkan bahan baku di bawah untuk memulai simulasi HPP dan prediksi limbah.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle border-b border-border text-text-secondary font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Nama Bahan Baku</th>
                    <th className="py-2.5 px-3">Kebutuhan / Porsi</th>
                    <th className="py-2.5 px-3">Kebutuhan 1 Batch ({batchUnits} Porsi)</th>
                    <th className="py-2.5 px-3">Biaya Est. / Porsi</th>
                    <th className="py-2.5 px-3">Porsi Biaya</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recipes.map((item) => {
                    const reqQty = Number(item.required_qty_per_unit) || 0;
                    const totalBatchQty =
                      Number(item.total_batch_required_qty) || reqQty * batchUnits;
                    const cost = Number(item.estimated_cost_per_unit) || 0;
                    const costShare = hpp > 0 ? (cost / hpp) * 100 : 0;

                    return (
                      <tr key={item.id} className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-text-primary">
                          {item.ingredient_name}
                        </td>
                        <td className="py-3 px-3 tabular-nums">
                          {reqQty} {item.unit}
                        </td>
                        <td className="py-3 px-3 font-medium text-text-primary tabular-nums">
                          {totalBatchQty} {item.unit}
                        </td>
                        <td className="py-3 px-3 font-bold text-text-primary tabular-nums">
                          {formatCurrency(cost)}
                        </td>
                        <td className="py-3 px-3 text-text-secondary tabular-nums">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 rounded-full bg-border overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${Math.min(100, costShare)}%` }}
                              />
                            </div>
                            <span className="text-[11px]">{costShare.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRecipe(item.id, item.ingredient_name)}
                            className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Hapus bahan"
                          >
                            <Trash2 className="w-4 h-4 text-error" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Add Ingredient Form */}
        <form
          onSubmit={handleAddRecipeItem}
          className="p-4 rounded-xl bg-surface-subtle/70 border border-border space-y-3"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-bold text-text-primary">
              Tambah Komponen Bahan Baku Baru ke Resep
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <Input
                label="Nama Bahan *"
                placeholder="Contoh: Bawang Merah Brebes"
                value={newIngName}
                onChange={(e) => setNewIngName(e.target.value)}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Kebutuhan / Porsi *"
                type="number"
                min="0"
                step="any"
                value={newIngQty}
                onChange={(e) => setNewIngQty(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Satuan *"
                placeholder="KG / LITER"
                value={newIngUnit}
                onChange={(e) => setNewIngUnit(e.target.value)}
                required
              />
            </div>

            <div className="sm:col-span-3">
              <Input
                label="Biaya Est. / Porsi (Rp) *"
                type="number"
                min="0"
                step="any"
                value={newIngCost}
                onChange={(e) => setNewIngCost(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isAddingIngredient}
              className="rounded-xl font-bold cursor-pointer min-h-[40px] px-5"
            >
              Simpan ke Resep
            </Button>
          </div>
        </form>
      </Card>

      {/* 6. Batch Production & Waste Monetization Simulator */}
      <Card className="rounded-2xl border border-border bg-surface p-6 shadow-elevation-1 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-text-primary flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-accent" />
              Kalkulator Simulasi Produksi &amp; Monetisasi Limbah
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Simulasikan beberapa kali iterasi batch produksi untuk melihat akumulasi kebutuhan bahan baku dan nilai limbah yang bisa dimonetisasi.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-surface-subtle px-3 py-1.5 rounded-xl border border-border">
            <span className="text-xs font-semibold text-text-secondary">Iterasi Batch:</span>
            <input
              type="number"
              min="1"
              max="100"
              value={simulatedBatches}
              onChange={(e) =>
                setSimulatedBatches(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              className="w-14 text-center font-bold text-sm bg-surface rounded-lg border border-border py-0.5 text-primary"
            />
            <span className="text-xs text-text-muted">Kali</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-surface-subtle/80 border border-border/80 space-y-1">
            <span className="text-text-secondary block font-medium">
              Total Porsi Diproduksi
            </span>
            <span className="text-lg font-bold text-text-primary tabular-nums">
              {formatNumber(batchUnits * simulatedBatches)} {product.unit || "Porsi"}
            </span>
            <span className="text-[10px] text-text-muted block">
              {simulatedBatches} batch × {batchUnits} unit
            </span>
          </div>

          <div className="p-4 rounded-xl bg-surface-subtle/80 border border-border/80 space-y-1">
            <span className="text-text-secondary block font-medium">
              Total Kebutuhan Modal Bahan
            </span>
            <span className="text-lg font-bold text-amber-700 tabular-nums">
              {formatCurrency(costPerBatch * simulatedBatches)}
            </span>
            <span className="text-[10px] text-text-muted block">
              HPP × {simulatedBatches} batch
            </span>
          </div>

          <div className="p-4 rounded-xl bg-surface-subtle/80 border border-border/80 space-y-1">
            <span className="text-text-secondary block font-medium">
              Proyeksi Omzet Penjualan
            </span>
            <span className="text-lg font-bold text-text-primary tabular-nums">
              {formatCurrency(revenuePerBatch * simulatedBatches)}
            </span>
            <span className="text-[10px] text-text-muted block">
              Laba Bersih: {formatCurrency(grossProfitPerBatch * simulatedBatches)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-circular-waste-light/70 border border-circular-waste/20 space-y-1">
            <span className="text-circular-waste block font-semibold">
              Potensi Valuasi Limbah
            </span>
            <span className="text-lg font-bold text-circular-waste tabular-nums">
              +{formatCurrency((wastePrediction?.totalPotentialRevenuePerBatch || 0) * simulatedBatches)}
            </span>
            <span className="text-[10px] text-text-muted block">
              ~{Math.round(((wastePrediction?.totalVolumeKg || 0) * simulatedBatches) * 10) / 10} kg residu sirkular
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
