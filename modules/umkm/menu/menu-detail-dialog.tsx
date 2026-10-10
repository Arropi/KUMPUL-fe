"use client";

import * as React from "react";
import Link from "next/link";
import {
  Pencil,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from "@/components/ui/table";
import type { BEProduct, BERecipe } from "@/lib/api/types";
import { formatCurrency, formatNumber } from "@/lib/format";
import { calculateCircularMargin } from "@/lib/menu-intelligence";
import { getProductWastePrediction } from "@/lib/ai-waste-prediction";
import { beFetch } from "@/lib/api/be-client";
import { cn } from "@/lib/utils";
import { SECTOR_OPTIONS } from "./menu-types";
interface MenuDetailDialogProps {
  product: BEProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: BEProduct) => void;
}

interface SmartCommodityRecommendation {
  commodityId: string;
  commodityName: string;
  badgeLabel: string;
  reason: string;
}

interface CommodityItem {
  id: string;
  name: string;
}

/**
 * Heuristik AI Alternatif Bahan Baku Cerdas:
 * Berdasarkan komoditas riil yang benar-benar tersedia di bursa Beranda KUMPUL.
 * Jika tidak ada komoditas di Beranda yang sesuai dengan resep produk, mengembalikan null (tidak ditampilkan).
 */
