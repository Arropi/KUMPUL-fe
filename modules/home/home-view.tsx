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
import { UserRole, UserSession } from "@/constants/auth";
import { Search, ChevronDown, Sparkles } from "lucide-react";

const SECTOR_OPTIONS = [
  { value: "ALL", label: "Semua Sektor" },
  { value: "Pertanian", label: "Pertanian" },
  { value: "FnB / Pengolahan", label: "FnB / Pengolahan" },
  { value: "Peternakan", label: "Peternakan" },
  { value: "Perikanan", label: "Perikanan" },
  { value: "Perkebunan", label: "Perkebunan" },
] as const;

interface HomeViewProps {
  initialSession?: UserSession | null;
}

export function HomeView({ initialSession }: HomeViewProps) {
  const [commodities, setCommodities] = React.useState<SupplierCommodity[]>(
    MOCK_SUPPLIER_COMMODITIES
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedSector, setSelectedSector] = React.useState<string>("ALL");

  const role: UserRole = initialSession?.role || "umkm";
  const isSupplier = role === "supplier";

  const selectedSectorLabel =
    SECTOR_OPTIONS.find((s) => s.value === selectedSector)?.label || "Semua Sektor";

  const handleToggleStatus = (id: string) => {
    setCommodities((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextState = !c.isActive;
          toast.success(
            nextState
              ? `Komoditas ${c.name} aktif di etalase bursa.`
              : `Komoditas ${c.name} ditarik dari bursa.`
          );
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

    const matchSector = selectedSector === "ALL" || item.sector === selectedSector;
    return matchSearch && matchSector;
  });

  return (
    <div className="space-y-6">
      {/* Header Marketplace */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-primary-light text-primary">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-primary font-heading uppercase tracking-wider">
              Bursa Komoditas &amp; Pengadaan
            </span>
          </div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary">
            Marketplace Bahan Baku Grosir
          </h1>
          <p className="font-body text-xs sm:text-sm text-text-secondary mt-1">
            Katalog pasokan bahan baku pangan bersertifikat mutu dengan harga bertingkat transparan untuk pooling mandiri.
          </p>
        </div>

        {isSupplier && (
          <Link href="/katalog/tambah" className="shrink-0">
            <Button variant="primary" size="md" className="font-semibold min-h-[42px] cursor-pointer">
              + Tambah Pasokan Komoditas
            </Button>
          </Link>
        )}
      </div>

      {/* Filter & Pencarian */}
      <Card className="p-4 sm:p-5 bg-surface border-border shadow-elevation-1 rounded-2xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 relative max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="search-commodity"
              placeholder="Cari komoditas, SKU, atau izin mutu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 min-h-[42px]"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="default"
                  className="h-10.5 w-full sm:w-auto sm:shrink-0 gap-2 rounded-xl px-3 text-xs sm:text-sm font-semibold shadow-xs justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-text-muted font-normal text-xs">Sektor:</span>
                    <span className="font-semibold text-text-primary truncate">{selectedSectorLabel}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuRadioGroup value={selectedSector} onValueChange={setSelectedSector}>
                  {SECTOR_OPTIONS.map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      {/* Grid Komoditas */}
      {filteredCommodities.length === 0 ? (
        <Card className="p-12 text-center bg-surface border-dashed border-border rounded-2xl">
          <p className="font-heading font-bold text-base text-text-primary">
            Tidak ada komoditas ditemukan
          </p>
          <p className="font-body text-xs text-text-secondary mt-1">
            Ubah kata kunci pencarian atau ganti filter sektor untuk melihat hasil lainnya.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
