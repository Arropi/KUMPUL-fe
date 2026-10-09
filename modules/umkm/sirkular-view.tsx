"use client";

import * as React from "react";
import Link from "next/link";
import {
  type WasteListing,
  type WasteBuyerOrder,
} from "@/constants/umkm";
import { getWasteListingsAction, createWasteListingAction } from "@/actions/waste";
import type { BEWasteListing, BEWasteCategory, BEProduct } from "@/lib/api/types";
import { getUmkmProductsAction } from "@/actions/products";
import { BankSampahMapSection } from "@/modules/umkm/bank-sampah-map-section";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ShoppingBag,
  AlertTriangle,
  Recycle,
  Plus,
  Phone,
  Wallet,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";

interface WasteBenchmark {
  id: string;
  name: string;
  category: string;
  unit: string;
  conditionAdjustments: {
    terbaik: {
      label: string;
      desc: string;
      price: number;
      priceRange: string;
    };
    standar: {
      label: string;
      desc: string;
      price: number;
      priceRange: string;
    };
  };
  shelfLifeDays: number;
  conditionTips: string;
  targetBuyer: string;
  descriptionTemplate: string;
}

const AI_WASTE_BENCHMARKS: WasteBenchmark[] = [
  {
    id: "jelantah",
    name: "Minyak Jelantah (UCO)",
    category: "Minyak Jelantah (UCO)",
    unit: "Liter",
    conditionAdjustments: {
      terbaik: {
        label: "Tersaring Jernih / Endapan Minimal",
        desc: "Disaring dari remahan sisa gorengan, wadah jeriken tertutup rapat",
        price: 8000,
        priceRange: "Rp 7.500 - Rp 8.500 / Liter",
      },
      standar: {
        label: "Standar (Masih ada sedikit remahan)",
        desc: "Minyak campur belum disaring maksimal",
        price: 6800,
        priceRange: "Rp 6.000 - Rp 7.000 / Liter",
      },
    },
    shelfLifeDays: 14,
    conditionTips: "Simpan dalam jeriken tertutup rapat dan hindari terkena tetesan air agar kadar FFA tetap rendah dan harga terima maksimal.",
    targetBuyer: "Pengepul UCO Bersertifikat & Pabrik Biodiesel Ekspor",
    descriptionTemplate: "Minyak jelantah sisa penggorengan disaring bersih dari ampas remahan. Disimpan dalam jeriken tertutup rapat, siap diangkut.",
  },
  {
    id: "ampas_tahu",
    name: "Ampas Kedelai / Tahu",
    category: "Ampas Kedelai / Tahu",
    unit: "Kg",
    conditionAdjustments: {
      terbaik: {
        label: "Segar Hari Ini (Perasan Murni)",
        desc: "Aroma segar kedelai, tidak berjamur/masam, padat higienis",
        price: 1400,
        priceRange: "Rp 1.200 - Rp 1.600 / Kg",
      },
      standar: {
        label: "Standar (> 12 Jam)",
        desc: "Kadar air tinggi, disarankan segera dijemput",
        price: 900,
        priceRange: "Rp 800 - Rp 1.100 / Kg",
      },
    },
    shelfLifeDays: 2,
    conditionTips: "Ampas kedelai cepat berfermentasi karena tinggi protein. Tiriskan kadar airnya agar tidak cepat berbau masam.",
    targetBuyer: "Peternak Bebek, Lele & Sentra Maggot BSF",
    descriptionTemplate: "Ampas kedelai murni hasil perasan produksi tahu hari ini. Kaya protein, bersih, dan siap diolah menjadi pakan ternak.",
  },
  {
    id: "cangkang_telur",
    name: "Cangkang Telur",
    category: "Cangkang Telur",
    unit: "Kg",
    conditionAdjustments: {
      terbaik: {
        label: "Cuci Bersih & Kering Sinar Matahari",
        desc: "Kering bebas lendir/putih telur, tidak bau busuk",
        price: 2400,
        priceRange: "Rp 2.000 - Rp 2.800 / Kg",
      },
      standar: {
        label: "Mentah / Masih Lembap",
        desc: "Masih terdapat sisa cairan telur atau belum dijemur",
        price: 1300,
        priceRange: "Rp 1.000 - Rp 1.500 / Kg",
      },
    },
    shelfLifeDays: 30,
    conditionTips: "Membilas sisa putih telur dan menjemurnya di bawah terik matahari meningkatkan nilai jual hingga 80%.",
    targetBuyer: "Pabrik Kalsium Pakan Ternak & Pengrajin Pupuk Organik",
    descriptionTemplate: "Cangkang telur ayam dicuci bersih dan dikeringkan di bawah sinar matahari. Kering higienis, siap digiling kalsium.",
  },
  {
    id: "ampas_kopi",
    name: "Ampas Kopi & Teh",
    category: "Ampas Kopi & Teh",
    unit: "Kg",
    conditionAdjustments: {
      terbaik: {
        label: "Tiris & Diangin-anginkan",
        desc: "Bebas jamur, aroma kopi murni terjaga, siap olah",
        price: 1600,
        priceRange: "Rp 1.400 - Rp 2.000 / Kg",
      },
      standar: {
        label: "Basah Portafilter / Saringan",
        desc: "Kadar air tinggi langsung setelah proses penyeduhan",
        price: 1000,
        priceRange: "Rp 800 - Rp 1.200 / Kg",
      },
    },
    shelfLifeDays: 7,
    conditionTips: "Ampas kopi yang diangin-anginkan sangat diminati petani jamur tiram dan pembuat briket bio-arang ramah lingkungan.",
    targetBuyer: "Petani Jamur Tiram & Industri Briket Arang Organik",
    descriptionTemplate: "Ampas bubuk kopi murni seduhan espresso dan manual brew. Diangin-anginkan higienis, cocok untuk media jamur/briket.",
  },
  {
    id: "kulit_sayur",
    name: "Residu Kulit & Sayur",
    category: "Residu Kulit & Sayur",
    unit: "Kg",
    conditionAdjustments: {
      terbaik: {
        label: "Segar Tanpa Bumbu Masak",
        desc: "Trimming sayur/buah mentah bebas kuah, garam, dan minyak",
        price: 1000,
        priceRange: "Rp 800 - Rp 1.200 / Kg",
      },
      standar: {
        label: "Campuran Dapur Umum",
        desc: "Sisa olahan sayur campur, kadar air relatif tinggi",
        price: 600,
        priceRange: "Rp 500 - Rp 700 / Kg",
      },
    },
    shelfLifeDays: 2,
    conditionTips: "Pastikan bebas dari sampah plastik, styrofoam, dan tusuk gigi agar aman dikonsumsi langsung oleh larva maggot BSF.",
    targetBuyer: "Sentra Budidaya Maggot BSF & Unit Pengomposan Kota",
    descriptionTemplate: "Sisa pemotongan sayuran segar dan kulit buah mentah. Bersih tanpa bumbu masak dan tanpa kontaminasi plastik.",
  },
  {
    id: "tulang_hewani",
    name: "Tulang & Trimming Hewani",
    category: "Tulang & Trimming Hewani",
    unit: "Kg",
    conditionAdjustments: {
      terbaik: {
        label: "Segar / Langsung Dibekukan (Frozen)",
        desc: "Disimpan di freezer, higienis dan tidak berbau busuk",
        price: 3000,
        priceRange: "Rp 2.500 - Rp 3.500 / Kg",
      },
      standar: {
        label: "Suhu Ruang (< 6 Jam)",
        desc: "Baru dipotong, perlu segera dijemput hari ini",
        price: 1800,
        priceRange: "Rp 1.500 - Rp 2.200 / Kg",
      },
    },
    shelfLifeDays: 1,
    conditionTips: "Wajib dibekukan jika waktu penjemputan lebih dari 6 jam untuk mencegah pembusukan dan menjaga kualitas tepung tulang.",
    targetBuyer: "Industri Tepung Tulang Pakan Ikan & Pengolahan Gelatin",
    descriptionTemplate: "Tulang dan trimming hewani segar sisa pemotongan, langsung disimpan dalam freezer untuk menjaga kesegaran.",
  },
];

