"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { SupplierCommodity } from "@/constants/supplier";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  ShoppingCart,
  ArrowRight,
  AlertTriangle,
  MapPin,
} from "lucide-react";

export interface CriticalStockNotice {
  daysRemaining: number;
  linkedMenu: string;
  suggestedQty?: number;
  unit?: string;
}

interface CommodityCatalogCardProps {
  item: SupplierCommodity;
  onToggleStatus?: (id: string) => void;
  role?: "umkm" | "supplier";
  pageContext?: "home" | "katalog";
  recipeTag?: string;
  benchmarkTag?: string;
  criticalStockNotice?: CriticalStockNotice;
  onPurchase?: (item: SupplierCommodity) => void;
}

export function CommodityCatalogCard({
  item,
  onToggleStatus,
  role = "umkm",
  pageContext,
  recipeTag,
  benchmarkTag,
  criticalStockNotice,
  onPurchase,
}: CommodityCatalogCardProps) {
  const [imgError, setImgError] = React.useState(false);

  // Konteks halaman: katalog supplier menampilkan status Published/Nonaktif (Draft), sedangkan home menampilkan asal komoditas (Pasokan Supplier / Hasil Limbah)
  const isKatalogContext =
    pageContext === "katalog" ||
    (pageContext === undefined && (role === "supplier" || Boolean(onToggleStatus)));

  const primaryPrice = item.priceTiers[0]?.pricePerUnit || 0;
  const isHygienePassed = item.batchTag.hygieneStatus === "TERVERIFIKASI";
  const isUmkm = role === "umkm";

  // Kondisional badges sesuai requirement:
  // 1. Penanda Tiering Price: HANYA muncul jika memiliki tiering price (> 1 tier)
  const hasTieringPrice = Boolean(item.hasTieringPrice && item.priceTiers.length > 1);

  // 2. Penanda Terbuka Pool: HANYA untuk produk yang SUDAH terdapat pool terbuka (OPEN / AGGREGATING)
  const openPoolsCount =
    typeof item.openPoolsCount === "number"
      ? item.openPoolsCount
      : Array.isArray(item.activePools)
        ? item.activePools.filter(
            (p) => p.poolStatus === "OPEN" || p.poolStatus === "AGGREGATING"
          ).length
        : 0;
  const hasOpenPools = Boolean(item.hasOpenPools && openPoolsCount > 0);

  // 3. Asal Komoditas (Supplier vs Limbah)
  const isWaste = item.sourceType === "WASTE";

  // 4. Lokasi Seller
  const locationDisplay =
    item.sellerCity || item.batchTag.originLocation || "Sentra Hub KUMPUL";

  return (
    <Card className="group flex flex-col rounded-2xl border-border bg-surface shadow-elevation-1 transition-all duration-200 hover:shadow-elevation-2 hover:border-border-strong p-3.5 sm:p-4">
      {/* Gambar Komoditas & Overlay Badges */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-100 border border-border/40">
        {item.imageUrl && !imgError ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-neutral-100 to-neutral-200 text-text-muted">
            <svg
              className="size-10 stroke-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
            <span className="text-xs font-medium">Foto Komoditas</span>
          </div>
        )}

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
          {/* Badge Kiri: Status Published/Nonaktif di Katalog vs Asal Pasokan di Home */}
          <div className="pointer-events-auto">
            {isKatalogContext ? (
              item.isActive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/95 text-white backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-bold shadow-xs">
                  <span className="size-1.5 rounded-full bg-white" />
                  <span>Published</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-600/95 text-white backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-bold shadow-xs">
                  <span className="size-1.5 rounded-full bg-neutral-300" />
                  <span>Nonaktif (Draft)</span>
                </span>
              )
            ) : isWaste ? (
              <span className="inline-flex items-center rounded-full bg-amber-700/95 text-white backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-bold shadow-xs">
                <span>Hasil Limbah</span>
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-primary-dark/95 text-white backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-bold shadow-xs">
                <span>Pasokan Supplier</span>
              </span>
            )}
          </div>

          {/* Badge Penanda Label Terverifikasi Mutu Gemini AI */}
          <div className="pointer-events-auto">
            {isHygienePassed ? (
              <span className="inline-flex items-center rounded-full bg-emerald-600/95 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                Terverifikasi Mutu AI
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-500/90 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                Audit Higienis
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Konten Card */}
      <div className="flex flex-1 flex-col pt-3.5 space-y-3">
        <div>
          {/* Critical Kitchen Stock Notice (brief.md Seksi 4.2) */}
          {criticalStockNotice ? (
            <div className="mb-2 space-y-1">
              <div
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border shadow-xs max-w-full ${
                  criticalStockNotice.daysRemaining <= 1.0
                    ? "text-red-700 bg-red-50 border-red-200"
                    : "text-amber-800 bg-amber-50 border-amber-200"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600 animate-pulse" />
                <span className="truncate">
                  Stok Kritis Dapur (Sisa {criticalStockNotice.daysRemaining} Hari) &bull; Kebutuhan {criticalStockNotice.linkedMenu}
                </span>
              </div>
              {criticalStockNotice.suggestedQty ? (
                <div className="flex items-center justify-between text-[10px] text-text-secondary px-0.5 font-medium">
                  <span>Saran Pengadaan 7 Hari:</span>
                  <span className="font-bold text-text-primary">
                    {criticalStockNotice.suggestedQty} {criticalStockNotice.unit || item.wholesaleUnit}
                  </span>
                </div>
              ) : null}
            </div>
          ) : recipeTag ? (
            <div className="mb-2">
              <span className="inline-flex items-center text-[11px] font-bold text-emerald-800 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg shadow-xs">
                <span className="truncate">{recipeTag}</span>
              </span>
            </div>
          ) : null}

          {/* Benchmark Tag for Supplier */}
          {benchmarkTag && (
            <div className="mb-2">
              <span className="inline-flex items-center text-[11px] font-bold text-primary bg-primary/10 border border-primary/25 px-2.5 py-0.5 rounded-lg shadow-xs">
                <span className="truncate">{benchmarkTag}</span>
              </span>
            </div>
          )}

          {/* Sektor, SKU, dan Lokasi */}
          <div className="flex items-center justify-between text-[11px] text-text-muted mb-1 gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-mono font-semibold uppercase">{item.sku}</span>
              <span>&bull;</span>
              <span className="truncate">{item.sector}</span>
            </div>
            {/* Metadata Lokasi Wajib */}
            <div className="inline-flex items-center gap-1 text-[11px] text-text-secondary shrink-0 max-w-[45%]">
              <MapPin className="size-3 text-primary shrink-0" />
              <span className="truncate font-medium">{locationDisplay}</span>
              {item.distanceKm != null && (
                <span className="text-[10px] text-text-muted">({item.distanceKm} km)</span>
              )}
            </div>
          </div>

          <h2 className="font-heading font-bold text-base text-text-primary line-clamp-1">
            {item.name}
          </h2>
        </div>

        {/* Badges Kondisional: Tiering Price & Pool Terbuka */}
        {(hasTieringPrice || hasOpenPools) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {/* Penanda Tiering Price: HANYA jika > 1 tier */}
            {hasTieringPrice && (
              <span className="inline-flex items-center rounded-md bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                <span>Diskon Bertingkat ({item.priceTiers.length} Tier)</span>
              </span>
            )}

            {/* Penanda Terbuka Pool: HANYA jika sudah terdapat pool terbuka */}
            {hasOpenPools && (
              <span className="inline-flex items-center rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                <span>
                  Pool Terbuka {openPoolsCount > 1 ? `(${openPoolsCount} Pool)` : ""}
                </span>
              </span>
            )}
          </div>
        )}

        {/* Harga Patokan Utama per Satuan */}
        <div className="rounded-xl bg-background p-3 border border-border/80">
          <span className="text-[11px] font-medium text-text-secondary block">
            Harga Patokan Utama
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="font-heading font-extrabold text-lg sm:text-xl text-primary tabular-nums">
              {formatCurrency(primaryPrice)}
            </span>
            <span className="text-xs font-semibold text-text-muted">
              / {item.wholesaleUnit}
            </span>
          </div>
          {item.unitWeightKg > 0 && (
            <span className="text-[11px] text-text-muted tabular-nums block mt-0.5">
              Setara Rp {formatNumber(Math.round(primaryPrice / item.unitWeightKg))} / kg
            </span>
          )}
        </div>

        {/* Metadata Wajib: Batas Minimum (MOQ) & Stok Tersedia */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
          <div className="rounded-lg bg-surface-subtle p-2 border border-border/50">
            <span className="text-[10px] text-text-muted block font-medium">Batas Minimum (MOQ)</span>
            <span className="font-bold text-text-primary tabular-nums">
              {item.baseMoq} {item.wholesaleUnit}
            </span>
          </div>
          <div className="rounded-lg bg-surface-subtle p-2 border border-border/50">
            <span className="text-[10px] text-text-muted block font-medium">Stok Tersedia</span>
            <span className="font-bold text-text-primary tabular-nums">
              {item.availableStock} {item.wholesaleUnit}
            </span>
          </div>
        </div>

        {/* Revisi 1: Tombol Aksi - Supplier TIDAK ADA tombol beli */}
        <div className="pt-2 mt-auto">
          {!isUmkm ? (
            // Aksi Khusus Supplier: HANYA Detail Pasar / Pengelolaan (TIDAK ADA TOMBOL BELI)
            onToggleStatus ? (
              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant={item.isActive ? "outline" : "primary"}
                  size="sm"
                  onClick={() => onToggleStatus(item.id)}
                  className="flex-1 font-semibold text-xs min-h-[42px]"
                >
                  {item.isActive ? "Tarik dari Bursa" : "Publikasikan"}
                </Button>
                <Link href={`/katalog/${item.id}`} className="flex-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full font-semibold text-xs min-h-[42px]"
                  >
                    Detail Pasar
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href={`/katalog/${item.id}`} className="block w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full font-bold text-xs min-h-[42px] flex items-center justify-center gap-2 shadow-xs cursor-pointer hover:bg-surface-subtle"
                >
                  <span>Lihat Detail Pasar &amp; Kuota</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )
          ) : (
            // Aksi Khusus UMKM: Membeli / Transaksi / Gabung Pool
            onPurchase ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={item.isActive ? "primary" : "secondary"}
                  size="sm"
                  disabled={!item.isActive}
                  onClick={() => item.isActive && onPurchase(item)}
                  className="flex-1 font-bold text-xs min-h-[42px] flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>{item.isActive ? "Beli / Buat Pool" : "Belum Aktif"}</span>
                </Button>
                <Link href={`/katalog/${item.id}`} className="shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="font-semibold text-xs min-h-[42px] px-3.5 cursor-pointer"
                  >
                    Detail &amp; Pool
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href={`/katalog/${item.id}`} className="block w-full">
                <Button
                  type="button"
                  variant={item.isActive ? "primary" : "outline"}
                  size="sm"
                  className="w-full font-bold text-xs min-h-[42px] flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>{item.isActive ? "Detail Komoditas & Gabung Pool" : "Detail Komoditas (Draft)"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
    </Card>
  );
}
