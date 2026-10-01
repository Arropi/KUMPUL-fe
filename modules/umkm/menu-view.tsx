"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Utensils, Trash2, Search, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface MenuIngredient {
  id: string;
  name: string;
  amountPerPortion: number;
  unit: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  dailyPortions: number;
  sellingPrice: number;
  ingredients: MenuIngredient[];
}

const INITIAL_MENUS: MenuItem[] = [
  {
    id: "menu-1",
    name: "Ayam Geprek Sambal Korek",
    category: "Makanan Utama",
    dailyPortions: 120,
    sellingPrice: 22000,
    ingredients: [
      { id: "ing-1", name: "Daging Ayam Broiler", amountPerPortion: 200, unit: "gram" },
      { id: "ing-2", name: "Cabai Rawit Merah", amountPerPortion: 25, unit: "gram" },
      { id: "ing-3", name: "Minyak Goreng Sawit", amountPerPortion: 30, unit: "ml" },
      { id: "ing-4", name: "Bawang Putih", amountPerPortion: 10, unit: "gram" },
    ],
  },
  {
    id: "menu-2",
    name: "Bebek Goreng Madura",
    category: "Makanan Utama",
    dailyPortions: 60,
    sellingPrice: 35000,
    ingredients: [
      { id: "ing-5", name: "Bebek Karkas", amountPerPortion: 250, unit: "gram" },
      { id: "ing-6", name: "Bumbu Rempah Hitam", amountPerPortion: 35, unit: "gram" },
      { id: "ing-7", name: "Minyak Goreng Sawit", amountPerPortion: 40, unit: "ml" },
    ],
  },
];

