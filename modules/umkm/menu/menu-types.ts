export type SectorType =
  | "PERTANIAN"
  | "PETERNAKAN"
  | "PERIKANAN"
  | "PERKEBUNAN"
  | "FNB_PENGOLAHAN"
  | "RITEL"
  | "LOGISTIK";

export const PRODUCT_UNITS = [
  { value: "PORSI", label: "Porsi (Piring / Sajian)" },
  { value: "BOWL", label: "Bowl (Mangkuk Kertas / Plastik)" },
  { value: "BOX", label: "Box / Kotak Bento / Nasi Kotak" },
  { value: "CUP", label: "Cup (Gelas Minuman Dingin/Panas)" },
  { value: "PAX", label: "Pax (Paket Katering / Rombongan)" },
  { value: "BOTOL", label: "Botol (250ml - 1000ml)" },
  { value: "LOYANG", label: "Loyang (Kue / Roti / Pizza)" },
  { value: "BUNGKUS", label: "Bungkus (Tradisional Daun / Kertas)" },
  { value: "PACK", label: "Pack / Standing Pouch (Snack / Bumbu)" },
  { value: "PCS", label: "Pcs (Potongan / Buah)" },
  { value: "KG", label: "Kg (Curah / Olahan Timbangan)" },
] as const;

export const MENU_CATEGORIES = [
  "Semua",
  "Makanan Utama",
  "Minuman",
  "Snack & Camilan",
  "Paket Katering",
  "Produk Olahan",
] as const;

export const SECTOR_OPTIONS: Array<{
  value: SectorType;
  label: string;
  badgeClass: string;
}> = [
  {
    value: "PERTANIAN",
    label: "Pertanian & Hasil Bumi",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    value: "PETERNAKAN",
    label: "Peternakan & Unggas",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    value: "PERIKANAN",
    label: "Perikanan & Kelautan",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
  },
  {
    value: "PERKEBUNAN",
    label: "Perkebunan",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-200",
  },
  {
    value: "FNB_PENGOLAHAN",
    label: "F&B / Olahan Pangan",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
  },
  {
    value: "RITEL",
    label: "Ritel & Kemasan",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    value: "LOGISTIK",
    label: "Logistik & Jasa",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
  },
];

export const COMMON_INGREDIENT_UNITS = [
  "KG",
  "GRAM",
  "LITER",
  "ML",
  "PCS",
  "LEMBAR",
  "BUTIR",
  "SDM",
  "PACK",
  "IKAT",
] as const;

export interface WasteItemInput {
  id?: string;
  wasteName: string;
  volumePerIteration: number;
  unit: "KG" | "LITER" | "PCS";
  potentialPricePerUnit: number;
}

export const WASTE_PRESETS = [
  {
    name: "Minyak Jelantah (UCO)",
    defaultPricePerUnit: 8000,
    unit: "LITER" as const,
    description: "Bahan baku biodiesel & sabun ekologis",
  },
  {
    name: "Ampas Kedelai / Tahu",
    defaultPricePerUnit: 1500,
    unit: "KG" as const,
    description: "Bahan pakan ternak kaya protein",
  },
  {
    name: "Ampas Kopi Basah",
    defaultPricePerUnit: 1200,
    unit: "KG" as const,
    description: "Kompos organik & briket arang",
  },
  {
    name: "Cangkang Telur Bersih",
    defaultPricePerUnit: 2000,
    unit: "KG" as const,
    description: "Sumber kalsium pupuk & suplemen pakan",
  },
  {
    name: "Residu Tulang & Jeroan",
    defaultPricePerUnit: 2500,
    unit: "KG" as const,
    description: "Pakan larva maggot BSF & gelatin",
  },
  {
    name: "Kulit Buah & Sayur",
    defaultPricePerUnit: 800,
    unit: "KG" as const,
    description: "Bahan fermentasi eco-enzyme",
  },
  {
    name: "Kardus & Sisa Karton",
    defaultPricePerUnit: 1800,
    unit: "KG" as const,
    description: "Daur ulang pulp kertas",
  },
];

export interface IngredientAlternativeSuggestion {
  originalIngredientName: string;
  suggestedIngredientName: string;
  category: "MARKET_AVAILABILITY" | "HEALTH_WELLNESS";
  reason: string;
  costDeltaPct: number; // e.g. -25 for 25% cheaper, or +10 for premium healthy
  badgeText: string;
}

export const INGREDIENT_ALTERNATIVES: Record<string, IngredientAlternativeSuggestion[]> = {
  cabai: [
    {
      originalIngredientName: "Cabai Rawit Merah",
      suggestedIngredientName: "Pasta Cabai / Cabai Kering Giling",
      category: "MARKET_AVAILABILITY",
      reason: "Harga cabai segar sedang fluktuatif di bursa; pasta cabai memangkas biaya hingga 30% dan tahan simpan lama.",
      costDeltaPct: -30,
      badgeText: "Hemat Biaya 30%",
    },
  ],
  minyak: [
    {
      originalIngredientName: "Minyak Goreng Sawit",
      suggestedIngredientName: "Minyak Kelapa Murni (VCO) / Canola",
      category: "HEALTH_WELLNESS",
      reason: "Bebas asam lemak trans, kadar kolesterol jahat lebih rendah, dan menaikkan citra menu sehat.",
      costDeltaPct: 20,
      badgeText: "Pilihan Sehat (Low Saturated Fat)",
    },
  ],
  terigu: [
    {
      originalIngredientName: "Tepung Terigu",
      suggestedIngredientName: "Tepung MOCAF Singkong Lokal",
      category: "HEALTH_WELLNESS",
      reason: "Gluten-free, indeks glikemik lebih rendah, dan mendukung komoditas petani lokal.",
      costDeltaPct: 10,
      badgeText: "Bebas Gluten (Gluten-Free)",
    },
  ],
  gula: [
    {
      originalIngredientName: "Gula Pasir",
      suggestedIngredientName: "Gula Aren Organik / Gula Singkong Cair",
      category: "HEALTH_WELLNESS",
      reason: "Indeks glikemik rendah (Low GI), aman bagi pelanggan diabetes, dan memberi aroma karamel khas.",
      costDeltaPct: 15,
      badgeText: "Rendah Glikemik (Low-GI)",
    },
  ],
  ayam: [
    {
      originalIngredientName: "Daging Ayam Broiler",
      suggestedIngredientName: "Jamur Tiram Olahan Segar",
      category: "MARKET_AVAILABILITY",
      reason: "Alternatif nabati tinggi serat saat harga karkas ayam naik, menekan HPP menu hingga 25%.",
      costDeltaPct: -25,
      badgeText: "Alternatif Hemat 25%",
    },
  ],
};

export interface KitchenStockItem {
  id: string;
  ingredientName: string;
  sector: SectorType;
  dailyConsumption: number;
  unit: string;
  currentStock: number;
  daysRemaining: number;
  status: "KRITIS" | "MENIPIS" | "AMAN";
  linkedProducts: string[];
}
