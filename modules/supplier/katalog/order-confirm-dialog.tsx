"use client";

import * as React from "react";
import { SupplierCommodity } from "@/constants/supplier";
import { DeliveryDetails } from "./purchase-delivery-selector";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Check, ShieldCheck } from "lucide-react";

interface OrderConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  commodity: SupplierCommodity;
  quantity: number;
  totalWeightKg: number;
  deliveryDetails: DeliveryDetails;
  totalAmount: number;
  isSubmitting: boolean;
  onConfirm: () => void;
}

export function OrderConfirmDialog({
  isOpen,
  onClose,
  commodity,
  quantity,
  totalWeightKg,
  deliveryDetails,
  totalAmount,
  isSubmitting,
  onConfirm,
}: OrderConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-3xl p-6 sm:p-7">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold text-text-primary">
            Konfirmasi Pengadaan Bahan Baku
          </DialogTitle>
          <DialogDescription className="text-xs text-text-muted">
            Periksa ringkasan pasokan dan tujuan pengiriman sebelum mengajukan ke pooling escrow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2 text-xs">
          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border space-y-2">
            <p className="font-bold text-sm text-text-primary">{commodity.name}</p>
            <div className="space-y-1 text-text-secondary text-[11px]">
              <p>
                Volume:{" "}
                <span className="font-bold text-text-primary">
                  {quantity} {commodity.wholesaleUnit}
                </span>{" "}
                ({totalWeightKg} Kg)
              </p>
              <p>
                Metode Pengiriman:{" "}
                <span className="font-bold text-text-primary">
                  {deliveryDetails.method === "HEMAT_HUB"
                    ? "Hemat Hub (Ambil di Titik Bersama)"
                    : "On Your Door (Antar ke Rumah)"}
                </span>
              </p>
              <p className="line-clamp-2">
                Alamat Tujuan:{" "}
                <span className="font-medium text-text-primary">
                  {deliveryDetails.address}
                </span>
              </p>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between">
              <span className="font-bold text-text-primary">Total Tagihan Escrow:</span>
              <span className="font-heading font-extrabold text-base text-primary tabular-nums">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-[11px]">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-700" />
            <span>
              Dana akan diamankan di escrow perbankan dan baru dicairkan setelah pemeriksaan mutu lolos.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/70">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs font-semibold h-10 px-4 text-text-secondary cursor-pointer"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            onClick={onConfirm}
            className="font-bold text-xs min-h-[42px] px-6 cursor-pointer"
          >
            <Check className="w-4 h-4 mr-1.5" />
            <span>Konfirmasi &amp; Ajukan PO</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
