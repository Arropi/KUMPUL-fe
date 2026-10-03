"use client";

import * as React from "react";
import { SupplierCommodity } from "@/constants/supplier";
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
import { formatCurrency } from "@/lib/utils";
import { Calendar, Globe2, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";

interface PublishCommodityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  commodity: SupplierCommodity;
  onPublishSuccess: (updatedCommodity: SupplierCommodity) => void;
}

export function PublishCommodityDialog({
  isOpen,
  onClose,
  commodity,
  onPublishSuccess,
}: PublishCommodityDialogProps) {
  // Tanggal produksi terisi otomatis dari data perkiraan panen / olah komoditas
  const defaultProductionDate =
    commodity.productionDate ||
    commodity.batchTag?.productionDate ||
    new Date().toISOString().split("T")[0];

  const defaultExpiryDate =
    commodity.expiryDate ||
    commodity.batchTag?.expiryDate ||
    "";

  const [productionDate, setProductionDate] = React.useState<string>(defaultProductionDate);
  const [expiryDate, setExpiryDate] = React.useState<string>(defaultExpiryDate);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Sinkronisasi form saat modal dibuka
  React.useEffect(() => {
    if (isOpen) {
      setProductionDate(
        commodity.productionDate ||
        commodity.batchTag?.productionDate ||
        new Date().toISOString().split("T")[0]
      );
      setExpiryDate(
        commodity.expiryDate ||
        commodity.batchTag?.expiryDate ||
        ""
      );
      setErrorMessage(null);
    }
  }, [isOpen, commodity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!productionDate) {
      setErrorMessage("Tanggal perkiraan produksi/panen wajib diisi.");
      return;
    }

    if (!expiryDate) {
      setErrorMessage("Tanggal akhir atau masa kadaluarsa (expired) wajib diisi.");
      return;
    }

    if (new Date(expiryDate) <= new Date(productionDate)) {
      setErrorMessage("Tanggal expired harus lebih baru dari tanggal produksi / panen.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      const updated: SupplierCommodity = {
        ...commodity,
        isActive: true,
        productionDate,
        expiryDate,
        batchTag: {
          ...commodity.batchTag,
          productionDate,
          expiryDate,
        },
      };

      toast.success(
        `Komoditas ${commodity.name} kini resmi aktif di Bursa Pasokan dan dapat dipesan oleh UMKM.`,
        "Berhasil Dipublikasikan"
      );

      onPublishSuccess(updated);
      onClose();
    }, 500);
  };

  const primaryPrice = commodity.priceTiers[0]?.pricePerUnit || 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-7">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/80">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Globe2 className="w-4 h-4" />
            </span>
            <DialogTitle className="font-heading text-lg font-bold text-text-primary">
              Publikasi ke Bursa Pasokan
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-text-secondary leading-relaxed">
            Lengkapi konfirmasi tanggal produksi dan tanggal akhir masa simpan (expired) sebelum komoditas ini dibuka untuk pemesanan UMKM.
          </DialogDescription>
        </DialogHeader>

        {/* Ringkasan Ringkas Komoditas */}
        <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border/70 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold text-text-muted">{commodity.sku}</span>
            <Badge variant="neutral" className="text-[10px]">{commodity.sector}</Badge>
          </div>
          <p className="font-heading font-bold text-sm text-text-primary">{commodity.name}</p>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50 text-[11px]">
            <div>
              <span className="text-text-muted block">Harga Pokok:</span>
              <span className="font-bold text-primary tabular-nums">
                {formatCurrency(primaryPrice)} / {commodity.wholesaleUnit}
              </span>
            </div>
            <div>
              <span className="text-text-muted block">MOQ Minimum:</span>
              <span className="font-bold text-text-primary tabular-nums">
                {commodity.baseMoq} {commodity.wholesaleUnit}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tanggal Produksi / Panen */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Tanggal Produksi / Panen</span>
              </span>
              <span className="text-[10px] font-normal text-text-muted">
                Terisi otomatis dari katalog
              </span>
            </label>
            <Input
              type="date"
              value={productionDate}
              onChange={(e) => setProductionDate(e.target.value)}
              className="h-10 text-xs font-semibold tabular-nums"
              required
            />
            <p className="text-[11px] text-text-muted">
              Diambil dari tanggal perkiraan panen/olahan saat pendaftaran komoditas.
            </p>
          </div>

          {/* Tanggal Kadaluarsa / Expired */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Tanggal Akhir / Expired (Batas Simpan)</span>
              <span className="text-destructive">*</span>
            </label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={productionDate}
              className="h-10 text-xs font-semibold tabular-nums"
              required
            />
            <p className="text-[11px] text-text-muted">
              Batas akhir ketahanan bahan pangan yang menjamin kesegaran dan higienitas bagi UMKM.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Setelah dipublikasikan, status komoditas akan langsung berubah menjadi <strong>Aktif di Bursa</strong> dan dapat ditemukan oleh mitra UMKM.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs font-semibold h-10 px-4 text-text-secondary cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="font-bold text-xs min-h-[42px] px-6 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Konfirmasi &amp; Publikasikan</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
