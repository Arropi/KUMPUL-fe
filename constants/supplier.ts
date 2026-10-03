export type WholesaleUnit = "KARUNG" | "SAK" | "KRAT" | "PAX" | "BAL" | "PETI";

export type StorageTemperature = "AMBIENT" | "CHILLED" | "FROZEN";

export type SectorType =
  | "Pertanian"
  | "Peternakan"
  | "Perikanan"
  | "Perkebunan"
  | "FnB / Pengolahan"
  | "Ritel"
  | "Logistik";

export const OFFICIAL_SECTORS = [
  "PERTANIAN",
  "PETERNAKAN",
  "PERIKANAN",
  "PERKEBUNAN",
  "FNB & PENGOLAHAN",
  "RITEL",
  "LOGISTIK",
] as const;

export const BANK_OPTIONS = [
  "Bank Central Asia (BCA)",
  "Bank Mandiri",
  "Bank Rakyat Indonesia (BRI)",
  "Bank Negara Indonesia (BNI)",
  "Bank Syariah Indonesia (BSI)",
];

export const SECTOR_MEDIA_MAP: Record<
  string,
  { label: string; image: string; tag: string }
> = {
  PERTANIAN: {
    label: "Sektor Pertanian & Agribisnis",
    image:
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80",
    tag: "Agribisnis Pangan Pokok",
  },
  PETERNAKAN: {
    label: "Sektor Peternakan & Daging",
    image:
      "https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=1200&q=80",
    tag: "Peternakan & Unggas Ruminansia",
  },
  PERIKANAN: {
    label: "Sektor Perikanan & Hasil Laut",
    image:
      "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=1200&q=80",
    tag: "Akuakultur & Hasil Laut",
  },
  PERKEBUNAN: {
    label: "Sektor Perkebunan & Rempah",
    image:
      "https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=1200&q=80",
    tag: "Hortikultura & Komoditas Rempah",
  },
  "FNB & PENGOLAHAN": {
    label: "Sektor FnB & Pengolahan Bahan Baku",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    tag: "Industri Pengolahan Pangan",
  },
};

export type StorageUnit = "TON" | "KG" | "KUINTAL" | "M3" | "LITER" | "PALET";

export type StorageType = "DRY" | "CHILLED" | "FROZEN" | "SILO";

export interface StorageUnitOption {
  label: string;
  value: StorageUnit;
  description: string;
}

export const STORAGE_UNIT_OPTIONS: StorageUnitOption[] = [
  { label: "Ton", value: "TON", description: "Standar kapasitas komoditas pangan grosir" },
  { label: "Kilogram (Kg)", value: "KG", description: "Satuan bobot kilogram" },
  { label: "Kuintal (100 Kg)", value: "KUINTAL", description: "1 kuintal setara 100 kg" },
  { label: "Meter Kubik (m³)", value: "M3", description: "Satuan volume ruang gudang" },
  { label: "Palet / Kontainer", value: "PALET", description: "Kapasitas muat palet terstandarisasi" },
  { label: "Liter (L)", value: "LITER", description: "Komoditas cair (minyak, susu segar, dll)" },
];

export interface StorageTypeOption {
  label: string;
  value: StorageType;
  description: string;
}

export const STORAGE_TYPE_OPTIONS: StorageTypeOption[] = [
  { label: "Gudang Kering (Ambient)", value: "DRY", description: "Penyimpanan suhu ruang (beras, jagung, umbi, biji-bijian)" },
  { label: "Ruang Pendingin (Chilled 0° s/d 4°C)", value: "CHILLED", description: "Sayuran segar, buah, telur, olahan susu" },
  { label: "Cold Storage Beku (Frozen -18°C)", value: "FROZEN", description: "Daging beku, seafood, ayam potong, produk beku" },
  { label: "Silo / Curah", value: "SILO", description: "Penyimpanan curah terproteksi cuaca" },
];

