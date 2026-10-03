"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Plus, Trash2, ArrowRightLeft, Check, Layers, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { BEBusinessRole } from "@/lib/api/types";
import {
  createBusinessRoleAction,
  deleteBusinessRoleAction,
} from "@/actions/business-profile";
import { switchRoleAction } from "@/actions/auth";

interface ProfileRolesCardProps {
  entityId: string;
  roles: BEBusinessRole[];
  currentRoleType?: "umkm" | "supplier";
  onRolesUpdated: (updatedRoles: BEBusinessRole[]) => void;
}

const SECTOR_OPTIONS = [
  { value: "FNB_PENGOLAHAN", label: "F&B / Pengolahan Pangan", forRole: "UMKM" },
  { value: "KATERING", label: "Katering & Jasa Boga", forRole: "UMKM" },
  { value: "RITEL_WARUNG", label: "Ritel & Warung Kelontong", forRole: "UMKM" },
  { value: "PERTANIAN", label: "Pertanian & Hortikultura", forRole: "SUPPLIER" },
  { value: "PETERNAKAN", label: "Peternakan & Unggas", forRole: "SUPPLIER" },
  { value: "PERIKANAN", label: "Perikanan & Hasil Laut", forRole: "SUPPLIER" },
  { value: "PERKEBUNAN", label: "Perkebunan & Rempah", forRole: "SUPPLIER" },
  { value: "LOGISTIK", label: "Logistik & Distributor", forRole: "SUPPLIER" },
];

