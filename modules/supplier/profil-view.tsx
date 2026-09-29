"use client";

import * as React from "react";
import { MOCK_SUPPLIER_PROFILE } from "@/constants/supplier";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";

export function SupplierProfilView() {
  const [profile, setProfile] = React.useState(MOCK_SUPPLIER_PROFILE);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Form Fields
  const [brandName, setBrandName] = React.useState(profile.brandName);
  const [contactEmail, setContactEmail] = React.useState(profile.contactEmail);
  const [contactPhone, setContactPhone] = React.useState(profile.contactPhone);
  const [address, setAddress] = React.useState(profile.address);

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
        contactEmail,
        contactPhone,
        address,
      }));
      setIsSaving(false);
      setIsEditing(false);
      setToast({
        isOpen: true,
        title: "Profil Diperbarui",
        message: "Data profil usaha dan kontak operasional berhasil disimpan.",
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary text-balance">
            Profil Legalitas &amp; Rekening Usaha
          </h1>
          <p className="font-body text-xs sm:text-sm text-text-secondary mt-1 text-pretty">
            Data identitas tunggal entitas bisnis (Single Legal Entity berbasis NIB/NPWP) dan rekening pencairan escrow platform.
          </p>
        </div>

        <div>
          {!isEditing ? (
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsEditing(true)}
              className="font-semibold min-h-[44px]"
            >
              Ubah Kontak Operasional
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

      {/* Informasi Legalitas Badan Usaha */}
      <Card className="p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="font-heading font-bold text-base text-text-primary">
              Identitas Badan Usaha Terdaftar
            </h2>
            <p className="font-body text-xs text-text-secondary mt-0.5 text-pretty">
              Terkunci sesuai verifikasi dokumen legalitas resmi di Kementerian Investasi/OSS.
            </p>
          </div>
          <Badge variant="success" className="font-bold text-xs">
            ✓ NIB Terverifikasi
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-background border border-border">
            <span className="text-text-muted font-semibold block text-[10px]">
              Nama Resmi Badan Hukum
            </span>
            <p className="font-heading text-sm font-bold text-text-primary mt-0.5">
              {profile.legalName}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border">
            <span className="text-text-muted font-semibold block text-[10px]">
              Nomor Pokok Wajib Pajak (NPWP) &amp; NIB
            </span>
            <p className="text-xs font-mono font-bold text-text-primary mt-1 tabular-nums">
              {profile.npwpNib}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border">
            <span className="text-text-muted font-semibold block text-[10px]">
              Kategori Sektor Utama
            </span>
            <p className="text-xs font-bold text-text-primary mt-1">
              {profile.sector} &bull; Rantai Pasok Pangan Hulu
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border">
            <span className="text-text-muted font-semibold block text-[10px]">
              Tanggal Terdaftar di Platform KUMPUL
            </span>
            <p className="text-xs font-bold text-text-primary mt-1 tabular-nums">
              {profile.registrationDate}
            </p>
          </div>
        </div>
      </Card>

      {/* Form Kontak Operasional & Alamat Gudang */}
      <Card className="p-5 sm:p-7 space-y-5">
        <div className="border-b border-border pb-3">
          <h2 className="font-heading font-bold text-base text-text-primary">
            Kontak Distribusi &amp; Lokasi Gudang Pengiriman
          </h2>
          <p className="font-body text-xs text-text-secondary mt-0.5 text-pretty">
            Digunakan untuk koordinasi armada logistik pengiriman dan penerbitan surat jalan.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              label="Nomor Telepon / WhatsApp Operasional"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              disabled={!isEditing}
              required
              className="min-h-[44px] tabular-nums"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="contactEmail"
              label="Email Operasional Pengadaan"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              disabled={!isEditing}
              required
              className="min-h-[44px]"
            />

            <Input
              id="address"
              label="Alamat Gudang Penampungan Utama"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!isEditing}
              required
              className="min-h-[44px]"
            />
          </div>

          {isEditing && (
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
                className="font-semibold px-6 min-h-[44px]"
              >
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          )}
        </form>
      </Card>

      {/* Rekening Penampungan Escrow Terverifikasi */}
      <Card className="p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="font-heading font-bold text-base text-text-primary">
              Rekening Bank Penampungan Escrow
            </h2>
            <p className="font-body text-xs text-text-secondary mt-0.5 text-pretty">
              Dana pesanan pooling yang telah tiba dan diverifikasi akan dicairkan otomatis ke rekening ini.
            </p>
          </div>
          <Badge variant="success">Kliring Siap</Badge>
        </div>

        <div className="p-4 rounded-xl bg-[#EBF5F0]/70 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-primary block">
              {profile.bankInfo.bankName}
            </span>
            <p className="text-lg font-mono font-extrabold text-text-primary tabular-nums">
              {profile.bankInfo.accountNumber}
            </p>
            <p className="text-xs font-semibold text-text-secondary">
              Atas Nama: {profile.bankInfo.accountHolder}
            </p>
          </div>
          <span className="text-[11px] font-medium text-primary bg-surface px-3 py-1.5 rounded-full border border-primary/20 shadow-elevation-1 self-start sm:self-center">
            Pencairan Maks. 1x24 Jam Kerja
          </span>
        </div>
      </Card>
    </div>
  );
}
