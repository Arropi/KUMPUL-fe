"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, ShoppingCart, ArrowUpDown, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { MenuAddDialog } from "./menu/menu-add-dialog";
import { MenuCard } from "./menu/menu-card";
import { MenuDetailDialog } from "./menu/menu-detail-dialog";
import { KitchenInventorySection } from "./menu/kitchen-inventory-section";
import { Pagination15 } from "@/components/ui/pagination";
import { getUmkmProductsAction } from "@/actions/products";
import type { BEProduct } from "@/lib/api/types";
import { calculateCircularMargin } from "@/lib/menu-intelligence";

export type MenuSortOption =
  | "MARGIN_DESC"
  | "CIRCULAR_BOOST"
  | "OUTPUT_DESC"
  | "PRICE_DESC"
  | "PRICE_ASC"
  | "NAME_ASC";

export const MENU_SORT_OPTIONS: { value: MenuSortOption; label: string; description: string }[] = [
  {
    value: "MARGIN_DESC",
    label: "Margin Tertinggi (Prioritas Jual)",
    description: "Urutkan menu dengan persentase laba bersih terbesar",
  },
  {
    value: "CIRCULAR_BOOST",
    label: "Laba Sirkular Terbesar (+Limbah)",
    description: "Urutkan menu dengan potensi tambahan pendapatan residu tertinggi",
  },
  {
    value: "OUTPUT_DESC",
    label: "Volume Produksi Tertinggi",
    description: "Urutkan menu dengan kapasitas porsi harian terbanyak",
  },
  {
    value: "PRICE_DESC",
    label: "Harga Jual Tertinggi",
    description: "Dari menu harga premium ke ekonomis",
  },
  {
    value: "PRICE_ASC",
    label: "Harga Jual Terendah",
    description: "Dari menu harga ekonomis ke premium",
  },
  {
    value: "NAME_ASC",
    label: "Nama Produk (A - Z)",
    description: "Urutan alfabetis nama menu",
  },
];

