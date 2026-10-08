export interface PriceTierRange {
  id: string;
  minQty: number;
  maxQty: number;
  price: number;
}

export interface KatalogFormData {
  name: string;
  unit: string;
  basePrice: number; // Harga utama
  minOrderQty: number;
  estimatedStock: number;
  leadTimeDays: number;
  harvestDate?: string;
  autoActivateMarketplace?: boolean;
  allowRetail?: boolean;
  retailPrice?: number;
  enablePriceTiers: boolean;
  priceTiers: PriceTierRange[];
  description: string;
  imageFile?: File | null;
  imagePreviewUrl?: string;
}

export type KatalogFormErrors = Partial<Record<string, string>>;
