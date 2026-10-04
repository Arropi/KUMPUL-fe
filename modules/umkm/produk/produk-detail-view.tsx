"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Sparkles,
  Coins,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { Dialog3 } from "@/components/ui/dialog-3";
import type { BEProduct, BERecipe } from "@/lib/api/types";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";
import { getProductByIdAction, deleteProductAction, addRecipeItemAction, deleteRecipeItemAction } from "@/actions/products";
import { getProductWastePrediction } from "@/lib/ai-waste-prediction";
import { getProductIngredientAlternatives } from "@/lib/menu-intelligence";

interface ProdukDetailViewProps {
  productId: string;
  initialProduct?: BEProduct | null;
}

export function ProdukDetailView({ productId, initialProduct }: ProdukDetailViewProps) {
  const router = useRouter();
  const [product, setProduct] = React.useState<BEProduct | null>(initialProduct || null);
  const [isLoading, setIsLoading] = React.useState(!initialProduct);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  // Form & Sheet tambah bahan baku baru
  const [isAddIngredientOpen, setIsAddIngredientOpen] = React.useState(false);
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

  // Alternatif bahan baku cerdas
  const alternatives = React.useMemo(() => {
    return getProductIngredientAlternatives(recipes);
  }, [recipes]);

  // Aksi Hapus Produk (menggunakan Dialog3 konfirmasi destruktif)
  const executeDeleteProduct = async () => {
    if (!product) return;

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
        setIsDeleteDialogOpen(false);
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
        setIsAddIngredientOpen(false);
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
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isDeleting}
            className="rounded-xl cursor-pointer gap-1.5 font-bold shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Produk</span>
          </Button>
        </div>
      </div>

      {/* 2. Hero Header Card */}
      <Card className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-elevation-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
        <Card className="rounded-2xl border border-border bg-surface p-6 shadow-elevation-1 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
            <h3 className="font-heading font-bold text-base sm:text-lg text-text-primary">
              Analisis Prediksi Limbah Sirkular (AI Eco-Engine)
            </h3>

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
            <div className="bg-surface-subtle/80 rounded-xl p-4 border border-border/80 shadow-xs space-y-1">
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

            <div className="bg-surface-subtle/80 rounded-xl p-4 border border-border/80 shadow-xs space-y-1">
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

            <div className="bg-surface-subtle/80 rounded-xl p-4 border border-border/80 shadow-xs space-y-1">
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
              Rincian Fraksi Limbah Terprediksi
            </h4>

            <div className="overflow-hidden rounded-xl border border-border shadow-xs bg-surface">
              <Table>
                <TableHeader className="bg-surface-subtle/80 shadow-[inset_0px_1px_2px_0px_rgba(255,255,255,1),inset_0px_-1px_4px_0px_rgba(0,0,0,0.05)]">
                  <TableRow>
                    <TableHead>Jenis Limbah Terprediksi</TableHead>
                    <TableHead>Est. Volume / Batch</TableHead>
                    <TableHead>Harga Patokan Offtaker</TableHead>
                    <TableHead className="text-right">Potensi Nilai</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wastePrediction.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold text-text-primary">
                        <span className="font-semibold text-text-primary">{item.name}</span>
                        <span className="text-[11px] text-text-muted font-normal block mt-0.5">
                          {item.handlingNote}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-text-primary tabular-nums">
                        {item.estimatedVolumePerBatch} {item.unit}
                      </TableCell>
                      <TableCell className="text-text-secondary tabular-nums">
                        {formatCurrency(item.pricePerUnit)} / {item.unit}
                      </TableCell>
                      <TableCell className="text-right font-bold text-circular-waste tabular-nums">
                        +{formatCurrency(item.potentialRevenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="shadow-[inset_0px_1px_2px_0px_rgba(255,255,255,1),inset_0px_-1px_4px_0px_rgba(0,0,0,0.05)] bg-surface-subtle/80">
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold text-text-primary">
                      Total Potensi Valuasi Limbah per Batch ({batchUnits} Porsi)
                    </TableCell>
                    <TableCell className="text-right font-bold text-circular-waste tabular-nums text-sm">
                      +{formatCurrency(wastePrediction.totalPotentialRevenuePerBatch)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Rekomendasi Optimalisasi AI - Noticeable, Bold & Elegant */}
            <div className="p-4 sm:p-4.5 rounded-xl bg-surface-subtle/90 border border-border border-l-4 border-l-primary shadow-xs flex items-start gap-3.5">
              <div className="size-9 rounded-xl bg-surface border border-border shadow-2xs flex items-center justify-center shrink-0 mt-0.5 text-primary">
                <Sparkles className="size-4.5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h5 className="font-heading font-bold text-sm sm:text-[15px] text-text-primary tracking-tight">
                    Rekomendasi Optimalisasi Sirkular
                  </h5>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface border border-border text-primary">
                    AI Insight
                  </span>
                </div>
                <p className="text-text-secondary text-xs sm:text-[13px] leading-relaxed">
                  {wastePrediction.aiRecommendation}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 5. Bill of Materials (BOM) / Resep Bahan Baku */}
      <Card className="rounded-2xl border border-border bg-surface p-6 shadow-elevation-1 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-3">
          <h3 className="font-heading font-bold text-base sm:text-lg text-text-primary">
            Komposisi Resep &amp; Bill of Materials (BOM)
          </h3>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsAddIngredientOpen(true)}
            className="rounded-xl font-bold gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bahan Baku</span>
          </Button>
        </div>

        {recipes.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-surface-subtle text-xs text-text-muted border border-dashed border-border space-y-3">
            <AlertCircle className="w-6 h-6 mx-auto text-amber-600 mb-1" />
            <p className="font-semibold text-text-primary text-sm">Belum ada bahan baku terdaftar</p>
            <p className="max-w-md mx-auto">
              Tambahkan komponen bahan baku untuk memulai penghitungan otomatis HPP, estimasi porsi, dan analisis prediksi fraksi limbah.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddIngredientOpen(true)}
              className="rounded-xl font-semibold gap-1.5 mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-primary" />
              <span>Tambah Bahan Pertama</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border shadow-xs bg-surface">
            <Table>
              <TableHeader className="bg-surface-subtle/80 shadow-[inset_0px_1px_2px_0px_rgba(255,255,255,1),inset_0px_-1px_4px_0px_rgba(0,0,0,0.05)]">
                <TableRow>
                  <TableHead>Nama Bahan Baku</TableHead>
                  <TableHead>Kebutuhan / Porsi</TableHead>
                  <TableHead>Kebutuhan 1 Batch ({batchUnits} Porsi)</TableHead>
                  <TableHead>Biaya Est. / Porsi</TableHead>
                  <TableHead>Porsi Biaya</TableHead>
                  <TableHead className="text-center w-16">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipes.map((item) => {
                  const reqQty = Number(item.required_qty_per_unit) || 0;
                  const totalBatchQty =
                    Number(item.total_batch_required_qty) || reqQty * batchUnits;
                  const cost = Number(item.estimated_cost_per_unit) || 0;
                  const costShare = hpp > 0 ? (cost / hpp) * 100 : 0;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold text-text-primary">
                        {item.ingredient_name}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {reqQty} {item.unit}
                      </TableCell>
                      <TableCell className="font-medium text-text-primary tabular-nums">
                        {totalBatchQty} {item.unit}
                      </TableCell>
                      <TableCell className="font-bold text-text-primary tabular-nums">
                        {formatCurrency(cost)}
                      </TableCell>
                      <TableCell className="text-text-secondary tabular-nums">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-border overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.min(100, costShare)}%` }}
                            />
                          </div>
                          <span className="text-[11px]">{costShare.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRecipe(item.id, item.ingredient_name)}
                          className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Hapus bahan"
                        >
                          <Trash2 className="w-4 h-4 text-error" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter className="shadow-[inset_0px_1px_2px_0px_rgba(255,255,255,1),inset_0px_-1px_4px_0px_rgba(0,0,0,0.05)] bg-surface-subtle/80">
                <TableRow>
                  <TableCell colSpan={3} className="font-bold text-text-primary">
                    Total HPP Pokok (Estimasi Biaya Bahan per Porsi)
                  </TableCell>
                  <TableCell className="font-bold text-primary tabular-nums text-sm">
                    {formatCurrency(hpp)}
                  </TableCell>
                  <TableCell colSpan={2} className="text-xs text-text-muted">
                    100% Alokasi Bahan
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </Card>

      {/* Sheet Tambah Bahan Baku (Watermelon UI Sheet-5 pattern) */}
      <Sheet open={isAddIngredientOpen} onOpenChange={setIsAddIngredientOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-hidden p-0">
          <form onSubmit={handleAddRecipeItem} className="flex flex-col h-full">
            <SheetHeader>
              <SheetTitle>Tambah Bahan Baku Resep</SheetTitle>
              <SheetDescription>
                Masukkan spesifikasi bahan baku, takaran per porsi, dan estimasi biaya untuk menghitung HPP &amp; simulasi limbah secara otomatis.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ingredient-name" className="text-xs font-semibold text-text-primary">
                  Nama Bahan Baku *
                </Label>
                <Input
                  id="ingredient-name"
                  placeholder="Contoh: Bawang Merah Brebes"
                  value={newIngName}
                  onChange={(e) => setNewIngName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ingredient-qty" className="text-xs font-semibold text-text-primary">
                    Kebutuhan / Porsi *
                  </Label>
                  <Input
                    id="ingredient-qty"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.1"
                    value={newIngQty}
                    onChange={(e) => setNewIngQty(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ingredient-unit" className="text-xs font-semibold text-text-primary">
                    Satuan Takar *
                  </Label>
                  <Input
                    id="ingredient-unit"
                    placeholder="KG / LITER"
                    value={newIngUnit}
                    onChange={(e) => setNewIngUnit(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ingredient-cost" className="text-xs font-semibold text-text-primary">
                  Biaya Est. per Porsi (Rp) *
                </Label>
                <Input
                  id="ingredient-cost"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="1000"
                  value={newIngCost}
                  onChange={(e) => setNewIngCost(parseFloat(e.target.value) || 0)}
                  required
                />
                <p className="text-[11px] text-text-muted">
                  Estimasi biaya bahan yang dialokasikan untuk 1 porsi menu jadi.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface-subtle p-3.5 text-xs text-text-secondary space-y-1">
                <div className="font-semibold text-text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-circular-waste" />
                  Kalkulasi Otomatis
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Setelah disimpan, HPP produk dan simulasi margin kotor akan dihitung ulang secara real-time.
                </p>
              </div>
            </div>

            <SheetFooter>
              <SheetClose asChild>
                <Button type="button" variant="outline" size="sm" className="rounded-xl cursor-pointer">
                  Batal
                </Button>
              </SheetClose>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isAddingIngredient}
                className="rounded-xl font-bold cursor-pointer"
              >
                Simpan ke Resep
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* 5.1 Rekomendasi Bahan Baku Alternatif Cerdas */}
      {alternatives.length > 0 && (
        <Card className="rounded-2xl border border-border bg-surface p-6 shadow-elevation-1 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="font-heading font-bold text-base sm:text-lg text-text-primary">
              Rekomendasi Alternatif Bahan Baku Cerdas ({alternatives.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {alternatives.map((alt, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-border bg-surface-subtle/50 space-y-2 hover:border-border-strong transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-text-muted block font-medium">
                      Bahan Asli: {alt.originalIngredientName}
                    </span>
                    <h4 className="font-bold text-sm text-text-primary mt-0.5">
                      {alt.suggestedIngredientName}
                    </h4>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 ${
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
                <p className="text-xs text-text-secondary leading-relaxed">
                  {alt.reason}
                </p>
                {alt.healthBadges && alt.healthBadges.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    {alt.healthBadges.map((badge, bIdx) => (
                      <span
                        key={bIdx}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-border text-text-primary"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 6. Batch Production & Waste Monetization Simulator */}
      <Card className="rounded-2xl border border-border bg-surface p-6 shadow-elevation-1 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="font-heading font-bold text-base sm:text-lg text-text-primary">
            Kalkulator Simulasi Produksi &amp; Monetisasi Limbah
          </h3>

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
    </div>
  );
}
