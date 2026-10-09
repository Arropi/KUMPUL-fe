export interface UnifiedProfileState {
  id: string;
  brandName: string;
  legalName: string;
  picName: string;
  picTitle: string;
  contactPhone: string;
  contactEmail: string;
  npwpNib: string;
  address: string;
  city: string;
  sector: string;
  sectorLabel: string;
  complianceStatus: string;
  registrationDate: string;
  storageValue: number;
  storageUnit: string;
  storageType: string;
  totalRevenue: number;
  totalItems: number;
}

export interface SectorVisualInfo {
  label: string;
  image: string;
  tag: string;
}

export const SECTOR_MEDIA_MAP: Record<string, SectorVisualInfo> = {
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
  FNB_PENGOLAHAN: {
    label: "Sektor FnB & Pengolahan Bahan Baku",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    tag: "Industri Pengolahan Pangan",
  },
  KATERING: {
    label: "Sektor Katering & Dapur Olahan",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    tag: "Katering & Jasa Boga",
  },
  KULINER_FNB: {
    label: "Sektor Kuliner & Warung Pangan",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    tag: "Kuliner & Restoran",
  },
};