const WASTE_UNITS = [
  "Karung",
  "Sak",
  "Krat",
  "Pax",
  "Bal",
  "Kg",
  "Gram",
  "Ton",
  "Kuintal",
  "Liter",
  "Ml",
  "Kubik",
  "Pcs",
  "Pack",
  "Dus",
  "Box",
  "Karton",
  "Botol",
  "Kaleng",
  "Tray",
  "Keranjang",
  "Baskom",
  "Ekor",
  "Butir",
  "Lembar",
  "Ikat",
  "Porsi",
  "Cup",
  "Bungkus",
  "Lusin",
  "Pallet",
  "Koli",
] as const;
type FilterTab = "SEMUA" | "ADA_PEMBELI" | "LEWAT_KADALUARSA" | "MENDEKATI_KADALUARSA" | "TERSEDIA";

export const WASTE_CATEGORY_OPTIONS: Array<{
  value: BEWasteCategory;
  label: string;
  badgeClass: string;
}> = [
  {
    value: "ORGANIK_BASAH",
    label: "Organik Basah",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  },
  {
    value: "ORGANIK_KERING",
    label: "Organik Kering",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200/80",
  },
  {
    value: "TEKSTIL_PERCA",
    label: "Tekstil Perca",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200/80",
  },
  {
    value: "ANORGANIK",
    label: "Anorganik",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200/80",
  },
];

function mapBEWasteToUI(be: BEWasteListing): WasteListing {
  const weight = Number(be.available_weight) || 0;
  const price = Number(be.price_per_kg) || 0;
  return {
    id: be.id,
    title: be.listing_title,
    category: be.waste_category,
    imageUrl: undefined,
    description: be.notes || undefined,
    totalVolume: weight,
    volumeKg: weight,
    unit: "Kg",
    pricePerKg: price,
    location: be.seller_address || "Surabaya, Jawa Timur",
    expiryDate: be.expired_at ? be.expired_at.split("T")[0] : "",
    status: be.listing_status === "SOLD_OUT" ? "HABIS_TERJUAL" : "TERSEDIA",
    potentialRevenue: weight * price,
    realizedRevenue: 0,
    suitableOfftaker: "Sesama UMKM & Mitra Terdaftar",
    buyerOrders: [],
  };
}

