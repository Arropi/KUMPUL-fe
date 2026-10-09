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
  has_tiering_price?: boolean;
  has_open_pools?: boolean;
  open_pools_count?: number;
  source_type?: 'SUPPLIER' | 'WASTE';
  seller_city?: string;
  distance_km?: number | null;
  active_pools?: any[];
  supplier?: {
    role_id?: string;
    legal_name?: string;
    default_address?: string;
    latitude?: number;
    longitude?: number;
    sector_type?: string | null;
  };
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

export interface BEPoolParticipant {
  id: string;
  pool_id: string;
  umkm_role_id: string;
  order_qty: string | number;
  delivery_method?: "HEMAT_HUB" | "DIRECT_DOOR_TO_DOOR" | null;
  required_delivery_date?: string | null;
  is_urgent_asap?: boolean;
  final_delivery_address: string;
  final_delivery_lat: string | number;
  final_delivery_lng: string | number;
  allocated_shipping_fee: string | number;
  pickup_code?: string | null;
  is_picked_up?: boolean;
  picked_up_at?: string | null;
  created_at?: string | null;
  umkm_name?: string | null;
  entity_address?: string | null;
}

export interface BEProcurementPool {
  id: string;
  commodity_id: string;
  host_umkm_role_id?: string | null;
  target_moq: string | number;
  accumulated_qty: string | number;
  pool_status: "OPEN" | "AGGREGATING" | "LOCKED" | "COMPLETED" | "FAILED";
  locked_tier_price?: string | number | null;
  target_delivery_date?: string | null;
  cutoff_date?: string | null;
  is_asap_allowed?: boolean;
  is_direct_order?: boolean;
  estimated_delivery_date?: string | null;
  expires_at: string;
  default_hub_address?: string | null;
  hub_latitude?: string | number | null;
  hub_longitude?: string | number | null;
  created_at?: string | null;
  updated_at?: string | null;
  participants?: BEPoolParticipant[];
  commodity_name?: string;
  wholesale_unit?: string;
}

export type BEWasteCategory =
  | "ORGANIK_BASAH"
  | "ORGANIK_KERING"
  | "TEKSTIL_PERCA"
  | "ANORGANIK";

export type BEWasteListingStatus =
  | "AVAILABLE"
  | "SOLD_OUT"
  | "REFERRED_TO_OFFTAKER";

export interface BEWasteListing {
  id: string;
  umkm_product_id?: string | null;
  seller_role_id: string;
  listing_title: string;
  waste_category: BEWasteCategory;
  available_weight: string | number;
  price_per_kg: string | number;
  is_marketplace_visible?: boolean;
  listing_status: BEWasteListingStatus;
  notes?: string | null;
  expired_at: string;
  created_at?: string;
  updated_at?: string;
  seller_business_name?: string;
  seller_address?: string;
  seller_latitude?: string | number;
  seller_longitude?: string | number;
}

export interface BENearestOfftaker {
  id: string;
  org_name: string;
  contact_person: string | null;
  phone: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  accepted_waste_types: string[];
  service_area_city: string;
  distance_km: number;
}

export interface BEWasteTransaction {
  id: string;
  listing_id: string;
  listing_title: string;
  waste_category: BEWasteCategory;
  purchased_weight: string | number;
  total_amount: string | number;
  fulfillment_status: "PAID_HELD_IN_ESCROW" | "PICKED_UP" | "ACCEPTED_COMPLETED";
  pickup_date: string | null;
  pickup_code: string | null;
  picked_up_at?: string | null;
  payment_status: string;
  created_at: string;
  buyer_business_name?: string;
  buyer_phone?: string | null;
}
