"use client";

import * as React from "react";
import Link from "next/link";
import {
  MOCK_CATALOG_COMMODITIES,
  MOCK_ACTIVE_POOLS,
  type CatalogCommodity,
} from "@/constants/umkm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

const CATEGORIES = [
  "Semua Kategori",
  "Beras & Biji-bijian",
  "Hortikultura & Sayur",
  "Bumbu & Rempah",
  "Minyak & Gula",
  "Unggas & Daging",
  "Bahan Penolong",
] as const;

export function UmkmKatalogView() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("Semua Kategori");
  const [onlyWithActivePool, setOnlyWithActivePool] = React.useState(false);
  const [selectedDetail, setSelectedDetail] = React.useState<CatalogCommodity | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  const filteredItems = React.useMemo(() => {
    return MOCK_CATALOG_COMMODITIES.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory =
        selectedCategory === "Semua Kategori" || item.category === selectedCategory;
      const matchPool = !onlyWithActivePool || Boolean(item.activePoolId);
      return matchSearch && matchCategory && matchPool;
    });
  }, [searchQuery, selectedCategory, onlyWithActivePool]);

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-text-muted">
              Paspor Mutu Pangan Grosir Hulu
            </span>
          </div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary mt-1">
            Katalog Pasokan Bahan Baku Grosir
          </h1>
          <p className="font-body text-xs sm:text-sm text-text-secondary mt-1">
            Komoditas langsung dari supplier terverifikasi dengan jaminan uji lab bebas residu, sertifikasi halal, dan tier harga volume.
          </p>
        </div>

        <Link href="/umkm" className="shrink-0">
          <Button variant="primary" size="md" className="font-semibold min-h-[44px]">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Radar Pooling Aktif
          </Button>
        </Link>
      </div>

      {/* Bar Pencarian & Filter Tabs Watermelon UI */}
      <Card className="p-4 sm:p-5 shadow-elevation-1">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari beras, minyak curah, bawang merah, supplier, atau SKU..."
              className="w-full h-11 pl-4 text-xs sm:text-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => setOnlyWithActivePool(!onlyWithActivePool)}
            className={`min-h-[44px] px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer ${
              onlyWithActivePool
                ? "bg-primary text-text-inverse shadow-xs font-bold"
                : "bg-surface-subtle text-text-secondary border border-border hover:bg-surface hover:text-text-primary"
            }`}
          >
            <span>Pool Berjalan ({MOCK_ACTIVE_POOLS.length})</span>
          </button>
        </div>

        {/* Tab Pills Kategori Bergaya Watermelon UI */}
        <div className="flex items-center gap-1.5 p-1 bg-background rounded-xl border border-border overflow-x-auto max-w-full mt-4">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[36px] px-3.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? "bg-surface text-primary shadow-[inset_0_1px_0_#FFFFFF,inset_0_-1px_0_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.06)] font-bold border border-border"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Grid Komoditas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-text-muted">
            Menampilkan <span className="text-text-primary font-bold tabular-nums">{filteredItems.length}</span> komoditas bahan baku
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const lowestTier = item.wholesalePriceTiers[item.wholesalePriceTiers.length - 1];
            const maxSavingsPercent = Math.round(
              ((item.marketPricePerKg - lowestTier.pricePerKg) / item.marketPricePerKg) * 100
            );
            const activePool = MOCK_ACTIVE_POOLS.find((p) => p.id === item.activePoolId);

            return (
              <Card
                key={item.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border-border bg-surface shadow-elevation-1 transition-all duration-200 hover:shadow-elevation-2"
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Header Kartu: Kategori & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md border border-primary/20 uppercase">
                      {item.category}
                    </span>
                    <Badge variant="success" className="font-semibold text-[11px]">
                      {item.qualityGrade}
                    </Badge>
                  </div>

                  {/* Judul & Info Supplier */}
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-heading text-base font-bold text-text-primary leading-snug line-clamp-1" title={item.name}>
                      {item.name}
                    </h3>
                    <p className="text-xs text-text-muted truncate" title={`${item.supplierName} • ${item.originCity}`}>
                      {item.supplierName} &bull; {item.originCity}
                    </p>
                  </div>

                  {/* Komparasi Harga: Pasar vs Grosir Tier */}
                  <div className="p-3.5 rounded-xl bg-surface-subtle border border-border/70 space-y-2">
                    <div className="flex items-baseline justify-between text-xs text-text-secondary">
                      <span>Harga Eceran Pasar:</span>
                      <span className="line-through text-text-muted tabular-nums">
                        {formatCurrency(item.marketPricePerKg)} / kg
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-semibold text-success">
                        Harga Grosir Pooling:
                      </span>
                      <div className="text-right">
                        <span className="font-heading text-lg font-black text-primary tabular-nums">
                          {formatCurrency(lowestTier.pricePerKg)}
                        </span>
                        <span className="text-xs text-text-muted"> / kg</span>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-border/40 flex items-center justify-between text-[11px]">
                      <span className="text-text-muted">Potensi Hemat Belanja:</span>
                      <span className="font-bold text-success tabular-nums">
                        Hingga {maxSavingsPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Sertifikasi Paspor Mutu */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                      Jaminan Mutu &amp; Keamanan:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.certifications.slice(0, 2).map((cert, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-surface border border-border text-text-secondary font-medium"
                        >
                          <span className="text-success font-bold">✓</span>
                          <span className="truncate max-w-[170px]">{cert}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Status Pool Aktif (Jika Ada) */}
                  {activePool && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between">
                      <span className="text-amber-800 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        Pool Sedang Berjalan
                      </span>
                      <span className="text-[11px] font-bold text-amber-900 tabular-nums">
                        {Math.round((activePool.accumulatedKg / activePool.targetMoqKg) * 100)}% Kuota
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Tombol Aksi */}
                <div className="p-4 pt-0 border-t border-border/50 flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedDetail(item);
                      setIsDetailOpen(true);
                    }}
                    className="flex-1 font-semibold text-xs min-h-[38px]"
                  >
                    Spesifikasi Mutu
                  </Button>

                  {item.activePoolId ? (
                    <Button
                      asChild
                      variant="primary"
                      size="sm"
                      className="flex-1 font-bold text-xs min-h-[38px]"
                    >
                      <Link href="/umkm">
                        Gabung Pool
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant="secondary"
                      size="sm"
                      className="flex-1 font-semibold text-xs min-h-[38px]"
                    >
                      <Link href="/umkm">
                        Mulai Pool
                      </Link>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modal Detail Spesifikasi Paspor Mutu */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          {selectedDetail && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 w-fit">
                  <span>Paspor Mutu Terverifikasi KUMPUL</span>
                </div>
                <DialogTitle className="font-heading text-lg font-bold text-text-primary mt-2 line-clamp-2" title={selectedDetail.name}>
                  {selectedDetail.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-text-muted truncate" title={`SKU: ${selectedDetail.sku} • Supplier: ${selectedDetail.supplierName}`}>
                  SKU: <span className="font-mono text-text-primary font-bold">{selectedDetail.sku}</span> &bull; Supplier: {selectedDetail.supplierName}
                </DialogDescription>
              </DialogHeader>

              {/* Tabel Tier Harga Grosir */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Tingkat Harga Grosir (Volume Tier)
                </h4>
                <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                  {selectedDetail.wholesalePriceTiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="p-3 flex items-center justify-between text-xs bg-surface"
                    >
                      <span className="font-medium text-text-secondary">
                        Minimum Pesanan <strong className="text-text-primary tabular-nums">{tier.minKg} kg</strong>
                      </span>
                      <span className="font-extrabold text-primary tabular-nums text-sm">
                        {formatCurrency(tier.pricePerKg)} / kg
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rincian Teknis & Suhu */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Spesifikasi Teknis &amp; Suhu Simpan
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-surface-subtle border border-border space-y-1">
                    <span className="text-text-muted text-[11px]">Suhu Penyimpanan:</span>
                    <p className="font-semibold text-text-primary">{selectedDetail.specifications.temperatureReq}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-subtle border border-border space-y-1">
                    <span className="text-text-muted text-[11px]">Umur Simpan (Shelf Life):</span>
                    <p className="font-semibold text-text-primary tabular-nums">{selectedDetail.specifications.shelfLifeDays} Hari</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-subtle border border-border space-y-1">
                    <span className="text-text-muted text-[11px]">Standar Kemasan:</span>
                    <p className="font-semibold text-text-primary">{selectedDetail.specifications.packagingType}</p>
                  </div>
                  {selectedDetail.specifications.waterContentPct && (
                    <div className="p-3 rounded-xl bg-surface-subtle border border-border space-y-1">
                      <span className="text-text-muted text-[11px]">Kadar Air Rata-rata:</span>
                      <p className="font-semibold text-text-primary tabular-nums">{selectedDetail.specifications.waterContentPct}%</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Daftar Sertifikasi Resmi */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Sertifikasi &amp; Uji Lab Lolos
                </h4>
                <ul className="space-y-1.5">
                  {selectedDetail.certifications.map((c, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                      <span className="text-success font-bold">✓</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-border flex justify-end">
                <Button
                  variant="primary"
                  size="default"
                  onClick={() => setIsDetailOpen(false)}
                  className="font-bold min-h-[40px]"
                >
                  Tutup Rincian
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
