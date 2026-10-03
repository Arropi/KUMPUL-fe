"use client";

import * as React from "react";
import { SupplierCommodity } from "@/constants/supplier";
import { DeliveryDetails } from "./purchase-delivery-selector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Check, ShieldCheck } from "lucide-react";

interface PurchaseConfirmStepProps {
  commodity: SupplierCommodity;
  quantity: number;
  totalWeightKg: number;
  pricePerUnit: number;
  deliveryDetails: DeliveryDetails;
  subtotalGoods: number;
  underMoqSurcharge: number;
  shippingFee: number;
  totalAmount: number;
  isUnderMoq: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

export function PurchaseConfirmStep({
  commodity,
  quantity,
  totalWeightKg,
  pricePerUnit,
  deliveryDetails,
  subtotalGoods,
  underMoqSurcharge,
  shippingFee,
  totalAmount,
  isUnderMoq,
  isSubmitting,
  onBack,
  onConfirm,
}: PurchaseConfirmStepProps) {
  return (
    <div className="space-y-4 pt-1">
      <div className="p-4 rounded-2xl bg-surface-subtle border border-border/80 space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <span className="font-bold text-sm text-text-primary">{commodity.name}</span>
          <Badge variant="neutral" className="text-[10px]">
            {commodity.sector}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-text-secondary text-[11px]">
          <div>
            <span className="text-text-muted block">Jumlah Kuota:</span>
            <span className="font-bold text-text-primary tabular-nums">
              {quantity} {commodity.wholesaleUnit} ({totalWeightKg} Kg)
            </span>
          </div>
          <div>
            <span className="text-text-muted block">Harga Satuan:</span>
            <span className="font-bold text-text-primary tabular-nums">
              {formatCurrency(pricePerUnit)}
            </span>
          </div>
          <div className="col-span-2 pt-1 border-t border-border/50">
            <span className="text-text-muted block">Metode Pengiriman:</span>
            <span className="font-bold text-text-primary">
              {deliveryDetails.method === "HEMAT_HUB"
                ? "Hemat Hub (Ambil di Titik Bersama)"
                : "On Your Door (Antar ke Rumah)"}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-text-muted block">Alamat Tujuan:</span>
            <span className="font-medium text-text-primary line-clamp-2">
              {deliveryDetails.address}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-border/60 space-y-1.5">
          <div className="flex items-center justify-between text-text-secondary">
            <span>Subtotal Bahan:</span>
            <span className="font-semibold text-text-primary tabular-nums">
              {formatCurrency(subtotalGoods)}
            </span>
          </div>
          {isUnderMoq && (
            <div className="flex items-center justify-between text-amber-800">
              <span>Surcharge di Bawah MOQ:</span>
              <span className="font-semibold tabular-nums">
                +{formatCurrency(underMoqSurcharge)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-text-secondary">
            <span>Ongkos Kirim:</span>
            <span className="font-semibold text-text-primary tabular-nums">
              +{formatCurrency(shippingFee)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border/60">
            <span className="font-bold text-text-primary text-sm">Total Tagihan Escrow:</span>
            <span className="font-heading font-extrabold text-base text-primary tabular-nums">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-[11px]">
        <ShieldCheck className="w-4 h-4 shrink-0 text-amber-700" />
        <span>
          Dana diamankan di escrow perbankan dan baru dicairkan setelah pemeriksaan mutu lolos.
        </span>
      </div>

      <div className="flex items-center gap-2.5 pt-2">
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={isSubmitting}
          onClick={onBack}
          className="flex-1 font-semibold text-xs min-h-[44px] cursor-pointer"
        >
          &larr; Kembali Ubah
        </Button>
        <Button
          type="button"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          onClick={onConfirm}
          className="flex-1 font-bold text-xs min-h-[44px] cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>Konfirmasi &amp; Bayar PO</span>
        </Button>
      </div>
    </div>
  );
}
