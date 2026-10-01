"use client";

import * as React from "react";
import {
  MOCK_WASTE_LISTINGS,
  MOCK_CIRCULAR_OFFTAKERS,
  type WasteListing,
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
import { formatCurrency, formatNumber } from "@/lib/utils";

export function UmkmSirkularView() {
  const [wasteListings, setWasteListings] = React.useState<WasteListing[]>(MOCK_WASTE_LISTINGS);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  // Form State
  const [newTitle, setNewTitle] = React.useState("");
  const [newCategory, setNewCategory] = React.useState<WasteListing["category"]>("Ampas Kedelai / Tahu");
  const [newVolumeKg, setNewVolumeKg] = React.useState<number>(50);
  const [newPricePerKg, setNewPricePerKg] = React.useState<number>(1500);
  const [newExpiryHours, setNewExpiryHours] = React.useState<number>(48);

  const totalWasteRevenue = wasteListings.reduce(
    (acc, curr) => acc + curr.potentialRevenue,
    0
  );
  const totalVolumeKg = wasteListings.reduce(
    (acc, curr) => acc + curr.volumeKg,
    0
  );

  const handleAddListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newListing: WasteListing = {
      id: `waste-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      volumeKg: newVolumeKg,
      pricePerKg: newPricePerKg,
      location: "Rungkut, Surabaya",
      expiryTimeHours: newExpiryHours,
      status: "TERSEDIA",
      potentialRevenue: newVolumeKg * newPricePerKg,
      suitableOfftaker: "Mitra Pengepul Terverifikasi KUMPUL",
    };

    setWasteListings((prev) => [newListing, ...prev]);
    setIsAddModalOpen(false);
    setNewTitle("");
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-text-muted">
              Eco-Marketplace &amp; Ekonomi Sirkular P2P
            </span>
          </div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary mt-1">
            Bursa Limbah Produktif UMKM
          </h1>
          <p className="font-body text-xs sm:text-sm text-text-secondary mt-1">
            Monetisasi sisa bahan olahan (minyak jelantah UCO, ampas kedelai, cangkang telur) langsung ke offtaker pakan dan biodiesel.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="default"
          onClick={() => setIsAddModalOpen(true)}
          className="font-bold min-h-[44px] shrink-0"
        >
          + Jual Limbah Dapur
        </Button>
      </div>

      {/* 2. Key Metrics Section: 3-Grid Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Estimasi Pendapatan Limbah</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs font-bold">
              Rp
            </span>
          </div>
          <div>
            <p className="font-heading text-xl sm:text-2xl font-black text-text-primary tabular-nums">
              {formatCurrency(totalWasteRevenue)}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Dari {wasteListings.length} listing aktif siap angkut
            </p>
          </div>
          <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px]">
            <span className="text-success font-bold">Nilai Ekonomis</span>
            <span className="text-text-muted">Langsung cair ke rekening</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Volume Tervalorisasi</span>
            <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-bold">
              Kg
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-xl sm:text-2xl font-black text-text-primary tabular-nums">
                {formatNumber(totalVolumeKg)}
              </span>
              <span className="text-xs font-semibold text-text-muted">kg</span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              Teralihkan dari pembuangan TPA liar
            </p>
          </div>
          <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px]">
            <span className="text-text-primary font-semibold">Zero Food Waste</span>
            <span className="text-primary font-semibold">Sirkular 100%</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Reduksi Jejak Karbon</span>
            <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
              CO2
            </span>
          </div>
          <div>
            <p className="font-heading text-xl sm:text-2xl font-black text-primary tabular-nums">
              {Math.round(totalVolumeKg * 1.8)} kg
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Setara emisi penyerapan 12 pohon produktif
            </p>
          </div>
          <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px]">
            <span className="text-success font-bold">Tersertifikasi Hijau</span>
            <span className="text-text-muted">Audit KUMPUL Eco</span>
          </div>
        </div>
      </div>

      {/* 3. Listing Limbah Aktif */}
      <div className="space-y-4">
        <h2 className="font-heading text-base font-bold text-text-primary">
          Limbah yang Sedang Ditawarkan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wasteListings.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border-border bg-surface shadow-elevation-1 p-5 space-y-4 transition-all duration-200 hover:shadow-elevation-2"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="waste" className="text-[11px] font-bold">
                    {item.category}
                  </Badge>
                  <Badge variant="success" className="text-[10px]">
                    {item.status}
                  </Badge>
                </div>

                <h3 className="font-heading text-base font-bold text-text-primary line-clamp-1">{item.title}</h3>

                <div className="p-3 rounded-xl bg-surface-subtle border border-border/70 space-y-1.5 text-xs">
                  <div className="flex justify-between text-text-secondary">
                    <span>Volume Siap Angkut:</span>
                    <strong className="text-text-primary tabular-nums">{item.volumeKg} kg</strong>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Harga Penawaran:</span>
                    <strong className="text-text-primary tabular-nums">{formatCurrency(item.pricePerKg)} / kg</strong>
                  </div>
                  <div className="pt-1 border-t border-border/60 flex justify-between">
                    <span className="text-success font-semibold">Potensi Cuan:</span>
                    <strong className="text-success text-sm tabular-nums">
                      {formatCurrency(item.potentialRevenue)}
                    </strong>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-text-muted">
                  <p>Masa Segar: Tersisa <strong className="text-amber-800 tabular-nums">{item.expiryTimeHours} Jam</strong></p>
                  <p className="truncate">Offtaker Cocok: <strong className="text-text-secondary">{item.suitableOfftaker}</strong></p>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full font-semibold text-xs min-h-[38px]"
                >
                  Kelola Listing &amp; Booking
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 4. Rekomendasi Mitra Offtaker Terdekat */}
      <div className="space-y-4 pt-2">
        <div>
          <h2 className="font-heading text-base font-bold text-text-primary">
            Mitra Off-Taker &amp; Bank Sampah Terdekat
          </h2>
          <p className="font-body text-xs text-text-secondary mt-0.5">
            Layanan penjemputan langsung ke dapur katering dengan timbangan digital terstandar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MOCK_CIRCULAR_OFFTAKERS.map((offtaker) => (
            <Card
              key={offtaker.id}
              className="p-5 rounded-2xl border-border bg-surface shadow-elevation-1 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <Badge variant="waste" className="text-[10px] font-semibold">
                  {offtaker.type}
                </Badge>
                <h3 className="font-heading text-base font-bold text-text-primary">{offtaker.name}</h3>
                <p className="text-xs text-text-muted">
                  {offtaker.location} &bull; <strong className="text-text-primary tabular-nums">{offtaker.distanceKm} km</strong>
                </p>

                <div className="p-3 rounded-xl bg-surface-subtle border border-border/70 text-xs space-y-1">
                  <span className="text-text-muted text-[11px]">Tarif Pembelian Estimasi:</span>
                  <p className="font-semibold text-text-primary">{offtaker.priceEstimateInfo}</p>
                </div>

                <p className="text-[11px] text-text-muted">
                  Menerima: <strong className="text-text-secondary">{offtaker.acceptedCommodities.join(", ")}</strong>
                </p>
              </div>

              <div className="pt-2 border-t border-border/50">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full font-bold text-xs min-h-[38px]"
                >
                  Minta Penjemputan Limbah
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal Jual Limbah Baru */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-text-primary">
              Pasang Listing Limbah Dapur
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted mt-1">
              Limbah akan ditampilkan kepada mitra offtaker pakan dan biodiesel terdaftar di area Surabaya.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddListing} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">Judul Listing</label>
              <Input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Contoh: Minyak Jelantah Penggorengan Bebek"
                className="w-full h-11 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">Kategori Limbah</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as WasteListing["category"])}
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="Ampas Kedelai / Tahu">Ampas Kedelai / Tahu</option>
                <option value="Minyak Jelantah (UCO)">Minyak Jelantah (UCO)</option>
                <option value="Kulit Buah & Sayur">Kulit Buah & Sayur</option>
                <option value="Cangkang Telur">Cangkang Telur</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">Volume (kg/L)</label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={newVolumeKg}
                  onChange={(e) => setNewVolumeKg(Number(e.target.value))}
                  className="w-full h-11 text-xs tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">Harga/kg (Rp)</label>
                <Input
                  type="number"
                  min="100"
                  step="100"
                  required
                  value={newPricePerKg}
                  onChange={(e) => setNewPricePerKg(Number(e.target.value))}
                  className="w-full h-11 text-xs tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">Masa Segar (Jam)</label>
                <Input
                  type="number"
                  min="6"
                  required
                  value={newExpiryHours}
                  onChange={(e) => setNewExpiryHours(Number(e.target.value))}
                  className="w-full h-11 text-xs tabular-nums"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-subtle border border-border text-xs flex justify-between items-center">
              <span className="text-text-secondary font-medium">Estimasi Penghasilan:</span>
              <strong className="text-success text-sm tabular-nums">
                {formatCurrency(newVolumeKg * newPricePerKg)}
              </strong>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="default"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 min-h-[44px]"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="default"
                className="flex-1 font-bold min-h-[44px]"
              >
                Tayangkan Listing
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
