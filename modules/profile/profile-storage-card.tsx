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
          `Kapasitas penyimpanan berhasil diperbarui menjadi ${capacity.toLocaleString("id-ID")} Unit.`,
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

  return (
    <Card id="section-storage" className="rounded-2xl border-border bg-surface shadow-elevation-1 h-full flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-text-primary">
              Kapasitas Ruang Penyimpanan
            </CardTitle>
            <CardDescription className="text-xs text-text-secondary mt-0.5">
              Daya tampung komoditas usaha Anda ({currentRole?.role_type || "UMKM"}).
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Informasi Perhitungan Satuan Unit */}
          <div className="p-3 rounded-xl border border-border bg-surface-subtle flex items-start gap-2.5 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold block text-text-primary text-xs">Perhitungan Satuan Unit</span>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Kapasitas dihitung <strong>per Unit</strong>. Contoh: 100 kg bahan baku = 100 unit kapasitas penyimpanan.
              </p>
            </div>
          </div>

          {/* Stepper Input & Tombol Cepat */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary block">
              Daya Tampung Saat Ini (Satuan Unit)
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAdjust(-50)}
                disabled={capacity <= 0 || isSaving}
                className="h-10 w-10 p-0 shrink-0 rounded-xl"
                aria-label="Kurangi 50 unit"
              >
                <Minus className="w-4 h-4" />
              </Button>

              <div className="relative flex-1">
                <Input
                  type="number"
                  min={0}
                  step={10}
                  value={capacity}
                  onChange={(e) => setCapacity(Math.max(0, Number(e.target.value) || 0))}
                  className="h-10 text-center font-bold text-base font-mono rounded-xl pr-14"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">
                  Unit
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAdjust(50)}
                disabled={isSaving}
                className="h-10 w-10 p-0 shrink-0 rounded-xl"
                aria-label="Tambah 50 unit"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Adjustment Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-text-muted mr-0.5">Cepat:</span>
              <button
                type="button"
                onClick={() => handleAdjust(-50)}
                disabled={capacity < 50 || isSaving}
                className="px-2 py-0.5 rounded-lg border border-border text-[11px] font-medium text-text-secondary hover:bg-surface-subtle disabled:opacity-40 cursor-pointer"
              >
                -50
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(50)}
                disabled={isSaving}
                className="px-2 py-0.5 rounded-lg border border-border text-[11px] font-medium text-text-secondary hover:bg-surface-subtle cursor-pointer"
              >
                +50
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(100)}
                disabled={isSaving}
                className="px-2 py-0.5 rounded-lg border border-border text-[11px] font-medium text-text-secondary hover:bg-surface-subtle cursor-pointer"
              >
                +100
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(500)}
                disabled={isSaving}
                className="px-2 py-0.5 rounded-lg border border-border text-[11px] font-medium text-text-secondary hover:bg-surface-subtle cursor-pointer"
              >
                +500
              </button>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Action Footer */}
      <div className="p-4 sm:p-5 pt-3 flex items-center justify-between border-t border-border/60 mt-3">
        <span className="text-[11px] text-text-muted font-medium">
          Tersimpan: <strong className="text-text-primary font-mono">{capacity.toLocaleString("id-ID")} Unit</strong>
        </span>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleSaveCapacity}
          isLoading={isSaving}
          className="font-bold gap-1.5 px-4 h-9 text-xs"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Simpan Kapasitas</span>
        </Button>
      </div>
    </Card>
  );
}
