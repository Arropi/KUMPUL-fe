"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MOCK_UMKM_PROFILE, type UMKMBusinessProfile } from "@/constants/umkm";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { switchRoleAction } from "@/actions/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function UmkmProfilView() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<UMKMBusinessProfile>(MOCK_UMKM_PROFILE);
  const [isSavedModalOpen, setIsSavedModalOpen] = React.useState(false);
  const [isSwitching, setIsSwitching] = React.useState(false);

  const handleSwitchToSupplier = async () => {
    if (isSwitching) return;
    setIsSwitching(true);
    toast.info("Menyiapkan akun & beralih ke portal Supplier...", "Beralih Peran Usaha");
    try {
      const res = await switchRoleAction("supplier");
      if (res.success) {
        toast.success(
          res.autoCreatedInDb
            ? "Akun Mitra Supplier baru otomatis dibuat & diaktifkan."
            : "Berhasil beralih ke portal Mitra Supplier.",
          "Beralih Peran Usaha"
        );
        router.push(res.redirectTo);
        router.refresh();
      } else {
        window.location.href = "/api/auth/switch-role?to=supplier&next=/supplier";
      }
    } catch {
      window.location.href = "/api/auth/switch-role?to=supplier&next=/supplier";
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavedModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-text-muted">
              Identitas Pelaku Usaha &amp; Hub Logistik
            </span>
          </div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary mt-1">
            Profil Usaha &amp; Preferensi Hub
          </h1>
          <p className="font-body text-xs sm:text-sm text-text-secondary mt-1">
            Atur titik dapur untuk optimasi logistik hub konsolidasi dan data rekening penampung transaksi bursa.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="md"
          disabled={isSwitching}
          onClick={handleSwitchToSupplier}
          className="shrink-0 font-semibold min-h-[44px] flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isSwitching ? (
            <>
              <svg className="w-4 h-4 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Menyiapkan Akun...</span>
            </>
          ) : (
            <>
              <span>Beralih ke Portal Supplier</span>
              <span aria-hidden="true">&rarr;</span>
            </>
          )}
        </Button>
      </div>

      {/* 2. Form Profil */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bagian 1: Data Badan Usaha */}
        <Card className="rounded-2xl border-border bg-surface shadow-elevation-1">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold text-text-primary">
              Informasi Usaha &amp; Legalitas
            </CardTitle>
            <CardDescription className="text-xs text-text-secondary mt-0.5">
              Data usaha untuk keperluan faktur pengadaan bahan baku dan kuota pooling KUMPUL.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">Nama Usaha / Warung</label>
                <Input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full h-11 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">Sektor Industri Pangan</label>
                <Input
                  type="text"
                  disabled
                  value={profile.sectorLabel}
                  className="w-full h-11 text-xs sm:text-sm bg-muted text-text-muted cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">Penanggung Jawab (Owner / PIC)</label>
                <Input
                  type="text"
                  value={profile.ownerName}
                  onChange={(e) => setProfile({ ...profile, ownerName: e.target.value })}
                  className="w-full h-11 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">NIB / NPWP Terdaftar</label>
                <Input
                  type="text"
                  value={profile.nibNpwp}
                  onChange={(e) => setProfile({ ...profile, nibNpwp: e.target.value })}
                  className="w-full h-11 text-xs sm:text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">Email Operasional</label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full h-11 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">Nomor WhatsApp Aktif</label>
                <Input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full h-11 text-xs sm:text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bagian 2: Titik Dapur & Preferensi Hub */}
        <Card className="rounded-2xl border-border bg-surface shadow-elevation-1">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold text-text-primary">
              Lokasi Dapur &amp; Hub Konsolidasi Terpilih
            </CardTitle>
            <CardDescription className="text-xs text-text-secondary mt-0.5">
              Hub terdekat menjadi titik kumpul pesanan pooling untuk memotong ongkos kirim armada bersama.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-text-primary">Alamat Lengkap Dapur / Produksi</label>
                <textarea
                  rows={2}
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full p-3 rounded-xl border border-border bg-surface text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">Kota / Kabupaten</label>
                <Input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="w-full h-11 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">Preferensi Hub Konsolidasi</label>
                <select
                  value={profile.preferredHubName}
                  onChange={(e) => setProfile({ ...profile, preferredHubName: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="Hub Konsolidasi Rungkut Pangan">Hub Konsolidasi Rungkut Pangan (Surabaya Timur)</option>
                  <option value="Hub Konsolidasi Margomulyo Logistik">Hub Konsolidasi Margomulyo Logistik (Surabaya Barat)</option>
                  <option value="Hub Konsolidasi Sidoarjo Dingin">Hub Konsolidasi Sidoarjo Dingin (Rantai Dingin)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bagian 3: Rekening Bank Penampung */}
        <Card className="rounded-2xl border-border bg-surface shadow-elevation-1">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold text-text-primary">
              Rekening Penampung Pendapatan &amp; Refund
            </CardTitle>
            <CardDescription className="text-xs text-text-secondary mt-0.5">
              Untuk transfer pembayaran bursa limbah sirkular atau pengembalian selisih kuota pooling.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">Nama Bank</label>
                <Input
                  type="text"
                  value={profile.bankAccount.bankName}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      bankAccount: { ...profile.bankAccount, bankName: e.target.value },
                    })
                  }
                  className="w-full h-11 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">Nomor Rekening</label>
                <Input
                  type="text"
                  value={profile.bankAccount.accountNumber}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      bankAccount: { ...profile.bankAccount, accountNumber: e.target.value },
                    })
                  }
                  className="w-full h-11 text-xs sm:text-sm font-mono tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">Nama Pemilik Rekening</label>
                <Input
                  type="text"
                  value={profile.bankAccount.accountHolder}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      bankAccount: { ...profile.bankAccount, accountHolder: e.target.value },
                    })
                  }
                  className="w-full h-11 text-xs sm:text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tombol Simpan */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="default"
            className="font-bold min-h-[44px] px-6"
          >
            Simpan Perubahan Profil
          </Button>
        </div>
      </form>

      {/* Modal Konfirmasi Berhasil */}
      <Dialog open={isSavedModalOpen} onOpenChange={setIsSavedModalOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-6 text-center">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 mx-auto flex items-center justify-center font-bold text-xl">
              ✓
            </div>
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="font-heading text-lg font-bold text-text-primary">
                Profil Berhasil Diperbarui
              </DialogTitle>
              <DialogDescription className="text-xs text-text-muted mt-1">
                Preferensi Hub Konsolidasi dan data rekening penampung telah tersimpan di sistem platform KUMPUL.
              </DialogDescription>
            </DialogHeader>

            <Button
              variant="primary"
              size="default"
              onClick={() => setIsSavedModalOpen(false)}
              className="w-full font-bold min-h-[44px]"
            >
              Selesai
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