export function UmkmMenuView() {
  const [menus, setMenus] = React.useState<MenuItem[]>(INITIAL_MENUS);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  // Form State Tambah Menu
  const [newMenuName, setNewMenuName] = React.useState("");
  const [newMenuCategory, setNewMenuCategory] = React.useState("Makanan Utama");
  const [newDailyPortions, setNewDailyPortions] = React.useState<number>(100);
  const [newSellingPrice, setNewSellingPrice] = React.useState<number>(20000);
  const [ingredients, setIngredients] = React.useState<Array<{ name: string; amount: number; unit: string }>>([
    { name: "", amount: 100, unit: "gram" },
  ]);

  const handleAddIngredientRow = () => {
    setIngredients((prev) => [...prev, { name: "", amount: 50, unit: "gram" }]);
  };

  const handleRemoveIngredientRow = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName.trim()) {
      toast.error("Nama menu wajib diisi.");
      return;
    }

    const validIngredients: MenuIngredient[] = ingredients
      .filter((ing) => ing.name.trim().length > 0)
      .map((ing, i) => ({
        id: `ing-new-${Date.now()}-${i}`,
        name: ing.name.trim(),
        amountPerPortion: Number(ing.amount) || 1,
        unit: ing.unit,
      }));

    if (validIngredients.length === 0) {
      toast.error("Masukkan minimal 1 bahan baku kebutuhan menu.");
      return;
    }

    const created: MenuItem = {
      id: `menu-${Date.now()}`,
      name: newMenuName.trim(),
      category: newMenuCategory,
      dailyPortions: Number(newDailyPortions) || 1,
      sellingPrice: Number(newSellingPrice) || 0,
      ingredients: validIngredients,
    };

    setMenus((prev) => [created, ...prev]);
    toast.success(`Menu "${created.name}" dan daftar bahan bakunya berhasil disimpan!`);
    setIsAddModalOpen(false);

    // Reset Form
    setNewMenuName("");
    setNewDailyPortions(100);
    setNewSellingPrice(20000);
    setIngredients([{ name: "", amount: 100, unit: "gram" }]);
  };

  const filteredMenus = menus.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.ingredients.some((ing) => ing.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-primary-light text-primary">
              <Utensils className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-primary font-heading uppercase tracking-wider">
              Manajemen Dapur &amp; Resep
            </span>
          </div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary">
            Menu Kuliner &amp; Kebutuhan Bahan Baku
          </h1>
          <p className="font-body text-xs sm:text-sm text-text-secondary mt-1">
            Daftarkan menu olahan kuliner Anda dan rinci kebutuhan bahan bakunya untuk dihubungkan langsung ke bursa pooling.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsAddModalOpen(true)}
          className="font-semibold min-h-[42px] cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Menu Baru
        </Button>
      </div>

      {/* Pencarian */}
      <Card className="p-4 bg-surface border-border shadow-elevation-1 rounded-2xl">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder="Cari menu atau bahan baku (cth: Daging Ayam, Minyak, dll)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 min-h-[42px]"
          />
        </div>
      </Card>

      {/* Grid Menu Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMenus.map((menu) => {
          const totalIngs = menu.ingredients.length;
          return (
            <Card
              key={menu.id}
              className="flex flex-col rounded-2xl border-border bg-surface shadow-elevation-1 hover:shadow-elevation-2 transition-all p-5"
            >
              <CardHeader className="p-0 pb-3 border-b border-border/70 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="neutral" className="text-[10px] uppercase font-bold">
                    {menu.category}
                  </Badge>
                  <span className="text-xs font-bold text-primary">
                    Rp {menu.sellingPrice.toLocaleString("id-ID")}/porsi
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-text-primary">{menu.name}</CardTitle>
                <CardDescription className="text-xs text-text-muted">
                  Estimasi produksi: <strong>{menu.dailyPortions} porsi/hari</strong>
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0 pt-3 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 font-heading">
                    Kebutuhan Bahan Baku ({totalIngs}):
                  </p>
                  <div className="space-y-2">
                    {menu.ingredients.map((ing) => {
                      const dailyNeed = ((ing.amountPerPortion * menu.dailyPortions) / 1000).toFixed(1);
                      return (
                        <div
                          key={ing.id}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-subtle border border-border/60"
                        >
                          <span className="font-medium text-text-primary">{ing.name}</span>
                          <div className="text-right">
                            <span className="font-bold text-primary">
                              {ing.amountPerPortion} {ing.unit}
                            </span>
                            <span className="text-[10px] text-text-muted block">
                              Total ~{dailyNeed} kg/hari
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-border/60">
                  <Link href="/home" className="w-full">
                    <Button variant="outline" size="sm" className="w-full justify-between text-xs cursor-pointer">
                      <span>Cari Pasokan di Bursa</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal Tambah Menu Baru */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-text-primary">
              Tambah Menu Kuliner &amp; Kebutuhan
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Rinci kebutuhan bahan baku per porsi agar sistem dapat mengalkulasi pooling otomatis di bursa.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveMenu} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-text-secondary block mb-1">Nama Menu Kuliner</label>
              <Input
                placeholder="Misal: Nasi Ayam Bakar Madu"
                value={newMenuName}
                onChange={(e) => setNewMenuName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-text-secondary block mb-1">Target Porsi/Hari</label>
                <Input
                  type="number"
                  min="1"
                  value={newDailyPortions}
                  onChange={(e) => setNewDailyPortions(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-secondary block mb-1">Harga Jual (Rp)</label>
                <Input
                  type="number"
                  min="0"
                  value={newSellingPrice}
                  onChange={(e) => setNewSellingPrice(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Dynamic Bahan Baku List */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary font-heading">
                  Rincian Bahan Baku per Porsi
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddIngredientRow}
                  className="text-xs text-primary font-bold cursor-pointer"
                >
                  + Tambah Bahan
                </Button>
              </div>

              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder="Nama bahan (cth: Daging Sapi)"
                    value={ing.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setIngredients((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                      );
                    }}
                    className="flex-1 text-xs"
                    required
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Jml"
                    value={ing.amount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setIngredients((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, amount: val } : item))
                      );
                    }}
                    className="w-20 text-xs"
                    required
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) => {
                      const val = e.target.value;
                      setIngredients((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, unit: val } : item))
                      );
                    }}
                    className="h-10 px-2 rounded-xl border border-border bg-surface text-xs text-text-primary"
                  >
                    <option value="gram">gram</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="liter">liter</option>
                    <option value="butir">butir</option>
                  </select>
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredientRow(idx)}
                      className="p-2 text-text-muted hover:text-danger cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary" size="sm" className="font-semibold cursor-pointer">
                Simpan Menu &amp; Bahan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
