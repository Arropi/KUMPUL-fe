export interface UMKMBusinessProfile {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  nibNpwp: string;
  sector: "KULINER_FNB" | "PENGOLAHAN_PANGAN" | "KATERING" | "RITEL_WARUNG";
  sectorLabel: string;
  address: string;
  city: string;
  province: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  preferredHubId: string;
  preferredHubName: string;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
}

export interface ActivePoolItem {
  id: string;
  commodityName: string;
  commoditySku: string;
  category: "Beras & Biji-bijian" | "Hortikultura & Sayur" | "Bumbu & Rempah" | "Minyak & Gula" | "Unggas & Daging";
  supplierName: string;
  supplierLocation: string;
  targetMoqKg: number;
  accumulatedKg: number;
  pricePerKgWholesale: number;
  pricePerKgRetailMarket: number;
  unit: string;
  status: "OPEN_POOL" | "AGGREGATING" | "LOCKED" | "COMPLETED";
  expiryHoursRemaining: number;
  participantsCount: number;
  hubName: string;
  hubAddress: string;
  deliveryDateEstimate: string;
  qualityBadge: {
    grade: "Grade A" | "Grade B";
    certification: string;
    hygienePassScore: number;
  };
}

export interface UMKMPurchaseHistory {
  id: string;
  orderNumber: string;
  commodityName: string;
  volumeKg: number;
  unit: string;
  totalWholesalePaid: number;
  marketPriceComparison: number;
  savingsAmount: number;
  status: "TERKUNCI" | "DIPROSES_SUPPLIER" | "TIBA_DI_HUB" | "SELESAI";
  deliveryMethod: "HEMAT_HUB" | "DIRECT_DELIVERY";
  orderDate: string;
  hubPickupCode?: string;
}

export interface WasteOrderInfo {
  buyerName: string;
  buyerType: string;
  buyerPhone?: string;
  orderedVolume: number;
  orderedUnit: string;
  totalPrice: number;
  orderDate: string;
  pickupScheduledDate: string;
  status: "MENUNGGU_KONFIRMASI" | "DIJADWALKAN_JEMPUT" | "SELESAI";
  notes?: string;
}

export interface WasteListing {
  id: string;
  title: string;
  category?: string;
  sourceProductId?: string;
  sourceProductName?: string;
  volumeKg: number;
  unit?: string;
  pricePerKg: number;
  location: string;
  expiryTimeHours?: number;
  expiryDate?: string;
  status: "TERSEDIA" | "DIBOOKING" | "DIJEMPUT_OFFTAKER";
  potentialRevenue: number;
  suitableOfftaker: string;
  orderInfo?: WasteOrderInfo;
}

export const MOCK_UMKM_PROFILE: UMKMBusinessProfile = {
  id: "umkm-01-sby",
  name: "Warung Katering Bu Siti Mandiri",
  ownerName: "Siti Rahmawati",
  email: "busiti.katering@gmail.com",
  phone: "0812-3456-7890",
  nibNpwp: "9120008819284 / 08.234.567.8-604.000",
  sector: "KATERING",
  sectorLabel: "Katering & Olahan Pangan Basah",
  address: "Jl. Rungkut Asri Timur No. 18, Rungkut Kidul",
  city: "Surabaya",
  province: "Jawa Timur",
  coordinates: {
    lat: -7.3248,
    lng: 112.7758,
  },
  preferredHubId: "hub-rungkut-01",
  preferredHubName: "Hub Konsolidasi Rungkut Pangan",
  bankAccount: {
    bankName: "Bank Central Asia (BCA)",
    accountNumber: "7880192837",
    accountHolder: "Siti Rahmawati",
  },
};

