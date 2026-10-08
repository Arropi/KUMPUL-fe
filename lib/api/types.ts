export interface BEProduct {
  id: string;
  umkm_role_id: string;
  product_name: string;
  unit: string;
  target_selling_price_per_unit: string | number;
  expected_batch_units: number;
  production_iterations_per_day?: number;
  calculated_hpp_per_unit: string | number;
  projected_margin_percentage: string | number;
  created_at?: string;
  updated_at?: string;
  recipes?: BERecipe[];
  category?: string;
  waste_items?: unknown[];
}

export interface BERecipe {
  id: string;
  umkm_product_id: string;
  ingredient_name: string;
  required_qty_per_unit: string | number;
  unit: string;
  total_batch_required_qty?: string | number;
  estimated_cost_per_unit?: string | number;
  sector?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BEPriceTier {
  min_qty: number;
  max_qty: number;
  tier_price: number;
}

export type BEWholesaleUnit =
  | "KARUNG"
  | "SAK"
  | "KRAT"
  | "PAX"
  | "BAL"
  | "KG"
  | "GRAM"
  | "TON"
  | "KUINTAL"
  | "LITER"
  | "ML"
  | "KUBIK"
  | "PCS"
  | "PACK"
  | "DUS"
  | "BOX"
  | "KARTON"
  | "BOTOL"
  | "KALENG"
  | "TRAY"
  | "KERANJANG"
  | "BASKOM"
  | "EKOR"
  | "BUTIR"
  | "LEMBAR"
  | "IKAT"
  | "PORSI"
  | "CUP"
  | "BUNGKUS"
  | "LUSIN"
  | "PALLET"
  | "KOLI";

export interface BESupplierCommodity {
  id: string;
  supplier_role_id: string;
  name: string;
  sku: string;
  wholesale_unit: BEWholesaleUnit;
  base_price: string | number;
  stock: string | number;
  base_moq: string | number;
  lead_time_days: number;
  image_url: string | null;
  description: string | null;
  productionDate?: string | null;
  production_date: string | null;
  closed_date?: string | null;
  supplier_entity_id?: string;
  auto_activate_marketplace: boolean;
  allows_under_moq: boolean;
  under_moq_price_per_kg: string | number | null;
  is_marketplace_active: boolean;
  created_at?: string;
  updated_at?: string;
  price_tiers?: BEPriceTier[];
  batch_tag?: BECommodityBatchTag | null;
  batch_tags?: BECommodityBatchTag[];
}

export type BEStorageTemperature = "AMBIENT" | "CHILLED" | "FROZEN";

export interface BECommodityBatchTag {
  id: string;
  commodity_id: string;
  supporting_file_url: string | null;
  storage_temperature_type: BEStorageTemperature;
  is_verified: boolean;
  verification_notes?: string | null;
  verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BEBankAccountItem {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_primary?: boolean;
}

export interface BEBankAccountInfo {
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
  accounts?: BEBankAccountItem[];
  brand_name?: string;
  pic_name?: string;
  pic_title?: string;
  phone?: string;
  email?: string;
  city?: string;
  [key: string]: unknown;
}

export interface BEBusinessEntity {
  id: string;
  auth_user_id?: string;
  legal_name: string;
  npwp_nib: string;
  default_address: string;
  latitude: string | number;
  longitude: string | number;
  phone_number?: string | null;
  bank_account_info?: BEBankAccountInfo;
  profile_picture_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BEBusinessRole {
  id: string;
  entity_id: string;
  role_type: "SUPPLIER" | "UMKM";
  sector_type: string;
  capacity_monthly?: string | number;
  capacity_unit?: string;
  storage_type?: string;
  storage_capacity?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
