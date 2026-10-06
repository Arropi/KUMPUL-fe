"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Utensils, Search, RefreshCw, ShoppingCart, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { MenuAddDialog } from "./menu/menu-add-dialog";
import { MenuCard } from "./menu/menu-card";
import { KitchenInventorySection } from "./menu/kitchen-inventory-section";
import { getUmkmProductsAction } from "@/actions/products";
import type { BEProduct } from "@/lib/api/types";
import { MENU_CATEGORIES } from "./menu/menu-types";

export function UmkmMenuView() {
  const [products, setProducts] = React.useState<BEProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("Semua");
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<BEProduct | null>(null);

  const loadProducts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getUmkmProductsAction();
      if (res.success) {
        setProducts(res.data);
      } else {
        toast.error(res.message || "Gagal memuat daftar menu dari backend");
      }
    } catch {
      toast.error("Gagal terhubung ke backend");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleProductSaved = (savedProduct: BEProduct) => {
    setProducts((prev) => [
      savedProduct,
      ...prev.filter((p) => p.id !== savedProduct.id),
    ]);
    setEditingProduct(null);
  };

  const handleProductDeleted = (deletedId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (product: BEProduct) => {
    setEditingProduct(product);
    setIsAddModalOpen(true);
  };

  // Filter Grouping Menu Berdasarkan Kategori & Pencarian
  const filteredProducts = React.useMemo(() => {
    let result = products;

    // Filter Kategori Grouping
    if (selectedCategory !== "Semua") {
      result = result.filter((p) => {
        const name = p.product_name.toLowerCase();
        if (selectedCategory === "Makanan Utama") {
          return !name.includes("es ") && !name.includes("kopi") && !name.includes("teh") && !name.includes("snack");
        } else if (selectedCategory === "Minuman") {
          return name.includes("es ") || name.includes("kopi") || name.includes("teh") || name.includes("jus") || name.includes("minum");
        } else if (selectedCategory === "Snack & Camilan") {
          return name.includes("snack") || name.includes("keripik") || name.includes("camilan") || name.includes("gorengan");
        } else if (selectedCategory === "Paket Katering") {
          return name.includes("paket") || name.includes("bento") || name.includes("box") || name.includes("pax");
        }
        return true;
      });
    }

    // Filter Search Text
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.product_name.toLowerCase().includes(q) ||
          p.recipes?.some((r) => r.ingredient_name.toLowerCase().includes(q))
      );
    }

    return result;
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="space-y-8">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-semibold text-text-muted">
              Manajemen Produksi &amp; Bill of Materials (BOM)
            </span>
          </div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary mt-1">
            Menu Usaha &amp; Kebutuhan Bahan Baku
          </h1>
          <p className="font-body text-xs sm:text-sm text-text-secondary mt-1">
            Kelola menu produk, sesuaikan iterasi hari produksi dapur, pantau valuasi margin limbah sirkular, dan jaga ketahanan stok bahan baku.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={loadProducts}
            disabled={isLoading}
            className="min-h-[44px] gap-2 font-semibold"
            aria-label="Segarkan data menu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleOpenAdd}
            className="min-h-[44px] gap-2 font-semibold px-4"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Menu &amp; Resep</span>
          </Button>
        </div>
      </div>

      {/* 2. Grouping per Kategori Menu (Tabs / Filter Pills) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-primary" />
          <span>Pengelompokan Menu Usaha:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {MENU_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface border border-border text-text-secondary hover:border-primary/50 hover:text-text-primary"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search & Bursa Pasokan Quick Action */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            type="text"
            placeholder="Cari berdasarkan nama menu olahan atau bahan baku..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 text-xs sm:text-sm bg-surface rounded-xl"
          />
        </div>

        <div className="md:col-span-4 flex items-center justify-end">
          <Link href="/home" className="w-full">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full min-h-[44px] text-xs font-semibold gap-2 border-primary/30 text-primary hover:bg-primary-light"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Beli Pasokan di Bursa</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4. Product Cards Grid (Dengan Tombol Edit & Analisis Limbah) */}
      {isLoading ? (
        <div className="min-h-[250px] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-xs text-text-muted font-medium">
            Memuat daftar menu dari backend KUMPUL...
          </span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-border py-12 text-center bg-surface">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center mx-auto">
              <Utensils className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-text-primary">
                {searchQuery || selectedCategory !== "Semua"
                  ? "Menu Tidak Ditemukan"
                  : "Belum Ada Menu Masakan"}
              </CardTitle>
              <p className="text-xs text-text-secondary">
                {searchQuery || selectedCategory !== "Semua"
                  ? `Tidak ada menu pada kelompok "${selectedCategory}" yang cocok dengan kata kunci.`
                  : "Daftarkan menu olahan kuliner Anda dan tentukan bahan baku kebutuhan produksinya untuk menghitung HPP otomatis."}
              </p>
            </div>
            {!searchQuery && selectedCategory === "Semua" && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleOpenAdd}
                className="gap-2 font-semibold min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                Tambah Menu Pertama Sekarang
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredProducts.map((prod) => (
            <MenuCard
              key={prod.id}
              product={prod}
              onDeleted={handleProductDeleted}
              onEdit={handleOpenEdit}
            />
          ))}
        </div>
      )}

      {/* 5. BAGIAN PENGOLAHAN STOK BAHAN BAKU DAPUR (TERHUBUNG KE REKOMENDASI HOME) */}
      <div className="pt-4">
        <KitchenInventorySection products={products} />
      </div>

      {/* 6. Dialog Tambah & Edit Menu */}
      <MenuAddDialog
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={handleProductSaved}
        initialProduct={editingProduct}
      />
    </div>
  );
}
