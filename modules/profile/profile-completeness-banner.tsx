"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, CreditCard, Warehouse, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileCompletenessBannerProps {
  hasValidBank: boolean;
  hasValidStorage: boolean;
  onFocusBank: () => void;
  onFocusStorage: () => void;
}

export function ProfileCompletenessBanner({
  hasValidBank,
  hasValidStorage,
  onFocusBank,
  onFocusStorage,
}: ProfileCompletenessBannerProps) {
  const isComplete = hasValidBank && hasValidStorage;

  if (isComplete) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-text-primary">
              Profil Usaha Lengkap &amp; Terverifikasi
            </h4>
            <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5">
              Legalitas, rekening penampung transaksi, dan kapasitas penyimpanan siap digunakan di seluruh ekosistem KUMPUL.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Alert Rekening Belum Lengkap */}
      {!hasValidBank && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-text-primary flex items-center gap-1.5">
                <span>Data Rekening Bank Belum Lengkap</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800">
                  Perlu Dilengkapi
                </span>
              </h4>
              <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5">
                Tambahkan nomor rekening operasional Anda untuk pencairan dana transaksi, penampungan hasil penjualan, dan escrow pooling.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onFocusBank}
            className="border-amber-500/40 text-amber-900 bg-amber-500/10 hover:bg-amber-500/20 font-bold text-xs shrink-0 self-start sm:self-center min-h-[36px]"
          >
            <span>Lengkapi Rekening</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      )}

      {/* Alert Kapasitas Penyimpanan Belum Diatur */}
      {!hasValidStorage && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <Warehouse className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-text-primary flex items-center gap-1.5">
                <span>Kapasitas Penyimpanan Belum Diatur</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-800">
                  0 Kg
                </span>
              </h4>
              <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5">
                Tentukan kapasitas gudang atau ruang penyimpanan (chiller/dry) usaha Anda agar alokasi kuota pesanan dapat dihitung optimal.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onFocusStorage}
            className="border-cyan-500/40 text-cyan-900 bg-cyan-500/10 hover:bg-cyan-500/20 font-bold text-xs shrink-0 self-start sm:self-center min-h-[36px]"
          >
            <span>Atur Penyimpanan</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
