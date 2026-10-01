"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MOCK_SUPPLIER_PROFILE,
  MOCK_SUPPLIER_COMMODITIES,
  MOCK_CONSOLIDATED_POS,
  BANK_OPTIONS,
  SECTOR_MEDIA_MAP,
} from "@/constants/supplier";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FloatingInput } from "@/components/ui/floating-input";
import { toast } from "@/components/ui/toast";
import { InlineDisclosureSelect } from "@/components/ui/inline-disclosure-select";

export function SupplierProfilView() {
  const searchParams = useSearchParams();
  const isOnboardingPending = searchParams.get("onboarding") === "pending";

  const [profile, setProfile] = React.useState(MOCK_SUPPLIER_PROFILE);
  const [isEditing, setIsEditing] = React.useState(isOnboardingPending);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isProfileComplete, setIsProfileComplete] = React.useState(!isOnboardingPending);

  // Bank Settlement Fields
  const [bankName, setBankName] = React.useState(profile.bankInfo.bankName || BANK_OPTIONS[0]);
  const [accountNumber, setAccountNumber] = React.useState(profile.bankInfo.accountNumber || "");
  const [accountHolder, setAccountHolder] = React.useState(
    profile.bankInfo.accountHolder || profile.legalName
  );

  // Agregasi metrik performa riil dari data mock
  const totalRevenue = React.useMemo(() => {
    return MOCK_CONSOLIDATED_POS.reduce((acc, po) => acc + po.grandTotalAmount, 0);
  }, []);

  const totalCommodities = MOCK_SUPPLIER_COMMODITIES.length;
  const activeCommodities = React.useMemo(() => {
    return MOCK_SUPPLIER_COMMODITIES.filter((item) => item.isActive).length;
  }, []);

  const sectorMeta =
    SECTOR_MEDIA_MAP[profile.sector.toUpperCase()] || SECTOR_MEDIA_MAP.PERTANIAN;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      setProfile((prev) => ({
        ...prev,
        bankInfo: {
          bankName,
          accountNumber,
          accountHolder,
        },
      }));
      setIsSaving(false);
      setIsEditing(false);
      setIsProfileComplete(true);

      if (typeof window !== "undefined") {
        localStorage.setItem("kumpul_supplier_profile_complete", "true");
        localStorage.setItem(
          "kumpul_supplier_bank_data",
          JSON.stringify({
            bankName,
            accountNumber,
            accountHolder,
          })
        );
      }

      toast.success(
        "Rekening settlement escrow aktif untuk pencairan dana otomatis.",
        "Rekening Tersimpan"
      );
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Banner Peringatan Onboarding (Jika Belum Selesai) */}
      {!isProfileComplete && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 shadow-elevation-1">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 font-bold text-xs">
              !
            </span>
            <p className="text-xs sm:text-sm text-text-primary font-medium">
              Lengkapi rekening escrow Anda agar siap menerima pencairan dana pesanan pooling UMKM.
            </p>
          </div>
          {!isEditing && (
            <Button
              type="button"
              variant="accent"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="font-bold text-xs h-9 px-4 shrink-0"
            >
              Lengkapi Sekarang
            </Button>
          )}
        </div>
      )}

      {/* Kartu Profil Utama dengan Visual Sektor */}
      <Card className="rounded-3xl border border-border bg-surface shadow-elevation-1 overflow-hidden">
        {/* Cover Gambar Visual Sektor */}
        <div className="relative w-full h-36 sm:h-48 bg-neutral-900 overflow-hidden">
          <Image
            src={sectorMeta.image}
            alt={sectorMeta.label}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 896px"
            className="object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

          {/* Badge Sektor di Atas Cover */}
          <div className="absolute top-4 left-4 sm:top-5 sm:left-5 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-surface/90 backdrop-blur-md text-text-primary text-[11px] font-bold border border-white/20 shadow-xs">
              {sectorMeta.label}
            </span>
            <Badge variant="success" className="text-[11px] font-bold shadow-xs">
              ✓ {profile.complianceStatus}
            </Badge>
          </div>

          <div className="absolute bottom-3 right-4 sm:bottom-4 sm:right-6 text-right">
            <span className="text-[11px] text-white/90 font-medium tracking-wide">
              {profile.city} &bull; Terdaftar sejak {profile.registrationDate}
            </span>
          </div>
        </div>

        {/* Info Detail Profil Perusahaan */}
        <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-3 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 relative z-10">
            <div className="flex items-end gap-3.5 sm:gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary text-text-inverse border-4 border-surface shadow-elevation-2 flex items-center justify-center font-heading font-extrabold text-2xl sm:text-3xl shrink-0">
                {profile.brandName.substring(0, 2).toUpperCase()}
              </div>
              <div className="pb-1">
                <h1 className="text-xl sm:text-2xl font-bold font-heading text-text-primary tracking-tight">
                  {profile.brandName}
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-text-secondary">
                  {profile.legalName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 sm:pt-0">
              <Button asChild variant="primary" size="sm" className="font-bold text-xs h-9">
                <Link href="/supplier/katalog/tambah">
                  <span>+ Tambah Katalog</span>
                </Link>
              </Button>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-xs h-9 font-semibold"
                >
                  Ubah Rekening
                </Button>
              )}
            </div>
          </div>

          {/* Rincian Identitas Legal & Kontak PIC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-2 border-t border-border/70 text-xs">
            <div className="space-y-1">
              <span className="text-text-muted text-[11px]">Nama Penanggung Jawab (PIC)</span>
              <p className="font-semibold text-text-primary">
                Hendra Pratama
                <span className="block text-[11px] text-text-secondary font-normal">
                  Head of Operations &amp; Supply
                </span>
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-text-muted text-[11px]">Kontak Resmi Usaha</span>
              <p className="font-semibold text-text-primary">{profile.contactPhone}</p>
              <p className="text-text-secondary text-[11px] truncate">{profile.contactEmail}</p>
            </div>

            <div className="space-y-1 sm:col-span-2 md:col-span-1">
              <span className="text-text-muted text-[11px]">NIB / NPWP Legal</span>
              <p className="font-mono text-text-primary font-medium text-[11px] break-all">
                {profile.npwpNib}
              </p>
              <p className="text-text-secondary text-[11px] truncate">{profile.address}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tiga Kartu Metrik Ringkas: Total Penjualan, Total Katalog, dan Kapasitas Gudang */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metrik 1: Total Penjualan */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-elevation-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Total Penjualan</span>
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              Rp
            </span>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold font-heading text-text-primary tabular-nums tracking-tight">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              3 PO Konsolidasi (Semua status aktif &amp; sukses)
            </p>
          </div>
        </div>

        {/* Metrik 2: Total Katalog */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-elevation-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Total Katalog</span>
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              📦
            </span>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold font-heading text-text-primary tabular-nums tracking-tight">
              {formatNumber(totalCommodities)} Komoditas
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {activeCommodities} komoditas aktif siap pooling MOQ
            </p>
          </div>
        </div>

        {/* Metrik 3: Kapasitas Penyimpanan */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-elevation-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Kapasitas Gudang</span>
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              🏢
            </span>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold font-heading text-text-primary tabular-nums tracking-tight">
              {profile.storageValue || 750} {profile.storageUnit || "TON"}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {profile.storageType === "DRY" ? "Gudang Kering (Ambient)" : "Penyimpanan Dingin"} &bull; {profile.city}
            </p>
          </div>
        </div>
      </div>

      {/* Bagian Rekening Settlement Escrow */}
      <Card className="p-5 sm:p-6 rounded-2xl border border-border bg-surface shadow-elevation-1 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div>
            <h2 className="font-heading font-bold text-base text-text-primary">
              Rekening Settlement Escrow
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Rekening terhubung untuk pencairan dana hasil verifikasi pesanan pooling UMKM.
            </p>
          </div>
          {isProfileComplete ? (
            <Badge variant="success" className="text-[11px] font-semibold">
              ✓ Terhubung
            </Badge>
          ) : (
            <Badge variant="warning" className="text-[11px] font-semibold">
              Belum Lengkap
            </Badge>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {isEditing ? (
            <div className="space-y-3 pt-1">
              <InlineDisclosureSelect
                id="bankNameSelect"
                label="Pilihan Bank Penampung"
                options={BANK_OPTIONS}
                value={bankName}
                onChange={(val) => setBankName(val)}
              />

              <FloatingInput
                id="accountNumberInput"
                label="Nomor Rekening Bank"
                placeholder="Contoh: 8830912441"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                className="font-mono"
              />

              <FloatingInput
                id="accountHolderInput"
                label="Nama Pemilik Rekening (Sesuai Buku Tabungan)"
                placeholder="Contoh: PT Agroniaga Nusantara Sejahtera"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                required
              />

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-semibold h-10 px-4 text-text-secondary"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                  className="font-bold text-xs min-h-[42px] px-6"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Rekening"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-2xl bg-surface-subtle border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary font-heading">
                    {bankName}
                  </span>
                  <span className="text-[10px] text-success font-semibold bg-success/10 px-2 py-0.5 rounded-md">
                    BI-FAST Siap
                  </span>
                </div>
                <p className="text-lg font-mono font-bold text-text-primary tracking-wide tabular-nums">
                  {accountNumber || "883-0912-441"}
                </p>
                <p className="text-xs text-text-secondary">
                  Atas Nama: <span className="font-semibold text-text-primary">{accountHolder || profile.legalName}</span>
                </p>
              </div>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-xs h-9 font-semibold w-full sm:w-auto"
                >
                  Ubah Rekening
                </Button>
              </div>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