export const MOCK_ACTIVE_POOLS: ActivePoolItem[] = [
  {
    id: "pool-01-beras",
    commodityName: "Beras Rojolele Super Premium",
    commoditySku: "KMPL-BRS-7721",
    category: "Beras & Biji-bijian",
    supplierName: "PT Sumber Pangan Nusantara",
    supplierLocation: "Surabaya, Jawa Timur",
    targetMoqKg: 1000,
    accumulatedKg: 850,
    pricePerKgWholesale: 12500,
    pricePerKgRetailMarket: 15200,
    unit: "Karung (50 kg)",
    status: "AGGREGATING",
    expiryHoursRemaining: 6,
    participantsCount: 9,
    hubName: "Hub Konsolidasi Margomulyo Logistik",
    hubAddress: "Kawasan Industri Margomulyo Indah Blok B-12, Surabaya",
    deliveryDateEstimate: "Besok, 09:00 WIB",
    qualityBadge: {
      grade: "Grade A",
      certification: "Bebas Klorin & Residu Nol",
      hygienePassScore: 98,
    },
  },
  {
    id: "pool-02-bawang",
    commodityName: "Bawang Merah Brebes Super",
    commoditySku: "KMPL-BWG-4412",
    category: "Bumbu & Rempah",
    supplierName: "CV Agro Tani Makmur",
    supplierLocation: "Nganjuk / Sidoarjo",
    targetMoqKg: 500,
    accumulatedKg: 460,
    pricePerKgWholesale: 28000,
    pricePerKgRetailMarket: 36000,
    unit: "Krat Plastik (15 kg)",
    status: "AGGREGATING",
    expiryHoursRemaining: 3,
    participantsCount: 14,
    hubName: "Hub Konsolidasi Rungkut Pangan",
    hubAddress: "Sentra Pergudangan Rungkut Industri Blok C-4, Surabaya",
    deliveryDateEstimate: "Hari Ini, 16:30 WIB",
    qualityBadge: {
      grade: "Grade A",
      certification: "Kadar Air < 14% Lolos Lab",
      hygienePassScore: 96,
    },
  },
  {
    id: "pool-03-minyak",
    commodityName: "Minyak Goreng Sawit Curah Higienis",
    commoditySku: "KMPL-MYK-9021",
    category: "Minyak & Gula",
    supplierName: "PT Mega Distribusi Nabati",
    supplierLocation: "Gresik, Jawa Timur",
    targetMoqKg: 1200,
    accumulatedKg: 1200,
    pricePerKgWholesale: 14200,
    pricePerKgRetailMarket: 17500,
    unit: "Jeriken (20 Liter)",
    status: "LOCKED",
    expiryHoursRemaining: 0,
    participantsCount: 16,
    hubName: "Hub Konsolidasi Margomulyo Logistik",
    hubAddress: "Kawasan Industri Margomulyo Indah Blok B-12, Surabaya",
    deliveryDateEstimate: "Sedang Dikemas Supplier",
    qualityBadge: {
      grade: "Grade A",
      certification: "SNI Minyak Goreng 7709:2019",
      hygienePassScore: 99,
    },
  },
  {
    id: "pool-04-ayam",
    commodityName: "Daging Ayam Broiler Karkas Bersih",
    commoditySku: "KMPL-AYM-3310",
    category: "Unggas & Daging",
    supplierName: "UD Berkah Unggas Sejahtera",
    supplierLocation: "Mojokerto / Sidoarjo",
    targetMoqKg: 400,
    accumulatedKg: 240,
    pricePerKgWholesale: 31000,
    pricePerKgRetailMarket: 39000,
    unit: "Box Higienis (10 kg)",
    status: "OPEN_POOL",
    expiryHoursRemaining: 18,
    participantsCount: 6,
    hubName: "Hub Konsolidasi Sidoarjo Dingin",
    hubAddress: "Pergudangan Berpendingin Waru No. 8, Sidoarjo",
    deliveryDateEstimate: "Lusa Pagi, 07:00 WIB",
    qualityBadge: {
      grade: "Grade A",
      certification: "Sertifikasi Halal ID351100021 & Rantai Dingin 2°C",
      hygienePassScore: 97,
    },
  },
];

export const MOCK_UMKM_PURCHASE_HISTORY: UMKMPurchaseHistory[] = [
  {
    id: "po-hist-01",
    orderNumber: "POOL-KMPL-2026-081",
    commodityName: "Beras Rojolele Super Premium",
    volumeKg: 150,
    unit: "3 Karung (50 kg)",
    totalWholesalePaid: 1875000,
    marketPriceComparison: 2280000,
    savingsAmount: 405000,
    status: "SELESAI",
    deliveryMethod: "HEMAT_HUB",
    orderDate: "28 Sep 2026",
    hubPickupCode: "HUB-SBY-8821",
  },
  {
    id: "po-hist-02",
    orderNumber: "POOL-KMPL-2026-088",
    commodityName: "Bawang Merah Brebes Super",
    volumeKg: 45,
    unit: "3 Krat (15 kg)",
    totalWholesalePaid: 1260000,
    marketPriceComparison: 1620000,
    savingsAmount: 360000,
    status: "TIBA_DI_HUB",
    deliveryMethod: "HEMAT_HUB",
    orderDate: "30 Sep 2026",
    hubPickupCode: "HUB-RKT-4410",
  },
  {
    id: "po-hist-03",
    orderNumber: "POOL-KMPL-2026-092",
    commodityName: "Minyak Goreng Sawit Curah Higienis",
    volumeKg: 80,
    unit: "4 Jeriken (20 Liter)",
    totalWholesalePaid: 1136000,
    marketPriceComparison: 1400000,
    savingsAmount: 264000,
    status: "DIPROSES_SUPPLIER",
    deliveryMethod: "HEMAT_HUB",
    orderDate: "01 Okt 2026",
  },
];

