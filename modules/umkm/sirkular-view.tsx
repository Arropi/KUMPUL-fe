"use client";

import * as React from "react";
import {
  MOCK_WASTE_LISTINGS,
  type WasteListing,
} from "@/constants/umkm";
import { DEFAULT_SEED_PRODUCTS } from "@/lib/menu-intelligence";
import type { BEProduct } from "@/lib/api/types";
import { getUmkmProductsAction } from "@/actions/products";
import { BankSampahMapSection } from "@/modules/umkm/bank-sampah-map-section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ShoppingBag,
  AlertTriangle,
  Clock,
  Recycle,
  CheckCircle2,
  Plus,
  Calendar,
  ChefHat,
  Phone,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";

const WASTE_UNITS = [
  "Karung",
  "Sak",
  "Krat",
  "Pax",
  "Bal",
  "Kg",
  "Gram",
  "Ton",
  "Kuintal",
  "Liter",
  "Ml",
  "Kubik",
  "Pcs",
  "Pack",
  "Dus",
  "Box",
  "Karton",
  "Botol",
  "Kaleng",
  "Tray",
  "Keranjang",
  "Baskom",
  "Ekor",
  "Butir",
  "Lembar",
  "Ikat",
  "Porsi",
  "Cup",
  "Bungkus",
  "Lusin",
  "Pallet",
  "Koli",
] as const;

type FilterTab = "SEMUA" | "DIPESAN" | "TERSEDIA" | "SEGERA_KADALUARSA";

