"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Plus,
  Minus,
  ArrowRight,
  X,
  Info,
} from "lucide-react";
import { SupplierCommodity } from "@/constants/supplier";
import { MOCK_UMKM_PROFILE } from "@/constants/umkm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  PurchaseDeliverySelector,
  DeliveryDetails,
  DELIVERY_METHOD_CONFIG,
} from "./purchase-delivery-selector";
import { PurchaseConfirmStep } from "./purchase-confirm-step";

interface UmkmPurchaseCardProps {
  commodity: SupplierCommodity;
  onClose?: () => void;
}

export function UmkmPurchaseCard({ commodity, onClose }: UmkmPurchaseCardProps) {
  const router = useRouter();

  const baseMoq = commodity.baseMoq || 1;

  // Step 1: form konfigurasi, Step 2: konfirmasi transaksi
  const [currentStep, setCurrentStep] = React.useState<"form" | "confirm">("form");

  // Default quantity: MOQ
  const [quantity, setQuantity] = React.useState<number>(baseMoq);

  // State rincian pengiriman & titik lokasi map
  const [deliveryDetails, setDeliveryDetails] = React.useState<DeliveryDetails>({
    address: `${MOCK_UMKM_PROFILE.address}, ${MOCK_UMKM_PROFILE.city}`,
    coordinates: {
      lat: MOCK_UMKM_PROFILE.coordinates.lat,
      lng: MOCK_UMKM_PROFILE.coordinates.lng,
      locationName: MOCK_UMKM_PROFILE.name,
    },
    method: "HEMAT_HUB",
    deliveryFee: DELIVERY_METHOD_CONFIG.HEMAT_HUB.fee,
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const minAllowedQty = baseMoq;
  // Menentukan active price tier
  const activeTier = React.useMemo(() => {
    if (!commodity.priceTiers || commodity.priceTiers.length === 0) {
      return { pricePerUnit: 0, label: "Harga Standar" };
    }
    for (let i = commodity.priceTiers.length - 1; i >= 0; i--) {
      const tier = commodity.priceTiers[i];
      if (quantity >= tier.minQty) {
        return tier;
      }
    }
    return commodity.priceTiers[0];
  }, [commodity.priceTiers, quantity]);

  const totalWeightKg = (commodity.unitWeightKg || 1) * quantity;
  const subtotalGoods = quantity * activeTier.pricePerUnit;
  const shippingFee = deliveryDetails.deliveryFee;
  const totalAmount = subtotalGoods + shippingFee;
  const estimatedSavings = Math.max(0, Math.round(subtotalGoods * 0.1));

  const handleAdjustQty = (delta: number) => {
    setQuantity((prev) => Math.max(minAllowedQty, prev + delta));
  };

  const handleManualQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) {
      setQuantity(minAllowedQty);
    } else {
      setQuantity(Math.max(minAllowedQty, val));
    }
  };

  const isSubmitDisabled = quantity < baseMoq;
  const handleConfirmOrder = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success(
        `Pesanan ${quantity} ${commodity.wholesaleUnit} ${commodity.name} berhasil diajukan ke pooling escrow.`,
        "Pemesanan Berhasil Diajukan"
      );
      if (onClose) onClose();
      router.push("/pesanan");
    }, 700);
  };

  return (
    <Card className="p-5 sm:p-6 bg-surface border-primary/30 shadow-elevation-2 rounded-3xl space-y-5">
      <div className="border-b border-border/80 pb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="primary" className="text-[11px] font-bold">
              <ShoppingCart className="w-3 h-3 mr-1" />
              <span>
                {currentStep === "confirm" ? "Konfirmasi Transaksi" : "Pemesanan Pasokan"}
              </span>
            </Badge>
            <span className="text-[11px] text-text-muted font-medium">
              Batas MOQ: {commodity.baseMoq} {commodity.wholesaleUnit}
            </span>
          </div>
          <h2 className="font-heading font-bold text-base sm:text-lg text-text-primary">
            {commodity.name}
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {currentStep === "confirm"
              ? "Periksa ringkasan pesanan dan alokasi logistik Anda sebelum diajukan ke pooling escrow."
              : "Tentukan kuota kebutuhan bahan baku, alamat pengiriman, dan metode logistik terbaik untuk usaha Anda."}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-neutral-100 transition-colors shrink-0"
            aria-label="Tutup formulir pembelian"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {currentStep === "confirm" ? (
        <PurchaseConfirmStep
          commodity={commodity}
          quantity={quantity}
          totalWeightKg={totalWeightKg}
          pricePerUnit={activeTier.pricePerUnit}
          deliveryDetails={deliveryDetails}
          subtotalGoods={subtotalGoods}
          shippingFee={shippingFee}
          totalAmount={totalAmount}
          isSubmitting={isSubmitting}
          onBack={() => setCurrentStep("form")}
          onConfirm={handleConfirmOrder}
        />
      ) : (
        <>
          {/* Jumlah Kuota Pesanan (Quantity Input & Stepper) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary flex items-center justify-between">
              <span>Jumlah Kebutuhan ({commodity.wholesaleUnit})</span>
              <span className="text-[11px] font-mono text-primary font-semibold">
                &asymp; {formatNumber(totalWeightKg)} Kg Bobot
              </span>
            </label>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAdjustQty(-1)}
                disabled={quantity <= minAllowedQty}
                className="w-10 h-10 p-0 rounded-xl shrink-0 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </Button>

              <Input
                type="number"
                min={minAllowedQty}
                value={quantity}
                onChange={handleManualQtyChange}
                className="h-10 text-center font-bold text-base font-heading tabular-nums"
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAdjustQty(1)}
                className="w-10 h-10 p-0 rounded-xl shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleAdjustQty(5)}
                className="h-10 px-3 text-xs font-bold shrink-0 cursor-pointer"
              >
                +5
              </Button>
            </div>
            <p className="text-[11px] text-text-muted flex items-center gap-1.5 pt-0.5">
              <Info className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span>Pemasok mewajibkan pemesanan minimal sebesar {commodity.baseMoq} {commodity.wholesaleUnit}.</span>
            </p>
          </div>

          {/* Tier Harga Aktif */}
          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary font-medium">Harga Satuan Terkunci:</span>
              <Badge variant="success" className="text-[10px] font-bold">
                {activeTier.label || "Tier Pasokan"}
              </Badge>
            </div>
            <div className="flex items-baseline gap-1.5 pt-0.5">
              <span className="text-lg font-bold font-heading text-primary tabular-nums">
                {formatCurrency(activeTier.pricePerUnit)}
              </span>
              <span className="text-xs text-text-muted">/ {commodity.wholesaleUnit}</span>
            </div>
          </div>

          {/* Delivery Selector (Alamat, Map Picker, & HEMAT_HUB vs ON_YOUR_DOOR) */}
          <PurchaseDeliverySelector
            value={deliveryDetails}
            onChange={setDeliveryDetails}
          />

          {/* Ringkasan Biaya Lengkap */}
          <div className="pt-2 border-t border-border/70 space-y-2 text-xs">
            <div className="flex items-center justify-between text-text-secondary">
              <span>Subtotal Bahan Pasokan:</span>
              <span className="font-semibold text-text-primary tabular-nums">
                {formatCurrency(subtotalGoods)}
              </span>
            </div>


            <div className="flex items-center justify-between text-text-secondary">
              <span>
                Ongkos Kirim ({deliveryDetails.method === "HEMAT_HUB" ? "Hemat Hub" : "On Your Door"}):
              </span>
              <span className="font-semibold text-text-primary tabular-nums">
                +{formatCurrency(shippingFee)}
              </span>
            </div>

            {estimatedSavings > 0 && (
              <div className="flex items-center justify-between text-emerald-700 bg-emerald-500/10 p-2 rounded-lg font-semibold">
                <span>Estimasi Penghematan Grosir:</span>
                <span className="tabular-nums font-bold">-{formatCurrency(estimatedSavings)}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-border/60">
              <span className="font-bold text-text-primary text-sm">Total Estimasi Escrow:</span>
              <span className="font-heading font-extrabold text-base text-primary tabular-nums">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* Tombol Ajukan Pemesanan */}
          <div className="space-y-1.5">
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={isSubmitDisabled}
              onClick={() => setCurrentStep("confirm")}
              className="w-full font-bold text-xs sm:text-sm min-h-[44px] shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Lanjutkan ke Konfirmasi PO</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

          </div>
        </>
      )}
    </Card>
  );
}