function getBerandaAiRecommendations(
  recipes: BERecipe[],
  availableCommodities: CommodityItem[]
): {
  hemat?: SmartCommodityRecommendation;
  sehat?: SmartCommodityRecommendation;
} | null {
  if (!recipes || recipes.length === 0) return null;

  const recipeText = recipes.map((r) => (r.ingredient_name || "").toLowerCase()).join(" ");

  // Cari komoditas yang benar-benar terdaftar di Beranda
  const findCommodity = (keywords: string[]): CommodityItem | undefined => {
    return availableCommodities.find((c) => {
      const lower = c.name.toLowerCase();
      return keywords.some((k) => lower.includes(k));
    });
  };

  let hemat: SmartCommodityRecommendation | undefined;
  let sehat: SmartCommodityRecommendation | undefined;

  // 1. Daging Bebek
  if (recipeText.includes("bebek")) {
    const bebekCom = findCommodity(["bebek"]);
    const bawangCom = findCommodity(["bawang"]);
    if (bebekCom) {
      hemat = {
        commodityId: bebekCom.id,
        commodityName: bebekCom.name,
        badgeLabel: "Hemat 18%",
        reason: "Karkas higienis siap potong mengeliminasi susut bobot pembersihan bulu dan jeroan hingga 18%, efisien untuk kalkulasi porsi tetap.",
      };
    }
    if (bawangCom) {
      sehat = {
        commodityId: bawangCom.id,
        commodityName: bawangCom.name,
        badgeLabel: "Sehat: Imunitas & Anti-Inflamasi",
        reason: "Bawang merah askip kaya allicin alami untuk melancarkan metabolisme lemak hewani dan bebas semprotan pengawet kimia.",
      };
    }
  }
  // 2. Daging Ayam / Unggas
  else if (recipeText.includes("ayam") || recipeText.includes("fillet") || recipeText.includes("unggas")) {
    const ayamCom = findCommodity(["ayam"]);
    const kedelaiCom = findCommodity(["kedelai"]);
    if (ayamCom) {
      hemat = {
        commodityId: ayamCom.id,
        commodityName: ayamCom.name,
        badgeLabel: "Hemat 25%",
        reason: "Beli langsung dari peternak kemitraan KUMPUL memotong biaya perantara dan menstabilkan HPP harian hingga 25% dibanding harga eceran pasar.",
      };
    }
    if (kedelaiCom) {
      sehat = {
        commodityId: kedelaiCom.id,
        commodityName: kedelaiCom.name,
        badgeLabel: "Sehat: Jantung & Bebas Kolesterol",
        reason: "Alternatif protein nabati non-GMO kaya isoflavon, bebas lemak jenuh dan aman bagi kesehatan kardiovaskular konsumen.",
      };
    }
  }
  // 3. Cabai / Cabe / Sambal
  else if (recipeText.includes("cabai") || recipeText.includes("cabe") || recipeText.includes("rawit") || recipeText.includes("sambal")) {
    const cabaiCom = findCommodity(["cabai", "cabe"]);
    if (cabaiCom) {
      hemat = {
        commodityId: cabaiCom.id,
        commodityName: cabaiCom.name,
        badgeLabel: "Hemat 30%",
        reason: "Memotong rantai tengkulak pasar induk, mengamankan kuota dengan diskon pooling 30% saat harga pasar sedang melonjak.",
      };
      sehat = {
        commodityId: cabaiCom.id,
        commodityName: cabaiCom.name,
        badgeLabel: "Sehat: Sirkulasi Darah & Vitamin C",
        reason: "Dipanen pada tingkat kematangan optimal, kaya vitamin C alami dan capsaicin aktif untuk meningkatkan metabolisme tubuh.",
      };
    }
  }
  // 4. Bawang Merah / Bumbu
  else if (recipeText.includes("bawang")) {
    const bawangCom = findCommodity(["bawang"]);
    if (bawangCom) {
      hemat = {
        commodityId: bawangCom.id,
        commodityName: bawangCom.name,
        badgeLabel: "Hemat 20%",
        reason: "Metode askip tradisional menjamin kadar air di bawah 12%, mencegah kebusukan simpan di dapur dan menekan biaya susut hingga 20%.",
      };
      sehat = {
        commodityId: bawangCom.id,
        commodityName: bawangCom.name,
        badgeLabel: "Sehat: Saluran Cerna & Prebiotik",
        reason: "Tinggi serat inulin yang berfungsi sebagai prebiotik untuk mikrobioma usus serta bebas dari zat kimia pemutih/pengkilap.",
      };
    }
  }
  // 5. Beras / Nasi
  else if (recipeText.includes("beras") || recipeText.includes("nasi")) {
    const berasCom = findCommodity(["beras"]);
    if (berasCom) {
      hemat = {
        commodityId: berasCom.id,
        commodityName: berasCom.name,
        badgeLabel: "Hemat 15%",
        reason: "Pengadaan karung 50kg via autonomous pooling KUMPUL menekan modal beras hingga 15% dibanding belanja karung kecil eceran.",
      };
      sehat = {
        commodityId: berasCom.id,
        commodityName: berasCom.name,
        badgeLabel: "Sehat: Saluran Cerna (Bebas Pemutih)",
        reason: "Hasil panen sawah binaan diproses tanpa klorin pemutih maupun pewangi buatan, aman bagi pencernaan dan lambung sensitif.",
      };
    }
  }
  // 6. Kedelai / Tahu / Tempe
  else if (recipeText.includes("kedelai") || recipeText.includes("tahu") || recipeText.includes("tempe") || recipeText.includes("soya")) {
    const kedelaiCom = findCommodity(["kedelai"]);
    if (kedelaiCom) {
      hemat = {
        commodityId: kedelaiCom.id,
        commodityName: kedelaiCom.name,
        badgeLabel: "Hemat 22%",
        reason: "Pengadaan langsung dari sentra binaan menekan harga bahan baku per kg hingga 22% untuk industri olahan tahu/tempe/susu.",
      };
      sehat = {
        commodityId: kedelaiCom.id,
        commodityName: kedelaiCom.name,
        badgeLabel: "Sehat: Jantung & Kontrol Gula Darah",
        reason: "Tinggi protein nabati, serat larut, dan isoflavon aktif untuk menjaga kesehatan kardiovaskular dan kestabilan glukosa darah.",
      };
    }
  }
  // 7. Minyak Goreng
  else if (recipeText.includes("minyak") || recipeText.includes("goreng") || recipeText.includes("oil") || recipeText.includes("margarin")) {
    const minyakCom = findCommodity(["minyak"]);
    const kedelaiCom = findCommodity(["kedelai"]);
    if (minyakCom) {
      hemat = {
        commodityId: minyakCom.id,
        commodityName: minyakCom.name,
        badgeLabel: "Hemat 24%",
        reason: "Pembelian kemasan bulk jeriken memangkas biaya kemasan ritel hingga 24% untuk siklus produksi penggorengan harian UMKM.",
      };
    }
    if (kedelaiCom) {
      sehat = {
        commodityId: kedelaiCom.id,
        commodityName: kedelaiCom.name,
        badgeLabel: "Sehat: Jantung & Bebas Kolesterol",
        reason: "Bahan pangan nabati murni bersertifikat mutu pangan PSAT, bebas modifikasi genetik dan bebas kolesterol untuk nilai tambah menu.",
      };
    }
  }
  // 8. Kopi
  else if (recipeText.includes("kopi") || recipeText.includes("coffee") || recipeText.includes("espresso")) {
    const kopiCom = findCommodity(["kopi"]);
    if (kopiCom) {
      hemat = {
        commodityId: kopiCom.id,
        commodityName: kopiCom.name,
        badgeLabel: "Hemat 20%",
        reason: "Pengadaan biji kopi langsung dari pemasok bursa memangkas marjin perantara hingga 20%.",
      };
      sehat = {
        commodityId: kopiCom.id,
        commodityName: kopiCom.name,
        badgeLabel: "Sehat: Antioksidan & Rendah Asam",
        reason: "Biji kopi sangrai pilihan bersertifikasi mutu, aman untuk lambung dan kaya antioksidan alami.",
      };
    }
  }

  // Jika tidak ada produk/bahan di Beranda yang sesuai/pas, jangan tampilkan apa-apa (null)
  if (!hemat && !sehat) {
    return null;
  }

  return { hemat, sehat };
}