export function UmkmMenuView() {
  const [products, setProducts] = React.useState<BEProduct[]>([]);
  const rawProducts = products;
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<MenuSortOption>("MARGIN_DESC");
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<BEProduct | null>(null);
  const [detailProduct, setDetailProduct] = React.useState<BEProduct | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

  const handleOpenDetail = (prod: BEProduct) => {
    setDetailProduct(prod);
    setIsDetailModalOpen(true);
  };

  const handleEditFromDetail = (prod: BEProduct) => {
    setIsDetailModalOpen(false);
    setDetailProduct(null);
    setEditingProduct(prod);
    setIsAddModalOpen(true);
  };

  // Pagination state (Watermelon UI Pagination-15)
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(9);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  const loadProducts = React.useCallback(async () => {
    try {
      const res = await getUmkmProductsAction();
      if (res.success && res.data) {
        setProducts(res.data);
      } else {
        setProducts([]);
      }
    } catch {
      setProducts([]);
      toast.error("Gagal terhubung ke backend");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleProductAdded = (newProduct: BEProduct) => {
    setProducts((prev) => [newProduct, ...prev.filter((p) => p.id !== newProduct.id)]);
    loadProducts();
  };

  const handleProductDeleted = (deletedId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== deletedId));
    loadProducts();
  };

  const handleEditProduct = (prod: BEProduct) => {
    setEditingProduct(prod);
    setIsAddModalOpen(true);
  };

  const processedProducts = React.useMemo(() => {
    let result = products;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.product_name.toLowerCase().includes(q) ||
          p.recipes?.some((r) => r.ingredient_name.toLowerCase().includes(q))
      );
    }

    return [...result].sort((a, b) => {
      const finA = calculateCircularMargin(a);
      const finB = calculateCircularMargin(b);

      switch (sortBy) {
        case "MARGIN_DESC":
          return finB.pureMarginPercentage - finA.pureMarginPercentage;

        case "CIRCULAR_BOOST":
          return finB.dailyWasteRevenue - finA.dailyWasteRevenue;

        case "OUTPUT_DESC": {
          const outA = (a.expected_batch_units || 50) * (a.production_iterations_per_day || 2);
          const outB = (b.expected_batch_units || 50) * (b.production_iterations_per_day || 2);
          return outB - outA;
        }

        case "PRICE_DESC":
          return finB.sellingPrice - finA.sellingPrice;

        case "PRICE_ASC":
          return finA.sellingPrice - finB.sellingPrice;

        case "NAME_ASC":
          return a.product_name.localeCompare(b.product_name);

        default:
          return 0;
      }
    });
  }, [products, searchQuery, sortBy]);

  const totalPages = Math.ceil(processedProducts.length / pageSize) || 1;
  const paginatedProducts = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedProducts.slice(start, start + pageSize);
  }, [processedProducts, currentPage, pageSize]);

  return (
    <div className="space-y-8">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary mt-1">
            Produk Usaha &amp; Kebutuhan Bahan Baku
          </h1>
          <p className="font-body text-xs sm:text-sm text-text-secondary mt-1">
            Daftarkan produk olahan atau komoditas kuliner Anda beserta rincian resep bahan baku untuk agregasi pengadaan grosir otomatis.
          </p>
        </div>

        <div className="flex items-center">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => {
              setEditingProduct(null);
              setIsAddModalOpen(true);
            }}
            className="min-h-[44px] gap-2 font-semibold px-4 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk &amp; Resep</span>
          </Button>
        </div>
      </div>

      {/* 2. Search, Sort Dropdown & Quick Link */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Kolom Pencarian */}
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Cari berdasarkan nama produk atau bahan baku..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftElement={<Search className="w-4 h-4" />}
            className="h-11 text-xs sm:text-sm bg-surface rounded-xl"
          />
        </div>

        {/* Dropdown Sortir Produk */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="md"
              className="min-h-[44px] h-11 px-3.5 gap-2 rounded-xl text-xs font-semibold border-border bg-surface hover:bg-surface-subtle shrink-0 cursor-pointer justify-between sm:justify-start"
            >
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="text-text-secondary font-normal">Urutkan:</span>
                <span className="font-bold text-text-primary">
                  {MENU_SORT_OPTIONS.find((o) => o.value === sortBy)?.label.split(" (")[0]}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-text-muted ml-0.5 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 p-1.5 rounded-2xl shadow-elevation-2">
            <div className="px-2.5 py-1.5 text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border/60 mb-1">
              Urutkan Produk
            </div>
            <DropdownMenuRadioGroup
              value={sortBy}
              onValueChange={(val) => setSortBy(val as MenuSortOption)}
            >
              {MENU_SORT_OPTIONS.map((opt) => (
                <DropdownMenuRadioItem
                  key={opt.value}
                  value={opt.value}
                  className="flex flex-col items-start gap-0.5 py-2 px-3 rounded-xl cursor-pointer hover:bg-surface-subtle"
                >
                  <span className="font-bold text-xs text-text-primary">
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-text-secondary leading-tight">
                    {opt.description}
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tombol Beli Pasokan di Bursa */}
        <Link href="/home" className="shrink-0">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="w-full sm:w-auto min-h-[44px] h-11 text-xs font-semibold gap-2 border-primary/30 text-primary hover:bg-primary-light rounded-xl px-4 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Beli Pasokan di Bursa</span>
          </Button>
        </Link>
      </div>

      {/* 3. Product Cards Grid (3 cards per row on desktop) */}
      {isLoading ? (
        <div className="min-h-[250px] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-xs text-text-muted font-medium">
            Memuat daftar produk dari backend KUMPUL...
          </span>
        </div>
      ) : processedProducts.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-border py-12 text-center">
          <CardContent className="space-y-2 max-w-md mx-auto">
            <CardTitle className="text-base font-bold text-text-primary">
              {searchQuery ? "Produk Tidak Ditemukan" : "Belum Ada Produk Terdaftar"}
            </CardTitle>
            <p className="text-xs text-text-secondary">
              {searchQuery
                ? `Tidak ada produk atau bahan baku yang cocok dengan kata kunci "${searchQuery}".`
                : "Daftarkan produk usaha Anda dan tentukan bahan baku kebutuhan produksinya untuk menghitung HPP otomatis."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedProducts.map((prod) => (
              <MenuCard
                key={prod.id}
                product={prod}
                onDeleted={handleProductDeleted}
                onEdit={handleEditProduct}
                onDetail={handleOpenDetail}
                onRecipeUpdated={loadProducts}
              />
            ))}
          </div>

          {/* Watermelon UI Pagination-15 Component */}
          {processedProducts.length > 0 && (
            <Pagination15
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={processedProducts.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[9, 12, 18, 27]}
              itemLabel="produk"
            />
          )}

          {/* 4. Pengolahan Stok Bahan Baku Dapur (Agregat Resep) */}
          <KitchenInventorySection products={rawProducts} />
        </div>
      )}

      {/* 5. Dialog Tambah & Edit Menu / Resep */}
      <MenuAddDialog
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={(savedProduct) => {
          handleProductAdded(savedProduct);
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        productToEdit={editingProduct}
      />

      {/* 5. Dialog Detail Produk & Sirkular Tabs */}
      <MenuDetailDialog
        key={detailProduct?.id || "none"}
        product={detailProduct}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailProduct(null);
        }}
        onEdit={handleEditFromDetail}
      />
    </div>
  );
}
