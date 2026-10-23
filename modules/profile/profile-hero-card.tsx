"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Edit3, MapPin } from "lucide-react";
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
import { MapPicker } from "@/components/ui/map-picker";
import { extractCityFromAddress } from "@/lib/utils";

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

  // Form states for editing - matching exactly what the PUT/PATCH endpoint accepts
  const [legalName, setLegalName] = React.useState(profile.legalName);
  const [npwpNib, setNpwpNib] = React.useState(profile.npwpNib);
  const [address, setAddress] = React.useState(profile.address);
  const [phoneNumber, setPhoneNumber] = React.useState(profile.contactPhone || "");
  const [latitude, setLatitude] = React.useState<number | null>(
    // Since latitude/longitude aren't in UnifiedProfileState, we initialize to null
    // In a real implementation, these would come from the entity data
    null
  );
  const [longitude, setLongitude] = React.useState<number | null>(null);

  React.useEffect(() => {
    setLegalName(profile.legalName);
    setNpwpNib(profile.npwpNib);
    setAddress(profile.address);
    setPhoneNumber(profile.contactPhone || "");
    // Note: latitude and longitude are not part of UnifiedProfileState
    // In a complete implementation, these would be fetched from the entity
  }, [profile]);

  // Extract values needed for display
  const brandName = profile.brandName;
  const sectorKey = profile.sector.toUpperCase();
  const sectorMeta =
    SECTOR_MEDIA_MAP[sectorKey] ||
    (role === "supplier" ? SECTOR_MEDIA_MAP.PERTANIAN : SECTOR_MEDIA_MAP.FNB_PENGOLAHAN);
  const initials = (brandName || profile.legalName || "KP").substring(0, 2).toUpperCase();
  const displayCity = React.useMemo(() => {
    return profile.city || extractCityFromAddress(profile.address);
  }, [profile.city, profile.address]);


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
      // Update entity fields - matching exactly what the PUT/PATCH endpoint accepts
      const entityRes = await updateBusinessEntityProfileAction({
        entityId: profile.id,
        legalName: legalName.trim(),
        npwpNib: npwpNib.trim(),
        defaultAddress: address.trim(),
        phoneNumber: phoneNumber.trim(),
        latitude: latitude === null ? undefined : latitude,
        longitude: longitude === null ? undefined : longitude,
      });

      if (entityRes.success) {
        // Prepare the update for the profile state
        const newAddress = address.trim();
        const newCity = extractCityFromAddress(newAddress);
        onProfileUpdated({
          legalName: legalName.trim(),
          npwpNib: npwpNib.trim(),
          address: newAddress,
          city: newCity,
          contactPhone: phoneNumber.trim(),
        });
        setIsEditModalOpen(false);
        toast.success("Profil usaha berhasil diperbarui di backend KUMPUL.");
      } else {
        throw new Error(entityRes.message || "Gagal memperbarui profil.");
      }
    } catch (err) {
      toast.error((err as Error)?.message ?? "Gagal terhubung ke backend server.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-surface shadow-elevation-1 overflow-hidden">
      {/* Cover Gambar Visual Sektor */}
      <div className="relative w-full h-56 sm:h-64 md:h-72 lg:h-80 bg-surface-subtle overflow-hidden">
        <Image
          src={sectorMeta.image}
          alt={sectorMeta.label}
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1200px"
          className="object-cover object-center"
        />
        {/* Soft natural gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/30 pointer-events-none" />

        {/* Badge Sektor di Kiri Atas Cover */}
        <div className="absolute top-4 left-4 sm:top-5 sm:left-6 flex flex-wrap items-center gap-2 z-10">
          <span className="px-3.5 py-1.5 rounded-full bg-surface/95 backdrop-blur-md text-text-primary text-[11px] sm:text-xs font-bold border border-border/80 shadow-xs flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary shrink-0" />
            <span>{sectorMeta.label}</span>
          </span>
        </div>

        {/* Badge Lokasi & Terdaftar di Kanan Atas Cover */}
        <div className="absolute top-4 right-4 sm:top-5 sm:right-6 text-right z-10">
          <span className="px-3.5 py-1.5 rounded-full bg-surface/95 backdrop-blur-md text-text-primary text-[11px] sm:text-xs font-semibold border border-border/80 shadow-xs flex items-center gap-1.5">
            <MapPin className="size-3 text-primary shrink-0" />
            <span>{displayCity}</span>
            <span className="text-text-muted">&bull;</span>
            <span className="text-text-muted">Terdaftar {profile.registrationDate || "2025"}</span>
          </span>
        </div>
      </div>

      {/* Info Detail Profil Usaha */}
      <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-3 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 sm:-mt-12 relative z-10">
          <div className="flex items-end gap-3.5 sm:gap-4">
            <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-primary text-text-inverse border-4 border-surface shadow-elevation-2 flex items-center justify-center font-heading font-extrabold text-2xl sm:text-3xl shrink-0">
              {initials}
            </div>
            <div className="pb-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-text-primary tracking-tight line-clamp-1" title={brandName || profile.legalName}>
                {brandName || profile.legalName}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-text-secondary line-clamp-1" title={profile.legalName}>
                {profile.legalName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 sm:pt-0 w-full sm:w-auto">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="text-xs min-h-[40px] sm:min-h-[36px] w-full sm:w-auto font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Ubah Profil</span>
            </Button>
          </div>
        </div>

        {/* Rincian Identitas Legal & Kontak */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/70 text-xs">
          {/* Kontak Resmi Usaha */}
          <div className="space-y-1">
            <span className="text-text-muted text-[11px] block font-medium">
              Kontak Resmi
            </span>
            <p className="font-semibold text-text-primary font-mono text-xs">
              {profile.contactPhone && profile.contactPhone.trim() ? profile.contactPhone : "Belum terdata"}
            </p>
            <p className="text-text-secondary text-[11px] truncate" title={profile.contactEmail || "-"}>
              {profile.contactEmail || "-"}
            </p>
          </div>

          {/* NIB / NPWP Legal */}
          <div className="space-y-1">
            <span className="text-text-muted text-[11px] block font-medium">
              NIB / NPWP Legal
            </span>
            <p className="font-mono text-text-primary font-semibold text-xs break-all">
              {profile.npwpNib || "-"}
            </p>
            <p className="text-text-secondary text-[11px]">
              Badan Usaha Terverifikasi
            </p>
          </div>

          {/* Alamat Operasional */}
          <div className="space-y-1">
            <span className="text-text-muted text-[11px] block font-medium">
              Alamat Operasional
            </span>
            <p className="text-text-primary text-xs leading-relaxed line-clamp-2" title={profile.address || "-"}>
              {profile.address || "Belum ada alamat terdaftar"}
            </p>
          </div>
        </div>

        {/* Modal Dialog Ubah Profil - showing only fields that match PUT/PATCH endpoint */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-7">
            <DialogHeader>
              <DialogTitle className="font-heading text-lg font-bold text-text-primary">
                Ubah Data Profil {role === "supplier" ? "Supplier" : "UMKM"}
              </DialogTitle>
              <DialogDescription className="text-xs text-text-muted">
                Perbarui identitas usaha dan kontak operasional yang terdaftar di KUMPUL.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                    Nomor Telepon Operasional
                  </label>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="h-10 text-xs font-mono"
                  />
                  <p className="text-[10px] text-text-muted">
                    Nomor WhatsApp / telepon yang aktif untuk koordinasi pesanan dan konfirmasi pengiriman.
                  </p>
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
                  <label className="text-xs font-bold text-text-primary">Latitude &amp; Longitude</label>
                  <MapPicker
                    latitude={latitude}
                    longitude={longitude}
                    onChange={(coords) => {
                      setLatitude(coords.lat);
                      setLongitude(coords.lng);
                    }}
                    className="w-full"
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
                  <span>Batal</span>
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                  className="font-bold text-xs min-h-[40px] px-6"
                >
                  <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}