export interface CatalogCommodity {
  id: string;
  name: string;
  sku: string;
  category: "Beras & Biji-bijian" | "Hortikultura & Sayur" | "Bumbu & Rempah" | "Minyak & Gula" | "Unggas & Daging" | "Bahan Penolong";
  supplierId: string;
  supplierName: string;
  supplierRating: number;
  originCity: string;
  unit: string;
  minOrderKg: number;
  marketPricePerKg: number;
  wholesalePriceTiers: {
    minKg: number;
    pricePerKg: number;
  }[];
  qualityGrade: "Grade A Super" | "Grade A Standar" | "Grade B Industri";
  specifications: {
    waterContentPct?: number;
    shelfLifeDays: number;
    packagingType: string;
    temperatureReq: string;
  };
  certifications: string[];
  activePoolId?: string;
  inStockKg: number;
}

export interface HygieneInspectionItem {
  id: string;
  title: string;
  category: "Penerimaan Bahan Baku" | "Penyimpanan & Suhu" | "Sanitasi & Kebersihan Dapur" | "Penanganan Kontaminasi Silang";
  description: string;
  standardReference: string;
  isChecked: boolean;
  notes?: string;
}

export interface SelfHygieneAudit {
  id: string;
  date: string;
  inspectorName: string;
  score: number;
  passedItemsCount: number;
  totalItemsCount: number;
  status: "MEMENUHI_STANDAR" | "PERLU_PERBAIKAN" | "BELUM_LENGKAP";
  certificateId: string;
  nextAuditDate: string;
}

export interface CircularOfftaker {
  id: string;
  name: string;
  type: "Pengepul Jelantah Bersertifikat" | "Pabrik Pakan Ternak" | "Pengomposan Pupuk Organik" | "Bank Sampah Induk";
  location: string;
  distanceKm: number;
  rating: number;
  acceptedCommodities: string[];
  minPickupKg: number;
  pickupService: boolean;
  priceEstimateInfo: string;
}

export interface BankSampahPoint {
  id: string;
  name: string;
  category: "Bank Sampah Induk Kota" | "Unit Bank Sampah Kelurahan" | "Pusat Daur Ulang Komunal";
  address: string;
  subdistrict: string;
  distanceKm: number;
  rating: number;
  userRatingsTotal: number;
  operatingHours: string;
  openStatus: "Buka Sekarang" | "Tutup Sementara";
  acceptedCommodities: string[];
  contactPerson: string;
  phone: string;
  hasDropbox24h: boolean;
  googleMapsUrl: string;
  serviceFeatures: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
}

