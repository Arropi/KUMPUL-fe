"use client";

import * as React from "react";
import { formatCurrency, formatNumber } from "@/lib/format";
import { ArrowUpRight } from "lucide-react";

interface ProfileMetricsCardsProps {
  role: "supplier" | "umkm";
  totalRevenue: number;
  totalItems: number;
  activeItems: number;
  storageValue: number;
  storageUnit: string; // kept for compatibility but not used in display
  storageType: string;
  city: string;
  onAdjustStorage?: () => void;
}

export function ProfileMetricsCards({
  role,
  totalRevenue,
  totalItems,
  activeItems,
  storageValue,
  storageUnit, // kept for compatibility but not used in display
  storageType,
  city,
  onAdjustStorage,
}: ProfileMetricsCardsProps) {
  const isSupplier = role === "supplier";

  const storageTypeLabel =
    storageType === "DRY"
      ? "Gudang Kering (Ambient)"
      : storageType === "CHILLED"
      ? "Pendingin (Chilled 0-4°C)"
      : storageType === "FROZEN"
      ? "Cold Storage Beku (-18°C)"
      : "Gudang Kering (Ambient)";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Metrik 1: Total Transaksi / Penjualan */}
      <div className="p-5 rounded-2xl bg-surface border border-border shadow-elevation-1 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text-secondary">
            {isSupplier ? "Total Penjualan" : "Total Pengadaan Bahan"}
          </span>
          <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-md border border-primary/20">
            IDR
          </span>
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-bold font-heading text-text-primary tabular-nums tracking-tight">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            {isSupplier
              ? "3 PO Konsolidasi (Semua status aktif & sukses)"
              : "Pesanan bahan baku & pooling kolektif aktif"}
          </p>
        </div>
      </div>

      {/* Metrik 2: Total Katalog / Menu */}
      <div className="p-5 rounded-2xl bg-surface border border-border shadow-elevation-1 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text-secondary">
            {isSupplier ? "Total Katalog" : "Total Menu Usaha"}
          </span>
          <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-md border border-primary/20">
            {isSupplier ? "Komoditas" : "Resep"}
          </span>
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-bold font-heading text-text-primary tabular-nums tracking-tight">
            {formatNumber(totalItems)} {isSupplier ? "Komoditas" : "Menu"}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            {isSupplier
              ? `${activeItems} komoditas aktif siap pooling MOQ`
              : `${activeItems} resep menu aktif siap diproduksi`}
          </p>
        </div>
      </div>

      {/* Metrik 3: Kapasitas Gudang / Ruang Penyimpanan */}
      <div className="p-5 rounded-2xl bg-surface border border-border shadow-elevation-1 space-y-2 relative group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text-secondary">
            Kapasitas Gudang
          </span>
          <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-md border border-primary/20">
            Gudang
          </span>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-xl sm:text-2xl font-bold font-heading text-text-primary tabular-nums tracking-tight">
              {formatNumber(storageValue)} Unit
            </p>
            {onAdjustStorage && (
              <button
                type="button"
                onClick={onAdjustStorage}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
              >
                <span>Atur</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-text-muted mt-0.5 truncate">
            {storageTypeLabel} &bull; {city || "Jawa Timur"}
          </p>
        </div>
      </div>
    </div>
  );
}