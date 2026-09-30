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
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getStatusStepIndex } from "./helpers";

interface PesananDetailViewProps {
  poId: string;
}

export function PesananDetailView({ poId }: PesananDetailViewProps) {
  const initialPO =
    MOCK_CONSOLIDATED_POS.find((p) => p.id === poId) || MOCK_CONSOLIDATED_POS[0];

  const [po, setPo] = React.useState<ConsolidatedPO>(initialPO);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [driverNameInput, setDriverNameInput] = React.useState(po.driverName || "Pak Hendra (Colt Diesel)");
  const [trackingNumberInput, setTrackingNumberInput] = React.useState(po.trackingNumber || "KMPL-LOG-2026-90412");
  const [showShipModal, setShowShipModal] = React.useState(false);

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
      toast.success(successMsg, "Status PO Diperbarui");
    }, 600);
  };

  const currentStep = getStatusStepIndex(po.status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Navigasi Balik & Header PO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/supplier/pesanan"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 mb-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            &larr; Kembali ke Daftar Pesanan PO
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary text-balance">
              Rincian {po.poNumber}
            </h1>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EBF5F0] text-primary border border-primary/20">
              {po.primaryDeliveryMethod === "HEMAT_HUB" ? "Opsi Hemat (Hub Konsolidasi)" : "Antar Langsung"}
            </span>
          </div>
          <p className="font-body text-xs sm:text-sm text-text-secondary mt-0.5 text-pretty">
            Diterbitkan pada {formatDate(po.createdAt, "long")} &bull; Komoditas: {po.commodityName}
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
              className="font-semibold min-h-[44px]"
            >
              Mulai Kemas Barang
            </Button>
          )}

          {po.status === "PROCESSING" && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowShipModal(true)}
              className="font-semibold min-h-[44px]"
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
              className="font-semibold min-h-[44px]"
            >
              Konfirmasi Tiba di Hub / Tujuan
            </Button>
          )}

          {po.status === "DELIVERED" && (
            <Badge variant="success" className="text-xs px-3.5 py-1.5 font-bold">
              ✓ Pesanan Telah Tiba &amp; Selesai
            </Badge>
          )}
        </div>
      </div>

      {/* Stepper Status Alur Logistik Terpadu */}
      <Card className="p-5 sm:p-6 space-y-4">
        <h2 className="font-heading text-xs font-bold text-text-secondary">
          Alur Status Pemenuhan Pesanan Konsolidasi
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className={`p-3.5 rounded-xl border ${currentStep >= 1 ? "bg-[#EBF5F0]/70 border-primary/30" : "bg-background border-border"}`}>
            <span className="text-[10px] font-bold text-primary block">Tahap 1</span>
            <p className="text-xs font-bold text-text-primary mt-0.5">Dana di Escrow</p>
            <p className="text-[11px] text-text-secondary mt-0.5">Semua UMKM telah bayar</p>
          </div>

          <div className={`p-3.5 rounded-xl border ${currentStep >= 2 ? "bg-[#EBF5F0]/70 border-primary/30" : "bg-background border-border"}`}>
            <span className="text-[10px] font-bold text-primary block">Tahap 2</span>
            <p className="text-xs font-bold text-text-primary mt-0.5">Sedang Dikemas</p>
            <p className="text-[11px] text-text-secondary mt-0.5">Pemeriksaan paspor mutu</p>
          </div>

          <div className={`p-3.5 rounded-xl border ${currentStep >= 3 ? "bg-[#EBF5F0]/70 border-primary/30" : "bg-background border-border"}`}>
            <span className="text-[10px] font-bold text-primary block">Tahap 3</span>
            <p className="text-xs font-bold text-text-primary mt-0.5">Dalam Pengiriman</p>
            <p className="text-[11px] text-text-secondary mt-0.5">Armada menuju Hub / UMKM</p>
          </div>

          <div className={`p-3.5 rounded-xl border ${currentStep >= 4 ? "bg-[#EBF5F0]/70 border-primary/30" : "bg-background border-border"}`}>
            <span className="text-[10px] font-bold text-primary block">Tahap 4</span>
            <p className="text-xs font-bold text-text-primary mt-0.5">Tiba di Tujuan</p>
            <p className="text-[11px] text-text-secondary mt-0.5">Rilis dana escrow</p>
          </div>
        </div>

        {po.trackingNumber && (
          <div className="p-3.5 rounded-xl bg-background border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-text-muted">Nomor Resi / Surat Jalan:</span>{" "}
              <strong className="font-mono text-text-primary font-bold tabular-nums">{po.trackingNumber}</strong>
            </div>
            {po.driverName && (
              <div>
                <span className="text-text-muted">Pengemudi / Armada:</span>{" "}
                <strong className="text-text-primary font-semibold">{po.driverName}</strong>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Dua Kolom: Info Hub Logistik & Rincian Finansial */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kolom 1: Alamat Drop Point Hub Konsolidasi */}
        <Card className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-bold text-text-primary">
              Destinasi Titik Kumpul (Hub Konsolidasi)
            </h2>
            <Badge variant="primary">
              Optimal Drop Point
            </Badge>
          </div>
          <div className="p-3.5 rounded-xl bg-background border border-border space-y-1.5">
            <p className="text-xs font-bold text-text-primary">
              {po.hubName}
            </p>
            <p className="font-body text-xs text-text-secondary leading-relaxed text-pretty">
              {po.hubAddress}
            </p>
            <div className="pt-1 flex items-center gap-3 text-[11px] text-text-muted tabular-nums">
              <span>Estimasi Tiba: <strong className="text-text-primary">{po.estimatedDeliveryDate}</strong></span>
              <span>&bull;</span>
              <span className="text-primary font-semibold">Radius Rute Hemat</span>
            </div>
          </div>
        </Card>

        {/* Kolom 2: Rincian Nilai Transaksi & Escrow */}
        <Card className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-bold text-text-primary">
              Rincian Pembayaran Escrow Platform
            </h2>
            <Badge variant="info">
              Terjamin Aman
            </Badge>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-text-secondary">
              <span>Subtotal Komoditas ({po.totalQuantity} {po.wholesaleUnit}):</span>
              <span className="font-semibold text-text-primary tabular-nums">{formatCurrency(po.totalGoodsAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-text-secondary">
              <span>Total Alokasi Ongkir Konsolidasi:</span>
              <span className="font-semibold text-text-primary tabular-nums">{formatCurrency(po.totalShippingAmount)}</span>
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between text-sm">
              <span className="font-bold text-text-primary">Total Dana Cair ke Supplier:</span>
              <span className="font-extrabold text-primary text-base tabular-nums">{formatCurrency(po.grandTotalAmount)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Manifest Distribusi Peserta Pooling UMKM (PRD Section 4) */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="font-heading font-bold text-base text-text-primary text-balance">
            Manifest Peserta Pool UMKM ({po.participants.length} Usaha Tergabung)
          </h2>
          <p className="font-body text-xs text-text-secondary mt-0.5 text-pretty">
            Daftar UMKM yang berpartisipasi dalam pesanan PO ini beserta pembagian alokasi kuota dan ongkos kirim.
          </p>
        </div>

        {/* Table Watermelon UI */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Usaha &amp; Kontak</TableHead>
              <TableHead>Kuota Dipesan</TableHead>
              <TableHead>Metode Pengiriman</TableHead>
              <TableHead>Bagi Ongkir (Split-Bill)</TableHead>
              <TableHead className="text-right">Subtotal Belanja</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {po.participants.map((part) => (
              <TableRow key={part.id}>
                <TableCell className="align-top">
                  <p className="font-heading font-bold text-sm text-text-primary">{part.umkmName}</p>
                  <p className="text-[11px] text-text-muted mt-0.5 tabular-nums">{part.ownerName} &bull; {part.phone}</p>
                </TableCell>
                <TableCell className="align-top">
                  <p className="font-bold text-text-primary tabular-nums">{part.orderQtyUnit} {po.wholesaleUnit}</p>
                  <p className="text-[11px] text-text-muted tabular-nums">{part.orderWeightKg} kg</p>
                </TableCell>
                <TableCell className="align-top">
                  {part.deliveryMethod === "HEMAT_HUB" ? (
                    <Badge variant="primary">
                      Opsi Hemat (Hub)
                    </Badge>
                  ) : (
                    <Badge variant="warning">
                      Direct (Door-to-Door)
                    </Badge>
                  )}
                  <p className="text-[11px] text-text-muted mt-1 line-clamp-1 max-w-xs text-pretty">
                    {part.destinationAddress}
                  </p>
                </TableCell>
                <TableCell className="align-top font-medium text-text-secondary tabular-nums">
                  {formatCurrency(part.allocatedShippingFee)}
                </TableCell>
                <TableCell className="align-top text-right font-extrabold text-primary tabular-nums">
                  {formatCurrency(part.subtotalAmount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Modal Input Resi & Armada (Saat Berangkatkan Pengiriman) */}
      {showShipModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <Card
            className="w-full max-w-md p-6 shadow-elevation-3 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-heading font-bold text-base text-text-primary">
              Berangkatkan Armada Pengiriman
            </h3>
            <p className="font-body text-xs text-text-secondary leading-relaxed text-pretty">
              Masukkan identitas pengemudi dan nomor surat jalan untuk memantau perjalanan pesanan menuju Hub Konsolidasi.
            </p>

            <div className="space-y-3">
              <Input
                id="trackingNumber"
                label="Nomor Resi / Surat Jalan"
                value={trackingNumberInput}
                onChange={(e) => setTrackingNumberInput(e.target.value)}
                className="min-h-[44px] font-mono tabular-nums font-bold"
              />

              <Input
                id="driverName"
                label="Nama Pengemudi &amp; Jenis Armada"
                value={driverNameInput}
                onChange={(e) => setDriverNameInput(e.target.value)}
                placeholder="Contoh: Hendra Wijaya (Truk Colt Diesel B 9812 UI)"
                className="min-h-[44px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShipModal(false)}
                className="min-h-[44px]"
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
                className="min-h-[44px]"
              >
                Konfirmasi Berangkat
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
