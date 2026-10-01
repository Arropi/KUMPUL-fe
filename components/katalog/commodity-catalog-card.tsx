"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { SupplierCommodity } from "@/constants/supplier";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface CommodityCatalogCardProps {
  item: SupplierCommodity;
  onToggleStatus: (id: string) => void;
}

export function CommodityCatalogCard({
  item,
  onToggleStatus,
}: CommodityCatalogCardProps) {
  const [imgError, setImgError] = React.useState(false);

  const primaryPrice = item.priceTiers[0]?.pricePerUnit || 0;
  const isHygienePassed = item.batchTag.hygieneStatus === "TERVERIFIKASI";

  return (
    <Card className="flex flex-col overflow-hidden rounded-2xl border-border bg-surface shadow-elevation-1 transition-all duration-200 hover:shadow-elevation-2 hover:border-border-strong">
      {/* Gambar Komoditas & Overlay Badges */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
        {item.imageUrl && !imgError ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
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
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          {/* Badge Active / Nonaktif */}
          <div className="pointer-events-auto">
            {item.isActive ? (
              <Badge variant="success" className="shadow-xs font-semibold">
                Aktif di Bursa
              </Badge>
            ) : (
              <Badge variant="neutral" className="shadow-xs font-semibold bg-neutral-900/75 text-white backdrop-blur-xs">
                Nonaktif (Draft)
              </Badge>
            )}
          </div>

          {/* Badge Lulus Kesehatan / Mutu */}
          <div className="pointer-events-auto">
            {isHygienePassed ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200 shadow-xs">
                <svg
                  className="size-3 text-emerald-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Lulus Mutu
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200 shadow-xs">
                <svg
                  className="size-3 text-amber-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Menunggu Audit
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Konten Card */}
      <div className="flex flex-1 flex-col p-4 sm:p-5 space-y-3.5">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-text-muted mb-1">
            <span className="font-mono font-semibold uppercase">{item.sku}</span>
            <span>&bull;</span>
            <span>{item.sector}</span>
          </div>
          <h2 className="font-heading font-bold text-base text-text-primary line-clamp-1">
            {item.name}
          </h2>
        </div>

        {/* Harga Utama */}
        <div className="rounded-xl bg-background p-3 border border-border/80">
          <span className="text-[11px] font-medium text-text-secondary block">
            Harga Utama
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

        {/* Info Kuota & Stok */}
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

        {/* Tombol Aksi: Publish & Detail */}
        <div className="flex items-center gap-2.5 pt-2 mt-auto">
          <Button
            type="button"
            variant={item.isActive ? "outline" : "primary"}
            size="sm"
            onClick={() => onToggleStatus(item.id)}
            className="flex-1 font-semibold text-xs min-h-[44px]"
          >
            {item.isActive ? "Tarik dari Bursa" : "Publikasikan"}
          </Button>

          <Link href={`/supplier/katalog/${item.id}`} className="flex-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full font-semibold text-xs min-h-[44px]"
            >
              Detail
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