export const MOCK_CATALOG_COMMODITIES: CatalogCommodity[] = [
  {
    id: "cat-01-beras",
    name: "Beras Rojolele Super Premium",
    sku: "KMPL-BRS-7721",
    category: "Beras & Biji-bijian",
    supplierId: "sup-01",
    supplierName: "PT Sumber Pangan Nusantara",
    supplierRating: 4.9,
    originCity: "Surabaya, Jawa Timur",
    unit: "Karung (50 kg)",
    minOrderKg: 50,
    marketPricePerKg: 15200,
    wholesalePriceTiers: [
      { minKg: 50, pricePerKg: 13500 },
      { minKg: 250, pricePerKg: 12900 },
      { minKg: 1000, pricePerKg: 12500 },
    ],
    qualityGrade: "Grade A Super",
    specifications: {
      waterContentPct: 13.5,
      shelfLifeDays: 180,
      packagingType: "Woven PP Laminated Food Grade",
      temperatureReq: "Suhu Ruang Kering (24 - 28°C)",
    },
    certifications: ["Bebas Klorin & Pemutih", "Kadar Air < 14% Lolos Lab SNI", "Sertifikat Halal ID00110000"],
    activePoolId: "pool-01-beras",
    inStockKg: 15000,
  },
  {
    id: "cat-02-bawang",
    name: "Bawang Merah Brebes Super",
    sku: "KMPL-BWG-4412",
    category: "Bumbu & Rempah",
    supplierId: "sup-02",
    supplierName: "CV Agro Tani Makmur",
    supplierRating: 4.8,
    originCity: "Nganjuk / Brebes",
    unit: "Krat Plastik (15 kg)",
    minOrderKg: 15,
    marketPricePerKg: 36000,
    wholesalePriceTiers: [
      { minKg: 15, pricePerKg: 31000 },
      { minKg: 100, pricePerKg: 29500 },
      { minKg: 500, pricePerKg: 28000 },
    ],
    qualityGrade: "Grade A Super",
    specifications: {
      waterContentPct: 12.0,
      shelfLifeDays: 30,
      packagingType: "Ventilated Mesh Crate",
      temperatureReq: "Suhu Ruang Sejuk Berventilasi",
    },
    certifications: ["Bebas Pestisida Berlebih", "Sortir Manual Bebas Busuk", "GAP Certified"],
    activePoolId: "pool-02-bawang",
    inStockKg: 3500,
  },
  {
    id: "cat-03-minyak",
    name: "Minyak Goreng Sawit Curah Higienis",
    sku: "KMPL-MYK-9021",
    category: "Minyak & Gula",
    supplierId: "sup-03",
    supplierName: "PT Mega Distribusi Nabati",
    supplierRating: 4.9,
    originCity: "Gresik, Jawa Timur",
    unit: "Jeriken (20 Liter)",
    minOrderKg: 20,
    marketPricePerKg: 17500,
    wholesalePriceTiers: [
      { minKg: 20, pricePerKg: 15500 },
      { minKg: 200, pricePerKg: 14800 },
      { minKg: 1200, pricePerKg: 14200 },
    ],
    qualityGrade: "Grade A Super",
    specifications: {
      shelfLifeDays: 365,
      packagingType: "HDPE Food Grade Jerrican",
      temperatureReq: "Suhu Ruang Terlindung Sinar Matahari",
    },
    certifications: ["SNI Minyak Goreng 7709:2019", "Fortifikasi Vitamin A Teruji", "Halal Kemenag RI"],
    activePoolId: "pool-03-minyak",
    inStockKg: 24000,
  },
  {
    id: "cat-04-ayam",
    name: "Daging Ayam Broiler Karkas Bersih",
    sku: "KMPL-AYM-3310",
    category: "Unggas & Daging",
    supplierId: "sup-04",
    supplierName: "UD Berkah Unggas Sejahtera",
    supplierRating: 4.7,
    originCity: "Mojokerto / Sidoarjo",
    unit: "Box Higienis (10 kg)",
    minOrderKg: 10,
    marketPricePerKg: 39000,
    wholesalePriceTiers: [
      { minKg: 10, pricePerKg: 34500 },
      { minKg: 100, pricePerKg: 32500 },
      { minKg: 400, pricePerKg: 31000 },
    ],
    qualityGrade: "Grade A Super",
    specifications: {
      shelfLifeDays: 7,
      packagingType: "Vacuum Seal Chilled Box",
      temperatureReq: "Rantai Dingin (0 - 4°C)",
    },
    certifications: ["Nomor Kontrol Veteriner (NKV) Level 1", "Sertifikat Juru Sembelih Halal (Juleha)", "Bebas Residu Antibiotik"],
    activePoolId: "pool-04-ayam",
    inStockKg: 2800,
  },
  {
    id: "cat-05-cabai",
    name: "Cabai Rawit Merah Segar Sortir",
    sku: "KMPL-CBI-1109",
    category: "Hortikultura & Sayur",
    supplierId: "sup-02",
    supplierName: "CV Agro Tani Makmur",
    supplierRating: 4.8,
    originCity: "Kediri / Pare",
    unit: "Keranjang Bambu Dilapisi Kertas (10 kg)",
    minOrderKg: 10,
    marketPricePerKg: 48000,
    wholesalePriceTiers: [
      { minKg: 10, pricePerKg: 42000 },
      { minKg: 80, pricePerKg: 39000 },
      { minKg: 300, pricePerKg: 36500 },
    ],
    qualityGrade: "Grade A Standar",
    specifications: {
      waterContentPct: 15.0,
      shelfLifeDays: 10,
      packagingType: "Breathable Basket",
      temperatureReq: "Sejuk Kering (12 - 15°C)",
    },
    certifications: ["Bebas Jamur Antraknosa", "Petik Segar Pagi Hari", "Uji Residu Pestisida Aman"],
    inStockKg: 1200,
  },
  {
    id: "cat-06-tepung",
    name: "Tepung Terigu Protein Sedang Segitiga Emas",
    sku: "KMPL-TPG-8801",
    category: "Bahan Penolong",
    supplierId: "sup-01",
    supplierName: "PT Sumber Pangan Nusantara",
    supplierRating: 4.9,
    originCity: "Surabaya, Jawa Timur",
    unit: "Sak Karung (25 kg)",
    minOrderKg: 25,
    marketPricePerKg: 11800,
    wholesalePriceTiers: [
      { minKg: 25, pricePerKg: 10500 },
      { minKg: 150, pricePerKg: 9900 },
      { minKg: 500, pricePerKg: 9400 },
    ],
    qualityGrade: "Grade A Super",
    specifications: {
      waterContentPct: 14.0,
      shelfLifeDays: 240,
      packagingType: "Multi-wall Paper Sack",
      temperatureReq: "Suhu Ruang Kering",
    },
    certifications: ["SNI 3751:2009", "Fortifikasi Seng & Zat Besi", "Sertifikasi Halal MUI"],
    inStockKg: 8000,
  },
];