export function calculateNormalizedKg(value: number, unit: StorageUnit): number | null {
  switch (unit) {
    case "TON":
      return value * 1000;
    case "KUINTAL":
      return value * 100;
    case "KG":
      return value;
    default:
      return null;
  }
}

export interface CommodityPriceTier {
  id: string;
  minQty: number;
  maxQty: number | null; // null jika tidak ada batas atas (tier tertinggi)
  pricePerUnit: number;
  label: string;
}

export interface CommodityBatchTag {
  id: string;
  licenseNumber: string; // Izin edar / BPOM / Kementan / Sertifikat Uji Bebas Residu
  productionDate: string; // YYYY-MM-DD
  expiryDate: string;
  storageTemperature: StorageTemperature;
  originLocation: string;
  hygieneStatus: "TERVERIFIKASI" | "MENUNGGU_AUDIT" | "KADALUARSA";
}

export interface SupplierCommodity {
  id: string;
  sku: string;
  name: string;
  sector: SectorType;
  description: string;
  wholesaleUnit: WholesaleUnit;
  unitWeightKg: number; // Berat per satuan dalam kg
  baseMoq: number; // Dalam satuan grosir
  availableStock: number;
  leadTimeDays: number;
  isActive: boolean;
  priceTiers: CommodityPriceTier[];
  batchTag: CommodityBatchTag;
  imageUrl?: string;
  createdAt: string;
  allowsUnderMoq?: boolean;
  underMoqPricePerKg?: number | null;
  productionDate?: string | null;
  expiryDate?: string | null;
}

export type DeliveryMethod = "HEMAT_HUB" | "ON_YOUR_DOOR" | "DIRECT_DOOR_TO_DOOR";

export type POStatus =
  | "ISSUED" // Baru diterbitkan dari pool yang locked
  | "PAID_TO_ESCROW" // Pembayaran UMKM aman di escrow, siap dikemas
  | "PROCESSING" // Sedang dikemas oleh supplier
  | "SHIPPED" // Dalam pengiriman ke Hub atau alamat UMKM
  | "DELIVERED"; // Tiba di tujuan / Hub dan siap diverifikasi

export interface PoolParticipantInfo {
  id: string;
  umkmName: string;
  ownerName: string;
  phone: string;
  orderQtyUnit: number;
  orderWeightKg: number;
  deliveryMethod: DeliveryMethod;
  destinationAddress: string;
  allocatedShippingFee: number;
  subtotalAmount: number;
}

export interface ConsolidatedPO {
  id: string;
  poNumber: string; // misal PO-PL-2026-0891
  poolId: string;
  commodityId: string;
  commodityName: string;
  wholesaleUnit: WholesaleUnit;
  totalQuantity: number;
  totalWeightKg: number;
  lockedTierPrice: number;
  totalGoodsAmount: number;
  totalShippingAmount: number;
  grandTotalAmount: number;
  status: POStatus;
  primaryDeliveryMethod: DeliveryMethod;
  hubName?: string;
  hubAddress?: string;
  hubCoordinates?: { lat: number; lng: number };
  participants: PoolParticipantInfo[];
  createdAt: string;
  estimatedDeliveryDate: string;
  trackingNumber?: string;
  driverName?: string;
  driverPhone?: string;
}

export interface LiveDemandPool {
  id: string;
  commodityName: string;
  targetMoqKg: number;
  accumulatedKg: number;
  participantsCount: number;
  hoursRemaining: number;
  sector: SectorType;
  hubCandidateArea: string;
}

export interface SupplierEntityProfile {
  id: string;
  legalName: string;
  brandName: string;
  npwpNib: string;
  sector: SectorType;
  storageValue?: number;
  storageUnit?: StorageUnit;
  storageType?: StorageType;
  storageCapacity?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  complianceStatus: "TERVERIFIKASI" | "PENINJAUAN";
  registrationDate: string;
}

