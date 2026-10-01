"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { KatalogFormErrors } from "../../modules/supplier/katalog/types";

interface PanenJadwalSectionProps {
  harvestDate: string;
  setHarvestDate: (val: string) => void;
  autoActivateMarketplace: boolean;
  setAutoActivateMarketplace: (val: boolean) => void;
  errors: KatalogFormErrors;
}

export function PanenJadwalSection({
  harvestDate,
  setHarvestDate,
  autoActivateMarketplace,
  setAutoActivateMarketplace,
  errors,
}: PanenJadwalSectionProps) {
  return (
    <Card className="p-5 sm:p-6 space-y-5 bg-surface border-border shadow-elevation-1 rounded-2xl">
      <div className="border-b border-border/80 pb-3">
        <h2 className="font-heading font-bold text-base text-text-primary">
          2. Perkiraan Tanggal Panen / Produksi &amp; Publikasi
        </h2>
        <p className="font-body text-xs text-text-secondary mt-0.5">
          Atur estimasi waktu panen atau siklus produksi dan opsi penayangan
          otomatis ke bursa marketplace.
        </p>
      </div>

      <div className="max-w-md">
        <Input
          id="harvest-date"
          type="date"
          label="Perkiraan Tanggal Panen / Produksi"
          value={harvestDate}
          onChange={(e) => setHarvestDate(e.target.value)}
          error={errors.harvestDate}
          helperText="Tanggal estimasi komoditas selesai dipanen atau selesai diproduksi"
          required
          className="min-h-[44px] tabular-nums"
        />
      </div>

      {/* Opsi Otomatis Aktifkan ke Marketplace */}
      <div className="rounded-xl border border-border/80 bg-background/60 p-4 transition-colors">
        <label
          htmlFor="auto-activate-marketplace"
          className="flex items-start gap-3 cursor-pointer select-none"
        >
          <div className="pt-0.5">
            <Checkbox
              id="auto-activate-marketplace"
              checked={autoActivateMarketplace}
              onCheckedChange={(checked) =>
                setAutoActivateMarketplace(Boolean(checked))
              }
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs sm:text-sm font-semibold text-text-primary block">
              Otomatis aktifkan ke marketplace ketika tanggal panen/produksi
            </span>
            <p className="text-xs text-text-secondary leading-relaxed">
              Jika dicentang, katalog pasokan komoditas ini akan otomatis
              berstatus aktif dan langsung muncul di marketplace KUMPUL tepat
              pada tanggal panen atau produksi yang ditentukan.
            </p>
          </div>
        </label>

        {autoActivateMarketplace && harvestDate && (
          <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-2 text-xs text-primary font-medium">
            <span className="size-2 rounded-full bg-primary inline-block shrink-0" />
            <span>
              Katalog akan dipublikasikan secara otomatis pada tanggal{" "}
              <strong className="font-semibold text-text-primary">
                {harvestDate}
              </strong>
              .
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
