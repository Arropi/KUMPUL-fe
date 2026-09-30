"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MOCK_SUPPLIER_PROFILE } from "@/constants/supplier";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FloatingInput } from "@/components/ui/floating-input";
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

  // Bank Info Fields
  const [bankName, setBankName] = React.useState(profile.bankInfo.bankName || BANK_OPTIONS[0]);
  const [accountNumber, setAccountNumber] = React.useState(profile.bankInfo.accountNumber || "");
  const [accountHolder, setAccountHolder] = React.useState(
    profile.bankInfo.accountHolder || profile.legalName
  );

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

      setToast({
        isOpen: true,
        title: "Rekening Tersimpan",
        message: "Rekening settlement escrow aktif untuk pencairan dana otomatis.",
        type: "success",
      });
    }, 500);
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <Toast
        isOpen={toast.isOpen}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Banner Ringkas Onboarding */}
      {!isProfileComplete && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 font-bold text-xs">
              !
            </span>
            <p className="text-xs text-text-primary font-medium">
              Lengkapi rekening escrow untuk mengaktifkan akses tambah katalog komoditas.
            </p>
          </div>
          {!isEditing && (
            <Button
              type="button"
              variant="accent"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="font-bold text-xs h-8 px-3 shrink-0"
            >
              Lengkapi
            </Button>
          )}
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="font-heading font-bold text-xl text-text-primary">
            Rekening Settlement Escrow
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            {profile.legalName} &bull; {profile.npwpNib}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isProfileComplete && !isEditing && (
            <Button asChild variant="primary" size="sm" className="font-bold text-xs h-9">
              <Link href="/supplier/katalog/tambah">
                <span>+ Tambah Katalog</span>
              </Link>
            </Button>
          )}

          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-xs h-9 font-semibold"
            >
              Ubah Rekening
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="text-xs h-9 font-semibold text-text-secondary"
            >
              Batal
            </Button>
          )}
        </div>
      </div>

      {/* Form Input Rekening */}
      <Card className="p-5 sm:p-6 rounded-2xl border border-border bg-surface shadow-xs">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/70">
            <span className="font-heading font-bold text-sm text-text-primary">
              Informasi Rekening Bank
            </span>
            {isProfileComplete ? (
              <Badge variant="success" className="text-[11px] font-semibold">
                ✓ Aktif
              </Badge>
            ) : (
              <Badge variant="warning" className="text-[11px] font-semibold">
                Belum Terisi
              </Badge>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3 pt-1">
              {/* Dropdown Bank (1 judul hint terpadu dari Watermelon) */}
              <InlineDisclosureSelect
                id="bankNameSelect"
                label="Pilihan Bank Penampung"
                options={BANK_OPTIONS}
                value={bankName}
                onChange={(val) => setBankName(val)}
              />

              {/* Nomor Rekening (1 judul hint terpadu dari FloatingInput) */}
              <FloatingInput
                id="accountNumberInput"
                label="Nomor Rekening Bank"
                placeholder="Contoh: 8830912441"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                className="font-mono"
              />

              {/* Nama Pemilik Rekening (1 judul hint terpadu dari FloatingInput) */}
              <FloatingInput
                id="accountHolderInput"
                label="Nama Pemilik Rekening (Sesuai Buku Tabungan)"
                placeholder="Contoh: PT Agroniaga Nusantara Sejahtera"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                required
              />

              <div className="flex justify-end pt-2">
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
            <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary font-heading">
                  {bankName}
                </span>
                <span className="text-[10px] text-success font-semibold bg-success/10 px-2 py-0.5 rounded-md">
                  BI-FAST Siap
                </span>
              </div>

              <div>
                <p className="text-lg font-mono font-bold text-text-primary tracking-wide tabular-nums">
                  {accountNumber || "883-0912-441"}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Atas Nama: <span className="font-semibold text-text-primary">{accountHolder || profile.legalName}</span>
                </p>
              </div>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