export const MOCK_HYGIENE_CHECKLIST_TEMPLATE: HygieneInspectionItem[] = [
  {
    id: "chk-01",
    title: "Pemeriksaan Suhu & Kesegaran Penerimaan",
    category: "Penerimaan Bahan Baku",
    description: "Bahan pangan dingin (daging/ayam) tiba pada suhu < 4°C dan bahan kering tidak lembap atau berbau apek.",
    standardReference: "Permenkes No. 1096/2011 Pasal 7",
    isChecked: true,
    notes: "Ayam tiba di suhu 2.8°C dalam ice box rapat.",
  },
  {
    id: "chk-02",
    title: "Integritas Kemasan & Segel Paspor Mutu",
    category: "Penerimaan Bahan Baku",
    description: "Segel barcode Paspor Mutu dari supplier utuh tanpa bekas robekan atau kebocoran kemasan.",
    standardReference: "Prosedur Baku Mutu KUMPUL Level 1",
    isChecked: true,
  },
  {
    id: "chk-03",
    title: "Pemisahan Wadah Bahan Mentah & Matang",
    category: "Penyimpanan & Suhu",
    description: "Tersedia wadah tertutup terpisah antara unggas mentah, sayuran segar, dan bumbu halus siap saji.",
    standardReference: "HACCP Prinsip 3 - Pencegahan Cross Contamination",
    isChecked: true,
  },
  {
    id: "chk-04",
    title: "Penerapan Sistem FIFO (First In First Out)",
    category: "Penyimpanan & Suhu",
    description: "Setiap wadah dan karung memiliki label tanggal masuk dan tanggal kadaluarsa jelas.",
    standardReference: "CPPOB (Cara Produksi Pangan Olahan yang Baik)",
    isChecked: true,
  },
  {
    id: "chk-05",
    title: "Sanitasi Meja Stainless & Talenan Kode Warna",
    category: "Sanitasi & Kebersihan Dapur",
    description: "Meja kerja didisinfeksi dengan food-safe alcohol 70% sebelum dan sesudah operasional.",
    standardReference: "SOP Dapur Sehat KUMPUL",
    isChecked: false,
    notes: "Talenan warna hijau (sayur) perlu diganti karena goresan dalam.",
  },
  {
    id: "chk-06",
    title: "Kesehatan & Higienitas Personel Masak (APD Dapur)",
    category: "Penanganan Kontaminasi Silang",
    description: "Juru masak memakai celemek bersih, hairnet/penutup rambut, masker, dan kuku pendek terawat.",
    standardReference: "UU Pangan No. 18/2012",
    isChecked: true,
  },
];