export function ProfileRolesCard({
  entityId,
  roles,
  currentRoleType = "umkm",
  onRolesUpdated,
}: ProfileRolesCardProps) {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isDeletingId, setIsDeletingId] = React.useState<string | null>(null);
  const [isSwitching, setIsSwitching] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form states for adding new role
  const [newRoleType, setNewRoleType] = React.useState<"SUPPLIER" | "UMKM">("SUPPLIER");
  const [newSector, setNewSector] = React.useState("PERTANIAN");
  const [newStorageCapacity, setNewStorageCapacity] = React.useState("100");

  // Determine available roles to add
  const existingRoleTypes = React.useMemo(
    () => roles.map((r) => r.role_type.toUpperCase()),
    [roles]
  );
  const canAddSupplier = !existingRoleTypes.includes("SUPPLIER");
  const canAddUmkm = !existingRoleTypes.includes("UMKM");

  // Reset form role type based on what is available
  React.useEffect(() => {
    if (canAddSupplier && !canAddUmkm) {
      setNewRoleType("SUPPLIER");
      setNewSector("PERTANIAN");
    } else if (canAddUmkm && !canAddSupplier) {
      setNewRoleType("UMKM");
      setNewSector("FNB_PENGOLAHAN");
    }
  }, [canAddSupplier, canAddUmkm]);

  const handleOpenAdd = () => {
    if (canAddSupplier && !canAddUmkm) {
      setNewRoleType("SUPPLIER");
      setNewSector("PERTANIAN");
    } else if (canAddUmkm && !canAddSupplier) {
      setNewRoleType("UMKM");
      setNewSector("FNB_PENGOLAHAN");
    } else {
      setNewRoleType("SUPPLIER");
      setNewSector("PERTANIAN");
    }
    setNewStorageCapacity("100");
    setIsAddOpen(true);
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityId) {
      toast.error("ID Entitas tidak ditemukan.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createBusinessRoleAction({
        entityId,
        role_type: newRoleType,
        sector_type: newSector,
        storage_capacity: parseInt(newStorageCapacity, 10) || 0,
      });

      if (res.success && res.data) {
        onRolesUpdated([...roles, res.data]);
        setIsAddOpen(false);
        toast.success(`Peran baru ${newRoleType} berhasil ditambahkan!`);
      } else {
        toast.error(res.message || "Gagal menambahkan peran usaha.");
      }
    } catch {
      toast.error("Gagal terhubung ke backend server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (roles.length <= 1) {
      toast.info("Entitas usaha harus memiliki minimal 1 peran aktif.");
      return;
    }

    setIsDeletingId(roleId);
    try {
      const res = await deleteBusinessRoleAction(roleId);
      if (res.success) {
        onRolesUpdated(roles.filter((r) => r.id !== roleId));
        toast.success(`Peran ${roleName} berhasil dihapus.`);
      } else {
        toast.error(res.message || "Gagal menghapus peran usaha.");
      }
    } catch {
      toast.error("Gagal terhubung ke backend server.");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleSwitchPortal = async (targetRole: "umkm" | "supplier") => {
    if (isSwitching) return;
    setIsSwitching(true);
    toast.info(`Beralih ke portal ${targetRole.toUpperCase()}...`);
    try {
      const res = await switchRoleAction(targetRole);
      if (res.success) {
        toast.success(`Berhasil beralih ke portal ${targetRole.toUpperCase()}.`);
        router.push(res.redirectTo);
        router.refresh();
      } else if (res.requiresBusinessStep && res.redirectTo) {
        toast.info(res.error || "Silakan lengkapi profil usaha Anda.", "Lengkapi Profil Usaha");
        router.push(res.redirectTo);
      } else {
        window.location.href = `/api/auth/switch-role?to=${targetRole}&next=/home`;
      }
    } catch {
      window.location.href = `/api/auth/switch-role?to=${targetRole}&next=/home`;
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <Card className="rounded-2xl border-border bg-surface shadow-elevation-1">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                Peran Usaha &amp; Sektor Terdaftar
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary mt-0.5">
                Kelola peran multi-posisi bisnis Anda sebagai UMKM pembeli bahan atau Mitra Supplier pengadaan.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(canAddSupplier || canAddUmkm) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenAdd}
                className="text-xs h-8 px-3 font-semibold text-text-primary border-primary/30 hover:bg-primary/5"
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-primary" />
                <span>Tambah Peran</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-4">
        {roles.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-text-muted">
            Belum ada peran terdaftar pada entitas ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {roles.map((r) => {
              const isCurrentActive =
                (currentRoleType === "supplier" && r.role_type.toUpperCase() === "SUPPLIER") ||
                (currentRoleType === "umkm" && r.role_type.toUpperCase() === "UMKM");
              const isDeleting = isDeletingId === r.id;

              return (
                <div
                  key={r.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrentActive
                      ? "border-primary/50 bg-primary/5 shadow-xs"
                      : "border-border bg-surface-subtle hover:border-border-subtle"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-bold text-sm text-text-primary">
                          {r.role_type.toUpperCase() === "SUPPLIER" ? "Mitra Supplier" : "Pelaku Usaha UMKM"}
                        </span>
                        {isCurrentActive && (
                          <Badge variant="primary" className="text-[10px] font-bold py-0.5 px-2">
                            Portal Aktif
                          </Badge>
                        )}
                        {r.is_active ? (
                          <Badge variant="success" className="text-[10px] py-0.5 px-1.5">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="neutral" className="text-[10px] py-0.5 px-1.5">
                            Nonaktif
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary font-medium">
                        Sektor: <span className="text-text-primary font-semibold">{r.sector_type || "-"}</span>
                      </p>
                      <p className="text-[11px] text-text-muted">
                        Kapasitas Ruang: <span className="font-mono font-semibold text-text-primary">{(r.storage_capacity || 0).toLocaleString("id-ID")} Kg</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {roles.length > 1 && (
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDeleteRole(r.id, r.role_type)}
                          title="Hapus peran ini"
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {!isCurrentActive && (
                    <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isSwitching}
                        onClick={() => handleSwitchPortal(r.role_type.toLowerCase() as "umkm" | "supplier")}
                        className="text-xs h-7 px-2.5 font-semibold flex items-center gap-1.5"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Beralih ke Portal Ini</span>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Modal Dialog Tambah Peran Baru */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-text-primary">
              Tambah Peran Usaha Baru
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted">
              Daftarkan entitas Anda untuk beroperasi sebagai Supplier pemasok atau UMKM pengolah.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddRole} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">Jenis Peran Bisnis</label>
              <select
                value={newRoleType}
                onChange={(e) => {
                  const val = e.target.value as "SUPPLIER" | "UMKM";
                  setNewRoleType(val);
                  setNewSector(val === "SUPPLIER" ? "PERTANIAN" : "FNB_PENGOLAHAN");
                }}
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {canAddSupplier && <option value="SUPPLIER">Mitra Supplier (Pemasok Bahan Baku)</option>}
                {canAddUmkm && <option value="UMKM">Pelaku Usaha UMKM (Pengolah &amp; Kuliner)</option>}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">Sektor Industri Usaha</label>
              <select
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {SECTOR_OPTIONS.filter((s) => s.forRole === newRoleType).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">
                Kapasitas Awal Ruang Penyimpanan (Kg)
              </label>
              <Input
                type="number"
                min="0"
                step="50"
                value={newStorageCapacity}
                onChange={(e) => setNewStorageCapacity(e.target.value)}
                placeholder="Contoh: 100"
                className="w-full h-11 text-xs sm:text-sm font-mono"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddOpen(false)}
                className="text-xs font-semibold h-10 px-4 text-text-secondary"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="font-bold text-xs min-h-[40px] px-5"
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                <span>{isSubmitting ? "Menambahkan..." : "Tambah Peran"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
