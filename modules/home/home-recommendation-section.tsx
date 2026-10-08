"use client";

import * as React from "react";
import Link from "next/link";
import { Utensils, BarChart2, ArrowRight, AlertTriangle } from "lucide-react";
import { SupplierCommodity } from "@/constants/supplier";
import {
  CommodityCatalogCard,
  type CriticalStockNotice,
} from "@/components/katalog/commodity-catalog-card";
import { beFetch } from "@/lib/api/be-client";

interface HomeRecommendationSectionProps {
  role: "umkm" | "supplier";
  commodities: SupplierCommodity[];
  onPurchase?: (item: SupplierCommodity) => void;
  recommendations: MatchedCommodity[];
  recsError: boolean;
}

export interface MatchedCommodity {
  commodity: SupplierCommodity;
  recipeTag?: string;
  benchmarkTag?: string;
  criticalStockNotice?: CriticalStockNotice;
}

export function HomeRecommendationSection({
  role,
  commodities,
  recommendations,
  recsError,
  onPurchase,
}: HomeRecommendationSectionProps) {
  const isUmkm = role === "umkm";

  if (recsError) {
    return (
      <div className="text-center py-8">
        <p className="text-text-muted">Gagal memuat rekomendasi.</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-text-muted">Saat ini rekomendasi tidak tersedia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Header Rekomendasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-border/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-700">
              {isUmkm ? <Utensils className="w-4 h-4" /> : <BarChart2 className="w-4 h-4" />}
            </span>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {isUmkm ? "Sesuai Kebutuhan Resep Dapur" : "Tolok Ukur Pasar Serupa"}
            </span>
            {isUmkm && (
              // We need to count critical notices from recommendations
              <span className="inline-flex items-center gap-1 rounded-md bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold">
                <AlertTriangle className="w-3 h-3 text-red-600 animate-pulse" />
                <span>
                  {recommendations.filter((r) => r.criticalStockNotice).length} Bahan Kritis Dapur
                </span>
              </span>
            )}
          </div>
          <h2 className="font-heading font-bold text-lg sm:text-xl text-text-primary">
            {isUmkm
              ? "Rekomendasi Bahan Baku Sesuai Resep Menu Anda"
              : "Rekomendasi Komoditas Serupa dengan Portofolio Anda"}
          </h2>
          <p className="text-xs text-text-secondary max-w-2xl">
            {isUmkm
              ? "Bahan pangan pokok yang terhubung dengan produk UMKM Anda. Pasokan kritis dapur otomatis diposition teratas dengan estimasi saran kuota 7 hari."
              : "Pantau komoditas sejenis di bursa untuk tolok ukur harga pasokan (benchmark) dan peluang pasokan konsolidasi."}
          </p>
        </div>

        {isUmkm && (
          <Link
            href="/produk"
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 shrink-0 self-start sm:self-center"
          >
            <span>Kelola Daftar Produk &amp; Resep</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Grid Kartu Rekomendasi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {recommendations.map(({ commodity, recipeTag, benchmarkTag, criticalStockNotice }) => (
          <div key={`rec-${commodity.id}`} className="relative">
            <div
              className={`absolute -inset-0.5 rounded-2xl blur-[2px] opacity-75 pointer-events-none ${
                criticalStockNotice
                  ? "bg-gradient-to-r from-red-500/25 to-amber-500/25"
                  : "bg-gradient-to-r from-emerald-500/20 to-primary/20"
              }`}
            />
            <div className="relative">
              <CommodityCatalogCard
                item={commodity}
                role={role}
                recipeTag={recipeTag}
                benchmarkTag={benchmarkTag}
                criticalStockNotice={criticalStockNotice}
                onPurchase={onPurchase}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}