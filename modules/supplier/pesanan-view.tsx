"use client";

import * as React from "react";
import Link from "next/link";
import {
  MOCK_CONSOLIDATED_POS,
  ConsolidatedPO,
  POStatus,
} from "@/constants/supplier";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SupplierPesananView() {
  const [orders] = React.useState<ConsolidatedPO[]>(MOCK_CONSOLIDATED_POS);
  const [activeTab, setActiveTab] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredOrders = orders.filter((po) => {
    const matchSearch =
      po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.commodityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (po.hubName && po.hubName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchTab =
      activeTab === "ALL" ||
      (activeTab === "ACTION_NEEDED" &&
        (po.status === "PAID_TO_ESCROW" || po.status === "PROCESSING")) ||
      (activeTab === "IN_TRANSIT" && po.status === "SHIPPED") ||
      (activeTab === "DELIVERED" && po.status === "DELIVERED");

    return matchSearch && matchTab;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: POStatus) => {
    switch (status) {
      case "ISSUED":
        return <Badge variant="neutral">Menunggu Pembayaran</Badge>;
      case "PAID_TO_ESCROW":
        return <Badge variant="warning">Dana Siap (Perlu Dikemas)</Badge>;
      case "PROCESSING":
        return <Badge variant="info">Sedang Dikemas</Badge>;
      case "SHIPPED":
        return <Badge variant="info">Dalam Pengiriman</Badge>;
      case "DELIVERED":
        return <Badge variant="success">Tiba di Hub / Tujuan</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
            Pesanan Terpadu (Consolidated PO)
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Daftar pesanan grosir dari hasil agregasi pooling UMKM yang telah mengunci tier diskon kuota (PRD Modul A.1).
          </p>
        </div>
      </div>

      {/* Tab Filter Status & Pencarian */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "ALL"
                  ? "bg-white text-[#0D3B2E] shadow-2xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Semua Pesanan ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ACTION_NEEDED")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "ACTION_NEEDED"
                  ? "bg-white text-[#0D3B2E] shadow-2xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Perlu Dikemas / Kirim
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("IN_TRANSIT")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "IN_TRANSIT"
                  ? "bg-white text-[#0D3B2E] shadow-2xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Dalam Pengiriman
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("DELIVERED")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "DELIVERED"
                  ? "bg-white text-[#0D3B2E] shadow-2xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Selesai / Tiba
            </button>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-72">
            <Input
              id="search-po"
              placeholder="Cari No. PO, Komoditas, Hub..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Daftar Kartu Pesanan Terpadu */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-neutral-300 p-12 text-center space-y-2">
          <p className="text-sm font-bold text-neutral-800">
            Tidak ada pesanan pada kategori ini
          </p>
          <p className="text-xs text-neutral-500">
            Pesanan baru akan muncul secara otomatis begitu kumpulan kuota pooling UMKM berstatus locked.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((po) => (
            <div
              key={po.id}
              className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs hover:border-[#0D3B2E]/30 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-extrabold text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded-md">
                    {po.poNumber}
                  </span>
                  {getStatusBadge(po.status)}
                  <span className="text-[11px] font-semibold text-neutral-500">
                    Diterbitkan: {new Date(po.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-neutral-500">
                    Skema Logistik:
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EBF5F0] text-[#0D3B2E]">
                    {po.primaryDeliveryMethod === "HEMAT_HUB" ? "Opsi Hemat (Drop Point Hub)" : "Antar Langsung"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Info Komoditas & Kuota Teragregasi */}
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold">Komoditas Dipesan</span>
                  <h2 className="text-base font-bold text-[#0F172A] leading-snug">
                    {po.commodityName}
                  </h2>
                  <p className="text-xs text-neutral-600 mt-1">
                    Volume: <strong className="text-neutral-900">{po.totalQuantity} {po.wholesaleUnit}</strong> ({po.totalWeightKg} kg)
                  </p>
                  <p className="text-[11px] text-[#B45309] font-medium">
                    Harga Grosir Terkunci: {formatCurrency(po.lockedTierPrice)}/{po.wholesaleUnit}
                  </p>
                </div>

                {/* Destinasi Pengiriman & Peserta Pool */}
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold">Tujuan Pengiriman</span>
                  <p className="text-xs font-bold text-neutral-800">
                    {po.hubName || "Alamat Direct UMKM"}
                  </p>
                  <p className="text-[11px] text-neutral-500 line-clamp-2">
                    {po.hubAddress}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-semibold pt-1">
                    {po.participants.length} UMKM Anggota Patungan Tergabung
                  </p>
                </div>

                {/* Nilai Transaksi Escrow & Tombol Aksi */}
                <div className="flex flex-col justify-between items-start md:items-end gap-3 pt-2 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">Total Nilai Pesanan PO</span>
                    <p className="text-lg font-extrabold text-[#0D3B2E]">
                      {formatCurrency(po.grandTotalAmount)}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Sudah ditahan di Escrow Platform
                    </p>
                  </div>

                  <Link href={`/supplier/pesanan/${po.id}`} className="w-full md:w-auto">
                    <Button variant="primary" size="sm" className="w-full font-semibold min-h-[38px]">
                      Buka Rincian &amp; Manifest
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