export const MOCK_PAST_HYGIENE_AUDITS: SelfHygieneAudit[] = [
  {
    id: "audit-2026-09",
    date: "28 Sep 2026",
    inspectorName: "Siti Rahmawati (Penanggung Jawab)",
    score: 94,
    passedItemsCount: 5,
    totalItemsCount: 6,
    status: "MEMENUHI_STANDAR",
    certificateId: "KMPL-MUTU-SBY-2026-0941",
    nextAuditDate: "05 Okt 2026",
  },
  {
    id: "audit-2026-08",
    date: "21 Sep 2026",
    inspectorName: "Siti Rahmawati",
    score: 100,
    passedItemsCount: 6,
    totalItemsCount: 6,
    status: "MEMENUHI_STANDAR",
    certificateId: "KMPL-MUTU-SBY-2026-0812",
    nextAuditDate: "28 Sep 2026",
  },
];

export const MOCK_CIRCULAR_OFFTAKERS: CircularOfftaker[] = [
  {
    id: "off-01",
    name: "PT Hijau Bioenergi Nusantara",
    type: "Pengepul Jelantah Bersertifikat",
    location: "Kawasan Industri SIER, Surabaya",
    distanceKm: 3.2,
    rating: 4.9,
    acceptedCommodities: ["Minyak Jelantah (UCO)"],
    minPickupKg: 40,
    pickupService: true,
    priceEstimateInfo: "Rp 7.500 - 8.200 / kg (Termasuk jeriken penampung gratis)",
  },
  {
    id: "off-02",
    name: "Koperasi Peternak Mandiri Sidoarjo",
    type: "Pabrik Pakan Ternak",
    location: "Waru, Sidoarjo",
    distanceKm: 5.8,
    rating: 4.8,
    acceptedCommodities: ["Ampas Kedelai / Tahu", "Cangkang Telur"],
    minPickupKg: 50,
    pickupService: true,
    priceEstimateInfo: "Rp 1.200 - 1.500 / kg (Penimbangan timbangan digital di tempat)",
  },
  {
    id: "off-03",
    name: "Kompos Lestari Karang Pilang",
    type: "Pengomposan Pupuk Organik",
    location: "Karang Pilang, Surabaya",
    distanceKm: 7.1,
    rating: 4.7,
    acceptedCommodities: ["Kulit Buah & Sayur", "Sisa Bahan Organik Basah"],
    minPickupKg: 30,
    pickupService: false,
    priceEstimateInfo: "Gratis drop off + insentif kupon pupuk cair KUMPUL",
  },
];

export const MOCK_WASTE_LISTINGS: WasteListing[] = [
  {
    id: "waste-01",
    title: "Ampas Kedelai Perasan Tahu Segar",
    category: "Ampas Kedelai / Tahu",
    sourceProductId: "mock-seed-tahu-walik",
    sourceProductName: "Tahu Walik Crispy Daun Jeruk",
    volumeKg: 120,
    unit: "Kg",
    pricePerKg: 1200,
    location: "Rungkut, Surabaya",
    expiryTimeHours: 24,
    expiryDate: "2026-10-06",
    status: "DIBOOKING",
    potentialRevenue: 144000,
    suitableOfftaker: "Peternak Bebek & Ikan Lele Sidoarjo",
    orderInfo: {
      buyerName: "UD Berkah Peternakan Bebek & Lele",
      buyerType: "Pabrik Pakan Ternak",
      buyerPhone: "0813-8899-2311",
      orderedVolume: 120,
      orderedUnit: "Kg",
      totalPrice: 144000,
      orderDate: "05 Okt 2026, 09:30 WIB",
      pickupScheduledDate: "Besok (06 Okt 2026), 08:30 WIB",
      status: "MENUNGGU_KONFIRMASI",
      notes: "Mohon ampas dikemas dalam karung plastik rapat agar tidak tumpah di bak pick-up.",
    },
  },
  {
    id: "waste-02",
    title: "Minyak Jelantah Bekas Katering (UCO)",
    category: "Minyak Jelantah (UCO)",
    sourceProductId: "mock-seed-bebek-goreng",
    sourceProductName: "Bebek Goreng Kremes Sambal Korek",
    volumeKg: 65,
    unit: "Liter",
    pricePerKg: 7500,
    location: "Rungkut, Surabaya",
    expiryTimeHours: 72,
    expiryDate: "2026-10-08",
    status: "DIBOOKING",
    potentialRevenue: 487500,
    suitableOfftaker: "Off-Taker Biodiesel Ekspor & Bank Sampah Induk",
    orderInfo: {
      buyerName: "PT Hijau Bioenergi Nusantara",
      buyerType: "Offtaker Industri Biodiesel",
      buyerPhone: "0812-9988-7711",
      orderedVolume: 65,
      orderedUnit: "Liter",
      totalPrice: 487500,
      orderDate: "05 Okt 2026, 08:15 WIB",
      pickupScheduledDate: "Rabu (07 Okt 2026), 10:00 WIB",
      status: "DIJADWALKAN_JEMPUT",
      notes: "Driver membawa 4 jeriken penukar 20L bertutup segel resmi SNI.",
    },
  },
  {
    id: "waste-03",
    title: "Cangkang Telur Ayam Kering Cacah",
    category: "Cangkang Telur",
    sourceProductId: "mock-seed-martabak-telur",
    sourceProductName: "Martabak Telur Daging Sapi Super",
    volumeKg: 25,
    unit: "Kg",
    pricePerKg: 2000,
    location: "Rungkut, Surabaya",
    expiryTimeHours: 168,
    expiryDate: "2026-10-14",
    status: "TERSEDIA",
    potentialRevenue: 50000,
    suitableOfftaker: "Produsen Pupuk Kalsium Organik",
  },
  {
    id: "waste-04",
    title: "Residu Trimming Lemak & Tulang Sapi Bersih",
    category: "Biomassa Organik Lainnya",
    sourceProductId: "mock-seed-rice-bowl-sapi",
    sourceProductName: "Rice Bowl Daging Sapi Lada Hitam",
    volumeKg: 35,
    unit: "Kg",
    pricePerKg: 3000,
    location: "Rungkut, Surabaya",
    expiryTimeHours: 48,
    expiryDate: "2026-10-07",
    status: "TERSEDIA",
    potentialRevenue: 105000,
    suitableOfftaker: "Biokonversi Maggot BSF SIER Tenggilis",
  },
];

