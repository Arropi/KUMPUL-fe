"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { PriceTierRange, KatalogFormErrors } from "../types";

interface EceranDanHargaSectionProps {
  unit: string;
  minOrderQty: number;
  allowRetail: boolean;
  setAllowRetail: (val: boolean) => void;
  retailPrice: number;
  setRetailPrice: (val: number) => void;
  enablePriceTiers: boolean;
  setEnablePriceTiers: (val: boolean) => void;
  priceTiers: PriceTierRange[];
  setPriceTiers: React.Dispatch<React.SetStateAction<PriceTierRange[]>>;
  errors: KatalogFormErrors;
}

export function EceranDanHargaSection({
  unit,
  minOrderQty,
  allowRetail,
  setAllowRetail,
  retailPrice,
  setRetailPrice,
  enablePriceTiers,
  setEnablePriceTiers,
  priceTiers,
  setPriceTiers,
  errors,
}: EceranDanHargaSectionProps) {
  // Pastikan rentang pertama selalu sinkron dengan nilai MOQ dan tak bisa diubah
  React.useEffect(() => {
    setPriceTiers((prev) => {
      if (prev.length === 0) return prev;
      if (prev[0].minQty === minOrderQty) return prev;
      const updated = [...prev];
      const newMax = Math.max(updated[0].maxQty, minOrderQty + 10);
      updated[0] = { ...updated[0], minQty: minOrderQty, maxQty: newMax };
      return updated;
    });
  }, [minOrderQty, setPriceTiers]);

  const handleAddTier = () => {
    const lastTier = priceTiers[priceTiers.length - 1];
    const newMin = lastTier ? lastTier.maxQty + 1 : (minOrderQty > 0 ? minOrderQty : 1);
    const newMax = newMin + 20;
    const newPrice = lastTier ? Math.max(0, lastTier.price - 500) : 10000;

    setPriceTiers((prev) => [
      ...prev,
      {
        id: `tier-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        minQty: newMin,
        maxQty: newMax,
        price: newPrice,
      },
    ]);
  };

  const handleRemoveTier = (id: string) => {
    if (priceTiers.length <= 1) return;
    setPriceTiers((prev) => prev.filter((tier) => tier.id !== id));
  };

  const handleUpdateTier = (
    id: string,
    field: "minQty" | "maxQty" | "price",
    value: number
  ) => {
    setPriceTiers((prev) =>
      prev.map((tier, idx) => {
        if (tier.id === id) {
          // Cegah perubahan minQty pada rentang pertama karena harus selalu sama dengan MOQ
          if (idx === 0 && field === "minQty") {
            return tier;
          }
          return { ...tier, [field]: value };
        }
        return tier;
      })
    );
  };

  return (
    <Card className="p-5 sm:p-6 space-y-6 bg-surface border-border shadow-elevation-1 rounded-2xl">
      <div className="border-b border-border/80 pb-3">
        <h2 className="font-heading font-bold text-base text-text-primary">
          3. Penjualan Eceran &amp; Skema Peningkatan Harga
        </h2>
        <p className="font-body text-xs text-text-secondary mt-0.5">
          Atur opsi penjualan eceran di bawah batas minimum dan konfigurasi rentang kuota harga bertingkat.
        </p>
      </div>

      {/* Bagian Eceran */}
      <div className="space-y-4">
        <div className="rounded-xl border border-border/80 bg-background/60 p-4 transition-colors">
          <label
            htmlFor="allow-retail"
            className="flex items-start gap-3 cursor-pointer select-none"
          >
            <div className="pt-0.5">
              <Checkbox
                id="allow-retail"
                checked={allowRetail}
                onCheckedChange={(checked) => setAllowRetail(Boolean(checked))}
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs sm:text-sm font-semibold text-text-primary block">
                Terima penjualan eceran atau kurang dari Batas minimum penjualan
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">
                Izinkan pembeli atau UMKM memesan dengan kuota lebih sedikit dari batas MOQ yang telah ditentukan.
              </p>
            </div>
          </label>

          {allowRetail && (
            <div className="mt-4 pt-4 border-t border-border/70 max-w-sm">
              <Input
                id="retail-price"
                type="number"
                min={0}
                label={`Harga Eceran per ${unit} (Rp)`}
                placeholder="Contoh: 15000"
                value={retailPrice <= 0 ? "" : retailPrice.toString()}
                onChange={(e) => setRetailPrice(Math.max(0, Number(e.target.value)))}
                error={errors.retailPrice}
                helperText={`Harga berlaku untuk pembelian di bawah ${minOrderQty > 0 ? minOrderQty : "batas minimum"} ${unit}`}
                required
                className="min-h-[44px] tabular-nums font-semibold"
              />
            </div>
          )}
        </div>
      </div>

      {/* Bagian Peningkatan Harga Bertingkat */}
      <div className="space-y-4 pt-2">
        <div className="rounded-xl border border-border/80 bg-background/60 p-4 transition-colors">
          <label
            htmlFor="enable-price-tiers"
            className="flex items-start gap-3 cursor-pointer select-none"
          >
            <div className="pt-0.5">
              <Checkbox
                id="enable-price-tiers"
                checked={enablePriceTiers}
                onCheckedChange={(checked) =>
                  setEnablePriceTiers(Boolean(checked))
                }
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs sm:text-sm font-semibold text-text-primary block">
                Berikan peningkatan harga bertingkat
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">
                Terapkan skema harga bertingkat dengan batas bawah, batas atas, dan harga spesifik. Rentang pertama otomatis dimulai dari nilai MOQ dan terkunci.
              </p>
            </div>
          </label>

          {enablePriceTiers && (
            <div className="mt-4 pt-4 border-t border-border/70 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-text-primary">
                    Daftar Rentang &amp; Tingkatan Harga
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Tentukan batas kuota pembelian dan harga per {unit} untuk masing-masing rentang volume.
                  </p>
                </div>
              </div>

              {errors.priceTiers && (
                <p className="text-xs text-error font-medium">
                  {errors.priceTiers}
                </p>
              )}

              <div className="space-y-3">
                {priceTiers.map((tier, index) => {
                  const isFirstTier = index === 0;

                  return (
                    <div
                      key={tier.id}
                      className="p-3.5 sm:p-4 rounded-xl border border-border bg-surface shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-primary">
                            Rentang {index + 1}
                          </span>
                          {isFirstTier && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                              Terkunci dari MOQ
                            </span>
                          )}
                        </div>

                        {!isFirstTier && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTier(tier.id)}
                            className="text-xs text-error hover:text-red-700 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error rounded-sm px-1.5 py-0.5 cursor-pointer"
                            aria-label={`Hapus rentang ${index + 1}`}
                          >
                            Hapus Baris
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Batas Bawah */}
                        <div>
                          <Input
                            id={`min-qty-${tier.id}`}
                            type="number"
                            min={1}
                            label={`Batas Bawah (${unit})${isFirstTier ? " (MOQ)" : ""}`}
                            placeholder="Contoh: 5"
                            value={isFirstTier ? minOrderQty.toString() : tier.minQty <= 0 ? "" : tier.minQty.toString()}
                            onChange={(e) =>
                              handleUpdateTier(
                                tier.id,
                                "minQty",
                                Math.max(0, Number(e.target.value))
                              )
                            }
                            disabled={isFirstTier}
                            helperText={isFirstTier ? "Terkunci dari nilai MOQ dan tidak dapat diubah" : undefined}
                            className={`min-h-[44px] tabular-nums ${isFirstTier ? "bg-neutral-100/80 cursor-not-allowed text-text-secondary" : ""}`}
                          />
                        </div>

                        {/* Batas Atas */}
                        <div>
                          <Input
                            id={`max-qty-${tier.id}`}
                            type="number"
                            min={isFirstTier ? minOrderQty : tier.minQty}
                            label={`Batas Atas (${unit})`}
                            placeholder="Contoh: 50"
                            value={tier.maxQty <= 0 ? "" : tier.maxQty.toString()}
                            onChange={(e) =>
                              handleUpdateTier(
                                tier.id,
                                "maxQty",
                                Math.max(0, Number(e.target.value))
                              )
                            }
                            className="min-h-[44px] tabular-nums"
                          />
                        </div>

                        {/* Harga yang Diterapkan */}
                        <div>
                          <Input
                            id={`price-${tier.id}`}
                            type="number"
                            min={0}
                            label={`Harga yang Diterapkan (Rp)`}
                            placeholder="Contoh: 12000"
                            value={tier.price <= 0 ? "" : tier.price.toString()}
                            onChange={(e) =>
                              handleUpdateTier(
                                tier.id,
                                "price",
                                Math.max(0, Number(e.target.value))
                              )
                            }
                            className="min-h-[44px] tabular-nums font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTier}
                  className="font-semibold"
                >
                  <svg
                    className="size-4 mr-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Tambah Lagi
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
