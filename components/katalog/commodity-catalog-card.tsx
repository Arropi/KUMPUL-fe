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
  Store,
  Recycle,
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
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-50 border border-border/50">
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
          <div className="flex h-full w-full flex-col items-center justify-center p-6 bg-gradient-to-br from-neutral-50 via-white to-neutral-100 text-text-muted select-none">
            <Image
              src="/logo/without-bg.svg"
              alt="Logo KUMPUL"
              width={110}
              height={36}
              className="h-8 w-auto object-contain opacity-75 transition-transform duration-300 group-hover:scale-105"
            />
            <span className="text-[11px] font-medium text-text-muted mt-2 tracking-wide">
              {isWaste ? "Katalog Residu Sirkular" : "Komoditas Pemasok KUMPUL"}
            </span>
          </div>
        )}

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
          {/* Badge Kiri: Penanda Jelas Supplier vs Limbah */}
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800 text-white backdrop-blur-md px-3 py-1 text-xs font-bold shadow-sm border border-emerald-400/40">
                <Recycle className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>Limbah Sirkular</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/90 backdrop-blur-md px-3 py-1 text-xs font-bold shadow-xs border border-border/80 text-text-primary">
                <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Komoditas Pemasok</span>
              </span>
            )}
          </div>

          {/* Badge Kanan: Penanda Verifikasi Mutu (Hanya untuk Komoditas Pemasok, Limbah tidak ada badge sebelah) */}
          {!isWaste && (
            <div className="pointer-events-auto">
              {isHygienePassed ? (
                <span className="inline-flex items-center rounded-full bg-emerald-600/95 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                  Terverifikasi
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-500/90 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                  Audit Higienis
                </span>
              )}
            </div>
          )}
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
            <div className="flex items-center gap-1.5 truncate min-w-0" title={`${item.sku} • ${item.sector}`}>
              <span className="font-mono font-semibold uppercase shrink-0">{item.sku}</span>
              <span>&bull;</span>
              <span className="truncate">{item.sector}</span>
            </div>
            {/* Metadata Lokasi Wajib */}
            <div className="inline-flex items-center gap-1 text-[11px] text-text-secondary shrink-0 max-w-[45%]" title={locationDisplay}>
              <MapPin className="size-3 text-primary shrink-0" />
              <span className="truncate font-medium">{locationDisplay}</span>
              {item.distanceKm != null && (
                <span className="text-[10px] text-text-muted shrink-0">({item.distanceKm} km)</span>
              )}
            </div>
          </div>

          <h2 className="font-heading font-bold text-base text-text-primary line-clamp-1" title={item.name}>
            {item.name}
          </h2>
        </div>

        {/* Badges Kondisional: Tiering Price & Pool Terbuka (atau Residu Sirkular untuk Limbah) */}
        {isWaste ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/90 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
              <Recycle className="w-3 h-3 text-emerald-600" />
              <span>Sisa Produksi &bull; Transaksi Langsung P2P</span>
            </span>
          </div>
        ) : (hasTieringPrice || hasOpenPools) ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {/* Penanda Tiering Price: HANYA jika > 1 tier */}
            {hasTieringPrice && (
              <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                <span>Diskon Bertingkat ({item.priceTiers.length} Tier)</span>
              </span>
            )}

            {/* Penanda Terbuka Pool: HANYA jika sudah terdapat pool terbuka */}
            {hasOpenPools && (
              <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                <span>
                  Pool Terbuka {openPoolsCount > 1 ? `(${openPoolsCount} Pool)` : ""}
                </span>
              </span>
            )}
          </div>
        ) : null}

        {/* Harga Patokan Utama per Satuan */}
        <div className="rounded-xl bg-background p-3 border border-border/80">
          <span className="text-[11px] font-medium text-text-secondary block">
            {isWaste ? "Harga Residu Sirkular (Beli per Kg)" : "Harga Patokan Utama"}
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="font-heading font-extrabold text-lg sm:text-xl text-primary tabular-nums">
              {formatCurrency(primaryPrice)}
            </span>
            <span className="text-xs font-semibold text-text-muted">
              / {item.wholesaleUnit}
            </span>
          </div>
          {isWaste ? (
            <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
              Simbiosis Sirkular P2P &bull; Tanpa Batas MOQ
            </span>
          ) : item.unitWeightKg > 0 ? (
            <span className="text-[11px] text-text-muted tabular-nums block mt-0.5">
              Setara Rp {formatNumber(Math.round(primaryPrice / item.unitWeightKg))} / kg
            </span>
          ) : null}
        </div>

        {/* Metadata Wajib: Batas Minimum (MOQ) & Stok Tersedia */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
          <div className="rounded-lg bg-surface-subtle p-2 border border-border/50">
            <span className="text-[10px] text-text-muted block font-medium">
              {isWaste ? "Skema Pengadaan" : "Batas Minimum (MOQ)"}
            </span>
            <span className={`font-bold tabular-nums truncate ${isWaste ? "text-emerald-800" : "text-text-primary"}`}>
              {isWaste ? "Tanpa Batas MOQ" : `${item.baseMoq} ${item.wholesaleUnit}`}
            </span>
          </div>
          <div className="rounded-lg bg-surface-subtle p-2 border border-border/50">
            <span className="text-[10px] text-text-muted block font-medium">
              {isWaste ? "Bobot Tersedia" : "Stok Tersedia"}
            </span>
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
                <Link href={isWaste ? "/limbah" : `/katalog/${item.id}`} className="flex-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full font-semibold text-xs min-h-[42px]"
                  >
                    {isWaste ? "Bursa Limbah" : "Detail Pasar"}
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href={isWaste ? "/limbah" : `/katalog/${item.id}`} className="block w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full font-bold text-xs min-h-[42px] flex items-center justify-center gap-2 shadow-xs cursor-pointer hover:bg-surface-subtle"
                >
                  <span>{isWaste ? "Bursa Residu Limbah" : "Lihat Detail Pasar & Kuota"}</span>
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
                  className={`flex-1 font-bold text-xs min-h-[42px] flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isWaste ? "bg-emerald-700 hover:bg-emerald-800 text-white" : ""
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>
                    {isWaste
                      ? item.isActive ? "Beli Residu Langsung" : "Habis Terjual"
                      : item.isActive ? "Beli / Buat Pool" : "Belum Aktif"}
                  </span>
                </Button>
                <Link href={isWaste ? "/limbah" : `/katalog/${item.id}`} className="shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="font-semibold text-xs min-h-[42px] px-3.5 cursor-pointer"
                  >
                    {isWaste ? "Bursa Limbah" : "Detail & Pool"}
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href={isWaste ? "/limbah" : `/katalog/${item.id}`} className="block w-full">
                <Button
                  type="button"
                  variant={item.isActive ? "primary" : "outline"}
                  size="sm"
                  className="w-full font-bold text-xs min-h-[42px] flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>
                    {isWaste
                      ? "Beli Residu di Bursa Limbah"
                      : item.isActive ? "Detail Komoditas & Gabung Pool" : "Detail Komoditas (Draft)"}
                  </span>
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
