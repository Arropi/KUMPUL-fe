"use client";

import * as React from "react";
import { Warehouse, Plus, Minus, AlertCircle, Check, Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import type { BEBusinessRole } from "@/lib/api/types";
import { updateBusinessRoleAction } from "@/actions/business-profile";

interface ProfileStorageCardProps {
  activeRole?: BEBusinessRole;
  allRoles: BEBusinessRole[];
  onRoleUpdated: (updatedRole: BEBusinessRole) => void;
}

export function ProfileStorageCard({
  activeRole,
  allRoles,
  onRoleUpdated,
}: ProfileStorageCardProps) {
  const currentRole = activeRole || allRoles[0];
  const [capacity, setCapacity] = React.useState<number>(
    currentRole?.storage_capacity || 0
  );
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (currentRole) {
      setCapacity(currentRole.storage_capacity || 0);
    }
  }, [currentRole]);

  const handleAdjust = (delta: number) => {
    setCapacity((prev) => Math.max(0, prev + delta));
  };

  const handleSaveCapacity = async () => {
    if (!currentRole?.id) {
      toast.error("ID Peran usaha tidak ditemukan.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateBusinessRoleAction(currentRole.id, {
        storage_capacity: Number(capacity) || 0,
      });

      if (res.success && res.data) {
        onRoleUpdated(res.data);
        toast.success(
          `Kapasitas penyimpanan berhasil diperbarui menjadi ${capacity.toLocaleString("id-ID")} Kg.`,
          "Penyimpanan Tersimpan"
        );
      } else {
        toast.error(res.message || "Gagal memperbarui kapasitas penyimpanan.");
      }
    } catch {
      toast.error("Terjadi kendala saat memperbarui kapasitas penyimpanan.");
    } finally {
      setIsSaving(false);
    }
  };

  const isStorageIncomplete = capacity <= 0;

  return (
    <Card id="section-storage" className="rounded-2xl border-border bg-surface shadow-elevation-1">
      <CardHeader className="pb-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-cyan-600" />
            <span>Kapasitas Ruang Penyimpanan &amp; Gudang</span>
          </CardTitle>
          <CardDescription className="text-xs text-text-secondary mt-0.5">
            Kapasitas simpan komoditas bahan baku atau gudang transit yang dimiliki usaha Anda.
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          {isStorageIncomplete ? (
            <Badge variant="warning" className="text-[10px] font-bold py-0.5">
              ⚠️ Belum Diatur
            </Badge>
          ) : (
            <Badge variant="success" className="text-[10px] font-bold py-0.5">
              <Check className="w-3 h-3 mr-1" />
              Tersedia
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-5">
        {isStorageIncomplete && (
          <div className="p-3.5 rounded-xl border border-cyan-300 bg-cyan-50/50 flex items-start gap-3 text-xs text-cyan-950">
            <AlertCircle className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Kapasitas Masih 0 Kg</span>
              <span className="text-[11px] text-cyan-800">
                Atur estimasi daya tampung ruang penyimpanan bahan baku usaha Anda untuk mempermudah alokasi distribusi pooling KUMPUL.
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Sisi Kiri: Angka Kapasitas & Pengaturan Cepat */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-text-primary block">
              Daya Tampung Penyimpanan (Kilogram / Kg)
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAdjust(-50)}
                disabled={capacity <= 0 || isSaving}
                className="h-11 w-11 p-0 shrink-0 text-text-primary rounded-xl"
                aria-label="Kurangi 50 kg"
              >
                <Minus className="w-4 h-4" />
              </Button>

              <Input
                type="number"
                min={0}
                step={10}
                value={capacity}
                onChange={(e) => setCapacity(Math.max(0, Number(e.target.value) || 0))}
                className="h-11 text-center font-bold text-base sm:text-lg font-mono rounded-xl"
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAdjust(50)}
                disabled={isSaving}
                className="h-11 w-11 p-0 shrink-0 text-text-primary rounded-xl"
                aria-label="Tambah 50 kg"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Adjustment Buttons (Penambahan / Pengurangan cepat) */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] font-semibold text-text-muted mr-1">Sesuaikan:</span>
              <button
                type="button"
                onClick={() => handleAdjust(-100)}
                disabled={capacity < 100 || isSaving}
                className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-medium text-text-secondary hover:bg-surface-subtle disabled:opacity-40"
              >
                -100 Kg
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(100)}
                disabled={isSaving}
                className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-medium text-text-secondary hover:bg-surface-subtle"
              >
                +100 Kg
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(500)}
                disabled={isSaving}
                className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-medium text-text-secondary hover:bg-surface-subtle"
              >
                +500 Kg
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(1000)}
                disabled={isSaving}
                className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-medium text-text-secondary hover:bg-surface-subtle"
              >
                +1 Ton
              </button>
            </div>
          </div>

          {/* Sisi Kanan: Konversi & Info Ringkasan */}
          <div className="p-4 rounded-xl bg-surface-subtle/70 border border-border space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border/60">
              <span className="text-text-secondary">Ekuivalen Satuan Ton:</span>
              <span className="font-bold text-text-primary font-mono">
                {(capacity / 1000).toFixed(2)} Ton
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-border/60">
              <span className="text-text-secondary">Ekuivalen Satuan Karung (50 kg):</span>
              <span className="font-bold text-text-primary font-mono">
                {Math.floor(capacity / 50)} Karung
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Peran Terkait:</span>
              <span className="font-bold text-primary">
                {currentRole?.role_type || "UMKM"} ({currentRole?.sector_type || "FNB"})
              </span>
            </div>
          </div>
        </div>

        {/* Action Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSaveCapacity}
            isLoading={isSaving}
            className="font-bold gap-1.5 px-6 min-h-[40px]"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Kapasitas Penyimpanan</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
