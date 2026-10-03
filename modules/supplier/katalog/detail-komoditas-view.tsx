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
import { updateSupplierCommodityAction } from "@/actions/supplier-catalog";
import { UmkmPurchaseCard } from "./umkm-purchase-card";
import { PublishCommodityDialog } from "./publish-commodity-dialog";
import { ShoppingCart, AlertCircle } from "lucide-react";

interface DetailKomoditasViewProps {
  initialCommodity: SupplierCommodity;
  role?: "umkm" | "supplier";
}

export function DetailKomoditasView({
  initialCommodity,
  role = "umkm",
}: DetailKomoditasViewProps) {
  const [commodity, setCommodity] =
    React.useState<SupplierCommodity>(initialCommodity);
  const [isPublishModalOpen, setIsPublishModalOpen] = React.useState(false);

  const purchaseSectionRef = React.useRef<HTMLDivElement>(null);
  const isUmkm = role === "umkm";

  const handleToggleStatus = async () => {
    // Jika belum aktif, buka dialog form konfirmasi publikasi
    if (!commodity.isActive) {
      setIsPublishModalOpen(true);
      return;
    }

    // Jika sudah aktif dan ingin dinonaktifkan (tarik dari bursa)
    const nextState = false;
    setCommodity((prev) => ({ ...prev, isActive: nextState }));
    try {
      await updateSupplierCommodityAction(commodity.id, { isMarketplaceActive: nextState });
      toast.info(
        `Komoditas ${commodity.name} kini ditarik dari bursa (berstatus nonaktif/draft).`,
        "Komoditas Dinonaktifkan"
      );
    } catch {
      toast.error("Gagal memperbarui status di backend.");
    }
  };

  const primaryPrice = commodity.priceTiers[0]?.pricePerUnit || 0;
  const isHygienePassed = commodity.batchTag.hygieneStatus === "TERVERIFIKASI";

  const handleScrollToPurchase = () => {
    purchaseSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Navigasi Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={isUmkm ? "/home" : "/katalog"}
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5 mb-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            &larr; {isUmkm ? "Kembali ke Bursa Pasokan" : "Kembali ke Katalog"}
          </Link>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-text-secondary bg-neutral-100 px-2.5 py-0.5 rounded-md border border-neutral-200">
              {commodity.sku}
            </span>
            <Badge variant="neutral">{commodity.sector}</Badge>
            {commodity.isActive ? (
              <Badge variant="success">
                {isUmkm ? "Siap Dipesan" : "Aktif di Bursa"}
              </Badge>
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

        {/* Action Buttons: UMKM vs Supplier */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {isUmkm ? (
            commodity.isActive ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleScrollToPurchase}
                className="font-bold text-xs sm:text-sm min-h-[42px] flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Beli / Gabung Pooling</span>
              </Button>
            ) : (
              <Badge variant="neutral" className="px-3 py-2 text-xs font-semibold">
                Belum Dibuka di Bursa
              </Badge>
            )
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Grid Banner Foto & Informasi Inti */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Foto Komoditas & Asal Panen */}
        <div className="space-y-5">
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
                  <span className="text-xs">Foto Komoditas</span>
                </div>
              )}
            </div>
            <div className="pt-3.5 px-1 space-y-1">
              <span className="text-[11px] font-semibold text-text-muted block">
                Lokasi Asal Panen / Gudang
              </span>
              <p className="text-xs font-bold text-text-primary">
                {commodity.batchTag.originLocation}
              </p>
            </div>
          </Card>

          {/* Jika UMKM: Tampilkan Formulir Pembelian atau Informasi Belum Aktif */}
          {isUmkm && (
            <div ref={purchaseSectionRef}>
              {commodity.isActive ? (
                <UmkmPurchaseCard commodity={commodity} />
              ) : (
                <Card className="p-5 bg-surface border-border shadow-elevation-1 rounded-3xl space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <h3 className="font-heading font-bold text-sm text-text-primary">
                      Belum Tersedia di Bursa Pasokan
                    </h3>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Komoditas ini masih berstatus nonaktif (draft) oleh pemasok dan belum dibuka untuk pemesanan umum UMKM.
                  </p>
                  <Link href="/home" className="block pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-semibold cursor-pointer"
                    >
                      &larr; Lihat Pasokan Aktif di Bursa
                    </Button>
                  </Link>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Rincian Harga & Spesifikasi Pasokan */}
        <div className={`${isUmkm ? "lg:col-span-2" : "lg:col-span-2"} space-y-5`}>
          {/* Card Harga Utama & Deskripsi */}
          <Card className="p-5 sm:p-6 bg-surface border-border shadow-elevation-1 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
              <div>
                <span className="text-xs font-semibold text-text-secondary">
                  Harga Pokok Pasokan Grosir
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

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-border/60">
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
                Paspor Mutu &amp; Kepatuhan Sanitasi Digital
              </h2>
              <div className="flex items-center gap-2">
                {isHygienePassed ? (
                  <Badge variant="success">Terverifikasi Mutu</Badge>
                ) : (
                  <Badge variant="warning">Menunggu Audit</Badge>
                )}
                {!isUmkm && (
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
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-background p-3 border border-border">
                <span className="text-text-muted block text-[11px]">Nomor Izin / Sertifikat Lab:</span>
                <span className="font-mono font-bold text-text-primary text-xs mt-0.5 block">{commodity.batchTag.licenseNumber}</span>
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
                <span className="font-bold text-text-primary text-xs mt-0.5 block tabular-nums">{commodity.batchTag.productionDate}</span>
              </div>
              <div className="rounded-xl bg-background p-3 border border-border">
                <span className="text-text-muted block text-[11px]">Masa Simpan Aman (Expired):</span>
                <span className="font-bold text-text-primary text-xs mt-0.5 block tabular-nums">{commodity.batchTag.expiryDate}</span>
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
                  Tingkatan harga volume yang berlaku untuk pemesanan agregasi atau pooling UMKM.
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

      {/* Dialog Konfirmasi Publikasi ke Bursa untuk Supplier */}
      <PublishCommodityDialog
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        commodity={commodity}
        onPublishSuccess={(updated) => setCommodity(updated)}
      />
    </div>
  );
}
