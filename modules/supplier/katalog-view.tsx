"use client";

import * as React from "react";
import Link from "next/link";
import { SupplierCommodity } from "@/constants/supplier";
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
import {
  getMySupplierCatalogsAction,
  updateSupplierCommodityAction,
  unpublishSupplierCommodityAction,
} from "@/actions/supplier-catalog";
import { mapBEToSupplierCommodity } from "./helpers";
import { PublishCommodityDialog } from "./katalog/publish-commodity-dialog";
import { Plus, Search, ChevronDown, PackageX } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "ALL", label: "Semua Status" },
  { value: "ACTIVE", label: "Aktif di Bursa" },
  { value: "INACTIVE", label: "Nonaktif (Draft)" },
] as const;

export function SupplierKatalogView() {
  const [commodities, setCommodities] = React.useState<SupplierCommodity[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [isLoading, setIsLoading] = React.useState(true);
  const [publishingCommodity, setPublishingCommodity] =
    React.useState<SupplierCommodity | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getMySupplierCatalogsAction();
      if (res.success && res.data) {
        setCommodities(res.data.map(mapBEToSupplierCommodity));
      } else {
        setCommodities([]);
      }
    } catch {
      setCommodities([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedStatusLabel =
    STATUS_OPTIONS.find((s) => s.value === selectedStatus)?.label || "Semua Status";

  const handleToggleStatus = async (id: string) => {
    const target = commodities.find((c) => c.id === id);
    if (!target) return;

    // Jika belum aktif, buka dialog form sebelum publikasi ke bursa
    if (!target.isActive) {
      setPublishingCommodity(target);
      return;
    }

    // Jika sudah aktif dan ingin ditarik dari bursa
    const nextState = false;
    setCommodities((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: nextState } : c))
    );

    try {
      await unpublishSupplierCommodityAction(id);
      toast.info(
        `Status publikasi ${target.name} telah ditarik dari etalase bursa.`,
        "Komoditas Dinonaktifkan"
      );
    } catch {
      toast.error("Gagal memperbarui status publikasi di backend.");
    }
  };

  const handlePublishSuccess = (updated: SupplierCommodity) => {
    setCommodities((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  const filteredCommodities = commodities.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchTag.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus =
      selectedStatus === "ALL" ||
      (selectedStatus === "ACTIVE" && item.isActive) ||
      (selectedStatus === "INACTIVE" && !item.isActive);

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Halaman (Tanpa Tombol Refresh) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary">
            Katalog Pasokan Komoditas Grosir
          </h1>
          <p className="font-body text-xs sm:text-sm text-text-secondary mt-1">
            Kelola etalase komoditas entitas Anda, verifikasi paspor mutu kesehatan pangan,
            dan pantau status publikasi di bursa.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/katalog/tambah" className="shrink-0">
            <Button
              variant="primary"
              size="md"
              className="font-semibold min-h-[44px] cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Tambah Pasokan Komoditas</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter & Pencarian (Tanpa Filter Sektor) */}
      <Card className="p-4 sm:p-5 bg-surface border-border shadow-elevation-1 rounded-2xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 relative max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="search-commodity"
              placeholder="Cari nama komoditas, SKU, atau izin mutu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 min-h-[44px]"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Filter Status */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="default"
                  className="h-11 w-full sm:w-auto sm:shrink-0 gap-2 rounded-xl px-3 text-xs sm:text-sm font-semibold shadow-xs justify-between cursor-pointer"
                  aria-label={`Pilih filter status: saat ini ${selectedStatusLabel}`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-text-muted font-normal text-xs">Status:</span>
                    <span className="font-semibold text-text-primary truncate">{selectedStatusLabel}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
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
            {(searchQuery || selectedStatus !== "ALL") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedStatus("ALL");
                }}
                className="h-11 text-xs font-semibold text-primary hover:text-primary-hover hover:bg-primary/5 min-h-[44px] px-3 gap-1.5 cursor-pointer"
              >
                Reset Filter
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Grid Kartu Komoditas */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 rounded-2xl border-border bg-surface animate-pulse h-72" />
          ))}
        </div>
      ) : filteredCommodities.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-dashed border-border p-12 text-center space-y-4 shadow-elevation-1">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-text-muted flex items-center justify-center mx-auto border border-border">
            <PackageX className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="font-heading font-bold text-base text-text-primary">
              {commodities.length === 0
                ? "Belum ada komoditas di katalog bisnis Anda"
                : "Tidak ada komoditas yang sesuai filter"}
            </h2>
            <p className="font-body text-xs text-text-secondary max-w-sm mx-auto">
              {commodities.length === 0
                ? "Tambahkan pasokan komoditas grosir pertama Anda untuk mulai memasarkan bahan baku ke mitra UMKM di bursa."
                : "Ubah kata kunci pencarian atau reset filter untuk menampilkan komoditas yang terdaftar."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommodities.map((item) => (
            <CommodityCatalogCard
              key={item.id}
              item={item}
              role="supplier"
              pageContext="katalog"
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Dialog Konfirmasi Publikasi ke Bursa untuk Supplier */}
      {publishingCommodity && (
        <PublishCommodityDialog
          isOpen={!!publishingCommodity}
          onClose={() => setPublishingCommodity(null)}
          commodity={publishingCommodity}
          onPublishSuccess={(updated) => {
            handlePublishSuccess(updated);
            setPublishingCommodity(null);
          }}
        />
      )}
    </div>
  );
}
