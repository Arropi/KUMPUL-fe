"use client";

import * as React from "react";
import Link from "next/link";
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShoppingCart,
  Edit3,
  RefreshCw,
  Search,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type { BEProduct } from "@/lib/api/types";
import { SECTOR_OPTIONS, type SectorType, type KitchenStockItem } from "./menu-types";

interface KitchenInventorySectionProps {
  products: BEProduct[];
}

const STORAGE_KEY = "kumpul_kitchen_stock_data";
export const CRITICAL_STOCK_KEY = "kumpul_kitchen_critical_items";

export function KitchenInventorySection({ products }: KitchenInventorySectionProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [editStockValue, setEditStockValue] = React.useState<number>(0);
  const [manualStockOverrides, setManualStockOverrides] = React.useState<Record<string, number>>({});

  // Muat override stok dari localStorage jika ada
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setManualStockOverrides(JSON.parse(saved));
      }
    } catch {
      // Ignore storage error
    }
  }, []);

  // Agregasi Bahan Baku dari Seluruh Menu Aktif
  const inventoryItems: KitchenStockItem[] = React.useMemo(() => {
    const map = new Map<string, {
      name: string;
      sector: SectorType;
      unit: string;
      dailyConsumption: number;
      linkedProducts: Set<string>;
    }>();

    // 1. Kumpulkan dari seluruh resep produk
    products.forEach((prod) => {
      const batchUnits = Number(prod.expected_batch_units) || 50;
      (prod.recipes || []).forEach((r) => {
        const rawName = r.ingredient_name.trim();
        const key = rawName.toLowerCase();
        const reqPerUnit = Number(r.required_qty_per_unit) || 0.1;
        const totalDaily = reqPerUnit * batchUnits;

        let sec: SectorType = "PERTANIAN";
        if (key.includes("ayam") || key.includes("daging") || key.includes("telur") || key.includes("susu")) {
          sec = "PETERNAKAN";
        } else if (key.includes("ikan") || key.includes("udang") || key.includes("cumi")) {
          sec = "PERIKANAN";
        } else if (key.includes("kopi") || key.includes("teh") || key.includes("kelapa") || key.includes("aren")) {
          sec = "PERKEBUNAN";
        } else if (key.includes("minyak") || key.includes("tepung") || key.includes("saus") || key.includes("bumbu")) {
          sec = "FNB_PENGOLAHAN";
        } else if (key.includes("box") || key.includes("bowl") || key.includes("cup") || key.includes("kemasan")) {
          sec = "RITEL";
        }

        if (map.has(key)) {
          const item = map.get(key)!;
          item.dailyConsumption += totalDaily;
          item.linkedProducts.add(prod.product_name);
        } else {
          map.set(key, {
            name: rawName,
            sector: sec,
            unit: r.unit || "KG",
            dailyConsumption: totalDaily,
            linkedProducts: new Set([prod.product_name]),
          });
        }
      });
    });

    // Fallback bahan demo jika produk kosong
    if (map.size === 0) {
      map.set("daging ayam", {
        name: "Daging Ayam Broiler Fillet",
        sector: "PETERNAKAN",
        unit: "KG",
        dailyConsumption: 20,
        linkedProducts: new Set(["Bebek & Ayam Goreng"]),
      });
      map.set("minyak sawit", {
        name: "Minyak Goreng Sawit",
        sector: "FNB_PENGOLAHAN",
        unit: "LITER",
        dailyConsumption: 6,
        linkedProducts: new Set(["Menu Gorengan & Sambal"]),
      });
      map.set("cabai rawit", {
        name: "Cabai Rawit Merah",
        sector: "PERTANIAN",
        unit: "KG",
        dailyConsumption: 4,
        linkedProducts: new Set(["Sambal Korek Spesial"]),
      });
    }

    // 2. Hitung Sisa Stok & Status Ketahanan
    const items: KitchenStockItem[] = [];
    map.forEach((val, key) => {
      const id = `item-${key.replace(/\s+/g, "-")}`;
      // Jika ada override di state, pakai itu. Kalau belum ada, beri mock realistis (misal 1.2 x harian)
      const currentStock =
        manualStockOverrides[id] !== undefined
          ? manualStockOverrides[id]
          : key.includes("ayam")
          ? 14 // Stok kritis (0.7 hari)
          : key.includes("minyak")
          ? 9 // Stok menipis (1.5 hari)
          : Math.round(val.dailyConsumption * 3.5); // Stok aman

      const daysRemaining =
        val.dailyConsumption > 0 ? currentStock / val.dailyConsumption : 99;

      let status: "KRITIS" | "MENIPIS" | "AMAN" = "AMAN";
      if (daysRemaining <= 1.0) {
        status = "KRITIS";
      } else if (daysRemaining <= 2.5) {
        status = "MENIPIS";
      }

      items.push({
        id,
        ingredientName: val.name,
        sector: val.sector,
        dailyConsumption: Math.round(val.dailyConsumption * 10) / 10,
        unit: val.unit,
        currentStock: Math.round(currentStock * 10) / 10,
        daysRemaining: Math.round(daysRemaining * 10) / 10,
        status,
        linkedProducts: Array.from(val.linkedProducts),
      });
    });

    return items;
  }, [products, manualStockOverrides]);

  // Sinkronkan bahan yang KRITIS & MENIPIS ke localStorage agar dapat dibaca oleh Home
  React.useEffect(() => {
    const criticalList = inventoryItems
      .filter((i) => i.status === "KRITIS" || i.status === "MENIPIS")
      .map((i) => ({
        name: i.ingredientName,
        status: i.status,
        daysRemaining: i.daysRemaining,
        unit: i.unit,
        sector: i.sector,
      }));

    try {
      localStorage.setItem(CRITICAL_STOCK_KEY, JSON.stringify(criticalList));
    } catch {
      // Ignore storage error
    }
  }, [inventoryItems]);

  const handleSaveStock = (id: string) => {
    const updated = { ...manualStockOverrides, [id]: Math.max(0, editStockValue) };
    setManualStockOverrides(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage error
    }
    setEditingItemId(null);
    toast.success("Stok fisik dapur berhasil diperbarui!");
  };

  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return inventoryItems;
    const q = searchQuery.toLowerCase();
    return inventoryItems.filter(
      (item) =>
        item.ingredientName.toLowerCase().includes(q) ||
        item.sector.toLowerCase().includes(q)
    );
  }, [inventoryItems, searchQuery]);

  const criticalCount = inventoryItems.filter((i) => i.status === "KRITIS").length;
  const lowCount = inventoryItems.filter((i) => i.status === "MENIPIS").length;

  return (
    <Card className="rounded-2xl border border-border shadow-elevation-1 bg-surface overflow-hidden">
      <CardHeader className="border-b border-border/60 pb-3 bg-surface-subtle/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-800">
                <Package className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Manajemen Rantai Pasok Dapur
              </span>
            </div>
            <CardTitle className="text-base sm:text-lg font-bold text-text-primary">
              Pengolahan &amp; Ketahanan Stok Bahan Baku Dapur
            </CardTitle>
            <p className="text-xs text-text-secondary">
              Agregasi konsumsi harian bahan baku berdasarkan iterasi hari produksi seluruh menu. Bahan berstatus kritis otomatis diprioritaskan di bursa belanja Beranda.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/home">
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="gap-1.5 text-xs font-bold min-h-[38px] px-3.5"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Beli Pasokan di Bursa</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Snapshot Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3">
          <div className="p-2.5 rounded-xl border border-red-200 bg-red-50/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="font-semibold text-red-950">Stok Kritis (&le; 1 Hari)</span>
            </div>
            <span className="font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full text-[11px]">
              {criticalCount} Bahan
            </span>
          </div>

          <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-amber-950">Mendekati ROP (1 - 2.5 Hari)</span>
            </div>
            <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full text-[11px]">
              {lowCount} Bahan
            </span>
          </div>

          <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-emerald-950">Stok Aman (&gt; 2.5 Hari)</span>
            </div>
            <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
              {inventoryItems.length - criticalCount - lowCount} Bahan
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Search Bar Stok */}
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            type="text"
            placeholder="Cari bahan baku dapur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-surface"
          />
        </div>

        {/* Tabel Agregasi Stok */}
        <div className="rounded-xl border border-border overflow-x-auto bg-surface">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle/80 text-text-secondary border-b border-border font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Bahan Baku Dapur</th>
                <th className="py-2.5 px-3">Sektor Asal</th>
                <th className="py-2.5 px-3">Kebutuhan Harian</th>
                <th className="py-2.5 px-3">Stok Aktual Dapur</th>
                <th className="py-2.5 px-3">Ketahanan</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredItems.map((item) => {
                const secMeta =
                  SECTOR_OPTIONS.find((s) => s.value === item.sector) ||
                  SECTOR_OPTIONS[0];

                const isEditing = editingItemId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-surface-subtle/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-text-primary">{item.ingredientName}</p>
                      <p className="text-[10px] text-text-muted truncate max-w-[200px]">
                        Dipakai di: {item.linkedProducts.join(", ")}
                      </p>
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${secMeta.badgeClass}`}
                      >
                        {secMeta.label.split("&")[0]}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-semibold text-text-secondary">
                      {item.dailyConsumption} {item.unit} / Hari
                    </td>

                    <td className="py-2.5 px-3">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={editStockValue}
                            onChange={(e) => setEditStockValue(parseFloat(e.target.value) || 0)}
                            className="w-16 h-7 text-xs border border-primary rounded px-1.5"
                            autoFocus
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSaveStock(item.id)}
                            className="h-7 px-2 text-[11px]"
                          >
                            Simpan
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-text-primary text-sm">
                            {item.currentStock} {item.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItemId(item.id);
                              setEditStockValue(item.currentStock);
                            }}
                            className="text-text-muted hover:text-primary p-1"
                            title="Sesuaikan stok fisik (Opname)"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold text-xs ${
                          item.status === "KRITIS"
                            ? "text-red-600"
                            : item.status === "MENIPIS"
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {item.daysRemaining} Hari
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      {item.status === "KRITIS" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3" />
                          Kritis
                        </span>
                      )}
                      {item.status === "MENIPIS" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Menipis
                        </span>
                      )}
                      {item.status === "AMAN" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Aman
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      {item.status !== "AMAN" ? (
                        <Link href="/home">
                          <Button
                            type="button"
                            size="sm"
                            variant="primary"
                            className="h-7 text-[11px] gap-1 px-2.5 font-bold"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>Restock</span>
                          </Button>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItemId(item.id);
                            setEditStockValue(item.currentStock);
                          }}
                          className="text-[11px] font-semibold text-text-muted hover:text-text-primary px-2 py-1"
                        >
                          Opname
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