export function UmkmSirkularView() {
  const [wasteListings, setWasteListings] = React.useState<WasteListing[]>(MOCK_WASTE_LISTINGS);
  const [products, setProducts] = React.useState<BEProduct[]>([]);
  const [activeFilter, setActiveFilter] = React.useState<FilterTab>("SEMUA");
  const [selectedProductFilter, setSelectedProductFilter] = React.useState<string>("SEMUA");

  // Notification Banner
  const [toastMessage, setToastMessage] = React.useState<{ text: string; type: "success" | "info" } | null>(null);

  // Form State Modal Tambah Listing
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [selectedProductId, setSelectedProductId] = React.useState<string>("");
  const [selectedProductName, setSelectedProductName] = React.useState<string>("");
  const [newTitle, setNewTitle] = React.useState("");
  const [newVolume, setNewVolume] = React.useState<number>(50);
  const [newUnit, setNewUnit] = React.useState<string>("Kg");
  const [newPricePerUnit, setNewPricePerUnit] = React.useState<number>(1500);
  const [newExpiryDate, setNewExpiryDate] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });

  // Modal Detail Pesanan / Order
  const [selectedOrderListing, setSelectedOrderListing] = React.useState<WasteListing | null>(null);

  // Load produk UMKM untuk integrasi asal limbah
  React.useEffect(() => {
    async function loadProducts() {
      try {
        const res = await getUmkmProductsAction();
        if (res.success && res.data && res.data.length > 0) {
          setProducts(res.data);
          return;
        }
      } catch {
        // Fallback to local storage or default seed
      }
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("kumpul_mock_products");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setProducts(parsed);
              return;
            }
          } catch {}
        }
      }
      setProducts(DEFAULT_SEED_PRODUCTS);
    }
    loadProducts();
  }, []);

  const showToast = (text: string, type: "success" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Helper kalkulasi sisa hari kadaluarsa
  const getExpiryDiffDays = (dateStr?: string): number => {
    if (!dateStr) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(dateStr);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  // Metrics
  const totalWasteRevenue = wasteListings.reduce((acc, curr) => acc + curr.potentialRevenue, 0);
  const totalVolumeKg = wasteListings.reduce((acc, curr) => acc + curr.volumeKg, 0);
  const orderedCount = wasteListings.filter((w) => w.orderInfo || w.status === "DIBOOKING").length;
  const availableCount = wasteListings.filter((w) => w.status === "TERSEDIA").length;
  const expiringSoonCount = wasteListings.filter((w) => getExpiryDiffDays(w.expiryDate) <= 3).length;

  // Handle pilih produk asal pada modal listing
  const handleProductSelect = (productId: string) => {
    if (productId === "CUSTOM_KITCHEN" || !productId) {
      setSelectedProductId("CUSTOM_KITCHEN");
      setSelectedProductName("Olahan Dapur Umum");
      if (!newTitle || newTitle.startsWith("Limbah ")) {
        setNewTitle("Limbah Residu Dapur Umum");
      }
      return;
    }
    const found = products.find((p) => p.id === productId);
    if (found) {
      setSelectedProductId(found.id);
      setSelectedProductName(found.product_name);
      if (!newTitle || newTitle.startsWith("Limbah ")) {
        setNewTitle(`Limbah Residu ${found.product_name}`);
      }
    }
  };

  // Tambah listing baru
  const handleAddListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newListing: WasteListing = {
      id: `waste-${Date.now()}`,
      title: newTitle,
      sourceProductId: selectedProductId !== "CUSTOM_KITCHEN" ? selectedProductId : undefined,
      sourceProductName: selectedProductName || "Olahan Dapur Umum",
      volumeKg: newVolume,
      unit: newUnit,
      pricePerKg: newPricePerUnit,
      location: "Rungkut, Surabaya",
      expiryDate: newExpiryDate,
      status: "TERSEDIA",
      potentialRevenue: newVolume * newPricePerUnit,
      suitableOfftaker: "Mitra Pengepul Terverifikasi KUMPUL",
    };

    setWasteListings((prev) => [newListing, ...prev]);
    setIsAddModalOpen(false);
    setNewTitle("");
    setSelectedProductId("");
    setSelectedProductName("");
    setNewVolume(50);
    setNewPricePerUnit(1500);
    showToast("Listing limbah berhasil ditayangkan ke bursa offtaker!");
  };

  // Konfirmasi pesanan masuk dari offtaker
  const handleConfirmOrder = (listingId: string) => {
    setWasteListings((prev) =>
      prev.map((item) => {
        if (item.id === listingId && item.orderInfo) {
          return {
            ...item,
            orderInfo: {
              ...item.orderInfo,
              status: "DIJADWALKAN_JEMPUT",
            },
          };
        }
        return item;
      })
    );
    showToast("Jadwal penjemputan limbah berhasil dikonfirmasi. Armada offtaker akan segera menuju lokasi.");
  };

  // Filter listings
  const filteredListings = wasteListings.filter((item) => {
    // Tab Filter
    if (activeFilter === "DIPESAN") {
      if (!item.orderInfo && item.status !== "DIBOOKING") return false;
    } else if (activeFilter === "TERSEDIA") {
      if (item.status !== "TERSEDIA") return false;
    } else if (activeFilter === "SEGERA_KADALUARSA") {
      if (getExpiryDiffDays(item.expiryDate) > 3) return false;
    }

    // Product Filter
    if (selectedProductFilter !== "SEMUA") {
      if (item.sourceProductName !== selectedProductFilter) return false;
    }

    return true;
  });

  // Unique product names yang ada di listings
  const uniqueProductSources = Array.from(
    new Set(wasteListings.map((w) => w.sourceProductName).filter(Boolean))
  );

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 p-4 rounded-2xl bg-neutral-900 text-white shadow-elevation-2 text-xs font-semibold animate-in fade-in slide-in-from-top-3 border border-white/10">
          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-border/70">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary text-balance mt-1">
            Bursa Limbah &amp; Valuasi Sirkular UMKM
          </h1>
          <p className="font-sans text-xs sm:text-sm text-text-secondary text-pretty mt-1 max-w-3xl leading-relaxed">
            Pantau limbah hasil produksi kuliner, tanggapi pesanan penjemputan offtaker, awasi tanggal kadaluwarsa residu dapur, dan kirimkan hasil limbah secara mandiri ke titik Bank Sampah terdekat.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="default"
          onClick={() => setIsAddModalOpen(true)}
          className="font-bold min-h-[44px] shrink-0 gap-2 cursor-pointer shadow-elevation-1"
        >
          <Plus className="size-4" />
          <span>+ Jual Limbah Dapur</span>
        </Button>
      </div>

      {/* 2. Key Metrics Section: Watermelon UI StatCard 3-Grid Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metrik 1: Nilai Valuasi Limbah */}
        <StatCard
          title="Estimasi Nilai Cuan Limbah"
          value={formatCurrency(totalWasteRevenue)}
          description={`Akumulasi nilai ekonomi dari ${wasteListings.length} jenis residu olahan produk`}
          badgeLabel={orderedCount > 0 ? `${orderedCount} Pesanan Masuk` : "Siap Ditransaksikan"}
          badgeVariant={orderedCount > 0 ? "warning" : "primary"}
          icon={orderedCount > 0 ? <ShoppingBag className="size-3 text-amber-700" /> : <Sparkles className="size-3 text-primary" />}
          trend="Dana langsung masuk ke kas setelah serah terima"
        />

        {/* Metrik 2: Total Volume Limbah Terkelola */}
        <StatCard
          title="Total Volume Residu Terkelola"
          value={formatNumber(totalVolumeKg)}
          unit="kg/L"
          description="Residu organik teralihkan 100% dari pembuangan TPA liar"
          badgeLabel="6 Bank Sampah"
          badgeVariant="waste"
          icon={<Recycle className="size-3 text-circular-waste" />}
          trend="Tersedia titik antar mandiri area Surabaya"
        />

        {/* Metrik 3: Pengawasan Kadaluwarsa */}
        <StatCard
          title="Status Ketahanan Residu"
          value={expiringSoonCount}
          unit="Residu Kritis"
          description={
            expiringSoonCount > 0
              ? `${expiringSoonCount} item mendekati batas kesegaran (<= 3 hari)`
              : "Seluruh residu dapur dalam status segar dan aman"
          }
          badgeLabel={expiringSoonCount > 0 ? "Prioritas Angkut" : "Kondisi Segar"}
          badgeVariant={expiringSoonCount > 0 ? "warning" : "success"}
          icon={<Clock className="size-3 text-amber-700" />}
          trend="Cegah pembusukan dengan antar mandiri tepat waktu"
        />
      </div>

      {/* 3. Section Listing Limbah dari Produk & Informasi Pesanan Masuk */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/70">
          <div>
            <h2 className="font-heading text-base sm:text-lg font-bold text-text-primary text-balance flex items-center gap-2">
              <ChefHat className="size-4.5 text-primary" />
              <span>Limbah Hasil Olahan Produk Dapur</span>
            </h2>
            <p className="font-sans text-xs text-text-secondary text-pretty mt-0.5">
              Daftar limbah yang dihasilkan dari produk kuliner kateringmu beserta status pemesanan offtaker dan tanggal akhir kadaluwarsa.
            </p>
          </div>

          {/* Quick Filter Tabs (Tactile Rounded Kumpul Style) */}
          <div className="flex flex-wrap items-center gap-1.5 bg-surface-subtle p-1 rounded-xl border border-border/80 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveFilter("SEMUA")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === "SEMUA"
                  ? "bg-surface text-text-primary shadow-xs border border-border/60"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
              }`}
            >
              Semua ({wasteListings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("DIPESAN")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === "DIPESAN"
                  ? "bg-accent-light text-accent shadow-xs border border-accent/20"
                  : "text-amber-800 hover:text-amber-900 hover:bg-surface/50"
              }`}
            >
              <ShoppingBag className="size-3" />
              <span>Ada Pesanan ({orderedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("SEGERA_KADALUARSA")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === "SEGERA_KADALUARSA"
                  ? "bg-red-50 text-red-800 shadow-xs border border-red-200"
                  : "text-red-700 hover:text-red-800 hover:bg-surface/50"
              }`}
            >
              <AlertTriangle className="size-3" />
              <span>Kadaluarsa &le; 3 Hari ({expiringSoonCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("TERSEDIA")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === "TERSEDIA"
                  ? "bg-surface text-text-primary shadow-xs border border-border/60"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
              }`}
            >
              Tersedia ({availableCount})
            </button>
          </div>
        </div>

        {/* Filter per Produk Asal jika ada variasi produk */}
        {uniqueProductSources.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs custom-scrollbar">
            <span className="font-heading text-text-muted shrink-0 text-[11px] font-semibold uppercase tracking-wider">
              Filter Produk:
            </span>
            <button
              type="button"
              onClick={() => setSelectedProductFilter("SEMUA")}
              className={`px-3 py-1 rounded-lg border text-xs font-semibold cursor-pointer shrink-0 transition-all ${
                selectedProductFilter === "SEMUA"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-text-secondary hover:bg-surface-subtle"
              }`}
            >
              Semua Produk
            </button>
            {uniqueProductSources.map((prodName) => (
              <button
                key={prodName}
                type="button"
                onClick={() => setSelectedProductFilter(prodName!)}
                className={`px-3 py-1 rounded-lg border text-xs font-semibold cursor-pointer shrink-0 transition-all ${
                  selectedProductFilter === prodName
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-text-secondary hover:bg-surface-subtle"
                }`}
              >
                {prodName}
              </button>
            ))}
          </div>
        )}

        {/* Grid Kartu Limbah */}
        {filteredListings.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-surface-subtle space-y-2">
            <Recycle className="size-8 text-text-muted mx-auto" />
            <p className="font-heading text-sm font-bold text-text-primary">Tidak ada limbah pada filter ini</p>
            <p className="font-sans text-xs text-text-muted">
              Pilih tab &quot;Semua&quot; atau pasang listing limbah baru dari dapurmu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredListings.map((item) => {
              const expiryDiff = getExpiryDiffDays(item.expiryDate);
              const hasOrder = Boolean(item.orderInfo);

              return (
                <Card
                  key={item.id}
                  className={`flex flex-col justify-between overflow-hidden rounded-2xl bg-surface shadow-elevation-1 p-5 space-y-4 transition-all duration-200 hover:shadow-elevation-2 ${
                    hasOrder
                      ? "border-2 border-amber-400 bg-amber-50/20"
                      : "border border-border"
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Header Kartu: Tag Asal Produk & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="secondary" className="gap-1.5 font-medium max-w-[240px] truncate">
                        <ChefHat className="size-3 text-primary shrink-0" />
                        <span className="truncate">
                          Dari: <strong className="text-text-primary font-semibold">{item.sourceProductName || "Olahan Dapur"}</strong>
                        </span>
                      </Badge>

                      {hasOrder ? (
                        <Badge variant="accent" className="gap-1 font-bold animate-pulse">
                          <ShoppingBag className="size-3" />
                          <span>Dipesan Offtaker</span>
                        </Badge>
                      ) : (
                        <Badge variant="waste">
                          {item.status}
                        </Badge>
                      )}
                    </div>

                    {/* Judul & Detail */}
                    <div>
                      <h3 className="font-heading text-base font-bold text-text-primary line-clamp-1 text-balance">
                        {item.title}
                      </h3>
                      <p className="font-sans text-xs text-text-muted mt-0.5">
                        Kategori: <span className="font-medium text-text-secondary">{item.category || "Limbah Residu Organik"}</span>
                      </p>
                    </div>

                    {/* Snapshot Volume & Nilai */}
                    <div className="p-3.5 rounded-xl bg-surface-subtle border border-border/80 space-y-2 text-xs">
                      <div className="flex justify-between text-text-secondary">
                        <span>Volume Terkumpul:</span>
                        <strong className="text-text-primary tabular-nums">
                          {item.volumeKg} {item.unit || "kg"}
                        </strong>
                      </div>
                      <div className="flex justify-between text-text-secondary">
                        <span>Harga Penawaran:</span>
                        <strong className="text-text-primary tabular-nums">
                          {formatCurrency(item.pricePerKg)} / {item.unit || "kg"}
                        </strong>
                      </div>
                      <div className="pt-1.5 border-t border-border/70 flex justify-between items-center">
                        <span className="text-circular-waste font-semibold">Potensi Cuan Bersih:</span>
                        <strong className="text-circular-waste text-sm font-bold tabular-nums">
                          {formatCurrency(item.potentialRevenue)}
                        </strong>
                      </div>
                    </div>

                    {/* Informasi Tanggal Akhir / Kadaluwarsa */}
                    <div className="space-y-1">
                      {expiryDiff <= 1 ? (
                        <div className="p-2.5 rounded-xl border border-red-200 bg-red-50/90 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-red-800 font-bold">
                            <AlertTriangle className="size-3.5 text-red-700 shrink-0" />
                            <span>{expiryDiff <= 0 ? "Kadaluarsa Hari Ini!" : "Kadaluarsa Besok!"}</span>
                          </div>
                          <span className="text-[11px] text-red-800 font-semibold tabular-nums">
                            {formatDate(item.expiryDate || "", "medium")}
                          </span>
                        </div>
                      ) : expiryDiff <= 3 ? (
                        <div className="p-2.5 rounded-xl border border-amber-200 bg-accent-light/60 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                            <Clock className="size-3.5 text-amber-700 shrink-0" />
                            <span>Kadaluarsa {expiryDiff} Hari Lagi</span>
                          </div>
                          <span className="text-[11px] text-amber-900 font-medium tabular-nums">
                            s/d {formatDate(item.expiryDate || "", "medium")}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-surface-subtle border border-border text-xs flex items-center justify-between text-text-secondary">
                          <div className="flex items-center gap-1.5 text-text-muted">
                            <Calendar className="size-3.5 text-text-muted shrink-0" />
                            <span>Batas Kadaluwarsa:</span>
                          </div>
                          <span className="font-semibold text-text-primary tabular-nums">
                            {item.expiryDate ? formatDate(item.expiryDate, "medium") : "-"} ({expiryDiff} hari lagi)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* BOX INFORMASI PESANAN MASUK (Jika Ada yang Memesan) */}
                    {item.orderInfo && (
                      <div className="rounded-xl border border-amber-300 bg-accent-light/40 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-amber-950">
                            <ShoppingBag className="size-3.5 text-amber-700 shrink-0" />
                            <span>Rincian Pesanan Masuk</span>
                          </div>
                          <Badge
                            variant={item.orderInfo.status === "MENUNGGU_KONFIRMASI" ? "warning" : "success"}
                            className="text-[10px] font-bold"
                          >
                            {item.orderInfo.status === "MENUNGGU_KONFIRMASI"
                              ? "Perlu Konfirmasi"
                              : "Dijadwalkan Jemput"}
                          </Badge>
                        </div>

                        <div className="text-xs text-text-secondary space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-text-muted">Pemesan:</span>
                            <strong className="text-text-primary text-right">{item.orderInfo.buyerName}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-muted">Volume Dipesan:</span>
                            <span className="font-bold text-text-primary tabular-nums">
                              {item.orderInfo.orderedVolume} {item.orderInfo.orderedUnit} ({formatCurrency(item.orderInfo.totalPrice)})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-muted">Jadwal Jemput:</span>
                            <strong className="text-amber-950 font-bold">{item.orderInfo.pickupScheduledDate}</strong>
                          </div>
                          {item.orderInfo.notes && (
                            <p className="text-[11px] text-text-secondary italic pt-1 border-t border-amber-200/80">
                              Catatan: &ldquo;{item.orderInfo.notes}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Tombol aksi pemesanan (Tactile 3D Buttons) */}
                        <div className="pt-1.5 flex gap-2">
                          {item.orderInfo.status === "MENUNGGU_KONFIRMASI" ? (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => handleConfirmOrder(item.id)}
                              className="w-full text-xs font-bold min-h-[38px] cursor-pointer gap-1.5"
                            >
                              <CheckCircle2 className="size-3.5" />
                              <span>Konfirmasi Jadwal Penjemputan</span>
                            </Button>
                          ) : (
                            <div className="flex w-full gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  showToast(`Nomor WA Pembeli: ${item.orderInfo?.buyerPhone || "0812-3456-7890"} (Tersalin)`)
                                }
                                className="flex-1 text-xs font-semibold min-h-[38px] cursor-pointer gap-1"
                              >
                                <Phone className="size-3 text-emerald-700" />
                                <span>Hubungi Pembeli</span>
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedOrderListing(item)}
                                className="text-xs font-semibold min-h-[38px] cursor-pointer"
                              >
                                Detail
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Card Aksi */}
                  {!item.orderInfo && (
                    <div className="pt-3 border-t border-border/70 flex gap-2">
                      <Button
                        type="button"
                        variant="soft"
                        size="sm"
                        onClick={() => {
                          const elem = document.getElementById("bank-sampah-map-section");
                          elem?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="flex-1 font-bold text-xs min-h-[40px] cursor-pointer gap-1.5"
                      >
                        <Recycle className="size-3.5 text-primary" />
                        <span>Kirim Mandiri ke Bank Sampah</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => showToast(`Listing ${item.title} aktif di bursa offtaker.`)}
                        className="text-xs font-semibold min-h-[40px] cursor-pointer"
                      >
                        Kelola
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Section Titik Bank Sampah Terdekat (Interactive Leaflet Map & Scraped Google Maps Locations) */}
      <div id="bank-sampah-map-section">
        <BankSampahMapSection />
      </div>

      {/* 5. Modal Tambah Listing Limbah Baru (Standardized Dropdowns & Tactile Controls) */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-surface border border-border shadow-elevation-2">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-text-primary text-balance">
              Pasang Listing Limbah Dapur
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddListing} className="space-y-4 pt-2">
            {/* Pilihan Produk Asal (Menggunakan Dropdown Menu Kumpul) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-heading text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <ChefHat className="size-3.5 text-primary" />
                  <span>Pilih Produk Asal (Opsional)</span>
                </label>
                <span className="font-sans text-[10px] text-text-muted">Dari menu aktif</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between h-11 px-3.5 rounded-xl border border-border bg-surface text-xs font-medium text-text-primary shadow-xs outline-none cursor-pointer hover:border-primary/40 hover:bg-surface-subtle focus:ring-2 focus:ring-primary/20 transition-all duration-150"
                  >
                    <span className="truncate">
                      {selectedProductName || "-- Pilih produk kuliner asal limbah --"}
                    </span>
                    <ChevronDown className="size-3.5 text-text-muted shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[340px] sm:w-[380px] max-h-60 overflow-y-auto p-1.5 rounded-xl shadow-elevation-2 bg-surface border border-border custom-scrollbar"
                >
                  <div className="px-2 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border/60 mb-1 select-none">
                    Daftar Menu Produk Dapur
                  </div>
                  <DropdownMenuRadioGroup
                    value={selectedProductId}
                    onValueChange={handleProductSelect}
                  >
                    <DropdownMenuRadioItem
                      value="CUSTOM_KITCHEN"
                      className="py-2 px-2.5 text-xs font-semibold rounded-lg cursor-pointer hover:bg-surface-subtle"
                    >
                      <span>Olahan Dapur Umum / Lainnya</span>
                    </DropdownMenuRadioItem>
                    {products.map((prod) => (
                      <DropdownMenuRadioItem
                        key={prod.id}
                        value={prod.id}
                        className="py-2 px-2.5 text-xs font-medium rounded-lg cursor-pointer hover:bg-surface-subtle"
                      >
                        <span>{prod.product_name}</span>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Judul Listing */}
            <div className="space-y-1.5">
              <label className="font-heading text-xs font-bold text-text-primary">Judul Listing</label>
              <Input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Contoh: Minyak Jelantah Penggorengan Bebek"
                className="w-full h-11 text-xs rounded-xl"
              />
            </div>

            {/* Volume & Satuan Dropdown (Scrollable Radix Dropdown) */}
            <div className="space-y-1.5">
              <label className="font-heading text-xs font-bold text-text-primary">Volume &amp; Satuan</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  required
                  value={newVolume}
                  onChange={(e) => setNewVolume(Number(e.target.value))}
                  placeholder="Jumlah volume"
                  className="flex-1 h-11 text-xs tabular-nums rounded-xl"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center justify-between gap-2 h-11 min-w-[125px] px-3.5 rounded-xl border border-border bg-surface text-xs font-bold text-text-primary shadow-xs outline-none cursor-pointer hover:border-primary/40 hover:bg-surface-subtle focus:ring-2 focus:ring-primary/20 transition-all duration-150"
                    >
                      <span className="truncate">{newUnit}</span>
                      <ChevronDown className="size-3.5 text-text-muted shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="max-h-60 overflow-y-auto min-w-[140px] p-1.5 rounded-xl shadow-elevation-2 bg-surface border border-border custom-scrollbar"
                  >
                    <div className="px-2 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border/60 mb-1 select-none">
                      Pilih Satuan
                    </div>
                    <DropdownMenuRadioGroup value={newUnit} onValueChange={setNewUnit}>
                      {WASTE_UNITS.map((unit) => (
                        <DropdownMenuRadioItem
                          key={unit}
                          value={unit}
                          className="py-1.5 px-2.5 text-xs font-semibold rounded-lg cursor-pointer hover:bg-surface-subtle"
                        >
                          <span>{unit}</span>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Harga & Tanggal Kadaluwarsa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-heading text-xs font-bold text-text-primary">
                  Harga per {newUnit} (Rp)
                </label>
                <Input
                  type="number"
                  min="100"
                  step="100"
                  required
                  value={newPricePerUnit}
                  onChange={(e) => setNewPricePerUnit(Number(e.target.value))}
                  className="w-full h-11 text-xs tabular-nums rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-heading text-xs font-bold text-text-primary">
                  Tanggal Expired / Kadaluwarsa
                </label>
                <Input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full h-11 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-subtle border border-border text-xs flex justify-between items-center">
              <span className="font-sans text-text-secondary font-medium">Estimasi Nilai Cuan:</span>
              <strong className="text-circular-waste text-sm font-bold tabular-nums">
                {formatCurrency(newVolume * newPricePerUnit)}
              </strong>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="default"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 min-h-[44px] cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="default"
                className="flex-1 font-bold min-h-[44px] cursor-pointer"
              >
                Tayangkan Listing
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Modal Detail Pesanan Pembeli */}
      <Dialog open={Boolean(selectedOrderListing)} onOpenChange={() => setSelectedOrderListing(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-surface border border-border shadow-elevation-2">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-text-primary flex items-center gap-2 text-balance">
              <ShoppingBag className="size-5 text-accent" />
              <span>Rincian Pesanan Masuk</span>
            </DialogTitle>
          </DialogHeader>

          {selectedOrderListing?.orderInfo && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="p-4 rounded-xl bg-accent-light/50 border border-amber-300 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-sm text-text-primary">{selectedOrderListing.orderInfo.buyerName}</span>
                  <Badge variant="warning" className="text-[10px] font-bold">
                    {selectedOrderListing.orderInfo.status === "MENUNGGU_KONFIRMASI"
                      ? "Menunggu Konfirmasi"
                      : "Dijadwalkan"}
                  </Badge>
                </div>
                <p className="font-sans text-text-secondary text-[11px]">
                  Tipe Mitra: <strong className="text-text-primary">{selectedOrderListing.orderInfo.buyerType}</strong>
                </p>
                <div className="pt-2 border-t border-amber-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Item Limbah:</span>
                    <strong className="text-text-primary">{selectedOrderListing.title}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Volume Dipesan:</span>
                    <strong className="text-text-primary tabular-nums">
                      {selectedOrderListing.orderInfo.orderedVolume} {selectedOrderListing.orderInfo.orderedUnit}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Total Kesepakatan:</span>
                    <strong className="text-circular-waste font-bold text-sm tabular-nums">
                      {formatCurrency(selectedOrderListing.orderInfo.totalPrice)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Jadwal Jemput:</span>
                    <strong className="text-amber-950 font-bold">{selectedOrderListing.orderInfo.pickupScheduledDate}</strong>
                  </div>
                </div>
              </div>

              {selectedOrderListing.orderInfo.notes && (
                <div className="p-3 rounded-xl bg-surface-subtle border border-border space-y-1">
                  <span className="font-heading text-[10px] font-bold text-text-muted uppercase">Catatan Pembeli:</span>
                  <p className="font-sans text-text-secondary italic text-pretty">
                    &ldquo;{selectedOrderListing.orderInfo.notes}&rdquo;
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => setSelectedOrderListing(null)}
                  className="flex-1 min-h-[44px] cursor-pointer"
                >
                  Tutup
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="default"
                  onClick={() => {
                    handleConfirmOrder(selectedOrderListing.id);
                    setSelectedOrderListing(null);
                  }}
                  className="flex-1 font-bold min-h-[44px] cursor-pointer gap-1.5"
                >
                  <CheckCircle2 className="size-4" />
                  <span>Konfirmasi Jadwal</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
