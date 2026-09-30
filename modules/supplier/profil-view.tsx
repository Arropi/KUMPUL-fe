"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MOCK_SUPPLIER_PROFILE, OFFICIAL_SECTORS, SectorType } from "@/constants/supplier";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { InlineDisclosureSelect } from "@/components/ui/inline-disclosure-select";

const BANK_OPTIONS = [
  "Bank Central Asia (BCA)",
  "Bank Mandiri",
  "Bank Rakyat Indonesia (BRI)",
  "Bank Negara Indonesia (BNI)",
  "Bank Syariah Indonesia (BSI)",
];

export function SupplierProfilView() {
  const searchParams = useSearchParams();
  const isOnboardingPending = searchParams.get("onboarding") === "pending";

  const [profile, setProfile] = React.useState(MOCK_SUPPLIER_PROFILE);
  const [isEditing, setIsEditing] = React.useState(isOnboardingPending);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isProfileComplete, setIsProfileComplete] = React.useState(!isOnboardingPending);

  // Form Fields - Sektor 7 Resmi, Kapasitas Storage, & Rekening Bank
  const [brandName, setBrandName] = React.useState(profile.brandName);
  const [sector, setSector] = React.useState<SectorType>(profile.sector || "PERTANIAN");
  const [storageCapacity, setStorageCapacity] = React.useState(
    profile.storageCapacity || "500 Ton (Gudang Kering & Cold Room)"
  );
  const [contactEmail, setContactEmail] = React.useState(profile.contactEmail);
  const [contactPhone, setContactPhone] = React.useState(profile.contactPhone);
  const [address, setAddress] = React.useState(profile.address);

  // Bank Info Fields
  const [bankName, setBankName] = React.useState(profile.bankInfo.bankName || BANK_OPTIONS[0]);
  const [accountNumber, setAccountNumber] = React.useState(profile.bankInfo.accountNumber || "");
  const [accountHolder, setAccountHolder] = React.useState(profile.bankInfo.accountHolder || profile.legalName);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      setProfile((prev) => ({
        ...prev,
        brandName,
        sector,
        storageCapacity,
        contactEmail,
        contactPhone,
        address,
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
      }

      setToast({
        isOpen: true,
        title: "Profil & Rekening Berhasil Dilengkapi",
        message: "Sektor usaha, kapasitas storage, dan rekening escrow terverifikasi. Akses tambah katalog telah aktif!",
        type: "success",
      });
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Toast
        isOpen={toast.isOpen}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Banner Peringatan jika Onboarding Belum Lengkap */}
      {!isProfileComplete && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 font-bold text-sm">
              !
            </span>
            <div>
              <h3 className="font-heading text-sm font-bold text-text-primary">
                Lengkapi Profil Operasional &amp; Finansial Kamu
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Pilih Sektor Usaha dari 7 sektor resmi, kapasitas storage, dan nomor rekening escrow untuk membuka akses penambahan katalog komoditas.
              </p>
            </div>
          </div>
          {!isEditing && (
            <Button
              type="button"
              variant="accent"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="font-bold shrink-0 self-start sm:self-auto min-h-[38px]"
            >
              Lengkapi Sekarang
            </Button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary text-balance">
            Profil Legalitas &amp; Rekening Usaha
          </h1>
          <p className="font-body text-xs sm:text-sm text-text-secondary mt-1 text-pretty">
            Data identitas tunggal entitas bisnis (Single Legal Entity NIB/NPWP), sektor operasional, kapasitas gudang, dan rekening settlement escrow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isProfileComplete && (
            <Button asChild variant="primary" size="md" className="font-bold min-h-[44px]">
              <Link href="/supplier/katalog/tambah">
                <span>+ Tambah Katalog Komoditas</span>
              </Link>
            </Button>
          )}

          {!isEditing ? (
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsEditing(true)}
              className="font-semibold min-h-[44px]"
            >
              Ubah Profil Usaha
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="md"
              onClick={() => setIsEditing(false)}
              className="font-semibold text-text-secondary min-h-[44px]"
            >
              Batal
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Informasi Legalitas Usaha Dagang */}
        <Card className="p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="font-heading font-bold text-base text-text-primary">
                Identitas Legalitas Usaha Terdaftar
              </h2>
              <p className="font-body text-xs text-text-secondary mt-0.5 text-pretty">
                Tervalidasi sesuai pendaftaran awal dan dokumen legalitas resmi (NIB/NPWP).
              </p>
            </div>
            <Badge variant="success" className="font-bold text-xs">
              ✓ NIB Terverifikasi
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-background border border-border">
              <span className="text-text-muted font-semibold block text-[10px]">
                Nama Resmi Badan Hukum / Usaha
              </span>
              <p className="font-heading text-sm font-bold text-text-primary mt-0.5">
                {profile.legalName}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-background border border-border">
              <span className="text-text-muted font-semibold block text-[10px]">
                Nomor NPWP &amp; NIB Usaha
              </span>
              <p className="text-xs font-mono font-bold text-text-primary mt-1 tabular-nums">
                {profile.npwpNib}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-background border border-border">
              <span className="text-text-muted font-semibold block text-[10px]">
                Wilayah Hub Logistik (Latitude &amp; Longitude)
              </span>
              <p className="text-xs font-mono font-bold text-text-primary mt-1">
                {profile.city} &bull; Lat: {profile.latitude ?? -6.1158}, Lng: {profile.longitude ?? 106.7865}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-background border border-border">
              <span className="text-text-muted font-semibold block text-[10px]">
                Status Paspor Mutu Supplier
              </span>
              <p className="text-xs font-bold text-success mt-1">
                Grade A &bull; Rantai Pasok Pangan Terakreditasi
              </p>
            </div>
          </div>
        </Card>

        {/* Card 2: Profiling Operasional (Sektor 7 Resmi & Storage Capacity) */}
        <Card className="p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="font-heading font-bold text-base text-text-primary">
                Profil Operasional &amp; Kapasitas Gudang
              </h2>
              <p className="font-body text-xs text-text-secondary mt-0.5 text-pretty">
                Klasifikasi sektor pangan dan daya tampung komoditas pasokan.
              </p>
            </div>
            {isProfileComplete ? (
              <Badge variant="success">Lengkap</Badge>
            ) : (
              <Badge variant="warning">Perlu Dilengkapi</Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dropdown 7 Sektor Resmi KUMPUL */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary block">
                Sektor Usaha (Lintas 7 Sektor KUMPUL)
              </label>
              {isEditing ? (
                <InlineDisclosureSelect
                  id="supplier-sector-profile"
                  label="Pilih Sektor Usaha"
                  options={OFFICIAL_SECTORS.map((s) => ({
                    label: s,
                    value: s,
                    description: `Sektor pasokan terintegrasi ${s}`,
                  }))}
                  value={sector}
                  onChange={(val) => setSector(val as SectorType)}
                />
              ) : (
                <div className="h-[52px] rounded-xl border border-border bg-background px-3.5 flex items-center">
                  <span className="font-heading text-sm font-bold text-primary">
                    {sector}
                  </span>
                </div>
              )}
            </div>

            {/* Kapasitas Storage */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary block">
                Kapasitas Penyimpanan (Storage Capacity)
              </label>
              {isEditing ? (
                <Input
                  id="storageCapacity"
                  label=""
                  placeholder="Contoh: 500 Ton (Dry Storage) / 100 Ton (Cold Room)"
                  value={storageCapacity}
                  onChange={(e) => setStorageCapacity(e.target.value)}
                  required
                  className="min-h-[52px]"
                />
              ) : (
                <div className="h-[52px] rounded-xl border border-border bg-background px-3.5 flex items-center">
                  <span className="text-xs sm:text-sm font-semibold text-text-primary">
                    {storageCapacity}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <Input
              id="brandName"
              label="Nama Merek / Brand Dagang"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              disabled={!isEditing}
              required
              className="min-h-[44px]"
            />

            <Input
              id="contactPhone"
              label="Nomor WhatsApp Operasional"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              disabled={!isEditing}
              required
              className="min-h-[44px] tabular-nums"
            />

            <Input
              id="contactEmail"
              label="Email Operasional"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              disabled={!isEditing}
              required
              className="min-h-[44px]"
            />
          </div>

          <Input
            id="address"
            label="Alamat Lengkap Fasilitas / Gudang Distribusi"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={!isEditing}
            required
            className="min-h-[44px]"
          />
        </Card>

        {/* Card 3: Rekening Settlement Escrow */}
        <Card className="p-5 sm:p-7 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="font-heading font-bold text-base text-text-primary">
                Rekening Settlement Escrow Platform
              </h2>
              <p className="font-body text-xs text-text-secondary mt-0.5 text-pretty">
                Rekening pencairan dana hasil transaksi pooling pesanan UMKM secara otomatis.
              </p>
            </div>
            <Badge variant="success">Kliring Siap</Badge>
          </div>

          {isEditing ? (
            <div className="space-y-4 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary block">
                  Pilihan Bank Penampung
                </label>
                <InlineDisclosureSelect
                  id="bankNameSelect"
                  label="Pilih Bank"
                  options={BANK_OPTIONS}
                  value={bankName}
                  onChange={(val) => setBankName(val)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="accountNumberInput"
                  label="Nomor Rekening Bank"
                  placeholder="Contoh: 8830912441"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                  className="min-h-[44px] font-mono"
                />

                <Input
                  id="accountHolderInput"
                  label="Nama Pemilik Rekening"
                  placeholder="Sesuai nama di buku tabungan / badan usaha"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  required
                  className="min-h-[44px]"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#EBF5F0]/70 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-primary block">
                  {bankName}
                </span>
                <p className="text-lg font-mono font-extrabold text-text-primary tabular-nums">
                  {accountNumber || "883-0912-441"}
                </p>
                <p className="text-xs font-semibold text-text-secondary">
                  Atas Nama: {accountHolder || profile.legalName}
                </p>
              </div>
              <span className="text-[11px] font-medium text-primary bg-surface px-3 py-1.5 rounded-full border border-primary/20 shadow-elevation-1 self-start sm:self-center">
                Pencairan Real-time BI-FAST
              </span>
            </div>
          )}

          {isEditing && (
            <div className="flex justify-end pt-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
                className="font-bold px-8 min-h-[44px]"
              >
                {isSaving ? "Menyimpan..." : "Simpan & Konfirmasi Profil"}
              </Button>
            </div>
          )}
        </Card>
      </form>
    </div>
  );
}
