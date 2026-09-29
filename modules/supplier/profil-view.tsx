"use client";

import * as React from "react";
import { MOCK_SUPPLIER_PROFILE } from "@/constants/supplier";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
            Profil Legalitas &amp; Rekening Usaha
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Data identitas tunggal entitas bisnis (*Single Legal Entity* berbasis NIB/NPWP) dan rekening pencairan escrow.
          </p>
        </div>

        <div>
          {!isEditing ? (
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsEditing(true)}
              className="font-semibold"
            >
              Ubah Kontak Operasional
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="md"
              onClick={() => setIsEditing(false)}
              className="font-semibold text-neutral-600"
            >
              Batal
            </Button>
          )}
        </div>
      </div>

      {/* Informasi Legalitas Badan Usaha */}
      <section className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">
              Identitas Badan Usaha Terdaftar
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Terkunci sesuai verifikasi dokumen legalitas di Kementerian Investasi/OSS.
            </p>
          </div>
          <Badge variant="success" className="font-bold text-xs">
            ✓ NIB Terverifikasi
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100">
            <span className="text-neutral-400 font-semibold block text-[10px] uppercase">
              Nama Resmi Badan Hukum
            </span>
            <p className="text-sm font-bold text-neutral-900 mt-0.5">
              {profile.legalName}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100">
            <span className="text-neutral-400 font-semibold block text-[10px] uppercase">
              Nomor Pokok Wajib Pajak (NPWP) &amp; NIB
            </span>
            <p className="text-xs font-mono font-bold text-neutral-800 mt-1">
              {profile.npwpNib}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100">
            <span className="text-neutral-400 font-semibold block text-[10px] uppercase">
              Kategori Sektor Utama
            </span>
            <p className="text-xs font-bold text-neutral-800 mt-1">
              {profile.sector} &bull; Rantai Pasok Pangan Hulu
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100">
            <span className="text-neutral-400 font-semibold block text-[10px] uppercase">
              Tanggal Terdaftar di Platform KUMPUL
            </span>
            <p className="text-xs font-bold text-neutral-800 mt-1">
              {profile.registrationDate}
            </p>
          </div>
        </div>
      </section>

      {/* Form Kontak Operasional & Alamat Gudang */}
      <section className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="border-b border-neutral-100 pb-3">
          <h2 className="text-base font-bold text-[#0F172A]">
            Kontak Distribusi &amp; Lokasi Gudang Pengiriman
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Digunakan untuk koordinasi armada logistik dan penerbitan surat jalan.
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
            />

            <Input
              id="contactPhone"
              label="Nomor Telepon / WhatsApp Operasional"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              disabled={!isEditing}
              required
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
            />

            <Input
              id="address"
              label="Alamat Gudang Penampungan Utama"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!isEditing}
              required
            />
          </div>

          {isEditing && (
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
                className="font-semibold shadow-xs px-6"
              >
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          )}
        </form>
      </section>

      {/* Rekening Penampungan Escrow Terverifikasi */}
      <section className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">
              Rekening Bank Penampungan Escrow
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Dana pesanan pooling yang telah tiba dan diverifikasi akan dicairkan otomatis ke rekening ini.
            </p>
          </div>
          <Badge variant="success">Kliring Siap</Badge>
        </div>

        <div className="p-4 rounded-xl bg-[#EBF5F0]/60 border border-[#0D3B2E]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#0D3B2E] uppercase tracking-wider">
              {profile.bankInfo.bankName}
            </span>
            <p className="text-lg font-mono font-extrabold text-[#0F172A] tracking-wider">
              {profile.bankInfo.accountNumber}
            </p>
            <p className="text-xs font-semibold text-neutral-600">
              Atas Nama: {profile.bankInfo.accountHolder}
            </p>
          </div>
          <span className="text-[11px] font-medium text-emerald-800 bg-white px-3 py-1.5 rounded-lg border border-emerald-200/60 shadow-2xs self-start sm:self-center">
            Pencairan Maks. 1x24 Jam Kerja
          </span>
        </div>
      </section>
    </div>
  );
}
