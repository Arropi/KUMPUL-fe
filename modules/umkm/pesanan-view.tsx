"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MOCK_UMKM_PURCHASE_HISTORY,
  MOCK_UMKM_PROFILE,
  MOCK_WASTE_SALES_ORDERS,
  type UMKMPurchaseHistory,
  type WasteSaleOrder,
} from "@/constants/umkm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingBag,
  Recycle,
  Clock,
  CheckCircle2,
  Calendar,
  Phone,
  ChefHat,
  Search,
  Plus,
} from "lucide-react";

type MainTab = "pembelian" | "penjualan";
type PurchaseStatusFilter = "SEMUA" | "TIBA_DI_HUB" | "DIPROSES_SUPPLIER" | "SELESAI";
type SaleStatusFilter = "SEMUA" | "MENUNGGU_DIAMBIL" | "SELESAI";

export function UmkmPesananView() {
  const searchParams = useSearchParams();

  // Tab Utama: Pembelian (Pooling Bahan Baku) vs Penjualan (Limbah Dapur)
  const [activeMainTab, setActiveMainTab] = React.useState<MainTab>("pembelian");

  // Deteksi query param ?tab=penjualan-limbah
  React.useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "penjualan-limbah" || tabParam === "penjualan") {
      setActiveMainTab("penjualan");
    } else if (tabParam === "pembelian") {
      setActiveMainTab("pembelian");
    }
  }, [searchParams]);

  // State Tab 1: Pembelian Bahan Baku (Pooling)
  const [purchaseFilter, setPurchaseFilter] = React.useState<PurchaseStatusFilter>("SEMUA");
  const [purchaseSearchQuery, setPurchaseSearchQuery] = React.useState("");
  const [selectedTicket, setSelectedTicket] = React.useState<UMKMPurchaseHistory | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = React.useState(false);

  // State Tab 2: Penjualan Limbah Saya
  const [saleFilter, setSaleFilter] = React.useState<SaleStatusFilter>("SEMUA");
  const [saleSearchQuery, setSaleSearchQuery] = React.useState("");

  // Data Filtering Tab 1
  const filteredPurchases = React.useMemo(() => {
    return MOCK_UMKM_PURCHASE_HISTORY.filter((order) => {
      const matchSearch =
        order.orderNumber.toLowerCase().includes(purchaseSearchQuery.toLowerCase()) ||
        order.commodityName.toLowerCase().includes(purchaseSearchQuery.toLowerCase()) ||
        (order.hubPickupCode && order.hubPickupCode.toLowerCase().includes(purchaseSearchQuery.toLowerCase()));

      const matchFilter =
        purchaseFilter === "SEMUA" || order.status === purchaseFilter;

      return matchSearch && matchFilter;
    });
  }, [purchaseFilter, purchaseSearchQuery]);

  const totalSavings = MOCK_UMKM_PURCHASE_HISTORY.reduce(
    (acc, curr) => acc + curr.savingsAmount,
    0
  );
  const readyAtHubCount = MOCK_UMKM_PURCHASE_HISTORY.filter(
    (o) => o.status === "TIBA_DI_HUB"
  ).length;

  // Data Filtering Tab 2
  const filteredSales = React.useMemo(() => {
    return MOCK_WASTE_SALES_ORDERS.filter((order) => {
      const matchSearch =
        order.orderNumber.toLowerCase().includes(saleSearchQuery.toLowerCase()) ||
        order.listingTitle.toLowerCase().includes(saleSearchQuery.toLowerCase()) ||
        order.buyerName.toLowerCase().includes(saleSearchQuery.toLowerCase()) ||
        (order.buyerPhone && order.buyerPhone.includes(saleSearchQuery));

      const matchFilter =
        saleFilter === "SEMUA" || order.status === saleFilter;

      return matchSearch && matchFilter;
    });
  }, [saleFilter, saleSearchQuery]);

  const waitingPickupSalesCount = MOCK_WASTE_SALES_ORDERS.filter(
    (o) => o.status === "MENUNGGU_DIAMBIL"
  ).length;
  const completedSalesCount = MOCK_WASTE_SALES_ORDERS.filter(
    (o) => o.status === "SELESAI"
  ).length;
  const totalCompletedRevenue = MOCK_WASTE_SALES_ORDERS.filter(
    (o) => o.status === "SELESAI"
  ).reduce((acc, curr) => acc + curr.totalPrice, 0);

  return (
    <div className="space-y-6">
      {/* 1. TOP-LEVEL TAB SWITCHER: Pembelian vs Penjualan (Mirip Shopee/Tokopedia: Beli vs Jual) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-heading text-xs font-semibold text-text-muted">
              Pusat Manajemen Transaksi UMKM
            </span>
          </div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary mt-1">
            Pesanan &amp; Transaksi Saya
          </h1>
          <p className="font-sans text-xs sm:text-sm text-text-secondary mt-1">
            Pantau pengadaan bahan baku yang Anda beli lewat pooling, serta transaksi limbah dapur yang dibeli oleh sesama UMKM.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1.5 bg-surface-subtle rounded-2xl border border-border/80 shadow-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMainTab("pembelian")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeMainTab === "pembelian"
                ? "bg-surface text-primary shadow-elevation-1 border border-border/70"
                : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
            }`}
          >
            <ShoppingBag className="size-4 text-primary" />
            <span>Pembelian Bahan Baku (Pooling)</span>
            <span className="text-[10px] py-0.5 px-2 rounded-full bg-primary/10 text-primary font-bold">
              {MOCK_UMKM_PURCHASE_HISTORY.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("penjualan")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeMainTab === "penjualan"
                ? "bg-surface text-circular-waste shadow-elevation-1 border border-border/70"
                : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
            }`}
          >
            <Recycle className="size-4 text-circular-waste" />
            <span>Penjualan Limbah Saya</span>
            <span className="text-[10px] py-0.5 px-2 rounded-full bg-circular-waste/15 text-circular-waste font-bold">
              {MOCK_WASTE_SALES_ORDERS.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TAB KONTEN 1: PEMBELIAN BAHAN BAKU (POOLING)                           */}
      {/* ========================================================================= */}
      {activeMainTab === "pembelian" && (
        <div className="space-y-6">
          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-text-primary">
                Daftar Pesanan Bahan Baku (Pooling)
              </h2>
              <p className="font-sans text-xs text-text-secondary mt-0.5">
                Status agregasi kuota, verifikasi paspor mutu di Hub Konsolidasi, dan pengambilan dengan tiket QR resmi.
              </p>
            </div>

            <Link href="/katalog" className="shrink-0">
              <Button variant="primary" size="default" className="font-bold min-h-[42px] gap-1.5 shadow-elevation-1">
                <Plus className="size-4" />
                <span>+ Gabung Pool Baru</span>
              </Button>
            </Link>
          </div>

          {/* Filter & Search Tab 1 */}
          <Card className="p-4 sm:p-5 shadow-elevation-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="size-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="text"
                  value={purchaseSearchQuery}
                  onChange={(e) => setPurchaseSearchQuery(e.target.value)}
                  placeholder="Cari nomor pesanan, komoditas, atau kode hub..."
                  className="w-full h-11 pl-10 text-xs sm:text-sm rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-text-muted shrink-0">
                <span>Total Penghematan:</span>
                <strong className="text-emerald-700 font-extrabold tabular-nums">
                  {formatCurrency(totalSavings)}
                </strong>
              </div>
            </div>

            {/* Tab Pills Status Bergaya Watermelon UI */}
            <div className="flex items-center gap-1.5 p-1 bg-surface-subtle rounded-xl border border-border overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setPurchaseFilter("SEMUA")}
                className={`min-h-[36px] px-3.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  purchaseFilter === "SEMUA"
                    ? "bg-surface text-primary shadow-xs font-bold border border-border"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                }`}
              >
                Semua Pesanan ({MOCK_UMKM_PURCHASE_HISTORY.length})
              </button>

              <button
                type="button"
                onClick={() => setPurchaseFilter("TIBA_DI_HUB")}
                className={`min-h-[36px] px-3.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  purchaseFilter === "TIBA_DI_HUB"
                    ? "bg-surface text-primary shadow-xs font-bold border border-border"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                }`}
              >
                <span>Siap Diambil di Hub ({readyAtHubCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setPurchaseFilter("DIPROSES_SUPPLIER")}
                className={`min-h-[36px] px-3.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  purchaseFilter === "DIPROSES_SUPPLIER"
                    ? "bg-surface text-primary shadow-xs font-bold border border-border"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                }`}
              >
                Diproses Supplier
              </button>

              <button
                type="button"
                onClick={() => setPurchaseFilter("SELESAI")}
                className={`min-h-[36px] px-3.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  purchaseFilter === "SELESAI"
                    ? "bg-surface text-primary shadow-xs font-bold border border-border"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                }`}
              >
                Selesai Diterima
              </button>
            </div>
          </Card>

          {/* List Pesanan Cards */}
          <div className="space-y-4">
            {filteredPurchases.length === 0 ? (
              <Card className="p-12 text-center rounded-2xl shadow-elevation-1 space-y-3">
                <p className="font-heading text-sm font-bold text-text-primary">Tidak ada pesanan pada filter ini.</p>
                <Button asChild variant="primary" size="sm" className="font-bold">
                  <Link href="/katalog">Jelajahi Radar Pooling</Link>
                </Button>
              </Card>
            ) : (
              filteredPurchases.map((order) => {
                const isReady = order.status === "TIBA_DI_HUB";
                const isProcessing = order.status === "DIPROSES_SUPPLIER";
                const isDone = order.status === "SELESAI";

                return (
                  <Card
                    key={order.id}
                    className="overflow-hidden rounded-2xl border-border bg-surface shadow-elevation-1 p-5 sm:p-6 space-y-4 transition-all duration-200 hover:shadow-elevation-2"
                  >
                    {/* Header Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-text-primary">
                            {order.orderNumber}
                          </span>
                          <span className="text-xs text-text-muted">&bull; {order.orderDate}</span>
                        </div>
                        <h3 className="font-heading text-base font-bold text-text-primary">{order.commodityName}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        {isReady && (
                          <Badge variant="success" className="font-bold text-xs py-1 px-3">
                            Siap Ambil di Hub
                          </Badge>
                        )}
                        {isProcessing && (
                          <Badge variant="warning" className="font-bold text-xs py-1 px-3">
                            Diproses Supplier
                          </Badge>
                        )}
                        {isDone && (
                          <Badge variant="secondary" className="font-bold text-xs py-1 px-3">
                            Selesai
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Grid Rincian Finansial & Volume */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-surface-subtle border border-border/70 space-y-1">
                        <span className="text-text-muted">Volume Pesanan:</span>
                        <p className="font-bold text-text-primary text-sm tabular-nums">
                          {order.volumeKg} kg ({order.unit})
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-surface-subtle border border-border/70 space-y-1">
                        <span className="text-text-muted">Total Bayar Grosir:</span>
                        <p className="font-bold text-primary text-sm tabular-nums">
                          {formatCurrency(order.totalWholesalePaid)}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-surface-subtle border border-border/70 space-y-1">
                        <span className="text-text-muted">Harga Pasar Eceran:</span>
                        <p className="font-medium text-text-muted text-sm line-through tabular-nums">
                          {formatCurrency(order.marketPriceComparison)}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                        <span className="text-emerald-800 font-semibold">Kamu Menghemat:</span>
                        <p className="font-extrabold text-emerald-700 text-sm tabular-nums">
                          {formatCurrency(order.savingsAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Rincian Titik Pengambilan Hub & Aksi Tiket */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                      <div className="text-xs text-text-muted">
                        Lokasi Hub: <strong className="text-text-primary">{MOCK_UMKM_PROFILE.preferredHubName}</strong>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {order.hubPickupCode ? (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedTicket(order);
                              setIsTicketModalOpen(true);
                            }}
                            className="font-bold min-h-[38px] cursor-pointer"
                          >
                            Tampilkan Tiket Pickup Hub
                          </Button>
                        ) : (
                          <span className="text-xs text-text-muted italic">
                            Menunggu kuota pool terkunci penuh
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB KONTEN 2: PENJUALAN LIMBAH SAYA (P2P PICK-UP MANDIRI OLEH PEMBELI)  */}
      {/* ========================================================================= */}
      {activeMainTab === "penjualan" && (
        <div className="space-y-6">
          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-text-primary flex items-center gap-2">
                <Recycle className="size-5 text-circular-waste" />
                <span>Pesanan Penjualan Limbah Dapur</span>
              </h2>
              <p className="font-sans text-xs text-text-secondary mt-0.5">
                Pantau pemesanan residu dapur oleh sesama UMKM yang datang mengambil mandiri ke dapur Anda. Saldo otomatis masuk begitu pembeli mengonfirmasi penerimaan.
              </p>
            </div>

            <Link href="/limbah" className="shrink-0">
              <Button variant="primary" size="default" className="font-bold min-h-[42px] gap-1.5 shadow-elevation-1">
                <Plus className="size-4" />
                <span>+ Pasang Listing Baru</span>
              </Button>
            </Link>
          </div>

          {/* Filter & Search Tab 2 */}
          <Card className="p-4 sm:p-5 shadow-elevation-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="size-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="text"
                  value={saleSearchQuery}
                  onChange={(e) => setSaleSearchQuery(e.target.value)}
                  placeholder="Cari nama pembeli, judul limbah, atau nomor kontak..."
                  className="w-full h-11 pl-10 text-xs sm:text-sm rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-text-muted shrink-0">
                <span>Saldo Penjualan Selesai:</span>
                <strong className="text-circular-waste font-extrabold tabular-nums">
                  +{formatCurrency(totalCompletedRevenue)}
                </strong>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-surface-subtle rounded-xl border border-border overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setSaleFilter("SEMUA")}
                className={`min-h-[36px] px-3.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  saleFilter === "SEMUA"
                    ? "bg-surface text-circular-waste shadow-xs font-bold border border-border"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                }`}
              >
                Semua Pesanan ({MOCK_WASTE_SALES_ORDERS.length})
              </button>

              <button
                type="button"
                onClick={() => setSaleFilter("MENUNGGU_DIAMBIL")}
                className={`min-h-[36px] px-3.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  saleFilter === "MENUNGGU_DIAMBIL"
                    ? "bg-accent-light text-accent shadow-xs font-bold border border-accent/20"
                    : "text-amber-800 hover:text-amber-900 hover:bg-surface/50"
                }`}
              >
                <Clock className="size-3" />
                <span>Menunggu Pembeli Mengambil ({waitingPickupSalesCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSaleFilter("SELESAI")}
                className={`min-h-[36px] px-3.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  saleFilter === "SELESAI"
                    ? "bg-surface text-emerald-700 shadow-xs font-bold border border-border"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                }`}
              >
                <CheckCircle2 className="size-3" />
                <span>Selesai (Saldo Masuk) ({completedSalesCount})</span>
              </button>
            </div>
          </Card>

          {/* List Pesanan Penjualan Limbah */}
          <div className="space-y-4">
            {filteredSales.length === 0 ? (
              <Card className="p-12 text-center rounded-2xl shadow-elevation-1 space-y-3">
                <Recycle className="size-8 text-text-muted mx-auto" />
                <p className="font-heading text-sm font-bold text-text-primary">
                  Tidak ada pesanan penjualan limbah pada filter ini.
                </p>
                <Button asChild variant="primary" size="sm" className="font-bold">
                  <Link href="/limbah">Kelola Listing Limbah</Link>
                </Button>
              </Card>
            ) : (
              filteredSales.map((order) => {
                const isWaiting = order.status === "MENUNGGU_DIAMBIL";
                const isCompleted = order.status === "SELESAI";

                return (
                  <Card
                    key={order.id}
                    className={`overflow-hidden rounded-2xl bg-surface shadow-elevation-1 p-5 sm:p-6 space-y-4 transition-all duration-200 hover:shadow-elevation-2 ${
                      isWaiting
                        ? "border-2 border-amber-300 bg-amber-50/10 ring-1 ring-amber-300/30"
                        : "border border-border"
                    }`}
                  >
                    {/* Header Card: Nomor Pesanan & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-text-primary">
                            {order.orderNumber}
                          </span>
                          <span className="text-xs text-text-muted">&bull; Dipesan pada: {order.orderDate}</span>
                        </div>
                        <h3 className="font-heading text-base font-bold text-text-primary">
                          {order.listingTitle}
                        </h3>
                      </div>

                      <div>
                        {isWaiting ? (
                          <Badge variant="accent" className="font-bold text-xs py-1 px-3 gap-1.5">
                            <Clock className="size-3 text-amber-700" />
                            <span>Menunggu Pembeli Mengambil</span>
                          </Badge>
                        ) : (
                          <Badge variant="success" className="font-bold text-xs py-1 px-3 gap-1.5">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            <span>Selesai &bull; Saldo Masuk</span>
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Content Body: Detail Limbah & Info Pembeli */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Kolom Kiri: Produk Limbah & Nilai Transaksi */}
                      <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-surface-subtle border border-border/70">
                        {order.listingImageUrl ? (
                          <img
                            src={order.listingImageUrl}
                            alt={order.listingTitle}
                            className="size-16 sm:size-18 rounded-xl object-cover shrink-0 border border-border"
                          />
                        ) : (
                          <div className="size-16 sm:size-18 rounded-xl bg-circular-waste-light border border-circular-waste/20 flex items-center justify-center shrink-0 text-circular-waste">
                            <Recycle className="size-6" />
                          </div>
                        )}

                        <div className="space-y-1 text-xs">
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                            {order.listingCategory || "Residu Dapur"}
                          </span>
                          <p className="font-heading font-bold text-sm text-text-primary">
                            Volume: {order.orderedVolume} {order.orderedUnit}
                          </p>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-text-secondary">Total Nilai:</span>
                            <strong className="text-circular-waste font-bold text-sm tabular-nums">
                              {formatCurrency(order.totalPrice)}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Kolom Kanan: Rincian Pembeli & Jadwal Pick-Up */}
                      <div className="p-3.5 rounded-xl bg-surface-subtle border border-border/70 space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="text-text-muted text-[11px] block">Profil Pembeli:</span>
                            <strong className="font-heading font-bold text-text-primary block">
                              {order.buyerName}
                            </strong>
                            <span className="text-[11px] text-text-secondary font-medium">
                              ({order.buyerType})
                            </span>
                          </div>

                          {order.buyerPhone && (
                            <div className="text-right">
                              <span className="text-text-muted text-[10px] block">Kontak Pembeli:</span>
                              <span className="font-mono text-xs font-bold text-text-primary flex items-center gap-1 justify-end mt-0.5">
                                <Phone className="size-3 text-text-muted" />
                                {order.buyerPhone}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                          <span className="text-text-muted flex items-center gap-1">
                            <Calendar className="size-3 text-accent" />
                            Rencana Pick-Up:
                          </span>
                          <strong className="text-text-primary font-bold">
                            {order.pickupScheduledDate}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Catatan Pembeli jika ada */}
                    {order.notes && (
                      <div className="p-3 rounded-xl bg-surface border border-border/60 text-xs text-text-secondary italic">
                        Catatan Pembeli: &ldquo;{order.notes}&rdquo;
                      </div>
                    )}

                    {/* Status Notice Banner */}
                    <div>
                      {isWaiting ? (
                        <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                          <Clock className="size-4 text-amber-700 shrink-0 mt-0.5" />
                          <div className="leading-snug">
                            <strong>Menunggu Kedatangan Pembeli:</strong>
                            <p className="mt-0.5 text-amber-800">
                              Pembeli akan datang langsung ke dapur Anda ({order.location}) sesuai jadwal di atas. Begitu pembeli mengambil dan menekan konfirmasi terima di aplikasinya, saldo sebesar <strong>{formatCurrency(order.totalPrice)}</strong> akan otomatis cair ke saldo kas Anda.
                            </p>
                          </div>
                        </div>
                      ) : isCompleted ? (
                        <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                          <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="leading-snug">
                            <strong>Transaksi Selesai &amp; Saldo Telah Cair:</strong>
                            <p className="mt-0.5 text-emerald-800">
                              Pembeli telah mengonfirmasi pengambilan barang ini. Dana penjualan sebesar <strong>{formatCurrency(order.totalPrice)}</strong> telah sukses masuk ke saldo kas Anda.
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal Tiket Pickup Hub (Untuk Tab Pembelian Pooling) */}
      <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 text-center">
          {selectedTicket && (
            <div className="space-y-5">
              <DialogHeader className="text-center sm:text-center">
                <DialogTitle className="font-heading text-lg font-bold text-text-primary">
                  Tiket Pengambilan Hub Konsolidasi
                </DialogTitle>
                <DialogDescription className="text-xs text-text-muted mt-1">
                  Tunjukkan kode atau QR ini kepada petugas Hub KUMPUL saat serah-terima barang.
                </DialogDescription>
              </DialogHeader>

              {/* Box Kode Pickup & Mock QR Code */}
              <div className="p-6 rounded-2xl bg-surface-subtle border-2 border-dashed border-primary/40 space-y-4">
                <div className="w-36 h-36 mx-auto bg-white p-3 rounded-xl shadow-xs border border-border flex flex-col items-center justify-center">
                  <div className="grid grid-cols-5 gap-1.5 w-full h-full p-2 bg-slate-900 rounded-lg">
                    <div className="bg-white rounded-xs col-span-2 row-span-2" />
                    <div className="bg-slate-900" />
                    <div className="bg-white rounded-xs col-span-2 row-span-2" />
                    <div className="bg-white rounded-xs" />
                    <div className="bg-white rounded-xs" />
                    <div className="bg-white rounded-xs col-span-2 row-span-2" />
                    <div className="bg-white rounded-xs" />
                    <div className="bg-white rounded-xs col-span-2 row-span-2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-text-muted">Kode Verifikasi Petugas:</span>
                  <p className="font-mono text-2xl font-black text-primary tracking-widest">
                    {selectedTicket.hubPickupCode}
                  </p>
                </div>
              </div>

              {/* Rincian Komoditas & Lokasi */}
              <div className="p-4 rounded-xl bg-surface border border-border text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-muted">Komoditas:</span>
                  <span className="font-bold text-text-primary">{selectedTicket.commodityName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Volume:</span>
                  <span className="font-bold text-text-primary tabular-nums">{selectedTicket.volumeKg} kg ({selectedTicket.unit})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Hub Konsolidasi:</span>
                  <span className="font-semibold text-text-primary">{MOCK_UMKM_PROFILE.preferredHubName}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="default"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="w-full font-bold min-h-[44px]"
                >
                  Tutup Tiket
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
