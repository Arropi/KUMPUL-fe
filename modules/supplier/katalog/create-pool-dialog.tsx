"use client";

import * as React from "react";
import {
  ShoppingCart,
  Users,
  Flame,
  Calendar,
  Truck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { SupplierCommodity } from "@/constants/supplier";
import { BEBusinessEntity } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { MapPicker } from "@/components/ui/map-picker";
import { toast } from "@/components/ui/toast";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { createPoolOrDirectOrderAction } from "@/actions/pooling";
import { useRouter } from "next/navigation";
import {
  createPaymentSnapTokenAction,
  checkPaymentStatusAction,
} from "@/actions/payment";

interface CreatePoolDialogProps {
  isOpen: boolean;
  onClose: () => void;
  commodity: SupplierCommodity;
  userProfile?: BEBusinessEntity | null;
  onSuccess?: () => void;
}

export function CreatePoolDialog({
  isOpen,
  onClose,
  commodity,
  userProfile,
  onSuccess,
}: CreatePoolDialogProps) {
  const router = useRouter();
  const baseMoq = commodity.baseMoq || 1;
  const leadTimeDays = commodity.leadTimeDays || 1;

  // Tanggal produksi komoditas (batas minimal pemilihan tanggal)
  const prodDateStr = React.useMemo(() => {
    if (commodity.productionDate && commodity.productionDate !== "-") {
      return commodity.productionDate;
    }
    if (
      commodity.batchTag?.productionDate &&
      commodity.batchTag.productionDate !== "-"
    ) {
      return commodity.batchTag.productionDate;
    }
    return new Date().toISOString().slice(0, 10);
  }, [commodity.productionDate, commodity.batchTag?.productionDate]);

  // Tanggal kedaluwarsa komoditas (batas maksimal jika ada)
  const closedDateStr = React.useMemo(() => {
    if (commodity.expiryDate && commodity.expiryDate !== "-") {
      return commodity.expiryDate;
    }
    if (
      commodity.batchTag?.expiryDate &&
      commodity.batchTag.expiryDate !== "-"
    ) {
      return commodity.batchTag.expiryDate;
    }
    return undefined;
  }, [commodity.expiryDate, commodity.batchTag?.expiryDate]);

  // Tanggal default: Math.max(prodDateStr, today + leadTime + 2 days)
  const defaultDateStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + leadTimeDays + 2);
    const calculatedStr = d.toISOString().slice(0, 10);
    return calculatedStr >= prodDateStr ? calculatedStr : prodDateStr;
  }, [leadTimeDays, prodDateStr]);

  // Form State
  const [orderQty, setOrderQty] = React.useState<number>(baseMoq);
  const [deliveryMethod, setDeliveryMethod] = React.useState<
    "HEMAT_HUB" | "DIRECT_DOOR_TO_DOOR"
  >("DIRECT_DOOR_TO_DOOR");
  const [requiredDate, setRequiredDate] = React.useState<string>(defaultDateStr);
  const [isUrgentAsap, setIsUrgentAsap] = React.useState<boolean>(false);
  const [address, setAddress] = React.useState<string>(
    userProfile?.default_address || "Surabaya, Jawa Timur"
  );
  const [coords, setCoords] = React.useState<{ lat: number; lng: number }>({
    lat: Number(userProfile?.latitude) || -7.2575,
    lng: Number(userProfile?.longitude) || 112.7521,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Sync profile data saat dibuka
  React.useEffect(() => {
    if (userProfile?.default_address && (!address || address === "Surabaya, Jawa Timur")) {
      setAddress(userProfile.default_address);
    }
    if (userProfile?.latitude && userProfile?.longitude) {
      setCoords({
        lat: Number(userProfile.latitude),
        lng: Number(userProfile.longitude),
      });
    }
  }, [userProfile, address]);

  // Reset tanggal default jika prodDate berubah
  React.useEffect(() => {
    if (requiredDate < prodDateStr) {
      setRequiredDate(prodDateStr);
    }
  }, [prodDateStr, requiredDate]);

  // Apakah pesanan di bawah batas MOQ?
  const isUnderMoq = orderQty < baseMoq;
  const isMoqReached = orderQty >= baseMoq;
  const isDirectOrder = isMoqReached;

  // Jika pesanan telah memenuhi/mencapai MOQ:
  // 1. Hemat Hub tidak bisa dipilih (harus Direct Door to Door karena beli penuh sendiri)
  // 2. Mode ASAP tidak berlaku (langsung proses reguler mandiri)
  React.useEffect(() => {
    if (isMoqReached) {
      if (deliveryMethod === "HEMAT_HUB") {
        setDeliveryMethod("DIRECT_DOOR_TO_DOOR");
      }
      if (isUrgentAsap) {
        setIsUrgentAsap(false);
      }
    }
  }, [isMoqReached, deliveryMethod, isUrgentAsap]);

  // Active price tier
  const activeTier = React.useMemo(() => {
    if (!commodity.priceTiers || commodity.priceTiers.length === 0) {
      return {
        pricePerUnit: commodity.priceTiers?.[0]?.pricePerUnit || 0,
        label: "Harga Standar",
      };
    }
    for (let i = commodity.priceTiers.length - 1; i >= 0; i--) {
      const tier = commodity.priceTiers[i];
      if (orderQty >= tier.minQty) {
        return tier;
      }
    }
    return commodity.priceTiers[0];
  }, [commodity.priceTiers, orderQty]);

  const shippingFee = deliveryMethod === "HEMAT_HUB" ? 15000 : 35000;
  const subtotal = orderQty * (activeTier?.pricePerUnit || 0);
  const grandTotal = subtotal + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.trim()) {
      toast.error("Alamat pengantaran wajib ditentukan melalui peta.", "Validasi Gagal");
      return;
    }

    if (orderQty <= 0) {
      toast.error("Jumlah pesanan harus lebih besar dari 0.", "Validasi Gagal");
      return;
    }

    if (!requiredDate) {
      toast.error("Tanggal kebutuhan wajib ditentukan.", "Validasi Gagal");
      return;
    }

    if (requiredDate < prodDateStr) {
      toast.error(
        `Tanggal kebutuhan tidak boleh sebelum tanggal panen/produksi (${prodDateStr}).`,
        "Validasi Tanggal"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPoolOrDirectOrderAction({
        commodityId: commodity.id,
        orderQty,
        deliveryMethod,
        requiredDeliveryDate: requiredDate,
        isUrgentAsap,
        finalDeliveryAddress: address.trim(),
        finalDeliveryLat: coords.lat,
        finalDeliveryLng: coords.lng,
      });

      if (res.success) {
        const orderId = res.data?.order_id;
        let snapToken = res.data?.snap_token;
        let snapRedirectUrl = res.data?.snap_redirect_url;

        // Jika pesanan langsung (>= MOQ) dan belum ada snapToken, inisiasi sesi sekarang
        if (isDirectOrder && !snapToken && orderId) {
          const payInit = await createPaymentSnapTokenAction(orderId, deliveryMethod);
          if (payInit.success && payInit.snapToken) {
            snapToken = payInit.snapToken;
            snapRedirectUrl = payInit.snapRedirectUrl;
          }
        }

        toast.success(
          isDirectOrder
            ? `Pesanan langsung ${orderQty} ${commodity.wholesaleUnit} berhasil dibuat!`
            : `Kamar patungan (pool) baru untuk ${orderQty} ${commodity.wholesaleUnit} berhasil dibuka!`,
          "Pemesanan Berhasil"
        );

        // Jika direct order dan ada Snap Token, luncurkan Midtrans Snap Checkout
        if (isDirectOrder && snapToken && typeof window !== "undefined" && (window as any).snap) {
          onClose();
          if (onSuccess) onSuccess();

          (window as any).snap.pay(snapToken, {
            onSuccess: async () => {
              toast.success("Pembayaran berhasil diverifikasi!", "Transaksi Sukses");
              if (orderId) {
                await checkPaymentStatusAction(orderId);
              }
              router.push("/pesanan");
            },
            onPending: () => {
              toast.info("Menunggu pembayaran diselesaikan via Midtrans", "Instruksi Pembayaran");
              router.push("/pesanan");
            },
            onError: () => {
              toast.error("Pembayaran dibatalkan atau gagal", "Pembayaran");
              router.push("/pesanan");
            },
            onClose: () => {
              toast.info(
                "Tagihan tersimpan. Anda dapat menyelesaikan pembayaran di menu Pesanan",
                "Info Tagihan"
              );
              router.push("/pesanan");
            },
          });
          return;
        }

        if (isDirectOrder && snapRedirectUrl) {
          onClose();
          if (onSuccess) onSuccess();
          window.location.href = snapRedirectUrl;
          return;
        }

        onClose();
        if (onSuccess) onSuccess();
        if (isDirectOrder) {
          router.push("/pesanan");
        }
      } else {
        toast.error(res.message || "Gagal memproses pesanan.", "Kendala");
      }
    } catch {
      toast.error("Terjadi kendala saat menghubungi server.", "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="primary" className="text-[10px] font-bold">
                <ShoppingCart className="size-3 mr-1" />
                {isDirectOrder ? "Pesanan Langsung" : "Buka Kamar Pool Baru"}
              </Badge>
              <span className="text-[11px] text-text-muted">
                Batas MOQ: {baseMoq} {commodity.wholesaleUnit}
              </span>
            </div>
            <DialogTitle className="text-base sm:text-lg font-heading font-bold text-text-primary">
              {commodity.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              {isDirectOrder
                ? "Pemesanan memenuhi kuota minimum MOQ dan akan langsung diproses tanpa menunggu UMKM lain."
                : "Buka kamar patungan baru untuk mengumpulkan kuota bersama UMKM lain di bursa regional."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-3 text-xs">
            {/* Indikator Status Langsung vs Pooling */}
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${
                isDirectOrder
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  : "bg-blue-50/70 border-blue-200 text-blue-900"
              }`}
            >
              {isDirectOrder ? (
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Users className="size-4 text-blue-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <span className="font-bold text-xs block">
                  {isDirectOrder
                    ? "Beli Langsung (Memenuhi Batas MOQ)"
                    : `Buat Pool Baru (Patungan Menuju ${baseMoq} ${commodity.wholesaleUnit})`}
                </span>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {isDirectOrder
                    ? "Kuantitas pesanan Anda telah mencapai batas minimum produsen. Pesanan akan langsung masuk ke Purchase Order pemasok."
                    : `Jumlah pesanan Anda (${orderQty} ${commodity.wholesaleUnit}) di bawah MOQ (${baseMoq} ${commodity.wholesaleUnit}). Anda akan menjadi inisiator kamar patungan ini.`}
                </p>
              </div>
            </div>

            {/* 1. Input Kuantitas Kebutuhan */}
            <div className="space-y-1.5">
              <label className="font-bold text-text-primary flex items-center justify-between">
                <span>Jumlah Kebutuhan ({commodity.wholesaleUnit})</span>
                <span className="text-[11px] font-mono text-primary font-semibold">
                  {orderQty} &times; {formatCurrency(activeTier?.pricePerUnit || 0)}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOrderQty((prev) => Math.max(1, prev - 1))}
                  disabled={orderQty <= 1 || isSubmitting}
                  className="size-9 p-0 rounded-lg shrink-0 cursor-pointer"
                >
                  -
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={orderQty}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setOrderQty(isNaN(val) ? 1 : Math.max(1, val));
                  }}
                  disabled={isSubmitting}
                  className="h-9 text-center font-bold text-sm font-heading tabular-nums"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOrderQty((prev) => prev + 1)}
                  disabled={isSubmitting}
                  className="size-9 p-0 rounded-lg shrink-0 cursor-pointer"
                >
                  +
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setOrderQty((prev) => prev + baseMoq)}
                  disabled={isSubmitting}
                  className="h-9 px-3 text-xs font-semibold cursor-pointer"
                >
                  +{baseMoq}
                </Button>
              </div>
            </div>

            {/* 2. Target Tanggal Kebutuhan (Dibatasi mulai dari tanggal produksi) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-text-primary flex items-center gap-1">
                  <Calendar className="size-3.5 text-text-muted" />
                  Target Tanggal Kebutuhan
                </label>
                <Input
                  type="date"
                  min={prodDateStr}
                  max={closedDateStr}
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  disabled={isSubmitting}
                  className="h-9 text-xs"
                />
                <span className="text-[10px] text-text-muted block leading-tight">
                  Minimal dari tanggal panen/produksi:{" "}
                  <strong className="text-text-primary">{prodDateStr}</strong>
                  {closedDateStr ? ` s.d. ${closedDateStr}` : ""}
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-primary block">
                  Mode Pengiriman
                </label>
                <label
                  className={`flex items-start gap-2 p-2 rounded-xl border transition-all select-none ${
                    isMoqReached
                      ? "border-border bg-neutral-100/80 opacity-60 cursor-not-allowed"
                      : "border-border bg-background hover:border-primary/40 cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isUrgentAsap}
                    onChange={(e) => setIsUrgentAsap(e.target.checked)}
                    disabled={isMoqReached || isSubmitting}
                    className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary accent-emerald-600 disabled:cursor-not-allowed"
                  />
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-text-primary flex items-center gap-1">
                      <Flame className="size-3 text-amber-600" />
                      Secepatnya (ASAP)
                    </span>
                    <span className="text-[10px] text-text-muted block leading-tight">
                      {isMoqReached
                        ? "Hanya berlaku untuk patungan di bawah MOQ. Pesanan mandiri langsung diproses."
                        : "Kunci pool begitu MOQ tercapai tanpa menunggu batas tanggal kebutuhan."}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* 3. Metode Pengiriman (Hemat Hub hanya bisa jika di bawah MOQ) */}
            <div className="space-y-1.5">
              <label className="font-bold text-text-primary block">
                Metode Logistik
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Opsi Hemat Hub */}
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("HEMAT_HUB")}
                  disabled={isMoqReached || isSubmitting}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isMoqReached
                      ? "border-border bg-neutral-100/80 opacity-60 cursor-not-allowed"
                      : deliveryMethod === "HEMAT_HUB"
                      ? "border-primary bg-primary/5 ring-1 ring-primary cursor-pointer"
                      : "border-border bg-background hover:border-primary/40 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-text-primary">Hemat Hub</span>
                    <Truck className="size-3.5 text-primary" />
                  </div>
                  {isMoqReached ? (
                    <span className="text-[10px] text-neutral-500 font-medium block mt-1 leading-snug">
                      🔒 Tidak tersedia saat pesanan telah mencapai batas MOQ ({baseMoq} {commodity.wholesaleUnit}). Gunakan Direct to Door.
                    </span>
                  ) : (
                    <>
                      <span className="text-[10px] text-text-muted block mt-1 leading-tight">
                        Biaya muncul di akhir setelah kuota terpenuhi. Berpotensi lebih murah/gratis jika jadi Host, namun bisa berubah ke Direct jika dalam pool hanya Anda yang memilih Hemat Hub.
                      </span>
                      <span className="font-heading font-extrabold text-xs text-primary block mt-1">
                        Dihitung di Akhir (Rp 0 - Rp 15.000)
                      </span>
                    </>
                  )}
                </button>

                {/* Opsi Direct to Door */}
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("DIRECT_DOOR_TO_DOOR")}
                  disabled={isSubmitting}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    deliveryMethod === "DIRECT_DOOR_TO_DOOR"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-text-primary">Direct to Door</span>
                    <MapPin className="size-3.5 text-text-secondary" />
                  </div>
                  <span className="text-[10px] text-text-muted block mt-1">
                    Antar langsung ke alamat usaha Anda
                  </span>
                  <span className="font-heading font-extrabold text-xs text-text-primary block mt-1">
                    Rp 35.000
                  </span>
                </button>
              </div>
            </div>

            {/* 4. Lokasi Pengantaran (Map Picker) */}
            <div className="space-y-2">
              <label className="font-bold text-text-primary flex items-center justify-between">
                <span>Titik Lokasi Pengantaran (Peta Interaktif)</span>
                <span className="text-[10px] text-text-muted font-normal">
                  Pilih pin lokasi akurat
                </span>
              </label>

              <MapPicker
                latitude={coords.lat}
                longitude={coords.lng}
                onChange={({ lat, lng, locationName }) => {
                  setCoords({ lat, lng });
                  if (locationName) setAddress(locationName);
                }}
                className="rounded-xl overflow-hidden border border-border"
              />

              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-subtle border border-border text-xs">
                <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5 flex-1 min-w-0">
                  <span className="text-[10px] text-text-muted font-medium block">
                    Alamat Terpilih dari Peta:
                  </span>
                  <p className="font-semibold text-text-primary text-xs leading-relaxed break-words">
                    {address || "Geser pin pada peta untuk menentukan alamat pengantaran"}
                  </p>
                  <span className="text-[10px] text-text-muted font-mono block">
                    Koordinat: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </span>
                </div>
              </div>
            </div>

            {/* Ringkasan Estimasi Biaya */}
            <div className="p-3 rounded-xl bg-background border border-border space-y-1.5 text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal Bahan Pasokan:</span>
                <span className="font-semibold text-text-primary tabular-nums">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>
                  Ongkos Kirim ({deliveryMethod === "HEMAT_HUB" ? "Hemat Hub" : "Direct Door"}):
                </span>
                <span className="font-semibold text-text-primary tabular-nums">
                  {deliveryMethod === "HEMAT_HUB" ? (
                    <span className="text-primary font-bold">
                      +{formatCurrency(shippingFee)}{" "}
                      <span className="text-[10px] text-text-muted font-normal block text-right">
                        (Dihitung di akhir: Rp 0 - Rp 15.000)
                      </span>
                    </span>
                  ) : (
                    `+${formatCurrency(shippingFee)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/60 font-bold text-text-primary">
                <span>Total Estimasi Transaksi:</span>
                <span className="font-heading font-extrabold text-sm text-primary tabular-nums">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={onClose}
              className="text-xs font-semibold cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-bold cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Memproses...
                </>
              ) : isDirectOrder ? (
                "Beli Langsung Sekarang"
              ) : (
                "Buka Kamar Pool Baru"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
