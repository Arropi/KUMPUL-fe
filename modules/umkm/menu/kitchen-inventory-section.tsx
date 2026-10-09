"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Search,
  ShoppingCart,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination15 } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BEProduct } from "@/lib/api/types";
import {
  aggregateKitchenInventory,
  KitchenStockItem,
} from "@/lib/menu-intelligence";

interface KitchenInventorySectionProps {
  products: BEProduct[];
}

const STORAGE_KEY = "kumpul_kitchen_inventory_stock";

export function KitchenInventorySection({ products }: KitchenInventorySectionProps) {
  const [stockMap, setStockMap] = React.useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [editingItem, setEditingItem] = React.useState<KitchenStockItem | null>(null);
  const [newStockValue, setNewStockValue] = React.useState<string>("");

  // Pagination state untuk mengantisipasi bahan dapur yang banyak
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(6);
  // Muat stok fisik dari localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setStockMap(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Simpan stok saat diperbarui
  const handleSaveStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const val = parseFloat(newStockValue);
    if (isNaN(val) || val < 0) {
      toast.error("Masukkan angka stok yang valid.");
      return;
    }

    const updated = {
      ...stockMap,
      [editingItem.id]: val,
    };
    setStockMap(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    toast.success(`Stok fisik "${editingItem.ingredientName}" diperbarui menjadi ${val} ${editingItem.unit}`);
    setEditingItem(null);
  };

  // Komputasi inventaris bahan
  const inventoryItems = React.useMemo(() => {
    return aggregateKitchenInventory(products, stockMap);
  }, [products, stockMap]);

  // Simpan ringkasan stok kritis agar bisa dibaca reaktif oleh Beranda (/home)
  React.useEffect(() => {
    try {
      const criticalItems = inventoryItems.filter(
        (i) => i.status === "KRITIS" || i.status === "MENIPIS"
      );
      localStorage.setItem("kumpul_critical_kitchen_needs", JSON.stringify(criticalItems));
    } catch {}
  }, [inventoryItems]);

  const filteredItems = React.useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchSearch =
        item.ingredientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sector.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [inventoryItems, searchQuery, statusFilter]);

  // Reset halaman saat filter pencarian atau status berganti
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const criticalCount = inventoryItems.filter((i) => i.status === "KRITIS").length;
  const warningCount = inventoryItems.filter((i) => i.status === "MENIPIS").length;

  return (
    <Card id="kitchen-inventory" className="rounded-2xl border border-border bg-surface shadow-elevation-1 p-5 sm:p-6 space-y-5 scroll-mt-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="font-heading font-bold text-lg sm:text-xl text-text-primary">
            Pengolahan Stok Bahan Baku Dapur (Agregat Resep)
          </h2>
          <p className="font-body text-xs text-text-secondary mt-1">
            Pantau ketersediaan bahan terhadap laju produksi harian dan sinkronkan pengadaan ke Bursa.
          </p>
        </div>

        {/* Ringkasan Status & Aksi Cepat */}
        <div className="flex items-center gap-2 flex-wrap">
          {criticalCount > 0 && (
            <span className="inline-flex items-center gap-1.5 font-bold text-[11px] text-red-700 bg-red-50 border border-red-200/80 px-2.5 py-1 rounded-full select-none">
              <AlertTriangle className="size-3" />
              <span>{criticalCount} Bahan Kritis</span>
            </span>
          )}
          {warningCount > 0 && (
            <Badge variant="warning" className="gap-1.5 font-bold text-[11px] py-1 rounded-full">
              <AlertTriangle className="size-3" />
              <span>{warningCount} Menipis</span>
            </Badge>
          )}
          <Link href="/home">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs font-semibold gap-1.5 min-h-[38px] rounded-xl border-primary/30 text-primary hover:bg-primary-light"
            >
              <ShoppingCart className="size-3.5" />
              <span>Buka Bursa Pasokan</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            type="text"
            placeholder="Cari bahan baku dapur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs bg-surface-subtle/60 rounded-xl"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-subtle rounded-xl border border-border/60 text-xs">
          {[
            { label: "Semua", value: "ALL" },
            { label: "Kritis", value: "KRITIS" },
            { label: "Menipis", value: "MENIPIS" },
            { label: "Aman", value: "AMAN" },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                statusFilter === tab.value
                  ? "bg-surface text-text-primary font-bold shadow-xs border border-border/80"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Inventaris Dapur */}
      {filteredItems.length === 0 ? (
        <div className="py-12 text-center rounded-2xl bg-surface-subtle/50 border border-dashed border-border text-xs text-text-muted">
          {searchQuery
            ? "Tidak ditemukan bahan baku yang sesuai kata kunci."
            : "Belum ada kebutuhan bahan baku terdaftar dari menu aktif."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border shadow-elevation-1 bg-surface">
          <Table>
            <TableHeader className="bg-surface-subtle/80 shadow-[inset_0px_1px_2px_0px_rgba(255,255,255,1),inset_0px_-1px_4px_0px_rgba(0,0,0,0.05)]">
              <TableRow>
                <TableHead>Bahan Baku Dapur</TableHead>
                <TableHead>Sektor Asal</TableHead>
                <TableHead className="text-right">Kebutuhan Harian</TableHead>
                <TableHead className="text-right">Stok Dapur</TableHead>
                <TableHead className="text-center">Ketahanan</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => {
                const isKritis = item.status === "KRITIS";
                const isMenipis = item.status === "MENIPIS";

                return (
                  <TableRow
                    key={item.id}
                    className={`hover:bg-surface-subtle/50 transition-colors ${
                      isKritis ? "bg-red-50/20" : isMenipis ? "bg-amber-50/15" : ""
                    }`}
                  >
                    <TableCell className="max-w-[200px]">
                      <span className="font-bold text-text-primary block truncate" title={item.ingredientName}>
                        {item.ingredientName}
                      </span>
                    </TableCell>

                    <TableCell className="max-w-[140px]">
                      <span className="text-[11px] font-semibold text-text-secondary bg-surface-subtle px-2.5 py-0.5 rounded-full border border-border/60 inline-block truncate max-w-full" title={item.sector}>
                        {item.sector}
                      </span>
                    </TableCell>

                    <TableCell className="text-right tabular-nums">
                      <span className="font-semibold text-text-primary">
                        {item.dailyConsumption} {item.unit}
                      </span>
                      <span className="text-[10px] text-text-muted block">/ hari</span>
                    </TableCell>

                    <TableCell className="text-right tabular-nums">
                      <span className="font-bold text-text-primary">
                        {item.currentStock} {item.unit}
                      </span>
                    </TableCell>

                    <TableCell className="text-center tabular-nums">
                      <span
                        className={`inline-block font-bold text-xs px-2.5 py-0.5 rounded-full ${
                          isKritis
                            ? "bg-red-100 text-red-700"
                            : isMenipis
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.daysRemaining > 30 ? "> 30 Hari" : `${item.daysRemaining} Hari`}
                      </span>
                    </TableCell>

                    <TableCell className="text-center">
                      {isKritis ? (
                        <span className="inline-flex items-center justify-center text-[11px] font-bold text-red-700 bg-red-50 border border-red-200/80 px-2.5 py-0.5 rounded-full select-none">
                          KRITIS
                        </span>
                      ) : isMenipis ? (
                        <Badge variant="warning" className="text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                          MENIPIS
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                          AMAN
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingItem(item);
                            setNewStockValue(String(item.currentStock));
                          }}
                          className="h-8 min-h-[32px] px-3 text-xs rounded-xl font-semibold cursor-pointer"
                        >
                          Opname
                        </Button>
                        {(isKritis || isMenipis) && (
                          <Link href={`/home?q=${encodeURIComponent(item.ingredientName)}`}>
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              className="text-[11px] font-bold px-3 min-h-[32px] h-8 rounded-xl shadow-xs cursor-pointer"
                            >
                              Restock
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination untuk mengantisipasi jumlah bahan baku yang banyak */}
      {filteredItems.length > 0 && (
        <div className="pt-2 border-t border-border/60">
          <Pagination15
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredItems.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[6, 10, 15, 25]}
            itemLabel="bahan"
          />
        </div>
      )}

      {/* Modal Dialog Opname Stok Cepat */}
      <Dialog open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-md rounded-2xl bg-surface border border-border p-6 shadow-elevation-2">
          <form onSubmit={handleSaveStock} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-text-primary">
                Penyesuaian Stok Fisik (Stok Opname)
              </DialogTitle>
              <DialogDescription className="text-xs text-text-secondary line-clamp-2" title={`Perbarui jumlah fisik aktual ${editingItem?.ingredientName ?? ""} yang tersedia di dapur usaha Anda.`}>
                Perbarui jumlah fisik aktual {editingItem?.ingredientName} yang tersedia di dapur usaha Anda.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="rounded-xl bg-surface-subtle p-3 border border-border/60 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-text-muted">Kebutuhan Produksi Harian:</span>
                  <span className="font-bold text-text-primary">
                    {editingItem?.dailyConsumption} {editingItem?.unit} / hari
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Ketahanan Saat Ini:</span>
                  <span className="font-bold text-text-primary">
                    {editingItem?.daysRemaining} Hari
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1.5">
                  Jumlah Stok Fisik Riil ({editingItem?.unit}) *
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(e.target.value)}
                  placeholder={`Contoh: 15.5`}
                  required
                  autoFocus
                  className="rounded-xl h-11 text-sm bg-surface border-border"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingItem(null)}
                className="rounded-xl px-4 min-h-[40px] cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="rounded-xl px-5 min-h-[40px] font-bold cursor-pointer"
              >
                Simpan Stok
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
