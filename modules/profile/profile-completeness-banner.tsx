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
      <div className="p-4 rounded-2xl bg-primary-light/70 border border-primary/20 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
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
        <div className="p-4 rounded-2xl bg-accent-light/50 border border-accent/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-text-primary flex items-center gap-1.5">
                <span>Data Rekening Bank Belum Lengkap</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent-light text-accent border border-accent/30">
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
            className="border-accent/40 text-accent hover:bg-accent-light/60 font-semibold text-xs shrink-0 self-start sm:self-center min-h-[36px]"
          >
            <span>Lengkapi Rekening</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      )}

      {/* Alert Kapasitas Penyimpanan Belum Diatur */}
      {!hasValidStorage && (
        <div className="p-4 rounded-2xl bg-surface-subtle border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface border border-border text-text-secondary flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
              <Warehouse className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-text-primary flex items-center gap-1.5">
                <span>Kapasitas Penyimpanan Belum Diatur</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface border border-border text-text-secondary">
                  0 Unit
                </span>
              </h4>
              <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5">
                Tentukan kapasitas gudang atau ruang penyimpanan usaha Anda agar alokasi kuota pesanan dapat dihitung optimal.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onFocusStorage}
            className="font-semibold text-xs shrink-0 self-start sm:self-center min-h-[36px]"
          >
            <span>Atur Penyimpanan</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
