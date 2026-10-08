import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { POStatus, StorageTemperature } from "@/constants/supplier";

export function getOrderStatusBadge(status: POStatus) {
  switch (status) {
    case "ISSUED":
      return <Badge variant="neutral">Menunggu Pembayaran</Badge>;
    case "PAID_TO_ESCROW":
      return <Badge variant="warning">Dana Siap di Escrow</Badge>;
    case "PROCESSING":
      return <Badge variant="info">Sedang Dikemas</Badge>;
    case "SHIPPED":
      return <Badge variant="info">Dalam Pengiriman</Badge>;
    case "DELIVERED":
      return <Badge variant="success">Tiba di Tujuan</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export function getStorageBadge(temp: StorageTemperature) {
  switch (temp) {
    case "AMBIENT":
      return <Badge variant="neutral">Suhu Ruang (Ambient)</Badge>;
    case "CHILLED":
      return <Badge variant="info">Dingin (Chilled 0 s.d. 4°C)</Badge>;
    case "FROZEN":
      return <Badge variant="warning">Beku (Frozen &lt; -18°C)</Badge>;
    default:
      return null;
  }
}

export function getStatusStepIndex(status: POStatus): number {
  switch (status) {
    case "ISSUED":
      return 0;
    case "PAID_TO_ESCROW":
      return 1;
    case "PROCESSING":
      return 2;
    case "SHIPPED":
      return 3;
    case "DELIVERED":
      return 4;
    default:
      return 0;
  }
}

import type { BESupplierCommodity } from "@/lib/api/types";
import type { SupplierCommodity, WholesaleUnit, CommodityPriceTier } from "@/constants/supplier";

export function mapBEToSupplierCommodity(be: BESupplierCommodity): SupplierCommodity {
  const basePrice = Number(be.base_price) || 0;
  const stock = Number(be.stock) || 0;
  const moq = Number(be.base_moq) || 1;

  const tiers: CommodityPriceTier[] = (be.price_tiers && be.price_tiers.length > 0)
    ? be.price_tiers.map((t, idx) => ({
        id: `tier-${be.id}-${idx}`,
        minQty: t.min_qty,
        maxQty: t.max_qty,
        pricePerUnit: t.tier_price,
        label: `Beli ${t.min_qty}${t.max_qty ? ` - ${t.max_qty}` : "+"} ${be.wholesale_unit}`,
      }))
    : [
        {
          id: `tier-${be.id}-0`,
          minQty: moq,
          maxQty: null,
          pricePerUnit: basePrice,
          label: `Pesanan Grosir (MOQ: ${moq} ${be.wholesale_unit})`,
        },
      ];

  return {
    id: be.id,
    sku: be.sku || "KOM-001",
    name: be.name,
    sector: "Pertanian",
    description: be.description || "Komoditas pasokan pangan grosir terverifikasi sistem KUMPUL.",
    wholesaleUnit: (be.wholesale_unit as WholesaleUnit) || "KARUNG",
    unitWeightKg: 20,
    baseMoq: moq,
    availableStock: stock,
    leadTimeDays: be.lead_time_days || 1,
    isActive: be.is_marketplace_active ?? true,
    priceTiers: tiers,
    batchTag: {
      id: (be.batch_tag?.id || (be.batch_tags && be.batch_tags[0]?.id)) || `bt-${be.id}`,
      licenseNumber:
        be.batch_tag?.is_verified || be.batch_tags?.[0]?.is_verified
          ? `BATCH-${be.sku || be.id.slice(0, 8)}`
          : "Menunggu Berkas Audit",
      verificationNotes:
        be.batch_tag?.verification_notes ||
        be.batch_tags?.[0]?.verification_notes ||
        null,
      supportingFileUrl:
        be.batch_tag?.supporting_file_url ||
        be.batch_tags?.[0]?.supporting_file_url ||
        null,
      productionDate: be.production_date || "-",
      expiryDate: be.closed_date || "-",
      storageTemperature:
        (be.batch_tag?.storage_temperature_type as StorageTemperature) ||
        (be.batch_tags?.[0]?.storage_temperature_type as StorageTemperature) ||
        "AMBIENT",
      originLocation: "Indonesia",
      hygieneStatus:
        be.batch_tag?.is_verified || be.batch_tags?.[0]?.is_verified
          ? "TERVERIFIKASI"
          : "MENUNGGU_AUDIT",
    },
    imageUrl: be.image_url || undefined,
    createdAt: be.created_at || new Date().toISOString(),
    allowsUnderMoq: be.allows_under_moq ?? false,
    underMoqPricePerKg: be.under_moq_price_per_kg ? Number(be.under_moq_price_per_kg) : null,
    productionDate: be.production_date || "-",
    expiryDate: be.closed_date || "-",
    supplierRoleId: be.supplier_role_id,
    supplierEntityId: be.supplier_entity_id,
  };
}