export function MenuDetailDialog({
  product,
  isOpen,
  onClose,
  onEdit,
}: MenuDetailDialogProps) {
  const [activeTab, setActiveTab] = React.useState<string>("limbah");

  if (!product) return null;

  const batchUnits = Math.max(1, product.expected_batch_units || 1);
  const iterationsPerDay = Math.max(1, product.production_iterations_per_day || 2);
  const dailyOutput = batchUnits * iterationsPerDay;
  const unitLabel = product.unit || "Porsi";

  const hpp =
    typeof product.calculated_hpp_per_unit === "number"
      ? product.calculated_hpp_per_unit
      : parseFloat(product.calculated_hpp_per_unit || "0") || 0;

  const costPerBatch = hpp * batchUnits;
  const recipes: BERecipe[] = product.recipes || [];

  // Analisis Sirkular & Prediksi Limbah AI
  const fin = calculateCircularMargin(product);
  const wastePrediction = getProductWastePrediction(product);

  const dailyWasteKg =
    Math.round(wastePrediction.totalVolumeKg * iterationsPerDay * 10) / 10;

  // Ambil komoditas bursa yang tersedia di Beranda dari database
  const [availableCommodities, setAvailableCommodities] = React.useState<CommodityItem[]>([]);

  React.useEffect(() => {
    let ignore = false;
    beFetch<CommodityItem[]>("/marketplace?limit=50")
      .then((res) => {
        if (!ignore && res.success && res.data) {
          setAvailableCommodities(res.data.map((b) => ({ id: b.id, name: b.name })));
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  // AI Rekomendasi Beranda (Hemat vs Sehat) - HANYA jika ada produk/bahan di Beranda yang sesuai
  const recommendations = React.useMemo(() => {
    return getBerandaAiRecommendations(recipes, availableCommodities);
  }, [recipes, availableCommodities]);

  const getSectorBadge = (sectorName?: string) => {
    if (!sectorName) return null;
    const found = SECTOR_OPTIONS.find((s) => s.value === sectorName);
    if (!found) {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-subtle text-text-secondary border border-border">
          {sectorName}
        </span>
      );
    }
    return (
      <span
        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${found.badgeClass}`}
      >
        {found.label}
      </span>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl sm:max-w-4xl p-0 overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl flex flex-col max-h-[92vh]">
        {/* Tombol Aksi Edit (berdampingan dengan tombol close X) */}
        <div className="absolute top-4.5 right-[62px] z-30 flex items-center">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              onClose();
              onEdit(product);
            }}
            className="h-9 min-h-9 px-3 sm:px-3.5 rounded-xl text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
          >
            <Pencil className="size-3.5" />
            <span className="hidden sm:inline">Edit Produk &amp; Resep</span>
            <span className="sm:hidden">Edit</span>
          </Button>
        </div>

        {/* 1. Modal Header */}
        <div className="px-6 py-5 pr-36 sm:pr-64 border-b border-border/80 bg-surface shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <DialogTitle className="text-lg sm:text-xl font-heading font-bold text-text-primary leading-tight line-clamp-2" title={product.product_name}>
                {product.product_name}
              </DialogTitle>
              <Badge variant="primary" className="text-[11px] uppercase font-bold tracking-wider">
                {unitLabel}
              </Badge>
              {product.category && (
                <Badge variant="secondary" className="text-[11px] font-semibold">
                  {product.category}
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs text-text-secondary flex items-center gap-2 flex-wrap">
              <span className="text-text-primary font-medium">
                Kapasitas: {batchUnits} {unitLabel}/batch
              </span>
              <span>&bull;</span>
              <span className="text-text-primary font-medium">
                Ritme: {iterationsPerDay}x iterasi/hari
              </span>
              <span>&bull;</span>
              <span className="font-semibold text-primary">
                Output: {formatNumber(dailyOutput)} {unitLabel}/hari
              </span>
            </DialogDescription>
          </div>
        </div>

        {/* 2. Tabs Switcher */}
        <div className="px-6 pt-4 pb-2 border-b border-border/60 bg-surface shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full sm:w-auto p-1 bg-surface-subtle border border-border rounded-2xl">
              <TabsTrigger
                value="limbah"
                className="flex-1 sm:flex-initial gap-2 text-xs sm:text-sm font-bold"
              >
                <span>Limbah yang Dihasilkan</span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-circular-waste-light text-circular-waste border border-circular-waste/20 tabular-nums">
                  {wastePrediction.items.length}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="resep"
                className="flex-1 sm:flex-initial gap-2 text-xs sm:text-sm font-bold"
              >
                <span>Komposisi Resep (BOM)</span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-primary-light text-primary border border-primary/20 tabular-nums">
                  {recipes.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* 3. Tab Contents Area */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 pb-6 space-y-6 custom-scrollbar min-h-0 bg-background/40">
          {/* TAB 1: LIMBAH YANG DIHASILKAN (Bersih tanpa 4 stat cards) */}
          {activeTab === "limbah" && (
            <div className="space-y-6 animate-in fade-in-50 duration-150">
              {/* Rincian Fraksi Limbah yang Dihasilkan */}
              <div className="p-5 rounded-2xl border border-border bg-surface shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/80">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-heading font-bold text-text-primary">
                      Rincian Jenis Limbah Terprediksi &amp; Valuasi Pasar
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Residu hasil komputasi resep bahan baku dan ukuran siklus batch produksi UMKM.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-circular-waste bg-circular-waste-light px-2.5 py-1 rounded-lg border border-circular-waste/20 w-fit">
                    AI Eco-Engine Terverifikasi
                  </span>
                </div>

                {wastePrediction.items.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-surface-subtle text-xs text-text-muted border border-dashed border-border space-y-2">
                    <AlertCircle className="size-6 mx-auto text-amber-600 mb-1" />
                    <p className="font-semibold text-text-primary text-sm">
                      Belum terdeteksi limbah spesifik
                    </p>
                    <p className="max-w-md mx-auto text-text-secondary">
                      Tambahkan bahan baku yang menghasilkan residu (seperti minyak goreng, kedelai, telur) atau konfigurasikan limbah kustom lewat form Edit.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border shadow-xs bg-surface">
                    <Table className="min-w-[620px]">
                      <TableHeader className="bg-surface-subtle/80 shadow-[inset_0px_1px_2px_0px_rgba(255,255,255,1),inset_0px_-1px_4px_0px_rgba(0,0,0,0.05)]">
                        <TableRow>
                          <TableHead className="w-[40%]">Jenis Residu &amp; Penanganan</TableHead>
                          <TableHead className="w-[22%]">Volume (Batch / Hari)</TableHead>
                          <TableHead className="w-[20%]">Harga Acuan</TableHead>
                          <TableHead className="w-[18%] text-right">Potensi Nilai/Hari</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {wastePrediction.items.map((item) => {
                          const dailyVolume =
                            Math.round(
                              item.estimatedVolumePerBatch * iterationsPerDay * 10
                            ) / 10;
                          const dailyRevenue = Math.round(
                            item.potentialRevenue * iterationsPerDay
                          );

                          return (
                            <TableRow key={item.id} className="hover:bg-surface-subtle/50">
                              <TableCell className="align-top max-w-[240px]">
                                <div className="space-y-1">
                                  <span className="font-bold text-text-primary text-xs block truncate" title={item.name}>
                                    {item.name}
                                  </span>
                                  <span className="text-[11px] text-text-muted block leading-relaxed line-clamp-2" title={item.handlingNote}>
                                    {item.handlingNote}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="align-top tabular-nums text-xs">
                                <span className="font-bold text-text-primary block">
                                  {item.estimatedVolumePerBatch} {item.unit}{" "}
                                  <span className="text-[10px] font-normal text-text-muted">
                                    /batch
                                  </span>
                                </span>
                                <span className="text-[11px] text-text-secondary font-medium">
                                  {dailyVolume} {item.unit} /hari
                                </span>
                              </TableCell>
                              <TableCell className="align-top tabular-nums text-xs text-text-secondary">
                                <span className="font-semibold text-text-primary block">
                                  {formatCurrency(item.pricePerUnit)}
                                </span>
                                <span className="text-[10px] text-text-muted">
                                  per {item.unit}
                                </span>
                              </TableCell>
                              <TableCell className="align-top text-right tabular-nums text-xs">
                                <span className="font-bold text-circular-waste block">
                                  +{formatCurrency(dailyRevenue)}
                                </span>
                                <span className="text-[10px] text-text-muted">
                                  +{formatCurrency(item.potentialRevenue)} /batch
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                      <TableFooter className="bg-surface-subtle/90 shadow-[inset_0px_1px_2px_0px_rgba(255,255,255,1),inset_0px_-1px_4px_0px_rgba(0,0,0,0.05)]">
                        <TableRow>
                          <TableCell className="font-bold text-text-primary text-xs">
                            Total Estimasi Valuasi Residu ({iterationsPerDay} Batch/Hari)
                          </TableCell>
                          <TableCell className="font-bold text-text-primary tabular-nums text-xs">
                            ~{dailyWasteKg} Kg/Hari
                          </TableCell>
                          <TableCell className="text-xs text-text-muted">
                            Akumulasi Harian
                          </TableCell>
                          <TableCell className="text-right font-bold text-circular-waste tabular-nums text-sm">
                            +{formatCurrency(fin.dailyWasteRevenue)} /hari
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                )}
              </div>

              {/* Banner Bursa Limbah */}
              <div className="p-4 rounded-2xl bg-surface-subtle/70 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-text-primary block">
                    Ingin Menyalurkan Limbah ke Pembeli (Offtaker)?
                  </span>
                  <p className="text-[11px] text-text-secondary">
                    Listing limbah Anda dapat dipublikasikan ke Bursa Sirkular KUMPUL untuk dijemput langsung oleh mitra agregator.
                  </p>
                </div>
                <Button
                  asChild
                  variant="primary"
                  size="sm"
                  className="rounded-xl px-3.5 py-1.5 text-xs font-bold gap-1.5 shrink-0 self-start sm:self-center"
                >
                  <Link href="/limbah">
                    <span>Buka Bursa Limbah</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: KOMPOSISI RESEP (BOM) */}
          {activeTab === "resep" && (
            <div className="space-y-6 animate-in fade-in-50 duration-150">
              {/* Recipe Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl border border-border bg-surface shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-text-secondary block">
                    Jumlah Bahan Baku
                  </span>
                  <span className="text-xl font-heading font-bold text-text-primary tabular-nums block">
                    {recipes.length}
                  </span>
                  <p className="text-[10px] text-text-muted">Komponen terdaftar</p>
                </div>

                <div className="p-3.5 rounded-2xl border border-border bg-surface shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-text-secondary block">
                    HPP Pokok per Porsi
                  </span>
                  <span className="text-xl font-heading font-bold text-amber-700 tabular-nums block">
                    {formatCurrency(hpp)}
                  </span>
                  <p className="text-[10px] text-text-muted">Total biaya bahan</p>
                </div>

                <div className="p-3.5 rounded-2xl border border-border bg-surface shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-text-secondary block">
                    Modal Bahan 1 Batch
                  </span>
                  <span className="text-xl font-heading font-bold text-text-primary tabular-nums block">
                    {formatCurrency(costPerBatch)}
                  </span>
                  <p className="text-[10px] text-text-muted">Untuk {batchUnits} {unitLabel}</p>
                </div>

                <div className="p-3.5 rounded-2xl border border-border bg-surface shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-text-secondary block">
                    Modal Bahan Harian
                  </span>
                  <span className="text-xl font-heading font-bold text-text-primary tabular-nums block">
                    {formatCurrency(costPerBatch * iterationsPerDay)}
                  </span>
                  <p className="text-[10px] text-text-muted">
                    {iterationsPerDay}x siklus ({dailyOutput} {unitLabel})
                  </p>
                </div>
              </div>

              {/* View-Only Recipe Table (Tanpa badge 'Mode View Only') */}
              <div className="p-5 rounded-2xl border border-border bg-surface shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/80">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-heading font-bold text-text-primary">
                      Daftar Bahan Baku &amp; Takaran Bill of Materials
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Rincian bahan baku tidak dapat ditambah atau diubah di sini.
                    </p>
                  </div>
                </div>

                {recipes.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-surface-subtle text-xs text-text-muted border border-dashed border-border space-y-3">
                    <AlertCircle className="size-6 mx-auto text-amber-600 mb-1" />
                    <p className="font-semibold text-text-primary text-sm">
                      Belum ada komposisi bahan baku
                    </p>
                    <p className="max-w-md mx-auto text-text-secondary">
                      Produk ini belum memiliki rincian bahan baku. Tambahkan bahan melalui pop up edit produk untuk menghitung HPP otomatis.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border shadow-xs bg-surface">
                    <Table className="min-w-[620px]">
                      <TableHeader className="bg-surface-subtle/80 shadow-[inset_0px_1px_2px_0px_rgba(255,255,255,1),inset_0px_-1px_4px_0px_rgba(0,0,0,0.05)]">
                        <TableRow>
                          <TableHead className="w-[30%]">Nama Bahan Baku &amp; Sektor</TableHead>
                          <TableHead className="w-[18%]">Takaran / Porsi</TableHead>
                          <TableHead className="w-[18%]">Kebutuhan 1 Batch</TableHead>
                          <TableHead className="w-[18%]">Kebutuhan Harian</TableHead>
                          <TableHead className="w-[16%] text-right">Biaya Est. / Porsi</TableHead>
                          <TableHead className="w-[15%] text-right">Porsi HPP</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recipes.map((item) => {
                          const reqQty = Number(item.required_qty_per_unit) || 0;
                          const totalBatchQty =
                            Number(item.total_batch_required_qty) || reqQty * batchUnits;
                          const totalDailyQty =
                            Math.round(totalBatchQty * iterationsPerDay * 100) / 100;
                          const cost = Number(item.estimated_cost_per_unit) || 0;
                          const costShare = hpp > 0 ? (cost / hpp) * 100 : 0;

                          return (
                            <TableRow key={item.id} className="hover:bg-surface-subtle/50">
                              <TableCell className="align-middle max-w-[200px]">
                                <div className="space-y-1 min-w-0">
                                  <span className="font-bold text-text-primary text-xs block truncate" title={item.ingredient_name}>
                                    {item.ingredient_name}
                                  </span>
                                  {getSectorBadge(item.sector)}
                                </div>
                              </TableCell>
                              <TableCell className="align-middle tabular-nums text-xs">
                                <span className="font-semibold text-text-primary">
                                  {reqQty} {item.unit}
                                </span>
                              </TableCell>
                              <TableCell className="align-middle tabular-nums text-xs">
                                <span className="font-semibold text-text-primary">
                                  {totalBatchQty} {item.unit}
                                </span>
                              </TableCell>
                              <TableCell className="align-middle tabular-nums text-xs">
                                <span className="font-bold text-primary">
                                  {totalDailyQty} {item.unit}
                                </span>
                              </TableCell>
                              <TableCell className="align-middle text-right tabular-nums text-xs font-bold text-text-primary">
                                {formatCurrency(cost)}
                              </TableCell>
                              <TableCell className="align-middle text-right tabular-nums text-xs">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-12 h-1.5 rounded-full bg-border overflow-hidden">
                                    <div
                                      className="h-full bg-primary rounded-full"
                                      style={{ width: `${Math.min(100, costShare)}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-text-secondary text-[11px]">
                                    {costShare.toFixed(0)}%
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                      <TableFooter className="bg-surface-subtle/90 shadow-[inset_0px_1px_2px_0px_rgba(255,255,255,1),inset_0px_-1px_4px_0px_rgba(0,0,0,0.05)]">
                        <TableRow>
                          <TableCell colSpan={4} className="font-bold text-text-primary text-xs">
                            Total HPP Pokok Bahan Baku
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary tabular-nums text-sm">
                            {formatCurrency(hpp)}
                          </TableCell>
                          <TableCell className="text-right text-xs font-bold text-text-muted">
                            100%
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                )}
              </div>

              {/* Rekomendasi Alternatif Bahan Baku Cerdas AI (Hanya jika ada produk/bahan di Beranda yang sesuai) */}
              {recommendations && (recommendations.hemat || recommendations.sehat) && (
                <div className="p-5 rounded-2xl border border-border bg-surface shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border/80">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-heading font-bold text-text-primary">
                        Rekomendasi Alternatif Bahan Baku Cerdas
                      </h3>
                      <p className="text-xs text-text-secondary">
                        Rekomendasi bahan langsung terhubung dengan pasokan bursa supplier di Beranda.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-md border border-primary/20">
                      KUMPUL AI Matcher
                    </span>
                  </div>

                  <div className={cn(
                    "grid gap-3.5",
                    recommendations.hemat && recommendations.sehat ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                  )}>
                    {/* CARD KIRI: REKOMENDASI HEMAT */}
                    {recommendations.hemat && (
                      <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-surface-subtle/50 flex flex-col justify-between gap-3 hover:border-border-strong transition-all">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2 min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-text-primary truncate" title={recommendations.hemat.commodityName}>
                              {recommendations.hemat.commodityName}
                            </h4>
                            <Badge variant="waste" className="text-[10px] font-bold shrink-0">
                              {recommendations.hemat.badgeLabel}
                            </Badge>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed line-clamp-3" title={recommendations.hemat.reason}>
                            {recommendations.hemat.reason}
                          </p>
                        </div>

                        <Button
                          asChild
                          variant="primary"
                          size="sm"
                          className="w-full rounded-xl font-bold justify-between text-xs cursor-pointer min-h-[36px]"
                        >
                          <Link
                            href={`/home?search=${encodeURIComponent(recommendations.hemat.commodityName)}&commodityId=${recommendations.hemat.commodityId}`}
                            onClick={onClose}
                          >
                            <span>Beli Bahan di Beranda</span>
                            <ArrowRight className="size-3.5" />
                          </Link>
                        </Button>
                      </div>
                    )}

                    {/* CARD KANAN: REKOMENDASI SEHAT */}
                    {recommendations.sehat && (
                      <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-surface-subtle/50 flex flex-col justify-between gap-3 hover:border-border-strong transition-all">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2 min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-text-primary truncate" title={recommendations.sehat.commodityName}>
                              {recommendations.sehat.commodityName}
                            </h4>
                            <Badge variant="primary" className="text-[10px] font-bold shrink-0">
                              {recommendations.sehat.badgeLabel}
                            </Badge>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed line-clamp-3" title={recommendations.sehat.reason}>
                            {recommendations.sehat.reason}
                          </p>
                        </div>

                        <Button
                          asChild
                          variant="primary"
                          size="sm"
                          className="w-full rounded-xl font-bold justify-between text-xs cursor-pointer min-h-[36px]"
                        >
                          <Link
                            href={`/home?search=${encodeURIComponent(recommendations.sehat.commodityName)}&commodityId=${recommendations.sehat.commodityId}`}
                            onClick={onClose}
                          >
                            <span>Beli Bahan di Beranda</span>
                            <ArrowRight className="size-3.5" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