// ---------------------------------------------------------------------------
// DATA MOCK TERSTRUKTUR (Single Source of Truth)
// ---------------------------------------------------------------------------

export const MOCK_SUPPLIER_PROFILE: SupplierEntityProfile = {
  id: "sup-ent-01",
  legalName: "PT Agroniaga Nusantara Sejahtera",
  brandName: "AgroNusantara Supply",
  npwpNib: "01.892.341.2-045.000 / NIB 9120003481923",
  sector: "Pertanian",
  storageValue: 750,
  storageUnit: "TON",
  storageType: "DRY",
  storageCapacity: "750 Ton • Gudang Kering (Ambient)",
  contactEmail: "distribusi@agronusantara.co.id",
  contactPhone: "0811-8899-2311",
  address: "Kawasan Pergudangan Muara Karang Blok B7 No. 12",
  city: "Jakarta Utara",
  latitude: -6.1158,
  longitude: 106.7865,
  bankInfo: {
    bankName: "Bank Central Asia (BCA)",
    accountNumber: "883-0912-441",
    accountHolder: "PT Agroniaga Nusantara Sejahtera",
  },
  complianceStatus: "TERVERIFIKASI",
  registrationDate: "12 Januari 2025",
};

export const MOCK_SUPPLIER_COMMODITIES: SupplierCommodity[] = [
  {
    id: "com-01",
    sku: "AGRO-BRS-001",
    name: "Beras Ramos Cianjur Super (Grade A)",
    sector: "Pertanian",
    description:
      "Beras kualitas premium dengan kadar patahan di bawah 5 persen, hasil panen sawah binaan Cianjur, bebas pemutih dan wangi pandan alami.",
    wholesaleUnit: "KARUNG",
    unitWeightKg: 50,
    baseMoq: 5, // 5 karung = 250 kg
    availableStock: 120, // 6.000 kg
    leadTimeDays: 2,
    isActive: true,
    imageUrl:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
    priceTiers: [
      {
        id: "tier-1",
        minQty: 5,
        maxQty: 10,
        pricePerUnit: 750000, // Rp 15.000/kg
        label: "Tier 1 (250 s.d. 500 kg)",
      },
      {
        id: "tier-2",
        minQty: 11,
        maxQty: null,
        pricePerUnit: 675000, // Rp 13.500/kg (Diskon pooling)
        label: "Tier 2 (> 500 kg - Rekomendasi Pool)",
      },
    ],
    batchTag: {
      id: "tag-01",
      licenseNumber: "KEMTAN-RI-PD.32.01-A.I.000-02-00192-11/24",
      productionDate: "2026-09-18",
      expiryDate: "2027-03-18",
      storageTemperature: "AMBIENT",
      originLocation: "Cianjur, Jawa Barat",
      hygieneStatus: "TERVERIFIKASI",
    },
    createdAt: "2026-09-20",
    allowsUnderMoq: true,
    underMoqPricePerKg: 1500,
    productionDate: "2026-09-18",
    expiryDate: "2027-03-18",
  },
  {
    id: "com-02",
    sku: "AGRO-KDL-002",
    name: "Kedelai Kuning Non-GMO Pilihan",
    sector: "FnB / Pengolahan",
    description:
      "Bahan baku utama industri tahu, tempe, dan susu kedelai. Butiran bulat padat, kadar air 12 persen, bebas kutu dan jamur.",
    wholesaleUnit: "SAK",
    unitWeightKg: 25,
    baseMoq: 8, // 8 sak = 200 kg
    availableStock: 80,
    leadTimeDays: 1,
    isActive: true,
    imageUrl:
      "https://images.unsplash.com/photo-1639843606783-b2f9c50a7468?auto=format&fit=crop&w=600&q=80",
    priceTiers: [
      {
        id: "tier-kdl-1",
        minQty: 8,
        maxQty: 20,
        pricePerUnit: 325000, // Rp 13.000/kg
        label: "Tier 1 (200 s.d. 500 kg)",
      },
      {
        id: "tier-kdl-2",
        minQty: 21,
        maxQty: null,
        pricePerUnit: 295000, // Rp 11.800/kg
        label: "Tier 2 (> 500 kg)",
      },
    ],
    batchTag: {
      id: "tag-02",
      licenseNumber: "PSAT-KEMTAN-3275-08/2025",
      productionDate: "2026-09-22",
      expiryDate: "2027-04-22",
      storageTemperature: "AMBIENT",
      originLocation: "Grobogan, Jawa Tengah",
      hygieneStatus: "TERVERIFIKASI",
    },
    createdAt: "2026-09-21",
    allowsUnderMoq: false,
    underMoqPricePerKg: null,
    productionDate: "2026-09-22",
    expiryDate: "2027-04-22",
  },
  {
    id: "com-03",
    sku: "AGRO-BAM-003",
    name: "Bawang Merah Brebes Super Askip",
    sector: "Pertanian",
    description:
      "Bawang merah kering simpan pilihan, aroma tajam kuat, kadar air rendah sehingga masa tahan hingga 3 bulan tanpa pembusukan dini.",
    wholesaleUnit: "KRAT",
    unitWeightKg: 20,
    baseMoq: 6, // 120 kg
    availableStock: 45,
    leadTimeDays: 2,
    isActive: true,
    imageUrl:
      "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80",
    priceTiers: [
      {
        id: "tier-bam-1",
        minQty: 6,
        maxQty: 15,
        pricePerUnit: 580000, // Rp 29.000/kg
        label: "Tier 1 (120 s.d. 300 kg)",
      },
      {
        id: "tier-bam-2",
        minQty: 16,
        maxQty: null,
        pricePerUnit: 520000, // Rp 26.000/kg
        label: "Tier 2 (> 300 kg)",
      },
    ],
    batchTag: {
      id: "tag-03",
      licenseNumber: "MUTU-PANGAN-BB-092-2026",
      productionDate: "2026-09-25",
      expiryDate: "2026-12-25",
      storageTemperature: "AMBIENT",
      originLocation: "Brebes, Jawa Tengah",
      hygieneStatus: "TERVERIFIKASI",
    },
    createdAt: "2026-09-26",
    allowsUnderMoq: true,
    underMoqPricePerKg: 2000,
    productionDate: "2026-09-25",
    expiryDate: "2026-12-25",
  },
  {
    id: "com-04",
    sku: "AGRO-AYM-004",
    name: "Daging Ayam Broiler Karkas Segar (0.9 s.d. 1.0 kg)",
    sector: "Peternakan",
    description:
      "Ayam potong higienis standar Rumah Potong Unggas (RPU) modern bersertifikat Halal dan Nomor Kontrol Veteriner (NKV).",
    wholesaleUnit: "PETI",
    unitWeightKg: 30, // 30 ekor dalam peti insulated
    baseMoq: 4, // 120 kg
    availableStock: 30,
    leadTimeDays: 1,
    isActive: false, // Ditandai nonaktif untuk contoh UI
    imageUrl:
      "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80",
    priceTiers: [
      {
        id: "tier-aym-1",
        minQty: 4,
        maxQty: 10,
        pricePerUnit: 1050000, // Rp 35.000/kg
        label: "Tier 1 (120 s.d. 300 kg)",
      },
      {
        id: "tier-aym-2",
        minQty: 11,
        maxQty: null,
        pricePerUnit: 960000, // Rp 32.000/kg
        label: "Tier 2 (> 300 kg)",
      },
    ],
    batchTag: {
      id: "tag-04",
      licenseNumber: "NKV-RPU-3201-0941 & HALAL-ID0011000021",
      productionDate: "2026-09-29",
      expiryDate: "2026-10-06",
      storageTemperature: "CHILLED",
      originLocation: "Bogor, Jawa Barat",
      hygieneStatus: "MENUNGGU_AUDIT",
    },
    createdAt: "2026-09-28",
    allowsUnderMoq: true,
    underMoqPricePerKg: 3000,
    productionDate: "2026-09-29",
    expiryDate: "2026-10-06",
  },
];

