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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { CommodityCatalogCard } from "@/components/katalog/commodity-catalog-card";

const SECTOR_OPTIONS = [
  { value: "ALL", label: "Semua Sektor" },
  { value: "Pertanian", label: "Pertanian" },
  { value: "FnB / Pengolahan", label: "FnB / Pengolahan" },
  { value: "Peternakan", label: "Peternakan" },
  { value: "Perikanan", label: "Perikanan" },
  { value: "Perkebunan", label: "Perkebunan" },
] as const;

const STATUS_OPTIONS = [
  { value: "ALL", label: "Semua Status" },
  { value: "ACTIVE", label: "Aktif di Bursa" },
  { value: "INACTIVE", label: "Nonaktif (Draft)" },
] as const;

export function SupplierKatalogView() {
  const [commodities, setCommodities] = React.useState<SupplierCommodity[]>(
    MOCK_SUPPLIER_COMMODITIES,
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedSector, setSelectedSector] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");

  const selectedSectorLabel =
    SECTOR_OPTIONS.find((s) => s.value === selectedSector)?.label || "Semua Sektor";
  const selectedStatusLabel =
    STATUS_OPTIONS.find((s) => s.value === selectedStatus)?.label || "Semua Status";

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

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto">
            {/* Filter Sektor */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="default"
                  className="h-11 w-full sm:w-auto sm:shrink-0 gap-2 rounded-xl px-3 text-xs sm:text-sm font-semibold shadow-xs justify-between"
                  aria-label={`Pilih filter sektor: saat ini ${selectedSectorLabel}`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-text-muted font-normal text-xs hidden xs:inline">Sektor:</span>
                    <span className="font-semibold text-text-primary truncate">{selectedSectorLabel}</span>
                  </div>
                  <svg
                    className="w-3.5 h-3.5 text-text-muted shrink-0 transition-transform duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuRadioGroup
                  value={selectedSector}
                  onValueChange={setSelectedSector}
                >
                  {SECTOR_OPTIONS.map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Filter Status */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="default"
                  className="h-11 w-full sm:w-auto sm:shrink-0 gap-2 rounded-xl px-3 text-xs sm:text-sm font-semibold shadow-xs justify-between"
                  aria-label={`Pilih filter status: saat ini ${selectedStatusLabel}`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-text-muted font-normal text-xs hidden xs:inline">Status:</span>
                    <span className="font-semibold text-text-primary truncate">{selectedStatusLabel}</span>
                  </div>
                  <svg
                    className="w-3.5 h-3.5 text-text-muted shrink-0 transition-transform duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuRadioGroup
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        {opt.value === "ACTIVE" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                        {opt.value === "INACTIVE" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        )}
                        {opt.value === "ALL" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                        )}
                        <span>{opt.label}</span>
                      </div>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Reset Filter Button */}
            {(searchQuery ||
              selectedSector !== "ALL" ||
              selectedStatus !== "ALL") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSector("ALL");
                  setSelectedStatus("ALL");
                }}
                className="h-11 col-span-2 sm:col-span-1 text-xs font-semibold text-primary hover:text-primary-hover hover:bg-primary/5 min-h-[44px] px-3 gap-1.5 justify-center sm:justify-start"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reset Filter
              </Button>
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