export const MOCK_BANK_SAMPAH_POINTS: BankSampahPoint[] = [
  {
    id: "bs-01",
    name: "Bank Sampah Induk Surabaya (BSIS)",
    category: "Bank Sampah Induk Kota",
    address: "Jl. Menur Pumpungan No. 32, Menur Pumpungan, Sukolilo",
    subdistrict: "Sukolilo, Surabaya",
    distanceKm: 2.4,
    rating: 4.8,
    userRatingsTotal: 142,
    operatingHours: "Senin - Sabtu: 08.00 - 16.00 WIB",
    openStatus: "Buka Sekarang",
    acceptedCommodities: [
      "Minyak Jelantah (UCO)",
      "Cangkang Telur Kering",
      "Kardus / Box Makanan",
      "Plastik Botol & Jeriken",
    ],
    contactPerson: "Bpk. Bambang Irawan",
    phone: "0812-3011-8844",
    hasDropbox24h: true,
    googleMapsUrl: "https://maps.google.com/?q=Bank+Sampah+Induk+Surabaya",
    serviceFeatures: [
      "Penimbangan Digital Akurat",
      "Area Parkir Pick-up Luas",
      "Dropbox Pintar 24 Jam",
    ],
    coordinates: {
      lat: -7.2882,
      lng: 112.7663,
    },
  },
  {
    id: "bs-02",
    name: "Bank Sampah Resik Mandiri Rungkut",
    category: "Unit Bank Sampah Kelurahan",
    address: "Balai RW 05, Jl. Rungkut Asri Timur No. 8, Rungkut Kidul",
    subdistrict: "Rungkut, Surabaya",
    distanceKm: 0.8,
    rating: 4.9,
    userRatingsTotal: 88,
    operatingHours: "Setiap Hari: 07.30 - 17.00 WIB",
    openStatus: "Buka Sekarang",
    acceptedCommodities: [
      "Ampas Kedelai / Tahu",
      "Kulit Buah & Sayur",
      "Minyak Jelantah (UCO)",
      "Sisa Makanan Katering",
    ],
    contactPerson: "Ibu Sri Wahyuni",
    phone: "0813-3342-9901",
    hasDropbox24h: true,
    googleMapsUrl: "https://maps.google.com/?q=Rungkut+Asri+Timur+Surabaya",
    serviceFeatures: [
      "Jarak Sangat Dekat (< 1 km)",
      "Drop-box 24 Jam",
      "Akses Motor & Tossa",
    ],
    coordinates: {
      lat: -7.3225,
      lng: 112.7788,
    },
  },
  {
    id: "bs-03",
    name: "Bank Sampah Bintang Mangrove Wonorejo",
    category: "Pusat Daur Ulang Komunal",
    address: "Jl. Wonorejo Timur No. 12, Wonorejo, Rungkut",
    subdistrict: "Rungkut, Surabaya",
    distanceKm: 3.1,
    rating: 4.7,
    userRatingsTotal: 65,
    operatingHours: "Senin - Jumat: 08.30 - 15.30 WIB",
    openStatus: "Buka Sekarang",
    acceptedCommodities: [
      "Minyak Jelantah (UCO)",
      "Ampas Kopi & Teh",
      "Cangkang Telur",
      "Sisa Organik Basah",
    ],
    contactPerson: "Mas Hendra Prasetyo",
    phone: "0811-3489-021",
    hasDropbox24h: false,
    googleMapsUrl: "https://maps.google.com/?q=Wonorejo+Rungkut+Surabaya",
    serviceFeatures: [
      "Sertifikasi ISCC Daur Ulang",
      "Edukasi Kompos Mandiri",
      "Area Parkir Nyaman",
    ],
    coordinates: {
      lat: -7.311,
      lng: 112.8021,
    },
  },
  {
    id: "bs-04",
    name: "Pusat Pengolahan Organik SIER Tenggilis",
    category: "Pusat Daur Ulang Komunal",
    address: "Kawasan Industri SIER Blok D-4, Tenggilis Mejoyo",
    subdistrict: "Tenggilis Mejoyo, Surabaya",
    distanceKm: 3.7,
    rating: 4.6,
    userRatingsTotal: 53,
    operatingHours: "Senin - Sabtu: 08.00 - 17.00 WIB",
    openStatus: "Buka Sekarang",
    acceptedCommodities: [
      "Residu Trimming Daging & Tulang",
      "Ampas Kedelai / Tahu",
      "Sisa Sayur & Nasi",
    ],
    contactPerson: "Drs. Eko Purwanto",
    phone: "0812-4455-6677",
    hasDropbox24h: false,
    googleMapsUrl: "https://maps.google.com/?q=Kawasan+Industri+SIER+Surabaya",
    serviceFeatures: [
      "Penerimaan Residu Skala Besar",
      "Khusus Residu Daging & Tulang",
      "Timbangan Truk / Pick-up",
    ],
    coordinates: {
      lat: -7.3312,
      lng: 112.7554,
    },
  },
  {
    id: "bs-05",
    name: "Bank Sampah Surya Mandiri Jemursari",
    category: "Unit Bank Sampah Kelurahan",
    address: "Jl. Jemursari Selatan IV No. 16, Jemur Wonosari",
    subdistrict: "Wonocolo, Surabaya",
    distanceKm: 4.2,
    rating: 4.8,
    userRatingsTotal: 92,
    operatingHours: "Senin - Sabtu: 08.00 - 16.30 WIB",
    openStatus: "Buka Sekarang",
    acceptedCommodities: [
      "Minyak Jelantah (UCO)",
      "Wadah Plastik & Jeriken",
      "Kardus Kemasan",
    ],
    contactPerson: "Ibu Ratna Dewi",
    phone: "0812-3211-9988",
    hasDropbox24h: true,
    googleMapsUrl: "https://maps.google.com/?q=Jemursari+Surabaya",
    serviceFeatures: [
      "Penerimaan Drop-off Langsung UMKM",
      "Dropbox 24 Jam",
      "Area Dekat Jalan Raya",
    ],
    coordinates: {
      lat: -7.318,
      lng: 112.748,
    },
  },
  {
    id: "bs-06",
    name: "Bank Sampah Bratang Binangun",
    category: "Unit Bank Sampah Kelurahan",
    address: "Jl. Bratang Binangun No. 22, Baratajaya, Gubeng",
    subdistrict: "Gubeng, Surabaya",
    distanceKm: 4.8,
    rating: 4.7,
    userRatingsTotal: 74,
    operatingHours: "Senin - Sabtu: 08.00 - 16.00 WIB",
    openStatus: "Buka Sekarang",
    acceptedCommodities: [
      "Minyak Jelantah (UCO)",
      "Cangkang Telur",
      "Kardus Kemasan Makanan",
    ],
    contactPerson: "Bpk. Agus Santoso",
    phone: "0813-9088-1234",
    hasDropbox24h: false,
    googleMapsUrl: "https://maps.google.com/?q=Bratang+Binangun+Surabaya",
    serviceFeatures: [
      "Tersedia Parkir Pick-up",
      "Pelayanan Ramah & Cepat",
      "Penimbangan Digital",
    ],
    coordinates: {
      lat: -7.2965,
      lng: 112.754,
    },
  },
];