export const MOCK_CONSOLIDATED_POS: ConsolidatedPO[] = [
  {
    id: "po-01",
    poNumber: "PO-KUMPUL-2026-0901",
    poolId: "pool-brs-01",
    commodityId: "com-01",
    commodityName: "Beras Ramos Cianjur Super (Grade A)",
    wholesaleUnit: "KARUNG",
    totalQuantity: 14, // 14 karung = 700 kg (Mencapai Tier 2)
    totalWeightKg: 700,
    lockedTierPrice: 675000, // Tier 2 harga locked
    totalGoodsAmount: 9450000,
    totalShippingAmount: 420000,
    grandTotalAmount: 9870000,
    status: "PAID_TO_ESCROW",
    primaryDeliveryMethod: "HEMAT_HUB",
    hubName: "Hub Konsolidasi Sentra UMKM Kuliner Cikarang",
    hubAddress: "Jl. Industri Pasir Gombong No. 45, Cikarang Utara, Bekasi",
    hubCoordinates: { lat: -6.2841, lng: 107.1524 },
    createdAt: "2026-09-29T10:15:00Z",
    estimatedDeliveryDate: "2026-10-01",
    participants: [
      {
        id: "part-01",
        umkmName: "Katering Berkah Rasa Ibu Siti",
        ownerName: "Siti Rahmawati",
        phone: "0812-9844-1211",
        orderQtyUnit: 6,
        orderWeightKg: 300,
        deliveryMethod: "HEMAT_HUB",
        destinationAddress: "Hub Konsolidasi Cikarang (Ambil Sendiri)",
        allocatedShippingFee: 180000,
        subtotalAmount: 4230000,
      },
      {
        id: "part-02",
        umkmName: "Warung Makan Prasmanan Barokah",
        ownerName: "Budi Santoso",
        phone: "0856-7788-3341",
        orderQtyUnit: 5,
        orderWeightKg: 250,
        deliveryMethod: "HEMAT_HUB",
        destinationAddress: "Hub Konsolidasi Cikarang (Ambil Sendiri)",
        allocatedShippingFee: 150000,
        subtotalAmount: 3525000,
      },
      {
        id: "part-03",
        umkmName: "Dapur Nasi Kotak Sedap Wangi",
        ownerName: "Dewi Lestari",
        phone: "0878-1122-9900",
        orderQtyUnit: 3,
        orderWeightKg: 150,
        deliveryMethod: "DIRECT_DOOR_TO_DOOR",
        destinationAddress: "Ruko Sentra Niaga Blok C-12, Lippo Cikarang",
        allocatedShippingFee: 90000,
        subtotalAmount: 2115000,
      },
    ],
  },
  {
    id: "po-02",
    poNumber: "PO-KUMPUL-2026-0889",
    poolId: "pool-kdl-01",
    commodityId: "com-02",
    commodityName: "Kedelai Kuning Non-GMO Pilihan",
    wholesaleUnit: "SAK",
    totalQuantity: 24, // 600 kg
    totalWeightKg: 600,
    lockedTierPrice: 295000,
    totalGoodsAmount: 7080000,
    totalShippingAmount: 380000,
    grandTotalAmount: 7460000,
    status: "SHIPPED",
    primaryDeliveryMethod: "HEMAT_HUB",
    hubName: "Hub Konsolidasi Pengrajin Tahu Semanan",
    hubAddress: "Komp. Kopti Semanan Blok D No. 8, Kalideres, Jakarta Barat",
    hubCoordinates: { lat: -6.1623, lng: 106.6987 },
    trackingNumber: "KMPL-LOG-2026-90412",
    driverName: "Hendra Wijaya (Armada Truk Colt Diesel)",
    driverPhone: "0813-4455-8812",
    createdAt: "2026-09-28T14:30:00Z",
    estimatedDeliveryDate: "2026-09-30",
    participants: [
      {
        id: "part-04",
        umkmName: "Pabrik Tahu Sutra Murni",
        ownerName: "Ahmad Fauzi",
        phone: "0812-4433-2211",
        orderQtyUnit: 14,
        orderWeightKg: 350,
        deliveryMethod: "HEMAT_HUB",
        destinationAddress: "Hub Semanan Kalideres",
        allocatedShippingFee: 220000,
        subtotalAmount: 4350000,
      },
      {
        id: "part-05",
        umkmName: "Tempe Tradisional Daun Jati",
        ownerName: "Supriyanto",
        phone: "0819-8877-6655",
        orderQtyUnit: 10,
        orderWeightKg: 250,
        deliveryMethod: "HEMAT_HUB",
        destinationAddress: "Hub Semanan Kalideres",
        allocatedShippingFee: 160000,
        subtotalAmount: 3110000,
      },
    ],
  },
  {
    id: "po-03",
    poNumber: "PO-KUMPUL-2026-0850",
    poolId: "pool-bam-01",
    commodityId: "com-03",
    commodityName: "Bawang Merah Brebes Super Askip",
    wholesaleUnit: "KRAT",
    totalQuantity: 18, // 360 kg
    totalWeightKg: 360,
    lockedTierPrice: 520000,
    totalGoodsAmount: 9360000,
    totalShippingAmount: 450000,
    grandTotalAmount: 9810000,
    status: "DELIVERED",
    primaryDeliveryMethod: "HEMAT_HUB",
    hubName: "Hub Sentra Bumbu Pasar Kramat Jati",
    hubAddress: "Sentra Distribusi Sayur Kramat Jati, Jakarta Timur",
    hubCoordinates: { lat: -6.2731, lng: 106.8712 },
    trackingNumber: "KMPL-LOG-2026-88123",
    driverName: "Teguh Santoso",
    driverPhone: "0812-1133-7722",
    createdAt: "2026-09-24T09:00:00Z",
    estimatedDeliveryDate: "2026-09-26",
    participants: [
      {
        id: "part-06",
        umkmName: "Bawang Goreng Crispy Gurih",
        ownerName: "Nurul Hidayah",
        phone: "0813-5566-7788",
        orderQtyUnit: 10,
        orderWeightKg: 200,
        deliveryMethod: "HEMAT_HUB",
        destinationAddress: "Hub Kramat Jati",
        allocatedShippingFee: 250000,
        subtotalAmount: 5450000,
      },
      {
        id: "part-07",
        umkmName: "Sambal Kemasan Maknyus",
        ownerName: "Doni Prasetyo",
        phone: "0812-9988-1122",
        orderQtyUnit: 8,
        orderWeightKg: 160,
        deliveryMethod: "HEMAT_HUB",
        destinationAddress: "Hub Kramat Jati",
        allocatedShippingFee: 200000,
        subtotalAmount: 4360000,
      },
    ],
  },
];

export const MOCK_LIVE_DEMAND_POOLS: LiveDemandPool[] = [
  {
    id: "pool-live-01",
    commodityName: "Beras Ramos Cianjur Super (Grade A)",
    targetMoqKg: 500,
    accumulatedKg: 350,
    participantsCount: 4,
    hoursRemaining: 8,
    sector: "Pertanian",
    hubCandidateArea: "Radius 5 km: Cibitung / Cikarang Barat",
  },
  {
    id: "pool-live-02",
    commodityName: "Bawang Merah Brebes Super Askip",
    targetMoqKg: 300,
    accumulatedKg: 240,
    participantsCount: 3,
    hoursRemaining: 14,
    sector: "Pertanian",
    hubCandidateArea: "Radius 8 km: Pasar Rebo / Ciracas",
  },
];
