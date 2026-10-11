"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { buyWasteListingAction } from "@/actions/waste";
import { SupplierCommodity } from "@/constants/supplier";
import { Recycle, Calendar, Scale, ShieldCheck, MapPin, Building2 } from "lucide-react";

interface BuyWasteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  wasteItem: SupplierCommodity;
  onSuccess: () => void;
}

export function BuyWasteDialog({
  isOpen,
  onClose,
  wasteItem,
  onSuccess,
}: BuyWasteDialogProps) {
  const pricePerKg = wasteItem.priceTiers[0]?.pricePerUnit || 0;
  const maxWeight = Math.max(1, wasteItem.availableStock);

  const [purchasedWeight, setPurchasedWeight] = React.useState<number>(() =>
    Math.min(10, maxWeight)
  );

  const [pickupDate, setPickupDate] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });

  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  // Sync weight default saat modal dibuka
  React.useEffect(() => {
    if (isOpen) {
      setPurchasedWeight(Math.min(10, maxWeight));
    }
  }, [isOpen, maxWeight]);

  const totalAmount = Math.round(purchasedWeight * pricePerKg);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (purchasedWeight <= 0) {
      toast.error("Bobot pembelian harus lebih dari 0 kg.");
      return;
    }

    if (purchasedWeight > maxWeight) {
      toast.error(`Bobot pembelian tidak boleh melebihi stok tersedia (${maxWeight} kg).`);
      return;
    }

    if (!pickupDate) {
      toast.error("Tentukan tanggal estimasi penjemputan residu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await buyWasteListingAction(
        wasteItem.id,
        purchasedWeight,
        pickupDate
      );

      if (res.success) {
        const snapToken = res.data?.snap_token;
        const snapRedirectUrl = res.data?.snap_redirect_url;
        const pickupCode = res.data?.pickup_code;

        if (snapToken && typeof window !== "undefined" && (window as any).snap) {
          (window as any).snap.pay(snapToken, {
            onSuccess: () => {
              toast.success(
                "Pembayaran limbah berhasil diproses!",
                pickupCode ? `Kode Pickup Anda: ${pickupCode}` : undefined
              );
              onSuccess();
              onClose();
            },
            onPending: () => {
              toast.info(
                "Pembayaran menunggu penyelesaian. Silakan cek menu Pesanan.",
                pickupCode ? `Kode Pickup: ${pickupCode}` : undefined
              );
              onSuccess();
              onClose();
            },
            onError: () => {
              toast.error("Pembayaran gagal diproses. Anda dapat mencoba lagi di menu Pesanan.");
              onSuccess();
              onClose();
            },
            onClose: () => {
              toast.info(
                "Jendela pembayaran ditutup. Pembayaran dapat dilanjutkan di menu Pesanan.",
                pickupCode ? `Kode Pickup: ${pickupCode}` : undefined
              );
              onSuccess();
              onClose();
            },
          });
          return;
        }

        if (snapRedirectUrl) {
          window.location.href = snapRedirectUrl;
          return;
        }

        toast.success(
          res.message || "Pesanan limbah sirkular berhasil diproses!",
          pickupCode ? `Kode Pickup Anda: ${pickupCode}` : undefined
        );
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || "Gagal melakukan pembelian residu limbah.");
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Terjadi kendala saat menghubungkan ke server."
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg w-full !p-0 !overflow-hidden flex flex-col rounded-3xl bg-surface border border-border shadow-2xl">
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-border/80 bg-surface shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-500/15 text-emerald-800">
              <Recycle className="w-4 h-4 text-emerald-700" />
            </span>
            <Badge variant="waste" className="text-[10px] font-bold">
              Bursa Sirkular P2P &bull; Tanpa Batas MOQ
            </Badge>
          </div>
          <DialogTitle className="font-heading text-lg font-bold text-text-primary mt-1.5 leading-snug">
            Beli Residu Limbah Sirkular
          </DialogTitle>
          <DialogDescription className="text-xs text-text-secondary mt-0.5">
            Beli langsung sisa olahan dapur UMKM per kilogram untuk bahan baku alternatif atau offtaker sirkular.
          </DialogDescription>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="p-6 space-y-4.5 overflow-y-auto max-h-[70vh]">
            {/* Info Kartu Residu */}
            <div className="p-4 rounded-2xl bg-surface-subtle/80 border border-border/80 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-heading font-bold text-sm text-text-primary line-clamp-1" title={wasteItem.name}>
                    {wasteItem.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-text-secondary mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <span className="truncate">{wasteItem.sellerName || "Mitra UMKM"}</span>
                    <span>&bull;</span>
                    <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <span className="truncate">{wasteItem.sellerCity}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-text-muted block font-medium">Harga Satuan</span>
                  <span className="font-heading font-extrabold text-sm text-emerald-800">
                    {formatCurrency(pricePerKg)}
                  </span>
                  <span className="text-[10px] text-text-muted"> / kg</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-text-muted">Total Stok Tersedia:</span>
                <span className="font-bold text-text-primary tabular-nums">
                  {formatNumber(wasteItem.availableStock)} kg
                </span>
              </div>
            </div>

            {/* Input Volume Pembelian */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-primary" />
                  <span>Jumlah Bobot yang Dibeli (Kg)</span>
                </span>
                <span className="text-[10px] text-text-muted font-normal">
                  Maks: {maxWeight} kg
                </span>
              </label>

              <div className="relative">
                <Input
                  type="number"
                  min={1}
                  max={maxWeight}
                  step={1}
                  required
                  value={purchasedWeight}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setPurchasedWeight(isNaN(val) ? 0 : val);
                  }}
                  className="w-full h-11 text-sm font-bold rounded-xl pr-12 tabular-nums"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted">
                  Kg
                </span>
              </div>

              {/* Quick weight shortcuts */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-text-muted mr-1">Pilihan Cepat:</span>
                {[5, 10, 25].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    disabled={qty > maxWeight}
                    onClick={() => setPurchasedWeight(Math.min(qty, maxWeight))}
                    className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-surface-subtle border border-border/80 hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    +{qty} kg
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPurchasedWeight(maxWeight)}
                  className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  Semua ({maxWeight} kg)
                </button>
              </div>
            </div>

            {/* Input Tanggal Penjemputan Langsung */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>Rencana Tanggal Penjemputan / Pickup</span>
                </span>
                <span className="text-[10px] text-text-muted font-normal">
                  Sesuai kesepakatan
                </span>
              </label>
              <Input
                type="date"
                required
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full h-10 text-xs rounded-xl"
              />
            </div>

            {/* Ringkasan Total Pembayaran & Escrow Notice */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-900">
                  Total Estimasi Pembayaran
                </span>
                <span className="font-heading font-extrabold text-base sm:text-lg text-emerald-800 tabular-nums">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800/80 leading-relaxed flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Dana diamankan sistem Escrow KUMPUL dan baru diteruskan ke penjual setelah kode pickup diverifikasi saat serah terima.
                </span>
              </p>
            </div>
          </div>

          {/* Footer Aksi */}
          <div className="p-4 sm:px-6 bg-surface-subtle border-t border-border/80 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || purchasedWeight <= 0 || purchasedWeight > maxWeight}
              className="rounded-xl text-xs font-bold min-w-32 bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
            >
              {isSubmitting ? "Memproses..." : "Konfirmasi Pembelian"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
