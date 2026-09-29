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
import { Toast } from "@/components/ui/toast";

interface PesananDetailViewProps {
  poId: string;
}

export function PesananDetailView({ poId }: PesananDetailViewProps) {
  // Ambil data PO atau fallback ke item pertama jika id tidak persis
  const initialPO =
    MOCK_CONSOLIDATED_POS.find((p) => p.id === poId) || MOCK_CONSOLIDATED_POS[0];

  const [po, setPo] = React.useState<ConsolidatedPO>(initialPO);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [driverNameInput, setDriverNameInput] = React.useState(po.driverName || "Pak Hendra (Colt Diesel)");
  const [trackingNumberInput, setTrackingNumberInput] = React.useState(po.trackingNumber || "KMPL-LOG-2026-90412");
  const [showShipModal, setShowShipModal] = React.useState(false);

  const [toast, setToast] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "info" | "error";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleAdvanceStatus = (nextStatus: POStatus, successMsg: string) => {
    setIsUpdating(true);
    setTimeout(() => {
      setPo((prev) => ({
        ...prev,
        status: nextStatus,
        driverName: nextStatus === "SHIPPED" ? driverNameInput : prev.driverName,
        trackingNumber: nextStatus === "SHIPPED" ? trackingNumberInput : prev.trackingNumber,
      }));
      setIsUpdating(false);
      setShowShipModal(false);
      setToast({
        isOpen: true,
        title: "Status PO Diperbarui",
        message: successMsg,
        type: "success",
      });
    }, 600);
  };

  const getStatusStepIndex = (status: POStatus) => {
    switch (status) {
      case "ISSUED":
        return 0;
      case "PAID_TO_ESCROW":
        return 1;
      case "PROCESSING":
        return 2;
      case "SHIPPED":
        return 3;
      case "DELIVERED":
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getStatusStepIndex(po.status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Toast
        isOpen={toast.isOpen}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Navigasi Balik & Header PO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/supplier/pesanan"
            className="text-xs font-semibold text-[#0D3B2E] hover:underline flex items-center gap-1.5 mb-1"
          >
            &larr; Kembali ke Daftar Pesanan PO
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              Rincian {po.poNumber}
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EBF5F0] text-[#0D3B2E]">
              {po.primaryDeliveryMethod === "HEMAT_HUB" ? "Opsi Hemat (Hub Konsolidasi)" : "Antar Langsung"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Diterbitkan pada {new Date(po.createdAt).toLocaleDateString("id-ID", { dateStyle: "long" })} &bull; Komoditas: {po.commodityName}
          </p>
        </div>

        {/* Tombol Aksi Cepat berdasarkan Status Saat Ini */}
        <div className="flex items-center gap-2">
          {po.status === "PAID_TO_ESCROW" && (
            <Button
              variant="primary"
              size="md"
              isLoading={isUpdating}
              onClick={() =>
                handleAdvanceStatus(
                  "PROCESSING",
                  "Pesanan ditandai sedang dikemas di gudang supplier."
                )
              }
              className="font-semibold shadow-xs"
            >
              Mulai Kemas Barang
            </Button>
          )}

          {po.status === "PROCESSING" && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowShipModal(true)}
              className="font-semibold shadow-xs"
            >
              Berangkatkan Armada Pengiriman
            </Button>
          )}

          {po.status === "SHIPPED" && (
            <Button
              variant="primary"
              size="md"
              isLoading={isUpdating}
              onClick={() =>
                handleAdvanceStatus(
                  "DELIVERED",
                  "Pesanan telah tiba di Hub Konsolidasi. Kode OTP pengambilan diterbitkan ke UMKM."
                )
              }
              className="font-semibold shadow-xs"
            >
              Konfirmasi Tiba di Hub / Tujuan
            </Button>
          )}

          {po.status === "DELIVERED" && (
            <Badge variant="success" className="text-xs px-3 py-1.5 font-bold">
              ✓ Pesanan Telah Tiba &amp; Selesai
            </Badge>
          )}
        </div>
      </div>

      {/* Stepper Status Alur Logistik Terpadu */}
      <section className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          Alur Status Pemenuhan Pesanan Konsolidasi
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className={`p-3 rounded-xl border ${currentStep >= 1 ? "bg-emerald-50/70 border-emerald-300" : "bg-neutral-50 border-neutral-200"}`}>
            <span className="text-[10px] font-bold text-emerald-800">Tahap 1</span>
            <p className="text-xs font-bold text-neutral-900 mt-0.5">Dana di Escrow</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Semua UMKM telah bayar</p>
          </div>

          <div className={`p-3 rounded-xl border ${currentStep >= 2 ? "bg-emerald-50/70 border-emerald-300" : "bg-neutral-50 border-neutral-200"}`}>
            <span className="text-[10px] font-bold text-emerald-800">Tahap 2</span>
            <p className="text-xs font-bold text-neutral-900 mt-0.5">Sedang Dikemas</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Pemeriksaan paspor mutu</p>
          </div>

          <div className={`p-3 rounded-xl border ${currentStep >= 3 ? "bg-emerald-50/70 border-emerald-300" : "bg-neutral-50 border-neutral-200"}`}>
            <span className="text-[10px] font-bold text-emerald-800">Tahap 3</span>
            <p className="text-xs font-bold text-neutral-900 mt-0.5">Dalam Pengiriman</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Armada menuju Hub / UMKM</p>
          </div>

          <div className={`p-3 rounded-xl border ${currentStep >= 4 ? "bg-emerald-50/70 border-emerald-300" : "bg-neutral-50 border-neutral-200"}`}>
            <span className="text-[10px] font-bold text-emerald-800">Tahap 4</span>
            <p className="text-xs font-bold text-neutral-900 mt-0.5">Tiba di Tujuan</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Rilis dana escrow</p>
          </div>
        </div>

        {po.trackingNumber && (
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-neutral-500">Nomor Resi / Surat Jalan:</span>{" "}
              <strong className="font-mono text-neutral-900 font-bold">{po.trackingNumber}</strong>
            </div>
            {po.driverName && (
              <div>
                <span className="text-neutral-500">Pengemudi / Armada:</span>{" "}
                <strong className="text-neutral-900 font-semibold">{po.driverName}</strong>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Dua Kolom: Info Hub Logistik & Rincian Finansial */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kolom 1: Alamat Drop Point Hub Konsolidasi */}
        <section className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0F172A]">
              Destinasi Titik Kumpul (Hub Konsolidasi)
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              Optimal Drop Point
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F8FAF8] border border-neutral-100 space-y-1.5">
            <p className="text-xs font-bold text-neutral-800">
              {po.hubName}
            </p>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {po.hubAddress}
            </p>
            <div className="pt-1 flex items-center gap-3 text-[11px] text-neutral-500">
              <span>Estimasi Tiba: <strong>{po.estimatedDeliveryDate}</strong></span>
              <span>&bull;</span>
              <span className="text-emerald-700 font-semibold">Radius Rute Hemat</span>
            </div>
          </div>
        </section>

        {/* Kolom 2: Rincian Nilai Transaksi & Escrow */}
        <section className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0F172A]">
              Rincian Pembayaran Escrow Platform
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              Terjamin Aman
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-neutral-600">
              <span>Subtotal Komoditas ({po.totalQuantity} {po.wholesaleUnit}):</span>
              <span className="font-semibold text-neutral-900">{formatCurrency(po.totalGoodsAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-600">
              <span>Total Alokasi Ongkir Konsolidasi:</span>
              <span className="font-semibold text-neutral-900">{formatCurrency(po.totalShippingAmount)}</span>
            </div>
            <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-sm">
              <span className="font-bold text-[#0F172A]">Total Dana Cair ke Supplier:</span>
              <span className="font-extrabold text-[#0D3B2E] text-base">{formatCurrency(po.grandTotalAmount)}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Manifest Distribusi Peserta Pooling UMKM (PRD Section 4) */}
      <section className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">
            Manifest Peserta Pool UMKM ({po.participants.length} Usaha Tergabung)
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Daftar UMKM yang berpartisipasi dalam pesanan PO ini beserta pembagian alokasi kuota dan ongkos kirim.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-semibold">
                <th className="py-3 px-3">Nama Usaha &amp; Kontak</th>
                <th className="py-3 px-3">Kuota Dipesan</th>
                <th className="py-3 px-3">Metode Pengiriman</th>
                <th className="py-3 px-3">Bagi Ongkir (Split-Bill)</th>
                <th className="py-3 px-3 text-right">Subtotal Belanja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {po.participants.map((part) => (
                <tr key={part.id} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="py-3 px-3">
                    <p className="font-bold text-[#0F172A]">{part.umkmName}</p>
                    <p className="text-[11px] text-neutral-500">{part.ownerName} &bull; {part.phone}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-neutral-800">{part.orderQtyUnit} {po.wholesaleUnit}</p>
                    <p className="text-[11px] text-neutral-500">{part.orderWeightKg} kg</p>
                  </td>
                  <td className="py-3 px-3">
                    {part.deliveryMethod === "HEMAT_HUB" ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200/60">
                        Opsi Hemat (Hub)
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[11px] font-semibold border border-amber-200/60">
                        Direct (Door-to-Door)
                      </span>
                    )}
                    <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">
                      {part.destinationAddress}
                    </p>
                  </td>
                  <td className="py-3 px-3 font-medium text-neutral-700">
                    {formatCurrency(part.allocatedShippingFee)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#0D3B2E]">
                    {formatCurrency(part.subtotalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Input Resi & Armada (Saat Berangkatkan Pengiriman) */}
      {showShipModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[#0F172A]">
              Berangkatkan Armada Pengiriman
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Masukkan identitas pengemudi dan nomor surat jalan untuk memantau perjalanan pesanan menuju Hub Konsolidasi.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Nomor Resi / Surat Jalan
                </label>
                <input
                  type="text"
                  value={trackingNumberInput}
                  onChange={(e) => setTrackingNumberInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-mono font-bold text-neutral-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Nama Pengemudi &amp; Jenis Armada
                </label>
                <input
                  type="text"
                  value={driverNameInput}
                  onChange={(e) => setDriverNameInput(e.target.value)}
                  placeholder="Contoh: Hendra Wijaya (Truk Colt Diesel B 9812 UI)"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShipModal(false)}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isUpdating}
                onClick={() =>
                  handleAdvanceStatus(
                    "SHIPPED",
                    "Armada berhasil diberangkatkan! Nomor resi tercatat di sistem."
                  )
                }
              >
                Konfirmasi Berangkat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
