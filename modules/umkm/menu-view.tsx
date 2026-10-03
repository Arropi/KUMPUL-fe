"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { MenuAddDialog } from "./menu/menu-add-dialog";
import { MenuCard } from "./menu/menu-card";
import { getUmkmProductsAction } from "@/actions/products";
import type { BEProduct } from "@/lib/api/types";

export function UmkmMenuView() {
  const [products, setProducts] = React.useState<BEProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  const loadProducts = React.useCallback(async () => {
    try {
      const res = await getUmkmProductsAction();
      if (res.success) {
        setProducts(res.data);
      } else {
        toast.error(res.message || "Gagal memuat daftar produk dari backend");
      }
    } catch {
      toast.error("Gagal terhubung ke backend");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let ignore = false;
    getUmkmProductsAction()
      .then((res) => {
        let localMocks: BEProduct[] = [];
        try {
          const saved = localStorage.getItem("kumpul_mock_products");
          if (saved) localMocks = JSON.parse(saved);
        } catch {}

        if (!ignore) {
          if (res.success && res.data && res.data.length > 0) {
            const backendIds = new Set(res.data.map((p) => p.id));
            const uniqueMocks = localMocks.filter((m) => !backendIds.has(m.id));
            setProducts([...uniqueMocks, ...res.data]);
          } else if (localMocks.length > 0) {
            setProducts(localMocks);
          }
        }
      })
      .catch(() => {
        if (!ignore) {
          try {
            const saved = localStorage.getItem("kumpul_mock_products");
            if (saved) setProducts(JSON.parse(saved));
          } catch {}
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleProductAdded = (newProduct: BEProduct) => {
    setProducts((prev) => {
      const updated = [newProduct, ...prev.filter((p) => p.id !== newProduct.id)];
      try {
        localStorage.setItem(
          "kumpul_mock_products",
          JSON.stringify(updated.filter((p) => p.id.startsWith("mock-")))
        );
      } catch {}
      return updated;
    });
  };

  const handleProductDeleted = (deletedId: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== deletedId);
      try {
        localStorage.setItem(
          "kumpul_mock_products",
          JSON.stringify(updated.filter((p) => p.id.startsWith("mock-")))
        );
      } catch {}
      return updated;
    });
  };

  const filteredProducts = React.useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.product_name.toLowerCase().includes(q) ||
        p.recipes?.some((r) => r.ingredient_name.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  return (
    <div className="space-y-6">
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
            onClick={() => setIsAddModalOpen(true)}
            className="min-h-[44px] gap-2 font-semibold px-4 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk &amp; Resep</span>
          </Button>
        </div>
      </div>

      {/* 2. Search & Aggregated Notice */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            type="text"
            placeholder="Cari berdasarkan nama produk atau bahan baku..."
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

      {/* 3. Product Cards Grid */}
      {isLoading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-xs text-text-muted font-medium">
            Memuat daftar produk dari backend KUMPUL...
          </span>
        </div>
      ) : filteredProducts.length === 0 ? (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((prod) => (
            <MenuCard
              key={prod.id}
              product={prod}
              onDeleted={handleProductDeleted}
              onRecipeUpdated={loadProducts}
            />
          ))}
        </div>
      )}

      {/* 4. Dialog Tambah Menu & Resep */}
      <MenuAddDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleProductAdded}
      />
    </div>
  );
}
