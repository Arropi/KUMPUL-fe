"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { SupplierCommodity } from "@/constants/supplier";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog3 } from "@/components/ui/dialog-3";
import { toast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  unpublishSupplierCommodityAction,
  deleteSupplierCommodityAction,
} from "@/actions/supplier-catalog";
import { CommodityRunningPools } from "./commodity-running-pools";
import { CreatePoolDialog } from "./create-pool-dialog";
import { PublishCommodityDialog } from "./publish-commodity-dialog";
import {
  ShoppingCart,
  AlertCircle,
  Trash2,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import type { BEProcurementPool, BEBusinessEntity } from "@/lib/api/types";

interface DetailKomoditasViewProps {
  initialCommodity: SupplierCommodity;
  initialPools?: BEProcurementPool[];
  userProfile?: BEBusinessEntity | null;
  role?: "umkm" | "supplier";
  isOwner?: boolean;
  currentRoleId?: string;
}

export function DetailKomoditasView({
  initialCommodity,
  initialPools = [],
  userProfile,
  role = "umkm",
  isOwner = false,
  currentRoleId,
}: DetailKomoditasViewProps) {
  const router = useRouter();
  const [commodity, setCommodity] =
    React.useState<SupplierCommodity>(initialCommodity);
  const [pools, setPools] = React.useState<BEProcurementPool[]>(initialPools);
  const [isPublishModalOpen, setIsPublishModalOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isCreatePoolOpen, setIsCreatePoolOpen] = React.useState(false);

  const purchaseSectionRef = React.useRef<HTMLDivElement>(null);
  const isBuyer = !isOwner;

  const handleDeleteCommodity = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteSupplierCommodityAction(commodity.id);
      if (res.success) {
        toast.success(
          `Komoditas "${commodity.name}" berhasil dihapus dari katalog pasokan.`,
          "Komoditas Dihapus"
        );
        router.push("/katalog");
      } else {
        toast.error(res.message || "Gagal menghapus komoditas.");
      }
    } catch {
      toast.error("Terjadi kendala saat menghapus komoditas.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

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
      await unpublishSupplierCommodityAction(commodity.id);
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
            href={isOwner ? "/katalog" : "/home"}
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5 mb-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
          >
            &larr; {isOwner ? "Kembali ke Katalog" : "Kembali ke Bursa Pasokan"}
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-mono text-xs font-bold text-text-secondary bg-surface-subtle px-2.5 py-0.5 rounded-md border border-border truncate max-w-[150px]"
              title={commodity.sku}
            >
              {commodity.sku}
            </span>
            <Badge
              variant="neutral"
              className="truncate max-w-[160px]"
              title={commodity.sector}
            >
              {commodity.sector}
            </Badge>
            {commodity.isActive ? (
              <Badge variant="success">
                {isOwner ? "Aktif di Bursa" : "Siap Dipesan"}
              </Badge>
            ) : (
              <Badge variant="neutral">Nonaktif (Draft)</Badge>
            )}
            {isHygienePassed ? (
              <Badge variant="success">Lulus Mutu &amp; Kesehatan</Badge>
            ) : (
              <Badge variant="warning">Menunggu Verifikasi Kesehatan</Badge>
            )}
          </div>
          <h1
            className="font-heading font-bold text-xl sm:text-2xl text-text-primary mt-2 text-balance break-words line-clamp-2"
            title={commodity.name}
          >
            {commodity.name}
          </h1>
        </div>

        {/* Action Buttons: Pemilik vs Pembeli (UMKM/Supplier Lain) */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {isOwner ? (
            <>
              <Button
                asChild
                variant="soft"
                size="md"
                className="text-xs sm:text-sm font-semibold gap-1.5"
              >
                <Link href={`/katalog/${commodity.id}/verifikasi`}>
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-700" />
                  <span>
                    {isHygienePassed
                      ? "Perbarui Verifikasi Mutu"
                      : "Verifikasi Mutu"}
                  </span>
                </Link>
              </Button>
              <Button
                type="button"
                variant={commodity.isActive ? "outline" : "primary"}
                size="md"
                onClick={handleToggleStatus}
                className="text-xs sm:text-sm font-bold"
              >
                {commodity.isActive ? "Tarik dari Bursa" : "Publikasikan ke Bursa"}
              </Button>
              <Button
                asChild
                variant="secondary"
                size="md"
                className="text-xs sm:text-sm font-bold gap-1.5"
              >
                <Link href={`/katalog/${commodity.id}/edit`}>
                  <Pencil className="size-3.5 shrink-0" />
                  <span>Ubah Data</span>
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-xs sm:text-sm font-semibold border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-1.5"
              >
                <Trash2 className="size-3.5 shrink-0 text-red-600" />
                <span>Hapus</span>
              </Button>
            </>
          ) : commodity.isActive ? (
            <Button
              type="button"
              variant="accent"
              size="md"
              onClick={() => setIsCreatePoolOpen(true)}
              className="text-xs sm:text-sm font-bold flex items-center gap-2"
            >
              <ShoppingCart className="size-4 shrink-0" />
              <span>Beli / Buat Pool</span>
            </Button>
          ) : (
            <Badge variant="neutral" className="px-3 py-2 text-xs font-semibold">
              Belum Dibuka di Bursa
            </Badge>
          )}
        </div>
      </div>

      {/* Grid Banner Foto & Informasi Inti */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Foto Komoditas & Asal Panen */}
        <div className="space-y-5">
          <Card className="flex flex-col rounded-2xl border-border bg-surface p-3.5 sm:p-4 shadow-elevation-1">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface-subtle border border-border/60">
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
              <p className="text-xs font-bold text-text-primary line-clamp-2 break-words" title={commodity.batchTag.originLocation}>
                {commodity.batchTag.originLocation}
              </p>
            </div>
          </Card>

          {/* Jika Pembeli (UMKM/Supplier Lain): Tampilkan Daftar Card Pool Berjalan */}
          {isBuyer && (
            <div ref={purchaseSectionRef}>
              {commodity.isActive ? (
                <CommodityRunningPools
                  commodity={commodity}
                  initialPools={pools}
                  userProfile={userProfile}
                  isBuyer={isBuyer}
                  currentRoleId={currentRoleId}
                  onRequestCreatePool={() => setIsCreatePoolOpen(true)}
                />
              ) : (
                <Card className="p-5 bg-surface border-border shadow-elevation-1 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-5 text-amber-600 shrink-0" />
                    <h3 className="font-heading font-bold text-sm text-text-primary">
                      Belum Tersedia di Bursa Pasokan
                    </h3>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed text-pretty">
                    Komoditas ini masih berstatus nonaktif (draft) oleh pemasok dan belum dibuka untuk pemesanan umum.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-semibold mt-1"
                  >
                    <Link href="/home">
                      &larr; Lihat Pasokan Aktif di Bursa
                    </Link>
                  </Button>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Rincian Harga & Spesifikasi Pasokan */}
        <div className={`${isBuyer ? "lg:col-span-2" : "lg:col-span-2"} space-y-5`}>
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
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed text-pretty break-words">
                {commodity.description || "Tidak ada deskripsi tambahan."}
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
                {isOwner && (
                  <Button
                    asChild
                    variant="soft"
                    size="sm"
                    className="text-xs font-semibold h-8 rounded-xl px-3"
                  >
                    <Link href={`/katalog/${commodity.id}/verifikasi`}>
                      {isHygienePassed ? "Perbarui Mutu \u2192" : "Verifikasi Mutu \u2192"}
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-background p-3.5 border border-border sm:col-span-2 space-y-1">
                <span className="text-text-muted block text-[11px] font-medium">
                  Keterangan / Hasil Audit Otomatis:
                </span>
                <p className="text-xs font-semibold text-text-primary leading-relaxed">
                  {commodity.batchTag.verificationNotes ||
                    (isHygienePassed
                      ? "Dokumen mutu pangan terverifikasi sah dan memenuhi standar oleh sistem AI KUMPUL."
                      : "Belum diaudit oleh AI. Silakan ajukan verifikasi kesehatan berkas dokumen untuk diaudit secara otomatis oleh AI.")}
                </p>
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
                <span className="text-text-muted block text-[11px]">Tanggal Produksi / Olah:</span>
                <span className="font-bold text-text-primary text-xs mt-0.5 block tabular-nums">
                  {commodity.productionDate && commodity.productionDate !== "-"
                    ? commodity.productionDate
                    : commodity.batchTag.productionDate || "-"}
                </span>
              </div>
              <div className="rounded-xl bg-background p-3 border border-border sm:col-span-2">
                <span className="text-text-muted block text-[11px]">Masa Simpan Aman (Expired):</span>
                <span className="font-bold text-text-primary text-xs mt-0.5 block tabular-nums">
                  {commodity.expiryDate && commodity.expiryDate !== "-"
                    ? commodity.expiryDate
                    : commodity.batchTag.expiryDate || "-"}
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
          {/* Untuk Pemilik (Supplier): Tampilkan Pantauan Kamar Pool Komoditas */}
          {isOwner && (
            <CommodityRunningPools
              commodity={commodity}
              initialPools={pools}
              userProfile={userProfile}
              isBuyer={false}
            />
          )}
        </div>
      </div>

      {/* Dialog Pemesanan Langsung / Buat Pool Baru untuk UMKM */}
      <CreatePoolDialog
        isOpen={isCreatePoolOpen}
        onClose={() => setIsCreatePoolOpen(false)}
        commodity={commodity}
        userProfile={userProfile}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Dialog Konfirmasi Publikasi ke Bursa untuk Supplier */}
      <PublishCommodityDialog
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        commodity={commodity}
        onPublishSuccess={(updated) => setCommodity(updated)}
      />

      {/* Dialog 3 Destructive Confirmation dari Watermelon UI */}
      <Dialog3
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={`Hapus Komoditas "${commodity.name}"?`}
        description={`Apakah Anda yakin ingin menghapus komoditas "${commodity.name}" (${commodity.sku}) dari katalog pasokan Anda? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.`}
        checkboxLabel="Saya paham bahwa tindakan ini tidak dapat dibatalkan"
        confirmLabel="Hapus Komoditas"
        cancelLabel="Batal"
        isLoading={isDeleting}
        onConfirm={handleDeleteCommodity}
      />
    </div>
  );
}
