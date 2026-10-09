"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type {
  PriceTierRange,
  KatalogFormErrors,
} from "../../modules/supplier/katalog/types";

interface EceranDanHargaSectionProps {
  unit: string;
  minOrderQty: number;
  basePrice?: number;
  enablePriceTiers: boolean;
  setEnablePriceTiers: (val: boolean) => void;
  priceTiers: PriceTierRange[];
  setPriceTiers: React.Dispatch<React.SetStateAction<PriceTierRange[]>>;
  errors: KatalogFormErrors;
  allowRetail?: boolean;
  setAllowRetail?: (val: boolean) => void;
  retailPrice?: number;
  setRetailPrice?: (val: number) => void;
}

export function EceranDanHargaSection({
  unit,
  minOrderQty,
  basePrice,
  enablePriceTiers,
  setEnablePriceTiers,
  priceTiers,
  setPriceTiers,
  errors,
}: EceranDanHargaSectionProps) {
  // Pastikan rentang pertama selalu sinkron dengan MOQ, dan rentang berikutnya selalu batas atas sebelumnya + 1
  React.useEffect(() => {
    setPriceTiers((prev) => {
      if (prev.length === 0) return prev;
      let hasChanges = false;
      const updated = [...prev];

      const firstMin = minOrderQty > 0 ? minOrderQty : 1;
      if (updated[0].minQty !== firstMin) {
        hasChanges = true;
        const newMax = Math.max(updated[0].maxQty, firstMin + 10);
        updated[0] = { ...updated[0], minQty: firstMin, maxQty: newMax };
      }

      for (let i = 1; i < updated.length; i++) {
        const expectedMin = updated[i - 1].maxQty + 1;
        if (updated[i].minQty !== expectedMin) {
          hasChanges = true;
          const newMax = Math.max(updated[i].maxQty, expectedMin + 10);
          updated[i] = { ...updated[i], minQty: expectedMin, maxQty: newMax };
        }
      }

      return hasChanges ? updated : prev;
    });
  }, [minOrderQty, setPriceTiers]);

  // Pastikan harga tier tidak melebihi basePrice jika basePrice berubah
  React.useEffect(() => {
    if (basePrice !== undefined && basePrice > 0) {
      setPriceTiers((prev) => {
        let hasChanges = false;
        const updated = prev.map((tier) => {
          if (tier.price > basePrice) {
            hasChanges = true;
            return { ...tier, price: basePrice };
          }
          return tier;
        });
        return hasChanges ? updated : prev;
      });
    }
  }, [basePrice, setPriceTiers]);

  const handleAddTier = () => {
    const lastTier = priceTiers[priceTiers.length - 1];
    const newMin = lastTier
      ? lastTier.maxQty + 1
      : minOrderQty > 0
        ? minOrderQty
        : 1;
    const newMax = newMin + 20;

    // Harga tier baru: default lebih murah dari tier sebelumnya atau sama dengan basePrice jika baru
    const fallbackPrice = basePrice && basePrice > 0 ? basePrice : 10000;
    let newPrice = lastTier ? Math.max(0, lastTier.price - 500) : fallbackPrice;
    if (basePrice && basePrice > 0 && newPrice > basePrice) {
      newPrice = basePrice;
    }

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
    setPriceTiers((prev) => {
      const filtered = prev.filter((tier) => tier.id !== id);
      // Sinkronisasi ulang batas bawah baris-baris setelah yang dihapus
      for (let i = 1; i < filtered.length; i++) {
        const expectedMin = filtered[i - 1].maxQty + 1;
        const newMax = Math.max(filtered[i].maxQty, expectedMin + 10);
        filtered[i] = { ...filtered[i], minQty: expectedMin, maxQty: newMax };
      }
      return filtered;
    });
  };

  const handleUpdateTier = (
    id: string,
    field: "minQty" | "maxQty" | "price",
    value: number,
  ) => {
    setPriceTiers((prev) => {
      const targetIndex = prev.findIndex((tier) => tier.id === id);
      if (targetIndex === -1) return prev;

      // minQty selalu disabled dan diatur otomatis
      if (field === "minQty") {
        return prev;
      }

      const updated = [...prev];

      if (field === "price") {
        let finalPrice = Math.max(0, value);
        // Harga yang diterapkan tidak bisa melebihi value dari harga utama
        if (basePrice && basePrice > 0 && finalPrice > basePrice) {
          finalPrice = basePrice;
        }
        updated[targetIndex] = { ...updated[targetIndex], price: finalPrice };
        return updated;
      }

      if (field === "maxQty") {
        const newMax = Math.max(0, value);
        updated[targetIndex] = { ...updated[targetIndex], maxQty: newMax };

        // Cascade update minQty (dan sesuaikan maxQty jika perlu) untuk semua baris setelah targetIndex
        for (let i = targetIndex + 1; i < updated.length; i++) {
          const prevMax = updated[i - 1].maxQty;
          const nextMin = prevMax > 0 ? prevMax + 1 : 1;
          const nextMax = Math.max(updated[i].maxQty, nextMin + 10);
          updated[i] = {
            ...updated[i],
            minQty: nextMin,
            maxQty: nextMax,
          };
        }
        return updated;
      }

      return prev;
    });
  };

  return (
    <Card className="p-5 sm:p-6 space-y-6 bg-surface border-border shadow-elevation-1 rounded-2xl">
      <div className="border-b border-border/80 pb-3">
        <h2 className="font-heading font-bold text-base text-text-primary">
          2. Skema Tingkatan Harga Pasokan (Tiered Pricing)
        </h2>
        <p className="font-body text-xs text-text-secondary mt-0.5">
          Atur opsi penawaran harga grosir bertingkat berdasarkan kuota volume pembelian.
        </p>
      </div>

      {/* Bagian Peningkatan Harga Bertingkat */}
      <div className="space-y-4">
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
                Terapkan skema harga bertingkat dengan batas bawah, batas atas,
                dan harga spesifik. Rentang pertama otomatis dimulai dari nilai
                MOQ dan terkunci.
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
                    Tentukan batas kuota pembelian dan harga per {unit} untuk
                    masing-masing rentang volume.
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
                          {isFirstTier ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                              Terkunci dari MOQ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                              Batas Bawah Otomatis (+1)
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
                            placeholder={isFirstTier ? minOrderQty.toString() : "Contoh: 5"}
                            value={
                              isFirstTier
                                ? minOrderQty.toString()
                                : tier.minQty <= 0
                                  ? ""
                                  : tier.minQty.toString()
                            }
                            disabled={true}
                            helperText={
                              isFirstTier
                                ? "Terkunci dari nilai MOQ dan tidak dapat diubah"
                                : "Otomatis batas atas baris sebelumnya + 1"
                            }
                            className="min-h-[44px] tabular-nums bg-neutral-100/80 cursor-not-allowed text-text-secondary select-none"
                          />
                        </div>

                        {/* Batas Atas */}
                        <div>
                          <Input
                            id={`max-qty-${tier.id}`}
                            type="number"
                            min={tier.minQty + 1}
                            label={`Batas Atas (${unit})`}
                            placeholder="Contoh: 50"
                            value={
                              tier.maxQty <= 0 ? "" : tier.maxQty.toString()
                            }
                            onChange={(e) =>
                              handleUpdateTier(
                                tier.id,
                                "maxQty",
                                Math.max(0, Number(e.target.value)),
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
                            max={basePrice && basePrice > 0 ? basePrice : undefined}
                            label={`Harga yang Diterapkan (Rp)`}
                            placeholder={
                              basePrice && basePrice > 0
                                ? `Maks. Rp ${basePrice.toLocaleString("id-ID")}`
                                : "Contoh: 12000"
                            }
                            value={tier.price <= 0 ? "" : tier.price.toString()}
                            onChange={(e) =>
                              handleUpdateTier(
                                tier.id,
                                "price",
                                Math.max(0, Number(e.target.value)),
                              )
                            }
                            helperText={
                              basePrice && basePrice > 0
                                ? `Maksimal Rp ${basePrice.toLocaleString("id-ID")} (harga utama)`
                                : undefined
                            }
                            className={`min-h-[44px] tabular-nums font-semibold ${
                              basePrice && basePrice > 0 && tier.price > basePrice
                                ? "border-error focus-visible:ring-error"
                                : ""
                            }`}
                          />
                          {basePrice && basePrice > 0 && tier.price > basePrice && (
                            <p className="text-[11px] text-error font-medium mt-1">
                              Harga tidak boleh melebihi harga utama (Rp{" "}
                              {basePrice.toLocaleString("id-ID")})
                            </p>
                          )}
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
