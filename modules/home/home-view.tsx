"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
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
import { Pagination15 } from "@/components/ui/pagination";
import { CommodityCatalogCard } from "@/components/katalog/commodity-catalog-card";
import { UserRole, UserSession } from "@/constants/auth";
import { Search, ChevronDown, ShoppingBag } from "lucide-react";
import { getAllMarketplaceCatalogsAction } from "@/actions/supplier-catalog";
import { mapBEToSupplierCommodity } from "@/modules/supplier/helpers";
import { HomeRecommendationSection } from "./home-recommendation-section";
import { CreatePoolDialog } from "@/modules/supplier/katalog/create-pool-dialog";
import { BuyWasteDialog } from "./buy-waste-dialog";
import { beFetch } from "@/lib/api/be-client";
import type { BEBusinessEntity } from "@/lib/api/types";
import type { MatchedCommodity, RawRecommendationsData } from "./home-recommendation-section";

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
  catalog: SupplierCommodity[];
  recommendations: MatchedCommodity[];
  rawRecommendations?: RawRecommendationsData | null;
  catalogError: boolean;
  recsError: boolean;
  userProfile?: BEBusinessEntity | null;
}

export function HomeView({
  initialSession,
  catalog,
  recommendations,
  rawRecommendations,
  catalogError,
  recsError,
  userProfile,
}: HomeViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [commodities, setCommodities] = React.useState<SupplierCommodity[]>(catalog);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedSource, setSelectedSource] = React.useState<"ALL" | "SUPPLIER" | "WASTE">("ALL");
  const [selectedSector, setSelectedSector] = React.useState<string>("ALL");
  const [onlyReadyStock, setOnlyReadyStock] = React.useState<boolean>(false);
  const [onlyOpenPools, setOnlyOpenPools] = React.useState<boolean>(false);
  const [onlyVerified, setOnlyVerified] = React.useState<boolean>(false);
  const [purchasingCommodity, setPurchasingCommodity] =
    React.useState<SupplierCommodity | null>(null);

  // Pagination state (Watermelon UI Pagination-15)
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(9);
  // Handle deep link from AI ingredient recommendations or search parameters
  React.useEffect(() => {
    const searchParam = searchParams.get("search");
    const commodityIdParam = searchParams.get("commodityId");

    if (searchParam) {
      setSearchQuery(searchParam);
    }
    if (commodityIdParam) {
      const found = commodities.find((c) => c.id === commodityIdParam);
      if (found) {
        setPurchasingCommodity(found);
      }
    }
  }, [searchParams, commodities]);

  // Update local commodities state when props catalog changes
  React.useEffect(() => {
    if (catalog && catalog.length > 0) {
      setCommodities(catalog);
    }
  }, [catalog]);

  const role: UserRole = initialSession?.role || "umkm";
  const isSupplier = role === "supplier";
  const isUmkm = role === "umkm";

  const selectedSectorLabel =
    SECTOR_OPTIONS.find((s) => s.value === selectedSector)?.label || "Semua Sektor";

  const isOwnCommodity = React.useCallback(
    (item: SupplierCommodity) => {
      const profileName = userProfile?.legal_name?.toLowerCase().trim();
      const sessionName = initialSession?.name?.toLowerCase().trim();
      const seller = item.sellerName?.toLowerCase().trim();

      if (seller && (seller === profileName || seller === sessionName)) {
        return true;
      }

      if (item.supplierEntityId) {
        if (userProfile?.id && item.supplierEntityId === userProfile.id) {
          return true;
        }
        if (initialSession?.entityId && item.supplierEntityId === initialSession.entityId) {
          return true;
        }
      }

      if (item.supplierRoleId && initialSession?.roleId && item.supplierRoleId === initialSession.roleId) {
        return true;
      }

      return false;
    },
    [userProfile, initialSession]
  );

  const filteredCommodities = commodities.filter((item) => {
    if (isOwnCommodity(item)) return false;

    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchTag.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sellerCity && item.sellerCity.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.batchTag.originLocation &&
        item.batchTag.originLocation.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchSector = selectedSector === "ALL" || item.sector === selectedSector;
    const matchReadyStock = !onlyReadyStock || item.availableStock > 0;
    const matchPool =
      !onlyOpenPools ||
      Boolean(item.hasOpenPools || (item.activePools && item.activePools.length > 0));
    const matchVerified =
      !onlyVerified || item.batchTag.hygieneStatus === "TERVERIFIKASI";
    const matchSource =
      selectedSource === "ALL" ||
      (selectedSource === "WASTE" ? item.sourceType === "WASTE" : item.sourceType !== "WASTE");

    return matchSearch && matchSector && matchReadyStock && matchPool && matchVerified && matchSource;
  });

  // Reset halaman saat filter berubah
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSector, onlyReadyStock, onlyOpenPools, onlyVerified, selectedSource]);

  const totalPages = Math.max(1, Math.ceil(filteredCommodities.length / pageSize));
  const paginatedCommodities = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCommodities.slice(start, start + pageSize);
  }, [filteredCommodities, currentPage, pageSize]);
  return (
    <div className="space-y-2 pb-10">
      {/* 1. Header Marketplace */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary">Marketplace Pasokan Bahan Baku</h1>
          <p className="font-body text-xs sm:text-sm text-text-secondary mt-1">
            {isSupplier
              ? "Katalog pasokan komoditas bersertifikasi mutu dan fasilitas pooling untuk distribusi agregasi UMKM."
              : "Beli kebutuhan bahan baku langsung dari pemasok terverifikasi dengan skema diskon pooling harga grosir."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isSupplier ? (
            <>
            </>
          ) : (
            <Link href="/produk" className="shrink-0">
              <Button variant="secondary" size="md" className="font-semibold min-h-[42px] cursor-pointer">
                <ShoppingBag className="w-4 h-4 mr-1.5 text-primary" />
                <span>Kelola Produk &amp; Resep</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 2. Section Rekomendasi Khusus */}
      <HomeRecommendationSection
        role={role}
        initialSession={initialSession}
        commodities={commodities}
        recommendations={recommendations}
        rawRecommendations={rawRecommendations}
        recsError={recsError}
        userProfile={userProfile}
        onPurchase={isUmkm ? setPurchasingCommodity : undefined}
      />

      {/* 3. Section Seluruh Komoditas di Bursa */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-heading font-bold text-lg sm:text-xl text-text-primary">
              {isSupplier ? "Seluruh Pasokan Komoditas di Bursa" : "Katalog Seluruh Bahan Baku Tersedia"}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {isSupplier
                ? "Daftar pasokan komoditas pangan grosir terdaftar di seluruh hub logistik KUMPUL."
                : "Pilih bahan baku, periksa sertifikat mutu, dan klik beli untuk masuk ke rincian pesanan."}
            </p>
          </div>
          <span className="text-xs font-semibold text-text-muted">
            {filteredCommodities.length} Komoditas Ditemukan
          </span>
        </div>

        {/* Filter & Pencarian */}
        <Card className="p-4 sm:p-5 bg-surface border-border shadow-elevation-1 rounded-2xl space-y-3.5">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <Input
                id="search-commodity"
                placeholder="Cari komoditas, SKU, izin mutu, kota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftElement={<Search className="w-4 h-4" />}
                className="min-h-[42px]"
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

          {/* Filter Pills Tambahan */}
          <div className="flex items-center gap-2 pt-1 border-t border-border/50 overflow-x-auto max-w-full flex-nowrap sm:flex-wrap pb-1.5 sm:pb-0 custom-scrollbar">
            <span className="text-xs font-semibold text-text-muted mr-1 whitespace-nowrap shrink-0">Sumber:</span>
            <button
              type="button"
              onClick={() => setSelectedSource("ALL")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[34px] ${
                selectedSource === "ALL"
                  ? "bg-text-primary text-white border-text-primary shadow-xs"
                  : "bg-surface-subtle text-text-secondary border-border hover:bg-surface-subtle/80 hover:text-text-primary"
              }`}
            >
              Semua Sumber
            </button>
            <button
              type="button"
              onClick={() => setSelectedSource("SUPPLIER")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[34px] ${
                selectedSource === "SUPPLIER"
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-surface-subtle text-text-secondary border-border hover:bg-surface-subtle/80 hover:text-text-primary"
              }`}
            >
              Komoditas Pemasok
            </button>
            <button
              type="button"
              onClick={() => setSelectedSource("WASTE")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[34px] ${
                selectedSource === "WASTE"
                  ? "bg-circular-waste text-white border-circular-waste shadow-xs"
                  : "bg-surface-subtle text-text-secondary border-border hover:bg-surface-subtle/80 hover:text-text-primary"
              }`}
            >
              Limbah Sirkular
            </button>

            <span className="text-xs font-semibold text-text-muted mx-1 hidden sm:inline shrink-0">&bull;</span>
            <span className="text-xs font-semibold text-text-muted mr-1 whitespace-nowrap shrink-0">Filter Cepat:</span>
            <button
              type="button"
              onClick={() => setOnlyReadyStock(!onlyReadyStock)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[34px] ${
                onlyReadyStock
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-surface-subtle text-text-secondary border-border hover:bg-surface-subtle/80 hover:text-text-primary"
              }`}
            >
              Ready Stock
            </button>
            {selectedSource !== "WASTE" && (
              <button
                type="button"
                onClick={() => setOnlyOpenPools(!onlyOpenPools)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[34px] ${
                  onlyOpenPools
                    ? "bg-accent text-white border-accent shadow-xs"
                    : "bg-surface-subtle text-text-secondary border-border hover:bg-surface-subtle/80 hover:text-text-primary"
                }`}
              >
                Pool Terbuka Saja
              </button>
            )}
            <button
              type="button"
              onClick={() => setOnlyVerified(!onlyVerified)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[34px] ${
                onlyVerified
                  ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                  : "bg-surface-subtle text-text-secondary border-border hover:bg-surface-subtle/80 hover:text-text-primary"
              }`}
            >
              Terverifikasi Mutu
            </button>
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedCommodities.map((item) => (
                <CommodityCatalogCard
                  key={item.id}
                  item={item}
                  role={role}
                  pageContext="home"
                  onPurchase={isUmkm ? setPurchasingCommodity : undefined}
                />
              ))}
            </div>

            {/* Watermelon UI Pagination-15 Component */}
            {filteredCommodities.length > 0 && (
              <Pagination15
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredCommodities.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[9, 12, 18, 27]}
                itemLabel="komoditas"
              />
            )}
          </div>
        )}
      </div>

      {/* Dialog Beli / Buat Pool di Beranda */}
      {purchasingCommodity && (
        purchasingCommodity.sourceType === "WASTE" ? (
          <BuyWasteDialog
            isOpen={!!purchasingCommodity}
            onClose={() => setPurchasingCommodity(null)}
            wasteItem={purchasingCommodity}
            onSuccess={() => {
              setPurchasingCommodity(null);
              router.refresh();
            }}
          />
        ) : (
          <CreatePoolDialog
            isOpen={!!purchasingCommodity}
            onClose={() => setPurchasingCommodity(null)}
            commodity={purchasingCommodity}
            userProfile={userProfile}
            onSuccess={() => {
              setPurchasingCommodity(null);
              router.refresh();
            }}
          />
        )
      )}
    </div>
  );
}