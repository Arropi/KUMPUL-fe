"use client";

import * as React from "react";
import { Building2, MapPin, FileText, Edit2, Check, X, Compass, Copy } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type { BEBusinessEntity } from "@/lib/api/types";
import { updateBusinessEntityProfileAction } from "@/actions/business-profile";

interface ProfileLegalInfoCardProps {
  entity: BEBusinessEntity;
  onEntityUpdated: (updatedEntity: BEBusinessEntity) => void;
}

export function ProfileLegalInfoCard({
  entity,
  onEntityUpdated,
}: ProfileLegalInfoCardProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Form states
  const [legalName, setLegalName] = React.useState(entity.legal_name || "");
  const [defaultAddress, setDefaultAddress] = React.useState(entity.default_address || "");
  const [latitude, setLatitude] = React.useState<string>(
    entity.latitude !== null && entity.latitude !== undefined ? String(entity.latitude) : ""
  );
  const [longitude, setLongitude] = React.useState<string>(
    entity.longitude !== null && entity.longitude !== undefined ? String(entity.longitude) : ""
  );

  React.useEffect(() => {
    setLegalName(entity.legal_name || "");
    setDefaultAddress(entity.default_address || "");
    setLatitude(entity.latitude !== null && entity.latitude !== undefined ? String(entity.latitude) : "");
    setLongitude(entity.longitude !== null && entity.longitude !== undefined ? String(entity.longitude) : "");
  }, [entity]);

  const handleCancel = () => {
    setLegalName(entity.legal_name || "");
    setDefaultAddress(entity.default_address || "");
    setLatitude(entity.latitude !== null && entity.latitude !== undefined ? String(entity.latitude) : "");
    setLongitude(entity.longitude !== null && entity.longitude !== undefined ? String(entity.longitude) : "");
    setIsEditing(false);
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin ke clipboard.`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalName.trim()) {
      toast.error("Nama legalitas usaha tidak boleh kosong.");
      return;
    }
    if (!defaultAddress.trim()) {
      toast.error("Alamat operasional usaha tidak boleh kosong.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateBusinessEntityProfileAction({
        entityId: entity.id,
        legalName: legalName.trim(),
        defaultAddress: defaultAddress.trim(),
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      });

      if (res.success && res.entity) {
        onEntityUpdated(res.entity);
        setIsEditing(false);
        toast.success("Informasi identitas legalitas usaha berhasil diperbarui.");
      } else {
        toast.error(res.message || "Gagal memperbarui informasi usaha.");
      }
    } catch {
      toast.error("Gagal terhubung ke backend server.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl border-border bg-surface shadow-elevation-1">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                Identitas Usaha &amp; Legalitas
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary mt-0.5">
                Data resmi entitas bisnis untuk verifikasi faktur bursa dan sertifikasi kepatuhan.
              </CardDescription>
            </div>
          </div>
          {!isEditing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-xs h-8 px-3 font-semibold text-text-primary"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1.5" />
              <span>Ubah Identitas</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">
                  Nama Badan Usaha / Brand <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Contoh: PT Agro Boga Lestari"
                  className="w-full h-11 text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">
                  Nomor NIB / NPWP (Terdaftar di Sistem)
                </label>
                <Input
                  type="text"
                  value={entity.npwp_nib || "-"}
                  disabled
                  className="w-full h-11 text-xs sm:text-sm font-mono bg-muted text-text-muted cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-text-primary">
                  Alamat Dapur / Gudang Utama <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={defaultAddress}
                  onChange={(e) => setDefaultAddress(e.target.value)}
                  placeholder="Alamat lengkap lokasi operasional/dapur..."
                  className="w-full p-3 rounded-xl border border-border bg-surface text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">
                  Latitude Koordinat GPS (Opsional)
                </label>
                <Input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="-7.2575"
                  className="w-full h-11 text-xs sm:text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">
                  Longitude Koordinat GPS (Opsional)
                </label>
                <Input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="112.7521"
                  className="w-full h-11 text-xs sm:text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-xs font-semibold h-10 px-4 text-text-secondary"
              >
                <X className="w-3.5 h-3.5 mr-1.5" />
                <span>Batal</span>
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
                className="font-bold text-xs min-h-[40px] px-5"
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-surface-subtle border border-border/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-[11px] font-medium flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Nama Legal Entitas</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(entity.legal_name, "Nama legal")}
                  className="text-text-muted hover:text-text-primary transition-colors p-1"
                  title="Salin nama"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <p className="font-bold text-text-primary text-sm sm:text-base">
                {entity.legal_name || "Belum diisi"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-subtle border border-border/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-[11px] font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Nomor NIB / NPWP</span>
                </span>
                {entity.npwp_nib && (
                  <button
                    type="button"
                    onClick={() => handleCopy(entity.npwp_nib, "NIB/NPWP")}
                    className="text-text-muted hover:text-text-primary transition-colors p-1"
                    title="Salin NIB/NPWP"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="font-mono font-bold text-text-primary text-sm sm:text-base">
                {entity.npwp_nib || "Tidak tercantum"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-subtle border border-border/70 space-y-1 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-[11px] font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Alamat Operasional Terdaftar</span>
                </span>
                {entity.default_address && (
                  <button
                    type="button"
                    onClick={() => handleCopy(entity.default_address, "Alamat")}
                    className="text-text-muted hover:text-text-primary transition-colors p-1"
                    title="Salin alamat"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-text-primary font-medium text-xs sm:text-sm leading-relaxed">
                {entity.default_address || "Belum ada alamat terdaftar"}
              </p>
              {(entity.latitude !== null && entity.longitude !== null && entity.latitude !== undefined && entity.longitude !== undefined) && (
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-text-muted font-mono">
                  <Compass className="w-3 h-3 text-primary" />
                  <span>{entity.latitude}, {entity.longitude}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