export function UmkmSirkularView() {
  const [wasteListings, setWasteListings] = React.useState<WasteListing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = React.useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [products, setProducts] = React.useState<BEProduct[]>([]);
  const [activeFilter, setActiveFilter] = React.useState<FilterTab>("SEMUA");

  // Form State Modal Tambah Listing
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newCategory, setNewCategory] = React.useState<BEWasteCategory>("ORGANIK_BASAH");
  const [newVolume, setNewVolume] = React.useState<number>(50);
  const [newUnit, setNewUnit] = React.useState<string>("Kg");
  const [newPricePerUnit, setNewPricePerUnit] = React.useState<number>(1500);
  const [newExpiryDate, setNewExpiryDate] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [newImageUrl, setNewImageUrl] = React.useState<string>("");
  const [newDescription, setNewDescription] = React.useState<string>("");

  // AI 1-Click Price Recommendation State
  const [aiPriceInsight, setAiPriceInsight] = React.useState<{
    suggestedPrice: number;
    priceRange: string;
    reason: string;
  } | null>(null);

  // Status kelengkapan form untuk mengaktifkan tombol Rekomendasi AI
  const isFormReadyForAi = Boolean(
    newTitle.trim().length >= 3 &&
    newVolume > 0 &&
    Boolean(newUnit) &&
    Boolean(newExpiryDate)
  );

  // Handler 1-Click Rekomendasi Harga AI berdasarkan data form yang sudah diisi user
  const handleOneClickAiPrice = () => {
    if (!isFormReadyForAi) return;

    const lowerText = `${newTitle} ${newDescription}`.toLowerCase();

    // 1. Identifikasi komoditas limbah
    let matchedBenchmark = AI_WASTE_BENCHMARKS[0]; // default: minyak jelantah
    if (lowerText.includes("minyak") || lowerText.includes("jelantah") || lowerText.includes("uco") || lowerText.includes("goreng")) {
      matchedBenchmark = AI_WASTE_BENCHMARKS.find((b) => b.id === "jelantah") || AI_WASTE_BENCHMARKS[0];
      setNewCategory("ORGANIK_KERING");
    } else if (lowerText.includes("tahu") || lowerText.includes("kedelai") || lowerText.includes("ampas")) {
      matchedBenchmark = AI_WASTE_BENCHMARKS.find((b) => b.id === "ampas_tahu") || AI_WASTE_BENCHMARKS[1];
      setNewCategory("ORGANIK_BASAH");
    } else if (lowerText.includes("telur") || lowerText.includes("cangkang") || lowerText.includes("kulit telur")) {
      matchedBenchmark = AI_WASTE_BENCHMARKS.find((b) => b.id === "cangkang_telur") || AI_WASTE_BENCHMARKS[2];
      setNewCategory("ORGANIK_KERING");
    } else if (lowerText.includes("kopi") || lowerText.includes("teh") || lowerText.includes("coffee")) {
      matchedBenchmark = AI_WASTE_BENCHMARKS.find((b) => b.id === "ampas_kopi") || AI_WASTE_BENCHMARKS[3];
      setNewCategory("ORGANIK_KERING");
    } else if (lowerText.includes("sayur") || lowerText.includes("buah") || lowerText.includes("kulit") || lowerText.includes("daun")) {
      matchedBenchmark = AI_WASTE_BENCHMARKS.find((b) => b.id === "kulit_sayur") || AI_WASTE_BENCHMARKS[4];
      setNewCategory("ORGANIK_BASAH");
    } else if (lowerText.includes("tulang") || lowerText.includes("daging") || lowerText.includes("ayam") || lowerText.includes("sapi") || lowerText.includes("ikan")) {
      matchedBenchmark = AI_WASTE_BENCHMARKS.find((b) => b.id === "tulang_hewani") || AI_WASTE_BENCHMARKS[5];
      setNewCategory("ORGANIK_BASAH");
    }
    // 2. Deteksi indikator kualitas & penanganan
    const isPremiumQuality =
      lowerText.includes("jernih") ||
      lowerText.includes("saring") ||
      lowerText.includes("kering") ||
      lowerText.includes("bersih") ||
      lowerText.includes("segar") ||
      lowerText.includes("frozen") ||
      lowerText.includes("beku") ||
      lowerText.includes("rapat");

    const conditionKey = isPremiumQuality ? "terbaik" : "standar";
    const conditionData = matchedBenchmark.conditionAdjustments[conditionKey];

    // 3. Terapkan harga rekomendasi langsung ke input form
    setNewPricePerUnit(conditionData.price);

    // Sinkronkan satuan jika komoditas cair tapi satuan bukan liter
    if (matchedBenchmark.unit === "Liter" && newUnit !== "Liter" && newUnit !== "Jeriken") {
      setNewUnit("Liter");
    }

    // Simpan insight ringkas
    setAiPriceInsight({
      suggestedPrice: conditionData.price,
      priceRange: conditionData.priceRange,
      reason: `Dihitung untuk ${newVolume} ${newUnit} ${matchedBenchmark.name} (${conditionData.label}). Target: ${matchedBenchmark.targetBuyer}.`,
    });

    toast.success(`Saran harga AI ${formatCurrency(conditionData.price)}/${newUnit} berhasil diterapkan!`, "Rekomendasi AI");
  };

  // Load listing limbah dari Backend Express
  const loadListings = React.useCallback(async () => {
    setIsLoadingListings(true);
    try {
      const res = await getWasteListingsAction();
      if (res.success && res.data) {
        setWasteListings(res.data.map(mapBEWasteToUI));
      } else {
        setWasteListings([]);
      }
    } catch {
      setWasteListings([]);
    } finally {
      setIsLoadingListings(false);
    }
  }, []);

  React.useEffect(() => {
    loadListings();
  }, [loadListings]);

  // Load produk UMKM untuk integrasi asal limbah
  React.useEffect(() => {
    async function loadProducts() {
      try {
        const res = await getUmkmProductsAction();
        if (res.success && res.data) {
          setProducts(res.data);
          return;
        }
      } catch {
        // Safe fail
      }
      setProducts([]);
    }
    loadProducts();
  }, []);
  // Helper kalkulasi sisa hari kadaluarsa
  const getExpiryDiffDays = (dateStr?: string): number => {
    if (!dateStr) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(dateStr);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helpers pesanan pembeli
  const getOrders = (item: WasteListing): WasteBuyerOrder[] => {
    if (item.buyerOrders && item.buyerOrders.length > 0) return item.buyerOrders;
    if (item.orderInfo) {
      return [
        {
          id: `ord-legacy-${item.id}`,
          buyerName: item.orderInfo.buyerName,
          buyerType: item.orderInfo.buyerType,
          buyerPhone: item.orderInfo.buyerPhone,
          orderedVolume: item.orderInfo.orderedVolume,
          orderedUnit: item.orderInfo.orderedUnit,
          totalPrice: item.orderInfo.totalPrice,
          orderDate: item.orderInfo.orderDate,
          pickupScheduledDate: item.orderInfo.pickupScheduledDate,
          status: item.orderInfo.status === "SELESAI" ? "SELESAI" : "MENUNGGU_KONFIRMASI",
          notes: item.orderInfo.notes,
        },
      ];
    }
    return [];
  };

  const getUnconfirmedOrders = (item: WasteListing) =>
    getOrders(item).filter((o) => o.status === "MENUNGGU_KONFIRMASI");

  const getCompletedOrders = (item: WasteListing) =>
    getOrders(item).filter((o) => o.status === "SELESAI");

  // Metrics untuk ringkasan statistik & tab filter
  const pastDueListings = wasteListings.filter(
    (w) => w.volumeKg > 0 && getExpiryDiffDays(w.expiryDate) <= 0
  );
  const pastDueCount = pastDueListings.length;
  const pastDueVolumeKg = pastDueListings.reduce((acc, curr) => acc + curr.volumeKg, 0);

  const expiringSoonListings = wasteListings.filter((w) => {
    const diff = getExpiryDiffDays(w.expiryDate);
    return w.volumeKg > 0 && diff > 0 && diff <= 1;
  });
  const expiringSoonCount = expiringSoonListings.length;
  const expiringSoonVolumeKg = expiringSoonListings.reduce((acc, curr) => acc + curr.volumeKg, 0);

  const listingsWithOrders = wasteListings.filter((w) => getUnconfirmedOrders(w).length > 0);
  const listingsWithOrdersCount = listingsWithOrders.length;
  const totalUnconfirmedOrdersCount = wasteListings.reduce(
    (acc, w) => acc + getUnconfirmedOrders(w).length,
    0
  );

  const availableListings = wasteListings.filter((w) => w.volumeKg > 0);
  const availableCount = availableListings.length;
  const totalActiveVolume = availableListings.reduce((acc, curr) => acc + curr.volumeKg, 0);

  // Handler upload file gambar limbah lokal (FileReader Data URL)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast.info("Ukuran foto maksimal 4MB", "Unggah Foto");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Tambah listing baru ke backend
  const handleAddListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await createWasteListingAction({
        title: newTitle.trim(),
        category: newCategory,
        availableWeight: newVolume,
        pricePerKg: newPricePerUnit,
        expiredAt: newExpiryDate,
        notes: newDescription.trim() || undefined,
      });

      if (res.success && res.data) {
        const newUI = mapBEWasteToUI(res.data);
        setWasteListings((prev) => [newUI, ...prev]);
        setIsAddModalOpen(false);
        setNewTitle("");
        setNewCategory("ORGANIK_BASAH");
        setNewVolume(50);
        setNewUnit("Kg");
        setNewPricePerUnit(1500);
        setNewImageUrl("");
        setNewDescription("");
        setAiPriceInsight(null);
        toast.success("Listing limbah berhasil dipublikasikan ke Bursa Sirkular!", "Listing Dibuat");
      } else {
        toast.error(res.message || "Gagal membuat listing limbah di server.");
      }
    } catch {
      toast.error("Terjadi kendala saat menghubungi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter listings
  const filteredListings = wasteListings.filter((item) => {
    if (activeFilter === "ADA_PEMBELI") {
      return getUnconfirmedOrders(item).length > 0;
    }
    if (activeFilter === "LEWAT_KADALUARSA") {
      return item.volumeKg > 0 && getExpiryDiffDays(item.expiryDate) <= 0;
    }
    if (activeFilter === "MENDEKATI_KADALUARSA") {
      const diff = getExpiryDiffDays(item.expiryDate);
      return item.volumeKg > 0 && diff > 0 && diff <= 1;
    }
    if (activeFilter === "TERSEDIA") {
      return item.volumeKg > 0;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-border/70">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary text-balance mt-1">
            Bursa Residu Limbah Dapur UMKM
          </h1>
          <p className="font-sans text-xs sm:text-sm text-text-secondary text-pretty mt-1 max-w-3xl leading-relaxed">
            Jual residu dapur ke sesama UMKM yang datang langsung mengambil ke lokasimu. Jika sisa stok mendekati kadaluwarsa, kamu bisa mengantarnya ke Bank Sampah terdekat.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="default"
          onClick={() => setIsAddModalOpen(true)}
          className="font-bold min-h-[44px] shrink-0 gap-2 cursor-pointer shadow-elevation-1"
        >
          <Plus className="size-4" />
          <span>Jual Limbah Dapur</span>
        </Button>
      </div>

      {/* 2. Section Listing Limbah dari Produk & Informasi Pesanan Masuk */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/70">
          <div>
            <h2 className="font-heading text-base sm:text-lg font-bold text-text-primary text-balance flex items-center gap-2">
              <span>Daftar Listing Residu Dapur</span>
            </h2>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-surface-subtle p-1 rounded-xl border border-border/80 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveFilter("SEMUA")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeFilter === "SEMUA"
                ? "bg-surface text-text-primary shadow-xs border border-border/60"
                : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                }`}
            >
              Semua ({wasteListings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("ADA_PEMBELI")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeFilter === "ADA_PEMBELI"
                ? "bg-surface text-text-primary shadow-xs border border-border/60"
                : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                }`}
            >
              Ada Pembeli ({listingsWithOrdersCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("LEWAT_KADALUARSA")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeFilter === "LEWAT_KADALUARSA"
                ? "bg-surface text-text-primary shadow-xs border border-border/60"
                : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                }`}
            >
              Lewat Kadaluwarsa ({pastDueCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("MENDEKATI_KADALUARSA")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeFilter === "MENDEKATI_KADALUARSA"
                ? "bg-surface text-text-primary shadow-xs border border-border/60"
                : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                }`}
            >
              Mendekati Tempo ({expiringSoonCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("TERSEDIA")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeFilter === "TERSEDIA"
                ? "bg-surface text-text-primary shadow-xs border border-border/60"
                : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                }`}
            >
              Ada Sisa Stok ({availableCount})
            </button>
          </div>
        </div>

        {/* Grid Kartu Limbah */}
        {isLoadingListings ? (
          <div className="p-12 text-center rounded-2xl border border-border bg-surface space-y-3">
            <div className="size-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="font-heading text-sm font-bold text-text-primary">
              Memuat listing residu limbah dapur...
            </p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-surface-subtle space-y-2">
            <Recycle className="size-8 text-text-muted mx-auto" />
            <p className="font-heading text-sm font-bold text-text-primary">
              {wasteListings.length === 0
                ? "Belum ada listing residu limbah aktif"
                : "Tidak ada limbah pada filter ini"}
            </p>
            <p className="font-sans text-xs text-text-muted">
              {wasteListings.length === 0
                ? 'Klik tombol "Jual Limbah Dapur" di atas untuk mempublikasikan sisa olahan dapur Anda.'
                : 'Pilih tab "Semua" atau pasang listing limbah baru dari dapurmu.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((item) => {
              const expiryDiff = getExpiryDiffDays(item.expiryDate);
              const unconfirmedOrders = getUnconfirmedOrders(item);
              const completedOrders = getCompletedOrders(item);
              const hasUnconfirmed = unconfirmedOrders.length > 0;
              const isSoldOut = item.volumeKg === 0;
              const totalInitial = item.totalVolume || item.volumeKg;
              const isPastDue = !isSoldOut && item.volumeKg > 0 && expiryDiff <= 0;
              const isExpiringSoon = !isSoldOut && item.volumeKg > 0 && expiryDiff > 0 && expiryDiff <= 1;
              const isExpiredWithStock = isPastDue || isExpiringSoon;

              // Total volume yang dipesan tapi belum dikonfirmasi
              const totalUnconfirmedVol = unconfirmedOrders.reduce(
                (acc, o) => acc + o.orderedVolume,
                0
              );

              return (
                <div
                  key={item.id}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-surface border shadow-elevation-1 transition-all duration-200 hover:shadow-elevation-2 ${
                    hasUnconfirmed
                      ? "border-amber-400/80"
                      : isPastDue
                        ? "border-[#8B1E1E]/60 shadow-[0_4px_16px_rgba(139,30,30,0.1)]"
                        : isExpiringSoon
                          ? "border-accent/60"
                          : "border-border hover:border-border-strong"
                  }`}
                >
                  {/* Top Image Frame (Card-12 Pattern) */}
                  <div className="relative h-44 w-full overflow-hidden bg-surface-subtle">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className={`size-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                          isPastDue ? "grayscale-[35%] opacity-90" : ""
                        }`}
                      />
                    ) : (
                      <div className="size-full flex flex-col items-center justify-center bg-linear-to-br from-surface-subtle via-surface to-surface-subtle text-text-muted gap-1.5 p-3 text-center">
                        <div className="p-2 rounded-full bg-circular-waste-light border border-circular-waste/20 text-circular-waste">
                          <Recycle className="size-5" />
                        </div>
                        <span className="text-[11px] font-semibold text-text-secondary">
                          Residu Dapur UMKM
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/25 to-black/55 pointer-events-none" />

                    {/* Status Badges on Image Frame (Rata Kiri, Vertikal Bertumpuk) */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5 pointer-events-none z-10 max-w-[85%]">
                      {isPastDue ? (
                        <>
                          <Badge
                            variant="neutral"
                            className="bg-red-50/95 backdrop-blur-xs text-[#8B1E1E] border border-[#8B1E1E]/40 font-bold shadow-md text-[10px] py-0.5 px-2.5 flex items-center gap-1"
                          >
                            <AlertTriangle className="size-3 text-[#8B1E1E] shrink-0" />
                            <span>Lewat Jatuh Tempo</span>
                          </Badge>
                          {hasUnconfirmed ? (
                            <Badge variant="accent" className="gap-1 font-bold shadow-md text-[10px] py-0.5 px-2.5">
                              <ShoppingBag className="size-3" />
                              <span>{unconfirmedOrders.length} Pesanan Tertunda</span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="neutral"
                              className="bg-surface/95 backdrop-blur-xs text-text-secondary border border-border font-semibold shadow-md text-[10px] py-0.5 px-2.5"
                            >
                              Listing Ditutup
                            </Badge>
                          )}
                        </>
                      ) : isSoldOut ? (
                        <Badge variant="neutral" className="font-bold shadow-md text-[10px] py-0.5 px-2.5 bg-surface/90 border-border text-text-secondary">
                          Habis Terjual
                        </Badge>
                      ) : (
                        <>
                          {hasUnconfirmed ? (
                            <Badge variant="accent" className="gap-1 font-bold shadow-md text-[10px] py-0.5 px-2.5">
                              <ShoppingBag className="size-3" />
                              <span>{unconfirmedOrders.length} Pesanan Masuk</span>
                            </Badge>
                          ) : (
                            <Badge variant="waste" className="shadow-md font-semibold text-[10px] py-0.5 px-2.5">
                              Tersedia
                            </Badge>
                          )}
                          {isExpiringSoon && (
                            <Badge variant="accent" className="font-bold shadow-md text-[10px] py-0.5 px-2.5">
                              {expiryDiff === 0 ? "Kadaluwarsa Hari Ini" : "Mendekati Kadaluwarsa"}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Inner Card Section (Card-12 Pattern) */}
                  <Card className="rounded-t-none border-none shadow-none bg-transparent !py-0 !gap-3 flex-1 flex flex-col justify-between">
                    <CardHeader className="space-y-1 p-4 pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm sm:text-base font-heading font-bold text-text-primary line-clamp-1 leading-snug flex-1" title={item.title}>
                          {item.title}
                        </CardTitle>
                        {item.category && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                            WASTE_CATEGORY_OPTIONS.find((c) => c.value === item.category)?.badgeClass ||
                            "bg-surface-subtle text-text-secondary border-border"
                          }`}>
                            {WASTE_CATEGORY_OPTIONS.find((c) => c.value === item.category)?.label || item.category}
                          </span>
                        )}
                      </div>
                      {item.description ? (
                        <CardDescription className="text-xs text-text-secondary line-clamp-2 leading-relaxed min-h-[2rem]" title={item.description}>
                          {item.description}
                        </CardDescription>
                      ) : (
                        <CardDescription className="text-xs text-text-muted min-h-[2rem]">
                          {item.location || "Lokasi: Surabaya, Jawa Timur"}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-3 px-4 py-0 text-xs flex-1 flex flex-col justify-between">
                      {/* Bar Sisa Volume */}
                      <div className="space-y-1 pt-0.5">
                        <div className="flex justify-between items-baseline text-[11px]">
                          <span className="text-text-secondary font-medium">Sisa Stok:</span>
                          <span className="font-heading font-bold text-text-primary tabular-nums">
                            {item.volumeKg} / {totalInitial} {item.unit || "kg"}
                            {isPastDue && (
                              <span className="text-[#8B1E1E] font-bold text-[10px] ml-1.5">
                                (Lewat Tempo)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-surface-subtle border border-border overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isSoldOut
                                ? "bg-text-muted"
                                : isPastDue
                                  ? "bg-[#8B1E1E]"
                                  : isExpiringSoon
                                    ? "bg-accent"
                                    : item.volumeKg < totalInitial * 0.3
                                      ? "bg-accent"
                                      : "bg-circular-waste"
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(0, (item.volumeKg / totalInitial) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* 2 Kolom Informasi: Kadaluwarsa & Transaksi Pembeli */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* Kadaluwarsa */}
                        <div className={`p-2.5 rounded-xl border flex flex-col justify-between min-h-[64px] gap-1 transition-colors ${
                          isPastDue
                            ? "bg-[#8B1E1E]/[0.05] border-[#8B1E1E]/30"
                            : "bg-surface-subtle border-border"
                        }`}>
                          <div className="text-text-muted text-[10px]">
                            <span className={`font-medium ${isPastDue ? "text-[#8B1E1E] font-semibold" : ""}`}>Kadaluwarsa</span>
                          </div>
                          <div>
                            <div className="font-heading font-bold text-text-primary tabular-nums text-xs leading-none">
                              {item.expiryDate ? formatDate(item.expiryDate, "medium") : "-"}
                            </div>
                            <div className="text-[10px] mt-1 font-medium leading-none">
                              {isPastDue ? (
                                <span className="text-[#8B1E1E] font-bold">
                                  Lewat {Math.abs(expiryDiff)} hari &bull; Wajib Setor
                                </span>
                              ) : expiryDiff <= 0 ? (
                                <span className="text-accent font-bold">Hari Ini (Kritis)</span>
                              ) : expiryDiff <= 3 ? (
                                <span className="text-accent font-semibold">{expiryDiff} hari lagi</span>
                              ) : (
                                <span className="text-text-muted">Stok aman</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Transaksi Pembeli */}
                        <div className="p-2.5 rounded-xl bg-surface-subtle border border-border flex flex-col justify-between min-h-[64px] gap-1">
                          <div className="text-text-muted text-[10px]">
                            <span className="font-medium">Transaksi</span>
                          </div>
                          <div>
                            <div className="font-heading font-bold text-text-primary tabular-nums text-xs leading-none">
                              {getOrders(item).length} Pembeli
                            </div>
                            <div className="text-[10px] mt-1 font-medium leading-none">
                              {unconfirmedOrders.length > 0 ? (
                                <span className="text-accent font-bold">
                                  {unconfirmedOrders.length} Menunggu
                                </span>
                              ) : completedOrders.length > 0 ? (
                                <span className="text-circular-waste font-semibold">
                                  {completedOrders.length} Selesai
                                </span>
                              ) : (
                                <span className="text-text-muted">Belum ada</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Saldo Cair Masuk (Jika Ada Realized Revenue) */}
                      {(item.realizedRevenue || 0) > 0 && (
                        <div className="flex justify-between items-center text-circular-waste px-0.5 text-xs">
                          <span className="font-medium text-[11px] flex items-center gap-1">
                            <Wallet className="size-3 text-circular-waste" />
                            Saldo Kas Masuk:
                          </span>
                          <strong className="font-heading font-bold tabular-nums">
                            +{formatCurrency(item.realizedRevenue || 0)}
                          </strong>
                        </div>
                      )}
                    </CardContent>

                    {/* CardFooter: Model Card12 (Harga di Kiri, Tombol Tactile di Kanan) */}
                    <CardFooter className="justify-between items-center gap-2 px-4 py-3 border-t border-border bg-surface-subtle/50 [.border-t]:pt-3">
                      <div className="flex flex-col">
                        <span className="text-text-muted text-[10px] font-semibold uppercase tracking-wider">
                          Harga Satuan
                        </span>
                        <span className="text-base sm:text-lg font-heading font-black text-text-primary tabular-nums leading-tight">
                          {formatCurrency(item.pricePerKg)}
                          <span className="text-[11px] font-normal text-text-secondary">/{item.unit || "kg"}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {getOrders(item).length > 0 ? (
                          <Button
                            asChild
                            variant={hasUnconfirmed ? "accent" : "primary"}
                            size="sm"
                            className="font-bold cursor-pointer"
                          >
                            <Link href="/pesanan?tab=penjualan-limbah">
                              <span>Rincian ({getOrders(item).length}) &rarr;</span>
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant={isPastDue ? "destructive" : "primary"}
                            size="sm"
                            onClick={() => {
                              const elem = document.getElementById("bank-sampah-map-section");
                              elem?.scrollIntoView({ behavior: "smooth" });
                              if (isPastDue) {
                                toast.info("Residu telah lewat tempo. Silakan drop ke titik Bank Sampah terdekat.", "Bursa Limbah");
                              }
                            }}
                            className="font-bold cursor-pointer gap-1.5"
                          >
                            <Recycle className="size-3.5" />
                            <span>Bank Sampah</span>
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Section Titik Bank Sampah Terdekat (Interactive Leaflet Map & Scraped Google Maps Locations) */}
      <div id="bank-sampah-map-section">
        <BankSampahMapSection />
      </div>

      {/* 5. Modal Tambah Listing Limbah Baru (Standardized Dropdowns & Tactile Controls) */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg w-full !p-0 !overflow-hidden flex flex-col max-h-[90vh] rounded-3xl bg-surface border border-border shadow-2xl">
          {/* Header Dialog (pr-16 memastikan tombol close 'X' tidak pernah bertabrakan dengan judul) */}
          <div className="px-6 py-4.5 pr-16 border-b border-border/80 bg-surface shrink-0">
            <DialogTitle className="font-heading text-base sm:text-lg font-bold text-text-primary leading-tight">
              Pasang Listing Residu Limbah
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary mt-0.5 truncate sm:text-wrap">
              Publikasikan sisa olahan dapur ke Bursa P2P untuk dibeli mitra offtaker
            </DialogDescription>
          </div>

          <form onSubmit={handleAddListing} className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Form Body */}
            <div className="flex-1 !overflow-y-auto px-5 sm:px-6 py-5 space-y-4.5 custom-scrollbar min-h-0">
              
              {/* 1. NAMA LISTING LIMBAH */}
              <div className="space-y-1.5">
                <label className="font-heading text-xs font-bold text-text-primary flex items-center justify-between">
                  <span>Nama Listing Limbah</span>
                  <span className="text-[10px] text-text-muted font-normal">Wajib diisi</span>
                </label>
                <Input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    setAiPriceInsight(null);
                  }}
                  placeholder="Contoh: Minyak Jelantah Penggorengan Bebek"
                  className="w-full h-10 text-xs rounded-xl"
                />
              </div>
              {/* 2. KATEGORI LIMBAH */}
              <div className="space-y-1.5">
                <label className="font-heading text-xs font-bold text-text-primary">
                  Kategori Limbah *
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center justify-between gap-2 h-10 w-full px-3.5 rounded-xl border border-border bg-surface text-xs font-medium text-text-primary shadow-xs outline-none cursor-pointer hover:border-primary/40 hover:bg-surface-subtle focus:ring-2 focus:ring-primary/20 transition-all text-left"
                    >
                      <span className="truncate">
                        {WASTE_CATEGORY_OPTIONS.find((c) => c.value === newCategory)?.label || newCategory}
                      </span>
                      <ChevronDown className="size-3.5 text-text-muted shrink-0 ml-1" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[calc(100vw-3rem)] sm:w-64 max-h-64 overflow-y-auto p-1 rounded-xl shadow-elevation-2 bg-surface border border-border custom-scrollbar z-50"
                  >
                    <DropdownMenuRadioGroup
                      value={newCategory}
                      onValueChange={(val) => setNewCategory(val as BEWasteCategory)}
                    >
                      {WASTE_CATEGORY_OPTIONS.map((cat) => (
                        <DropdownMenuRadioItem
                          key={cat.value}
                          value={cat.value}
                          className="py-2 px-2.5 rounded-lg cursor-pointer hover:bg-surface-subtle text-xs font-medium text-text-primary"
                        >
                          {cat.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* 3. VOLUME & SATUAN */}
              <div className="space-y-1.5">
                <label className="font-heading text-xs font-bold text-text-primary flex items-center justify-between">
                  <span>Jumlah Volume &amp; Satuan</span>
                  <span className="text-[10px] text-text-muted font-normal">Stok tersedia</span>
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    required
                    value={newVolume}
                    onChange={(e) => {
                      setNewVolume(Number(e.target.value));
                      setAiPriceInsight(null);
                    }}
                    placeholder="Jumlah volume"
                    className="flex-1 h-10 text-xs tabular-nums rounded-xl"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center justify-between gap-2 h-10 min-w-[120px] px-3 rounded-xl border border-border bg-surface text-xs font-bold text-text-primary shadow-xs outline-none cursor-pointer hover:border-primary/40 hover:bg-surface-subtle focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        <span className="truncate">{newUnit}</span>
                        <ChevronDown className="size-3.5 text-text-muted shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="max-h-60 overflow-y-auto min-w-[140px] p-1.5 rounded-xl shadow-elevation-2 bg-surface border border-border custom-scrollbar"
                    >
                      <div className="px-2 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border/60 mb-1 select-none">
                        Pilih Satuan
                      </div>
                      <DropdownMenuRadioGroup
                        value={newUnit}
                        onValueChange={(val) => {
                          setNewUnit(val);
                          setAiPriceInsight(null);
                        }}
                      >
                        {WASTE_UNITS.map((unit) => (
                          <DropdownMenuRadioItem
                            key={unit}
                            value={unit}
                            className="py-1.5 px-2.5 text-xs font-semibold rounded-lg cursor-pointer hover:bg-surface-subtle"
                          >
                            <span>{unit}</span>
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* 3. TANGGAL KADALUWARSA */}
              <div className="space-y-1.5">
                <label className="font-heading text-xs font-bold text-text-primary flex items-center justify-between">
                  <span>Tanggal Kadaluwarsa</span>
                  <span className="text-[10px] text-text-muted font-normal">Batas aman penjemputan</span>
                </label>
                <Input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={newExpiryDate}
                  onChange={(e) => {
                    setNewExpiryDate(e.target.value);
                    setAiPriceInsight(null);
                  }}
                  className="w-full h-10 text-xs rounded-xl"
                />
              </div>

              {/* 4. DESKRIPSI & KONDISI LIMBAH (OPSIONAL) */}
              <div className="space-y-1.5">
                <label className="font-heading text-xs font-bold text-text-primary flex items-center justify-between">
                  <span>Deskripsi &amp; Kondisi Limbah (Opsional)</span>
                  <span className="font-sans text-[10px] text-text-muted">Mempengaruhi valuasi AI</span>
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => {
                    setNewDescription(e.target.value);
                    setAiPriceInsight(null);
                  }}
                  placeholder="Contoh: Disaring bersih dari remahan gorengan, disimpan dalam jeriken tertutup rapat..."
                  className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none leading-relaxed"
                />
              </div>

              {/* 5. HARGA PER SATUAN & TOMBOL REKOMENDASI HARGA AI (1X CLICK) */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-surface-subtle/70 border border-border/90">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <label className="font-heading text-xs font-bold text-text-primary block">
                      Harga per {newUnit} (Rp)
                    </label>
                    <span className="text-[10px] text-text-muted">
                      Tentukan manual atau minta saran AI
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant={isFormReadyForAi ? "primary" : "secondary"}
                    size="sm"
                    disabled={!isFormReadyForAi}
                    onClick={handleOneClickAiPrice}
                    className="text-xs font-bold h-8 px-3 cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                    title={
                      isFormReadyForAi
                        ? "Klik 1x untuk mendapatkan saran harga AI otomatis berdasarkan data limbahmu"
                        : "Lengkapi nama limbah, volume, dan tanggal kadaluwarsa terlebih dahulu"
                    }
                  >
                    Rekomendasi Harga AI
                  </Button>
                </div>

                <Input
                  type="number"
                  min="100"
                  step="100"
                  required
                  value={newPricePerUnit}
                  onChange={(e) => {
                    setNewPricePerUnit(Number(e.target.value));
                    setAiPriceInsight(null);
                  }}
                  placeholder="Harga per satuan"
                  className="w-full h-10 text-xs tabular-nums rounded-xl bg-surface"
                />

                {/* Insight Saran Harga AI setelah 1x klik */}
                {aiPriceInsight ? (
                  <div className="p-2.5 rounded-xl bg-accent-light/60 border border-accent/40 text-[11px] space-y-0.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between font-bold text-text-primary">
                      <span>Saran AI Diterapkan: {formatCurrency(aiPriceInsight.suggestedPrice)}/{newUnit}</span>
                      <span className="text-[10px] text-text-secondary font-normal">Pasar: {aiPriceInsight.priceRange}</span>
                    </div>
                    <p className="text-text-secondary text-[10px] leading-snug">
                      {aiPriceInsight.reason}
                    </p>
                  </div>
                ) : !isFormReadyForAi ? (
                  <p className="text-[10px] text-text-muted">
                    Lengkapi nama limbah, volume, dan kadaluwarsa di atas agar tombol Rekomendasi Harga AI aktif.
                  </p>
                ) : (
                  <p className="text-[10px] text-text-muted">
                    Form sudah terisi! Klik tombol &ldquo;Rekomendasi Harga AI&rdquo; di atas untuk mengisi harga pasar otomatis.
                  </p>
                )}
              </div>

              {/* 6. FOTO LIMBAH (FILE UPLOAD ONLY) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-xs font-bold text-text-primary">Foto Limbah (Opsional)</span>
                  <span className="font-sans text-[10px] text-text-muted">Upload dari perangkat</span>
                </div>

                {newImageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-border bg-surface-subtle h-36 flex items-center justify-center group">
                    <img
                      src={newImageUrl}
                      alt="Preview Limbah"
                      className="size-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                      <label
                        htmlFor="waste-photo-change"
                        className="px-3 py-1.5 rounded-lg bg-surface text-text-primary text-xs font-semibold hover:bg-surface-subtle cursor-pointer shadow-xs"
                      >
                        <span>Ganti Foto</span>
                        <input
                          id="waste-photo-change"
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewImageUrl("")}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer shadow-xs"
                      >
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="waste-photo-upload"
                    className="flex flex-col items-center justify-center gap-1.5 p-5 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-surface-subtle/70 bg-surface text-center cursor-pointer transition-all group"
                  >
                    <span className="text-xs font-semibold text-text-primary block">
                      Pilih Foto dari Perangkat
                    </span>
                    <span className="text-[10px] text-text-muted">
                      Format JPG, PNG, atau WebP (Maks. 4MB)
                    </span>
                    <input
                      id="waste-photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* 7. ESTIMASI POTENSI NILAI CUAN */}
              <div className="p-3 rounded-xl bg-surface-subtle border border-border/80 text-xs flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-sans text-text-secondary text-[11px] font-medium">Estimasi Potensi Nilai Cuan:</span>
                  <span className="text-[10px] text-text-muted">{newVolume} {newUnit} &times; {formatCurrency(newPricePerUnit)}</span>
                </div>
                <strong className="text-circular-waste text-base font-bold tabular-nums font-heading">
                  {formatCurrency(newVolume * newPricePerUnit)}
                </strong>
              </div>
            </div>

            {/* FIXED FOOTER */}
            <div className="px-6 py-3.5 border-t border-border/80 bg-surface-subtle/40 shrink-0 flex items-center gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="default"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1 min-h-[42px] cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="default"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="flex-1 font-bold min-h-[42px] cursor-pointer shadow-xs"
              >
                {isSubmitting ? "Menayangkan..." : "Tayangkan Listing"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>


    </div>
  );
}
