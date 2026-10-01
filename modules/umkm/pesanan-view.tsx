"use client";

import * as React from "react";
import Link from "next/link";
import {
  MOCK_UMKM_PURCHASE_HISTORY,
  MOCK_UMKM_PROFILE,
  type UMKMPurchaseHistory,
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

type OrderStatusFilter = "SEMUA" | "TIBA_DI_HUB" | "DIPROSES_SUPPLIER" | "SELESAI";

export function UmkmPesananView() {
  const [selectedFilter, setSelectedFilter] = React.useState<OrderStatusFilter>("SEMUA");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTicket, setSelectedTicket] = React.useState<UMKMPurchaseHistory | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = React.useState(false);

  const filteredOrders = React.useMemo(() => {
    return MOCK_UMKM_PURCHASE_HISTORY.filter((order) => {
      const matchSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.commodityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.hubPickupCode && order.hubPickupCode.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchFilter =
        selectedFilter === "SEMUA" || order.status === selectedFilter;

      return matchSearch && matchFilter;
    });
  }, [selectedFilter, searchQuery]);

  const totalSavings = MOCK_UMKM_PURCHASE_HISTORY.reduce(
    (acc, curr) => acc + curr.savingsAmount,
    0
  );
  const readyAtHubCount = MOCK_UMKM_PURCHASE_HISTORY.filter(
    (o) => o.status === "TIBA_DI_HUB"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-text-muted">
              Manajemen Logistik &amp; Pengambilan Bahan
            </span>
          </div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary mt-1">
            Pesanan Pooling Saya
          </h1>
          <p className="font-body text-xs sm:text-sm text-text-secondary mt-1">
            Pantau status agregasi kuota, verifikasi paspor mutu di Hub Konsolidasi, dan ambil barang dengan tiket QR resmi.
          </p>
        </div>

        <Link href="/umkm" className="shrink-0">
          <Button variant="primary" size="md" className="font-semibold min-h-[44px]">
            + Gabung Pool Baru
          </Button>
        </Link>
      </div>

      {/* Tab Filter Status & Pencarian */}
      <Card className="p-4 sm:p-5 shadow-elevation-1 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor pesanan, komoditas, atau kode hub..."
              className="w-full h-11 pl-4 text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-text-muted shrink-0">
            <span>Total Penghematan:</span>
            <strong className="text-success font-extrabold tabular-nums">
              {formatCurrency(totalSavings)}
            </strong>
          </div>
        </div>

        {/* Tab Pills Status Bergaya Watermelon UI */}
        <div className="flex items-center gap-1.5 p-1 bg-background rounded-xl border border-border overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setSelectedFilter("SEMUA")}
            className={`min-h-[36px] px-3.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              selectedFilter === "SEMUA"
                ? "bg-surface text-primary shadow-[inset_0_1px_0_#FFFFFF,inset_0_-1px_0_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.06)] font-bold border border-border"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
            }`}
          >
            Semua Pesanan ({MOCK_UMKM_PURCHASE_HISTORY.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter("TIBA_DI_HUB")}
            className={`min-h-[36px] px-3.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center gap-1.5 ${
              selectedFilter === "TIBA_DI_HUB"
                ? "bg-surface text-primary shadow-[inset_0_1px_0_#FFFFFF,inset_0_-1px_0_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.06)] font-bold border border-border"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Siap Diambil di Hub ({readyAtHubCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter("DIPROSES_SUPPLIER")}
            className={`min-h-[36px] px-3.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              selectedFilter === "DIPROSES_SUPPLIER"
                ? "bg-surface text-primary shadow-[inset_0_1px_0_#FFFFFF,inset_0_-1px_0_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.06)] font-bold border border-border"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
            }`}
          >
            Diproses Supplier
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter("SELESAI")}
            className={`min-h-[36px] px-3.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              selectedFilter === "SELESAI"
                ? "bg-surface text-primary shadow-[inset_0_1px_0_#FFFFFF,inset_0_-1px_0_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.06)] font-bold border border-border"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
            }`}
          >
            Selesai Diterima
          </button>
        </div>
      </Card>

      {/* List Pesanan Cards */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="p-12 text-center rounded-2xl shadow-elevation-1 space-y-3">
            <p className="font-heading text-sm font-bold text-text-primary">Tidak ada pesanan pada filter ini.</p>
            <Button asChild variant="primary" size="sm" className="font-bold">
              <Link href="/umkm">Jelajahi Radar Pooling</Link>
            </Button>
          </Card>
        ) : (
          filteredOrders.map((order) => {
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
                      <Badge variant="success" className="font-bold text-xs py-1 px-3 gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
                        className="font-bold min-h-[38px]"
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

      {/* Modal Tiket Pickup Hub */}
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
