"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { SupplierCommodity } from "@/constants/supplier";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";

interface DetailKomoditasViewProps {
  initialCommodity: SupplierCommodity;
}

export function DetailKomoditasView({
  initialCommodity,
}: DetailKomoditasViewProps) {
  const [commodity, setCommodity] =
    React.useState<SupplierCommodity>(initialCommodity);

  const handleToggleStatus = () => {
    const nextState = !commodity.isActive;
    setCommodity((prev) => ({ ...prev, isActive: nextState }));
    if (nextState) {
      toast.success(
        `Komoditas ${commodity.name} berhasil diaktifkan di bursa pasokan.`,
        "Komoditas Dipublikasikan"
      );
    } else {
      toast.info(
        `Komoditas ${commodity.name} kini berstatus nonaktif (draft).`,
        "Komoditas Dinonaktifkan"
      );
    }
  };

  const primaryPrice = commodity.priceTiers[0]?.pricePerUnit || 0;
  const isHygienePassed = commodity.batchTag.hygieneStatus === "TERVERIFIKASI";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Navigasi Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/katalog"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5 mb-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            &larr; Kembali ke Katalog
          </Link>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-text-secondary bg-neutral-100 px-2.5 py-0.5 rounded-md border border-neutral-200">
              {commodity.sku}
            </span>
            <Badge variant="neutral">{commodity.sector}</Badge>
            {commodity.isActive ? (
              <Badge variant="success">Aktif di Bursa</Badge>
            ) : (
              <Badge variant="neutral">Nonaktif (Draft)</Badge>
            )}
            {isHygienePassed ? (
              <Badge variant="success">Lulus Mutu &amp; Kesehatan</Badge>
            ) : (
              <Badge variant="warning">Menunggu Audit</Badge>
            )}
          </div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary mt-2">
            {commodity.name}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Link href={`/katalog/${commodity.id}/verifikasi`}>
            <Button
              type="button"
              variant="outline"
              size="md"
              className="font-semibold text-xs sm:text-sm min-h-[42px] border-emerald-600 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
            >
              Verifikasi Kepatuhan
            </Button>
          </Link>
          <Button
            type="button"
            variant={commodity.isActive ? "outline" : "primary"}
            size="md"
            onClick={handleToggleStatus}
            className="font-semibold text-xs sm:text-sm min-h-[42px] cursor-pointer"
          >
            {commodity.isActive ? "Tarik dari Bursa" : "Publikasikan"}
          </Button>
          <Link href={`/katalog/${commodity.id}/edit`}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="font-semibold text-xs sm:text-sm min-h-[42px] cursor-pointer"
            >
              Ubah Data
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid Banner Foto & Informasi Inti */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Foto Komoditas */}
        <Card className="flex flex-col rounded-2xl border-border bg-surface p-3.5 sm:p-4 shadow-elevation-1">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-100 border border-border/40">
            {commodity.imageUrl ? (
              <Image
                src={commodity.imageUrl}
                alt={commodity.name}
                fill
                priority
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-text-muted">
                <svg
                  className="size-12 stroke-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
                <span className="text-xs">Belum ada foto komoditas</span>
              </div>
            )}
          </div>
          <div className="pt-3.5 px-1 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted block">
              Lokasi Asal Panen
            </span>
            <p className="text-xs font-bold text-text-primary">
              {commodity.batchTag.originLocation}
            </p>
          </div>
        </Card>

        {/* Kolom Kanan: Rincian Harga & Spesifikasi Pasokan */}
        <div className="lg:col-span-2 space-y-5">
          {/* Card Harga Utama & Deskripsi */}
          <Card className="p-5 sm:p-6 bg-surface border-border shadow-elevation-1 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
              <div>
                <span className="text-xs font-semibold text-text-secondary">
                  Harga Utama Pasokan
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-heading font-extrabold text-2xl sm:text-3xl text-primary tabular-nums">
                    {formatCurrency(primaryPrice)}
                  </span>
                  <span className="text-xs font-bold text-text-muted">
                    / {commodity.wholesaleUnit}
                  </span>
                </div>
              </div>
              {commodity.unitWeightKg > 0 && (
                <div className="rounded-xl bg-background px-3 py-2 border border-border text-left sm:text-right">
                  <span className="text-[10px] text-text-muted block font-medium">Bobot per Satuan</span>
                  <span className="text-xs font-bold text-text-primary tabular-nums">
                    {commodity.unitWeightKg} kg / {commodity.wholesaleUnit}
                  </span>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xs font-bold text-text-primary mb-1">
                Deskripsi &amp; Spesifikasi Produk
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                {commodity.description}
              </p>
            </div>

            {/* Metrik Kuota Pasokan */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div className="rounded-xl bg-background p-3 border border-border">
                <span className="text-[10px] text-text-muted font-medium block">
                  Batas Minimum (MOQ)
                </span>
                <span className="font-bold text-text-primary text-sm tabular-nums mt-0.5 block">
                  {commodity.baseMoq} {commodity.wholesaleUnit}
                </span>
              </div>
              <div className="rounded-xl bg-background p-3 border border-border">
                <span className="text-[10px] text-text-muted font-medium block">
                  Stok Siap Kirim
                </span>
                <span className="font-bold text-text-primary text-sm tabular-nums mt-0.5 block">
                  {commodity.availableStock} {commodity.wholesaleUnit}
                </span>
              </div>
              <div className="rounded-xl bg-background p-3 border border-border col-span-2 sm:col-span-1">
                <span className="text-[10px] text-text-muted font-medium block">
                  Estimasi Lead Time
                </span>
                <span className="font-bold text-text-primary text-sm tabular-nums mt-0.5 block">
                  {commodity.leadTimeDays} Hari Kerja
                </span>
              </div>
            </div>
          </Card>

          {/* Paspor Mutu & Kesehatan Pangan */}
          <Card className="p-5 sm:p-6 bg-surface border-border shadow-elevation-1 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h2 className="font-heading font-bold text-sm text-text-primary flex items-center gap-2">
                <svg
                  className="size-4 text-primary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Paspor Mutu &amp; Kepatuhan Sanitasi Digital
              </h2>
              <div className="flex items-center gap-2">
                {isHygienePassed ? (
                  <Badge variant="success">Terverifikasi</Badge>
                ) : (
                  <Badge variant="warning">Menunggu Audit</Badge>
                )}
                <Link href={`/katalog/${commodity.id}/verifikasi`}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold h-7 px-2.5 border-emerald-600 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                  >
                    Verifikasi Kepatuhan &rarr;
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-background p-3 border border-border">
                <span className="text-text-muted block text-[11px]">Nomor Izin / Sertifikat Lab:</span>
                <span className="font-mono font-bold text-text-primary text-xs mt-0.5 block">
                  {commodity.batchTag.licenseNumber}
                </span>
              </div>
              <div className="rounded-xl bg-background p-3 border border-border">
                <span className="text-text-muted block text-[11px]">Instruksi Suhu Simpan:</span>
                <span className="font-bold text-text-primary text-xs mt-0.5 block">
                  {commodity.batchTag.storageTemperature === "AMBIENT"
                    ? "Suhu Ruang (Ambient)"
                    : commodity.batchTag.storageTemperature === "CHILLED"
                    ? "Dingin (Chilled 0 s.d. 4°C)"
                    : "Beku (Frozen < -18°C)"}
                </span>
              </div>
              <div className="rounded-xl bg-background p-3 border border-border">
                <span className="text-text-muted block text-[11px]">Tanggal Panen / Olah:</span>
                <span className="font-bold text-text-primary text-xs mt-0.5 block tabular-nums">
                  {commodity.batchTag.productionDate}
                </span>
              </div>
              <div className="rounded-xl bg-background p-3 border border-border">
                <span className="text-text-muted block text-[11px]">Masa Simpan Aman (Expired):</span>
                <span className="font-bold text-text-primary text-xs mt-0.5 block tabular-nums">
                  {commodity.batchTag.expiryDate}
                </span>
              </div>
            </div>
          </Card>

          {/* Skema Harga Bertingkat */}
          {commodity.priceTiers.length > 0 && (
            <Card className="p-5 sm:p-6 bg-surface border-border shadow-elevation-1 rounded-2xl space-y-4">
              <div className="border-b border-border/80 pb-3">
                <h2 className="font-heading font-bold text-sm text-text-primary">
                  Skema Tingkatan Harga Pasokan (Tiered Pricing)
                </h2>
                <p className="font-body text-xs text-text-secondary mt-0.5">
                  Tingkatan harga volume yang berlaku untuk pemesanan agregasi atau partai besar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {commodity.priceTiers.map((tier, idx) => (
                  <div
                    key={tier.id}
                    className={`rounded-xl border p-3.5 space-y-1.5 ${
                      idx === 1
                        ? "bg-amber-50/50 border-amber-200"
                        : "bg-background border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">
                        {tier.label}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-200/80 text-text-primary tabular-nums">
                        {tier.minQty} {commodity.wholesaleUnit}{" "}
                        {tier.maxQty ? `s.d. ${tier.maxQty} ${commodity.wholesaleUnit}` : "ke atas"}
                      </span>
                    </div>
                    <div className="pt-1">
                      <span className="font-heading font-extrabold text-base text-primary tabular-nums block">
                        {formatCurrency(tier.pricePerUnit)}
                      </span>
                      <span className="text-[11px] text-text-secondary">
                        per {commodity.wholesaleUnit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
