"use client";

import * as React from "react";
import Link from "next/link";
import {
  MOCK_SUPPLIER_COMMODITIES,
  SupplierCommodity,
} from "@/constants/supplier";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { CommodityCatalogCard } from "@/components/katalog/commodity-catalog-card";

export function SupplierKatalogView() {
  const [commodities, setCommodities] = React.useState<SupplierCommodity[]>(
    MOCK_SUPPLIER_COMMODITIES,
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedSector, setSelectedSector] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");

  const handleToggleStatus = (id: string) => {
    setCommodities((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextState = !c.isActive;
          if (nextState) {
            toast.success(
              `Status publikasi ${c.name} telah diaktifkan di Bursa KUMPUL.`,
              "Komoditas Dipublikasikan",
            );
          } else {
            toast.info(
              `Status publikasi ${c.name} telah ditarik dari etalase bursa.`,
              "Komoditas Dinonaktifkan",
            );
          }
          return { ...c, isActive: nextState };
        }
        return c;
      }),
    );
  };

  const filteredCommodities = commodities.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchTag.licenseNumber
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchSector =
      selectedSector === "ALL" || item.sector === selectedSector;

    const matchStatus =
      selectedStatus === "ALL" ||
      (selectedStatus === "ACTIVE" && item.isActive) ||
      (selectedStatus === "INACTIVE" && !item.isActive);

    return matchSearch && matchSector && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary">
            Katalog Pasokan Komoditas Grosir
          </h1>
          <p className="font-body text-xs sm:text-sm text-text-secondary mt-1">
            Kelola etalase komoditas, verifikasi paspor mutu kesehatan pangan,
            dan pantau status publikasi di bursa.
          </p>
        </div>

        <Link href="/supplier/katalog/tambah" className="shrink-0">
          <Button
            variant="primary"
            size="md"
            className="font-semibold min-h-[44px]"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Tambah Pasokan Komoditas
          </Button>
        </Link>
      </div>

      {/* Filter & Pencarian */}
      <Card className="p-4 sm:p-5 bg-surface border-border shadow-elevation-1 rounded-2xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Input
              id="search-commodity"
              placeholder="Cari nama komoditas, SKU, atau nomor izin mutu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-[44px]"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter Sektor */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="filter-sector"
                className="text-xs font-semibold text-text-secondary whitespace-nowrap"
              >
                Sektor:
              </label>
              <select
                id="filter-sector"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-border bg-surface text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="ALL">Semua Sektor</option>
                <option value="Pertanian">Pertanian</option>
                <option value="FnB / Pengolahan">FnB / Pengolahan</option>
                <option value="Peternakan">Peternakan</option>
                <option value="Perikanan">Perikanan</option>
                <option value="Perkebunan">Perkebunan</option>
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="filter-status"
                className="text-xs font-semibold text-text-secondary whitespace-nowrap"
              >
                Status:
              </label>
              <select
                id="filter-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-border bg-surface text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif di Bursa</option>
                <option value="INACTIVE">Nonaktif (Draft)</option>
              </select>
            </div>

            {(searchQuery ||
              selectedSector !== "ALL" ||
              selectedStatus !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSector("ALL");
                  setSelectedStatus("ALL");
                }}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer min-h-[44px] px-2 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Grid Kartu Komoditas */}
      {filteredCommodities.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-dashed border-border p-12 text-center space-y-3 shadow-elevation-1">
          <div className="w-12 h-12 rounded-xl bg-background text-text-muted flex items-center justify-center mx-auto border border-border">
            <svg
              className="size-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </div>
          <h2 className="font-heading font-bold text-base text-text-primary">
            Tidak ada komoditas yang sesuai kriteria
          </h2>
          <p className="font-body text-xs text-text-secondary max-w-sm mx-auto">
            Ubah kata kunci pencarian atau reset filter untuk menampilkan
            komoditas yang terdaftar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommodities.map((item) => (
            <CommodityCatalogCard
              key={item.id}
              item={item}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
