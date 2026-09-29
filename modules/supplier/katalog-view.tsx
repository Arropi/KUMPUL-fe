"use client";

import * as React from "react";
import Link from "next/link";
import {
  MOCK_SUPPLIER_COMMODITIES,
  SupplierCommodity,
} from "@/constants/supplier";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";

export function SupplierKatalogView() {
  const [commodities, setCommodities] = React.useState<SupplierCommodity[]>(
    MOCK_SUPPLIER_COMMODITIES
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedSector, setSelectedSector] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");

  const [toast, setToast] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "info" | "error";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const handleToggleStatus = (id: string) => {
    setCommodities((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextState = !c.isActive;
          setToast({
            isOpen: true,
            title: nextState ? "Komoditas Diaktifkan" : "Komoditas Dinonaktifkan",
            message: `Status publikasi ${c.name} telah diperbarui di Bursa KUMPUL.`,
            type: nextState ? "success" : "info",
          });
          return { ...c, isActive: nextState };
        }
        return c;
      })
    );
  };

  const filteredCommodities = commodities.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchTag.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchSector =
      selectedSector === "ALL" || item.sector === selectedSector;

    const matchStatus =
      selectedStatus === "ALL" ||
      (selectedStatus === "ACTIVE" && item.isActive) ||
      (selectedStatus === "INACTIVE" && !item.isActive);

    return matchSearch && matchSector && matchStatus;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStorageBadge = (temp: SupplierCommodity["batchTag"]["storageTemperature"]) => {
    switch (temp) {
      case "AMBIENT":
        return <Badge variant="neutral">Suhu Ruang (Ambient)</Badge>;
      case "CHILLED":
        return <Badge variant="info">Dingin (Chilled 0 s.d. 4°C)</Badge>;
      case "FROZEN":
        return <Badge variant="warning">Beku (Frozen &lt; -18°C)</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Toast
        isOpen={toast.isOpen}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary text-balance">
            Katalog Pasokan Komoditas Grosir
          </h1>
          <p className="font-body text-xs sm:text-sm text-text-secondary mt-1 text-pretty">
            Atur kuota pasokan, konfigurasi batas MOQ, skema harga bertingkat, dan paspor mutu sanitasi (PRD Modul A.1 &amp; A.2).
          </p>
        </div>

        <Link href="/supplier/katalog/tambah" className="shrink-0">
          <Button variant="primary" size="md" className="font-semibold min-h-[44px]">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Pasokan Komoditas
          </Button>
        </Link>
      </div>

      {/* Filter & Pencarian */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Input
              id="search-commodity"
              placeholder="Cari nama komoditas, SKU, atau nomor izin edar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-[44px]"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter Sektor */}
            <div className="flex items-center gap-2">
              <label htmlFor="filter-sector" className="text-xs font-semibold text-text-secondary whitespace-nowrap">
                Sektor:
              </label>
              <select
                id="filter-sector"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-border bg-surface text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">Semua Sektor (7 Sektor)</option>
                <option value="Pertanian">Pertanian</option>
                <option value="FnB / Pengolahan">FnB / Pengolahan</option>
                <option value="Peternakan">Peternakan</option>
                <option value="Perikanan">Perikanan</option>
                <option value="Perkebunan">Perkebunan</option>
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-2">
              <label htmlFor="filter-status" className="text-xs font-semibold text-text-secondary whitespace-nowrap">
                Status:
              </label>
              <select
                id="filter-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-border bg-surface text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif di Bursa</option>
                <option value="INACTIVE">Nonaktif (Draft)</option>
              </select>
            </div>

            {(searchQuery || selectedSector !== "ALL" || selectedStatus !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSector("ALL");
                  setSelectedStatus("ALL");
                }}
                className="text-xs font-semibold text-accent hover:underline cursor-pointer min-h-[44px] px-2 flex items-center"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Daftar Kartu Komoditas */}
      {filteredCommodities.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-dashed border-border p-12 text-center space-y-3 shadow-elevation-1">
          <div className="w-12 h-12 rounded-xl bg-background text-text-muted flex items-center justify-center mx-auto border border-border">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h2 className="font-heading font-bold text-base text-text-primary">
            Tidak ada komoditas yang sesuai filter
          </h2>
          <p className="font-body text-xs text-text-secondary max-w-sm mx-auto text-pretty">
            Coba ubah kata kunci pencarian atau reset filter untuk menampilkan komoditas terdaftar.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCommodities.map((item) => (
            <Card
              key={item.id}
              className={`transition-all p-5 sm:p-6 ${
                item.isActive ? "border-border" : "border-border bg-neutral-50/60 opacity-85"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                {/* Informasi Pokok & Deskripsi */}
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-text-secondary bg-neutral-100 px-2.5 py-0.5 rounded-md tabular-nums border border-neutral-200">
                      {item.sku}
                    </span>
                    <Badge variant="neutral">{item.sector}</Badge>
                    {item.isActive ? (
                      <Badge variant="success">Tayang di Bursa</Badge>
                    ) : (
                      <Badge variant="warning">Nonaktif (Gudang)</Badge>
                    )}
                    {getStorageBadge(item.batchTag.storageTemperature)}
                  </div>

                  <div>
                    <h2 className="font-heading font-bold text-lg text-text-primary text-balance">
                      {item.name}
                    </h2>
                    <p className="font-body text-xs text-text-secondary leading-relaxed mt-1 text-pretty">
                      {item.description}
                    </p>
                  </div>

                  {/* Spesifikasi Grosir & MOQ */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-background border border-border">
                      <span className="text-[10px] text-text-muted font-semibold block">Satuan Grosir</span>
                      <p className="text-xs font-bold text-text-primary mt-0.5 tabular-nums">
                        {item.wholesaleUnit} ({item.unitWeightKg} kg)
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border">
                      <span className="text-[10px] text-text-muted font-semibold block">Batas Minimum (Base MOQ)</span>
                      <p className="text-xs font-bold text-accent mt-0.5 tabular-nums">
                        {item.baseMoq} {item.wholesaleUnit} ({item.baseMoq * item.unitWeightKg} kg)
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border">
                      <span className="text-[10px] text-text-muted font-semibold block">Stok Siap Kirim</span>
                      <p className="text-xs font-bold text-text-primary mt-0.5 tabular-nums">
                        {item.availableStock} {item.wholesaleUnit}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border">
                      <span className="text-[10px] text-text-muted font-semibold block">Estimasi Lead Time</span>
                      <p className="text-xs font-bold text-text-primary mt-0.5 tabular-nums">
                        {item.leadTimeDays} Hari Kerja
                      </p>
                    </div>
                  </div>

                  {/* Paspor Mutu, Kepatuhan & Lot Tagging */}
                  <div className="p-3.5 rounded-xl bg-[#EBF5F0]/60 border border-primary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Paspor Mutu &amp; Kepatuhan Pangan Digital
                      </span>
                      <Badge variant="success">
                        {item.batchTag.hygieneStatus}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-text-secondary">
                      <div>
                        <span className="text-text-muted">Nomor Izin:</span>{" "}
                        <span className="font-semibold text-text-primary font-mono tabular-nums">{item.batchTag.licenseNumber}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Tanggal Panen:</span>{" "}
                        <span className="font-semibold text-text-primary tabular-nums">{item.batchTag.productionDate}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Asal Komoditas:</span>{" "}
                        <span className="font-semibold text-text-primary">{item.batchTag.originLocation}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sisi Kanan: Skema Harga Bertingkat & Tombol Aksi */}
                <div className="lg:w-80 shrink-0 space-y-4 pt-2 lg:pt-0 lg:border-l lg:border-border lg:pl-6">
                  <div>
                    <h3 className="font-heading text-xs font-bold text-text-secondary mb-2">
                      Skema Harga Bertingkat (Tiered Pricing)
                    </h3>
                    <div className="space-y-2">
                      {item.priceTiers.map((tier, idx) => (
                        <div
                          key={tier.id}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                            idx === 1
                              ? "bg-amber-50/70 border-amber-200"
                              : "bg-background border-border"
                          }`}
                        >
                          <div>
                            <span className="font-semibold text-text-primary block">
                              {tier.label}
                            </span>
                            <span className="text-[10px] text-text-muted tabular-nums">
                              {tier.minQty} {item.wholesaleUnit} {tier.maxQty ? `s.d. ${tier.maxQty} ${item.wholesaleUnit}` : "ke atas"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-primary block tabular-nums text-sm">
                              {formatCurrency(tier.pricePerUnit)}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              per {item.wholesaleUnit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tombol Aksi Kontrol */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant={item.isActive ? "outline" : "primary"}
                      size="sm"
                      onClick={() => handleToggleStatus(item.id)}
                      className="flex-1 font-semibold text-xs min-h-[44px]"
                    >
                      {item.isActive ? "Tarik dari Bursa" : "Publikasikan"}
                    </Button>
                    <Link href={`/supplier/katalog/${item.id}/edit`}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="font-semibold text-xs min-h-[44px]"
                      >
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
