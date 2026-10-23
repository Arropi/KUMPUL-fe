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
  MapPin,
  Store,
  Recycle,
  Info,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
} from "lucide-react";
export interface CriticalStockNotice {
  daysRemaining: number;
  linkedMenu: string;
  suggestedQty?: number;
  unit?: string;
  currentStock?: number;
}

interface CommodityCatalogCardProps {
  item: SupplierCommodity;
  onToggleStatus?: (id: string) => void;
  role?: "umkm" | "supplier";
  pageContext?: "home" | "katalog";
  recipeTag?: string;
  benchmarkTag?: string;
  criticalStockNotice?: CriticalStockNotice;
  recommendationReason?: string;
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
  recommendationReason,
  onPurchase,
}: CommodityCatalogCardProps) {
  const [imgError, setImgError] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);

  // Konteks halaman: katalog supplier menampilkan status Published/Nonaktif (Draft), sedangkan home menampilkan asal komoditas (Pasokan Supplier / Hasil Limbah)
  const isKatalogContext =
    pageContext === "katalog" ||
    (pageContext === undefined && (role === "supplier" || Boolean(onToggleStatus)));

  const primaryPrice = item.priceTiers[0]?.pricePerUnit || 0;
  const isHygienePassed = item.batchTag.hygieneStatus === "TERVERIFIKASI";
  const isHygieneRejected = item.batchTag.hygieneStatus === "TIDAK_SESUAI";
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

  const detailHref = isWaste
    ? "/limbah"
    : pageContext === "home"
    ? `/katalog/${item.id}?from=home`
    : `/katalog/${item.id}?from=katalog`;

  // 4. Lokasi Seller
  const locationDisplay =
    item.sellerCity || item.batchTag.originLocation || "Sentra Hub KUMPUL";

  return (
    <Card className="group flex flex-col h-full w-full rounded-2xl border-border bg-surface shadow-elevation-1 transition-all duration-200 hover:shadow-elevation-2 hover:border-border-strong p-3.5 sm:p-4 min-w-0">
      {/* Gambar Komoditas & Overlay Badges */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-neutral-50 border border-border/50">
        <div className="absolute inset-0 overflow-hidden rounded-xl">
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
        </div>

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
          {/* Badge Kiri: Penanda Jelas Supplier vs Limbah */}
          <div className="pointer-events-auto">
            {isKatalogContext ? (
              item.isActive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/95 text-white backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold shadow-xs whitespace-nowrap">
                  <span className="size-1.5 rounded-full bg-white" />
                  <span>Published</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-600/95 text-white backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold shadow-xs whitespace-nowrap">
                  <span className="size-1.5 rounded-full bg-neutral-300" />
                  <span>Nonaktif (Draft)</span>
                </span>
              )
            ) : isWaste ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800 text-white backdrop-blur-md px-2.5 py-1 text-[11px] font-bold shadow-sm border border-emerald-400/40 whitespace-nowrap">
                <Recycle className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>Limbah Sirkular</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold shadow-xs border border-border/80 text-text-primary whitespace-nowrap">
                <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Komoditas Pemasok</span>
              </span>
            )}
          </div>

          {/* Badge Kanan: Penanda Verifikasi Mutu (Hanya untuk Komoditas Pemasok, Limbah tidak ada badge sebelah) */}
          {!isWaste && (
            <div className="pointer-events-auto">
              {isHygienePassed ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold shadow-xs whitespace-nowrap">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Terverifikasi</span>
                </span>
              ) : isHygieneRejected ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 text-rose-800 border border-rose-500/30 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold shadow-xs whitespace-nowrap">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                  <span>Tidak Sesuai</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold shadow-xs whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Menunggu Audit</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Icon (i) di Kanan Bawah Gambar dengan Tooltip Alasan Rekomendasi */}
        {recommendationReason && (
          <div
            className="absolute bottom-2.5 right-2.5 z-20 pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div
              className="relative group/rec-tooltip"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowTooltip((prev) => !prev);
                }}
                className="flex items-center justify-center size-7 rounded-full bg-white/95 text-primary hover:text-white hover:bg-primary shadow-elevation-2 border border-primary/20 backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95"
                title="Alasan Direkomendasikan"
                aria-label="Alasan Direkomendasikan"
              >
                <Info className="size-4 shrink-0" />
              </button>

              {/* Tooltip Popover */}
              <div
                className={`absolute bottom-full right-0 mb-2 w-64 sm:w-72 rounded-2xl bg-slate-900/95 text-white p-3 text-xs shadow-elevation-3 backdrop-blur-md border border-white/10 transition-all duration-200 z-50 pointer-events-none ${
                  showTooltip
                    ? "opacity-100 visible translate-y-0"
                    : "opacity-0 invisible translate-y-1 group-hover/rec-tooltip:opacity-100 group-hover/rec-tooltip:visible group-hover/rec-tooltip:translate-y-0"
                }`}
              >
                <div className="font-bold text-[11px] text-emerald-400 mb-1">
                  Alasan Rekomendasi
                </div>
                <p className="text-[11px] leading-relaxed text-slate-200 font-normal">
                  {recommendationReason}
                </p>
                {/* Segitiga Panah Tooltip */}
                <div className="absolute top-full right-3 -mt-1 border-4 border-transparent border-t-slate-900/95" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Konten Card */}
      <div className="flex flex-1 flex-col pt-3.5 space-y-3 min-w-0 justify-between">
        <div className="min-w-0">
          {/* Baris Meta: Tag Status/Kebutuhan & Lokasi Seller */}
          <div className="flex items-center justify-between gap-2 mb-1.5 text-[11px] h-[22px] min-h-[22px] min-w-0">
            <div className="min-w-0 flex-1 truncate">
              {criticalStockNotice ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200/90 px-2 py-0.5 rounded-lg shadow-xs whitespace-nowrap">
                  <AlertTriangle className="size-3 text-red-600 shrink-0" />
                  <span className="truncate">
                    Sisa {criticalStockNotice.daysRemaining} Hari ({criticalStockNotice.currentStock ?? 0} {criticalStockNotice.unit || item.wholesaleUnit})
                  </span>
                </span>
              ) : recipeTag ? (
                <span className="inline-flex items-center text-[10px] font-semibold text-text-secondary bg-surface-subtle/80 border border-border/80 px-2 py-0.5 rounded-lg truncate whitespace-nowrap">
                  <span className="truncate">{recipeTag}</span>
                </span>
              ) : benchmarkTag ? (
                <span className="inline-flex items-center text-[10px] font-bold text-primary bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-lg shadow-xs truncate whitespace-nowrap">
                  <span className="truncate">{benchmarkTag}</span>
                </span>
              ) : null}
            </div>

            <div className="inline-flex items-center gap-1 text-[11px] text-text-secondary shrink-0" title={locationDisplay}>
              <MapPin className="size-3 text-primary shrink-0" />
              <span className="truncate max-w-[110px] font-medium">{locationDisplay}</span>
            </div>
          </div>
          <h2 className="font-heading font-bold text-sm sm:text-base text-text-primary truncate h-6 leading-6 min-w-0" title={item.name}>
            {item.name}
          </h2>
        </div>

        {/* Badges: Tiering Price & Pool Terbuka (Tinggi dikunci 24px agar kartu seragam) */}
        <div className="h-6 min-h-[24px] max-h-[24px] flex items-center gap-1.5 overflow-hidden min-w-0">
          {!isWaste && (hasTieringPrice || hasOpenPools) ? (
            <>
              {hasTieringPrice && (
                <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 whitespace-nowrap">
                  <span>Diskon Bertingkat ({item.priceTiers.length} Tier)</span>
                </span>
              )}

              {hasOpenPools && (
                <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 whitespace-nowrap">
                  <span>
                    Pool Terbuka {openPoolsCount > 1 ? `(${openPoolsCount})` : ""}
                  </span>
                </span>
              )}
            </>
          ) : null}
        </div>

        {/* Harga Satuan (Tinggi dikunci 86px agar kartu seragam) */}
        <div className="rounded-xl bg-background p-3 border border-border/80 h-[86px] min-h-[86px] max-h-[86px] flex flex-col justify-center shrink-0">
          <span className="text-[11px] font-medium text-text-muted block">
            {isWaste ? "Harga Residu" : "Harga Satuan"}
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="font-heading font-extrabold text-lg sm:text-xl text-primary tabular-nums">
              {formatCurrency(primaryPrice)}
            </span>
            <span className="text-xs font-semibold text-text-muted">
              / {item.wholesaleUnit}
            </span>
          </div>
          {!isWaste && item.wholesaleUnit !== "KG" && item.unitWeightKg > 0 ? (
            <span className="text-[11px] text-text-muted tabular-nums block mt-0.5">
              Setara Rp {formatNumber(Math.round(primaryPrice / item.unitWeightKg))} / kg
            </span>
          ) : null}
        </div>

        {/* Metadata: Batas Minimum (MOQ) & Stok Tersedia (Tinggi dikunci 58px) */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-0.5 h-[58px] shrink-0">
          <div className="rounded-lg bg-surface-subtle p-2 border border-border/50">
            <span className="text-[10px] text-text-muted block font-medium">
              {isWaste ? "Skema" : "Min. Pesanan (MOQ)"}
            </span>
            <span className={`font-bold tabular-nums truncate block ${isWaste ? "text-emerald-800" : "text-text-primary"}`}>
              {isWaste ? "Bebas MOQ" : `${item.baseMoq} ${item.wholesaleUnit}`}
            </span>
          </div>
          <div className="rounded-lg bg-surface-subtle p-2 border border-border/50">
            <span className="text-[10px] text-text-muted block font-medium">
              Stok Tersedia
            </span>
            <span className="font-bold text-text-primary tabular-nums truncate block">
              {item.availableStock} {item.wholesaleUnit}
            </span>
          </div>
        </div>
        {/* Tombol Aksi */}
        <div className="pt-2 mt-auto shrink-0">
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
                <Link href={detailHref} className="flex-1">
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
              <Link href={detailHref} className="block w-full">
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
                <Link href={detailHref} className="shrink-0">
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
              <Link href={detailHref} className="block w-full">
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
