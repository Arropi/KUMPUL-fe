"use client";

import * as React from "react";
import Link from "next/link";
import {
  MOCK_SUPPLIER_PROFILE,
  MOCK_SUPPLIER_COMMODITIES,
  MOCK_CONSOLIDATED_POS,
  MOCK_LIVE_DEMAND_POOLS,
  ConsolidatedPO,
} from "@/constants/supplier";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function SupplierDashboardView() {
  const [orders] = React.useState<ConsolidatedPO[]>(MOCK_CONSOLIDATED_POS);
  const commodities = MOCK_SUPPLIER_COMMODITIES;
  const livePools = MOCK_LIVE_DEMAND_POOLS;

  // Kalkulasi ringkasan metrik
  const activeOrdersCount = orders.filter(
    (o) => o.status === "PAID_TO_ESCROW" || o.status === "PROCESSING" || o.status === "SHIPPED"
  ).length;

  const totalWeightInFulfillment = orders
    .filter((o) => o.status !== "DELIVERED")
    .reduce((acc, curr) => acc + curr.totalWeightKg, 0);

  const totalEscrowAmount = orders
    .filter((o) => o.status !== "DELIVERED")
    .reduce((acc, curr) => acc + curr.grandTotalAmount, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: ConsolidatedPO["status"]) => {
    switch (status) {
      case "PAID_TO_ESCROW":
        return <Badge variant="warning">Dana Siap (Perlu Dikemas)</Badge>;
      case "PROCESSING":
        return <Badge variant="info">Sedang Dikemas</Badge>;
      case "SHIPPED":
        return <Badge variant="info">Dalam Pengiriman</Badge>;
      case "DELIVERED":
        return <Badge variant="success">Tiba di Tujuan</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Sambutan & Aksi Utama */}
      <section className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-7 shadow-[0_4px_24px_rgb(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              Dashboard Operasional Pasokan
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF5F0] text-[#0D3B2E]">
              {MOCK_SUPPLIER_PROFILE.legalName}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl leading-relaxed">
            Pantau pesanan terpadu (Consolidated PO) dari patungan UMKM, kelola kuota komoditas hulu, dan validasi paspor mutu pengiriman.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/supplier/katalog/tambah">
            <Button variant="primary" size="md" className="font-semibold shadow-xs">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Tambah Pasokan
            </Button>
          </Link>
          <Link href="/supplier/pesanan">
            <Button variant="outline" size="md" className="font-semibold">
              Lihat Semua PO
            </Button>
          </Link>
        </div>
      </section>

      {/* Grid 4 Kartu KPI Metrik Utama */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">PO Siap Proses</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-[#B45309] flex items-center justify-center font-bold text-xs">
              PO
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A] tracking-tight">{activeOrdersCount} Pesanan</p>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5">
              Terkunci dari akumulasi pooling UMKM
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Volume Terjadwal</span>
            <span className="w-8 h-8 rounded-xl bg-[#EBF5F0] text-[#0D3B2E] flex items-center justify-center font-bold text-xs">
              KG
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A] tracking-tight">
              {totalWeightInFulfillment.toLocaleString("id-ID")} kg
            </p>
            <p className="text-[11px] text-[#0D3B2E] font-medium mt-0.5">
              {(totalWeightInFulfillment / 1000).toFixed(1)} ton komoditas aktif
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Dana Escrow Tertahan</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              Rp
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A] tracking-tight">
              {formatCurrency(totalEscrowAmount)}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
              Aman di platform, rilis pasca terima
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Kepatuhan Mutu</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
              QA
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A] tracking-tight">98% Lolos</p>
            <p className="text-[11px] text-blue-700 font-medium mt-0.5">
              4/4 komoditas terverifikasi sertifikasi
            </p>
          </div>
        </div>
      </section>

      {/* Radar Permintaan Pooling Terkini (Demand Alert) */}
      <section className="bg-linear-to-r from-[#0D3B2E] to-[#145A46] rounded-2xl p-6 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-emerald-200 text-[11px] font-semibold mb-1.5 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Radar Pooling Aktif (Geolokasi Terdekat)
            </div>
            <h2 className="text-lg font-bold tracking-tight">
              Kelompok UMKM Sedang Mengumpulkan Kuota Komoditas Anda
            </h2>
            <p className="text-xs text-emerald-100 max-w-xl mt-0.5 leading-relaxed">
              Pesanan ini otomatis menjadi pesanan grosir utuh begitu batas MOQ tercapai. Pantau ketersediaan stok Anda di gudang.
            </p>
          </div>
          <Link href="/supplier/katalog">
            <span className="inline-block text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3.5 py-2 rounded-xl transition-colors cursor-pointer text-center">
              Periksa Stok Gudang
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {livePools.map((pool) => {
            const percentage = Math.min(Math.round((pool.accumulatedKg / pool.targetMoqKg) * 100), 100);
            return (
              <div
                key={pool.id}
                className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-sm text-white line-clamp-1">
                      {pool.commodityName}
                    </h3>
                    <p className="text-[11px] text-emerald-200 mt-0.5">
                      {pool.hubCandidateArea}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-neutral-900 shrink-0">
                    Sisa {pool.hoursRemaining} Jam
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-100">
                      Terkumpul: <strong className="text-white font-bold">{pool.accumulatedKg} kg</strong> / {pool.targetMoqKg} kg
                    </span>
                    <span className="font-extrabold text-white">{percentage}%</span>
                  </div>
                  <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-emerald-200/90 text-right">
                    Didukung oleh {pool.participantsCount} UMKM lokal
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dua Kolom: Tabel PO Mendesak & Ringkasan Katalog */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri (2 Kolom): Daftar Consolidated PO Perlu Tindakan */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">
                Pesanan Terpadu Masuk (Consolidated PO)
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Pesanan dari hasil agregasi pooling yang siap diproses logistiknya.
              </p>
            </div>
            <Link
              href="/supplier/pesanan"
              className="text-xs font-semibold text-[#0D3B2E] hover:underline"
            >
              Lihat Semua ({orders.length})
            </Link>
          </div>

          <div className="divide-y divide-neutral-100">
            {orders.slice(0, 3).map((po) => (
              <div key={po.id} className="py-4 first:pt-2 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-neutral-800">
                      {po.poNumber}
                    </span>
                    {getStatusBadge(po.status)}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                      {po.primaryDeliveryMethod === "HEMAT_HUB" ? "Opsi Hemat (Hub)" : "Antar Langsung"}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#0F172A]">
                    {po.commodityName}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Total: <strong className="text-neutral-700">{po.totalQuantity} {po.wholesaleUnit}</strong> ({po.totalWeightKg} kg) &bull; {po.participants.length} UMKM Tergabung
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Lokasi: {po.hubName || "Alamat Direct UMKM"}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-[#0D3B2E]">
                    {formatCurrency(po.grandTotalAmount)}
                  </span>
                  <Link href={`/supplier/pesanan/${po.id}`}>
                    <Button variant="outline" size="sm" className="font-semibold text-xs min-h-[36px]">
                      Detail &amp; Manifest
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Kolom Kanan (1 Kolom): Status Pasokan Katalog & Stok */}
        <section className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Katalog Pasokan</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Stok &amp; kuota aktif</p>
            </div>
            <Link
              href="/supplier/katalog"
              className="text-xs font-semibold text-[#0D3B2E] hover:underline"
            >
              Kelola
            </Link>
          </div>

          <div className="space-y-3">
            {commodities.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-neutral-800 line-clamp-1">
                    {item.name}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      item.isActive ? "bg-emerald-500" : "bg-neutral-300"
                    }`}
                    title={item.isActive ? "Aktif di Katalog" : "Nonaktif"}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Stok: <strong>{item.availableStock} {item.wholesaleUnit}</strong></span>
                  <span className="text-[#B45309] font-medium">
                    MOQ: {item.baseMoq} {item.wholesaleUnit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-100">
                  <span>Suhu: {item.batchTag.storageTemperature}</span>
                  <span className="text-emerald-700 font-semibold">Tersertifikasi Mutu</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link href="/supplier/katalog/tambah" className="block">
              <Button variant="secondary" size="sm" className="w-full font-semibold text-xs min-h-[40px]">
                + Tambah Komoditas Baru
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
