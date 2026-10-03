"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Edit3, Check, X, ShieldCheck, MapPin, Phone, Mail, User, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SECTOR_MEDIA_MAP, type UnifiedProfileState } from "./types";
import { updateBusinessEntityProfileAction } from "@/actions/business-profile";

interface ProfileHeroCardProps {
  role: "supplier" | "umkm";
  profile: UnifiedProfileState;
  onProfileUpdated: (updated: Partial<UnifiedProfileState>) => void;
}

export function ProfileHeroCard({
  role,
  profile,
  onProfileUpdated,
}: ProfileHeroCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Form states for editing
  const [brandName, setBrandName] = React.useState(profile.brandName);
  const [legalName, setLegalName] = React.useState(profile.legalName);
  const [picName, setPicName] = React.useState(profile.picName);
  const [picTitle, setPicTitle] = React.useState(profile.picTitle);
  const [contactPhone, setContactPhone] = React.useState(profile.contactPhone);
  const [contactEmail, setContactEmail] = React.useState(profile.contactEmail);
  const [npwpNib, setNpwpNib] = React.useState(profile.npwpNib);
  const [address, setAddress] = React.useState(profile.address);
  const [city, setCity] = React.useState(profile.city);

  React.useEffect(() => {
    setBrandName(profile.brandName);
    setLegalName(profile.legalName);
    setPicName(profile.picName);
    setPicTitle(profile.picTitle);
    setContactPhone(profile.contactPhone);
    setContactEmail(profile.contactEmail);
    setNpwpNib(profile.npwpNib);
    setAddress(profile.address);
    setCity(profile.city);
  }, [profile]);

  const sectorKey = profile.sector.toUpperCase();
  const sectorMeta =
    SECTOR_MEDIA_MAP[sectorKey] ||
    (role === "supplier" ? SECTOR_MEDIA_MAP.PERTANIAN : SECTOR_MEDIA_MAP.FNB_PENGOLAHAN);

  const initials = (brandName || profile.legalName || "KP").substring(0, 2).toUpperCase();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalName.trim()) {
      toast.error("Nama legalitas usaha wajib diisi.");
      return;
    }
    if (!address.trim()) {
      toast.error("Alamat operasional usaha wajib diisi.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateBusinessEntityProfileAction({
        entityId: profile.id,
        legalName: legalName.trim(),
        npwpNib: npwpNib.trim(),
        defaultAddress: address.trim(),
      });

      if (res.success) {
        onProfileUpdated({
          brandName: brandName.trim() || legalName.trim(),
          legalName: legalName.trim(),
          picName: picName.trim(),
          picTitle: picTitle.trim(),
          contactPhone: contactPhone.trim(),
          contactEmail: contactEmail.trim(),
          npwpNib: npwpNib.trim(),
          address: address.trim(),
          city: city.trim(),
        });
        setIsEditModalOpen(false);
        toast.success("Profil usaha berhasil diperbarui di backend KUMPUL.");
      } else {
        toast.error(res.message || "Gagal memperbarui profil.");
      }
    } catch {
      toast.error("Gagal terhubung ke backend server.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            <span>{profile.complianceStatus || "TERVERIFIKASI"}</span>
          </Badge>
        </div>

        <div className="absolute bottom-3 right-4 sm:bottom-4 sm:right-6 text-right">
          <span className="text-[11px] text-white/90 font-medium tracking-wide">
            {profile.city || "Jawa Timur"} &bull; Terdaftar sejak {profile.registrationDate || "2025"}
          </span>
        </div>
      </div>

      {/* Info Detail Profil Usaha */}
      <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-3 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 relative z-10">
          <div className="flex items-end gap-3.5 sm:gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary text-text-inverse border-4 border-surface shadow-elevation-2 flex items-center justify-center font-heading font-extrabold text-2xl sm:text-3xl shrink-0">
              {initials}
            </div>
            <div className="pb-1">
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-text-primary tracking-tight">
                {profile.brandName || profile.legalName}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-text-secondary">
                {profile.legalName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            {role === "supplier" ? (
              <Button asChild variant="primary" size="sm" className="font-bold text-xs h-9">
                <Link href="/katalog/tambah">
                  <span>+ Tambah Katalog</span>
                </Link>
              </Button>
            ) : (
              <Button asChild variant="primary" size="sm" className="font-bold text-xs h-9">
                <Link href="/produk">
                  <span>+ Tambah Produk</span>
                </Link>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="text-xs h-9 font-semibold flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Ubah Profil</span>
            </Button>
          </div>
        </div>

        {/* Rincian Identitas Legal & Kontak PIC */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-2 border-t border-border/70 text-xs">
          <div className="space-y-1">
            <span className="text-text-muted text-[11px] flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>Nama Penanggung Jawab (PIC)</span>
            </span>
            <p className="font-semibold text-text-primary">
              {profile.picName || "Penanggung Jawab"}
              <span className="block text-[11px] text-text-secondary font-normal">
                {profile.picTitle || (role === "supplier" ? "Head of Operations & Supply" : "Owner / Pengelola Usaha")}
              </span>
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-text-muted text-[11px] flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>Kontak Resmi Usaha</span>
            </span>
            <p className="font-semibold text-text-primary">{profile.contactPhone || "-"}</p>
            <p className="text-text-secondary text-[11px] truncate flex items-center gap-1">
              <Mail className="w-2.5 h-2.5" />
              <span>{profile.contactEmail || "-"}</span>
            </p>
          </div>

          <div className="space-y-1 sm:col-span-2 md:col-span-1">
            <span className="text-text-muted text-[11px] flex items-center gap-1">
              <Building className="w-3 h-3" />
              <span>NIB / NPWP Legal</span>
            </span>
            <p className="font-mono text-text-primary font-medium text-[11px] break-all">
              {profile.npwpNib || "-"}
            </p>
            <p className="text-text-secondary text-[11px] truncate flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{profile.address || "-"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Modal Dialog Ubah Profil */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-text-primary">
              Ubah Data Profil {role === "supplier" ? "Supplier" : "UMKM"}
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted">
              Perbarui identitas usaha, kontak operasional penanggung jawab, dan alamat legalitas Anda.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-text-primary">
                  Nama Brand / Merek Usaha
                </label>
                <Input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Contoh: AgroNusantara Supply"
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-text-primary">
                  Nama Badan Usaha (Legal) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Contoh: PT Agroniaga Nusantara Sejahtera"
                  className="h-10 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Nama PIC</label>
                <Input
                  type="text"
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  placeholder="Contoh: Hendra Pratama"
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Jabatan PIC</label>
                <Input
                  type="text"
                  value={picTitle}
                  onChange={(e) => setPicTitle(e.target.value)}
                  placeholder="Contoh: Head of Operations"
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">No. Telepon / WhatsApp</label>
                <Input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="h-10 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Email Operasional</label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="kontak@usaha.com"
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-text-primary">NIB / NPWP Legal</label>
                <Input
                  type="text"
                  value={npwpNib}
                  onChange={(e) => setNpwpNib(e.target.value)}
                  placeholder="Contoh: 9120003481923 / 01.892.341.2-045.000"
                  className="h-10 text-xs font-mono"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-text-primary">
                  Alamat Lengkap Operasional / Dapur <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat lengkap lokasi operasional..."
                  className="w-full p-2.5 rounded-xl border border-border bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  required
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-text-primary">Kota / Kabupaten</label>
                <Input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Contoh: Surabaya"
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
                className="text-xs font-semibold h-10 px-4 text-text-secondary"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                <span>Batal</span>
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
                className="font-bold text-xs min-h-[40px] px-6"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
