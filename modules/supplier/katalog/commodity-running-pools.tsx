"use client";

import * as React from "react";
import {
  Users,
  Flame,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Truck,
  CheckCircle2,
  Building2,
  Loader2,
  Pencil,
} from "lucide-react";
import { SupplierCommodity } from "@/constants/supplier";
import {
  BEProcurementPool,
  BEPoolParticipant,
  BEBusinessEntity,
} from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { MapPicker } from "@/components/ui/map-picker";
import { PoolParticipantsMap } from "@/components/ui/pool-participants-map";
import { toast } from "@/components/ui/toast";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { joinPoolAction, getCommodityPoolsAction } from "@/actions/pooling";
import { checkPaymentStatusAction } from "@/actions/payment";
import { useMoqRealtime } from "@/lib/supabase/realtime-hooks";

interface CommodityRunningPoolsProps {
  commodity: SupplierCommodity;
  initialPools?: BEProcurementPool[];
  userProfile?: BEBusinessEntity | null;
  isBuyer?: boolean;
  currentRoleId?: string;
  onRequestCreatePool?: () => void;
}

function getCutoffCountdown(
  targetDeliveryDate?: string | null,
  cutoffDate?: string | null,
  leadTimeDays: number = 1
) {
  if (!targetDeliveryDate && !cutoffDate) return null;
  let cutoffMs: number;
  if (cutoffDate) {
    cutoffMs = new Date(`${cutoffDate}T23:59:59`).getTime();
  } else {
    const delivMs = new Date(targetDeliveryDate!).getTime();
    cutoffMs = delivMs - leadTimeDays * 86400000;
  }

  const nowMs = Date.now();
  const diffMs = cutoffMs - nowMs;

  if (diffMs <= 0) {
    return { isExpired: true, text: "Cut-off Lewat" };
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const diffMins = Math.floor((diffMs / (1000 * 60)) % 60);

  if (diffDays > 0) {
    return { isExpired: false, text: `${diffDays} hari ${diffHours} jam` };
  }
  if (diffHours > 0) {
    return { isExpired: false, text: `${diffHours} jam ${diffMins} mnt` };
  }
  return { isExpired: false, text: `${diffMins} menit` };
}

export function CommodityRunningPools({
  commodity,
  initialPools = [],
  userProfile,
  isBuyer = true,
  currentRoleId,
  onRequestCreatePool,
}: CommodityRunningPoolsProps) {
  const [pools, setPools] = React.useState<BEProcurementPool[]>(initialPools);

  const refreshPools = React.useCallback(async () => {
    try {
      const res = await getCommodityPoolsAction(commodity.id);
      if (res.success && res.data) {
        setPools(res.data);
      }
    } catch {
      // silent refresh on realtime event
    }
  }, [commodity.id]);

  useMoqRealtime(undefined, refreshPools);
  const [selectedPoolForDetail, setSelectedPoolForDetail] =
    React.useState<BEProcurementPool | null>(null);
  const [selectedPoolForJoin, setSelectedPoolForJoin] =
    React.useState<BEProcurementPool | null>(null);
  const [editingParticipant, setEditingParticipant] =
    React.useState<BEPoolParticipant | null>(null);

  // Form State untuk Join / Ubah Modal
  const [joinQty, setJoinQty] = React.useState<number>(1);
  const [joinMethod, setJoinMethod] = React.useState<
    "HEMAT_HUB" | "DIRECT_DOOR_TO_DOOR"
  >("DIRECT_DOOR_TO_DOOR");
  const [joinAddress, setJoinAddress] = React.useState<string>(
    userProfile?.default_address || "Surabaya, Jawa Timur"
  );
  const [joinCoords, setJoinCoords] = React.useState<{ lat: number; lng: number }>({
    lat: Number(userProfile?.latitude) || -7.2575,
    lng: Number(userProfile?.longitude) || 112.7521,
  });
  const [isSubmittingJoin, setIsSubmittingJoin] = React.useState(false);

  // Update default address saat profile berubah
  React.useEffect(() => {
    if (userProfile?.default_address && (!joinAddress || joinAddress === "Surabaya, Jawa Timur")) {
      setJoinAddress(userProfile.default_address);
    }
    if (userProfile?.latitude && userProfile?.longitude) {
      setJoinCoords({
        lat: Number(userProfile.latitude),
        lng: Number(userProfile.longitude),
      });
    }
  }, [userProfile, joinAddress]);

  // Buka Modal Join / Ubah
  const handleOpenJoin = (
    pool: BEProcurementPool,
    existingParticipant?: BEPoolParticipant | null
  ) => {
    setSelectedPoolForDetail(null);
    setSelectedPoolForJoin(pool);
    setEditingParticipant(existingParticipant || null);

    const targetMoq = Number(pool.target_moq) || commodity.baseMoq || 1;
    const accumulated = Number(pool.accumulated_qty) || 0;
    const shortage = Math.max(1, targetMoq - accumulated);

    if (existingParticipant) {
      setJoinQty(Number(existingParticipant.order_qty) || 1);
      setJoinMethod(
        (existingParticipant.delivery_method as any) || "HEMAT_HUB"
      );
      if (existingParticipant.final_delivery_address) {
        setJoinAddress(existingParticipant.final_delivery_address);
      }
      if (
        existingParticipant.final_delivery_lat &&
        existingParticipant.final_delivery_lng
      ) {
        setJoinCoords({
          lat: Number(existingParticipant.final_delivery_lat),
          lng: Number(existingParticipant.final_delivery_lng),
        });
      }
    } else {
      setJoinQty(Math.min(10, shortage));
      const isPoolMoqReached = accumulated >= targetMoq;
      if (isPoolMoqReached) {
        setJoinMethod("DIRECT_DOOR_TO_DOOR");
      } else {
        setJoinMethod("HEMAT_HUB");
      }

      if (userProfile?.default_address) {
        setJoinAddress(userProfile.default_address);
      }
      if (userProfile?.latitude && userProfile?.longitude) {
        setJoinCoords({
          lat: Number(userProfile.latitude),
          lng: Number(userProfile.longitude),
        });
      }
    }
  };

  // Submit Join Pool
  const handleSubmitJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoolForJoin) return;

    if (!joinAddress.trim()) {
      toast.error("Alamat pengantaran wajib ditentukan melalui peta.", "Validasi Gagal");
      return;
    }

    if (joinQty <= 0) {
      toast.error("Jumlah pesanan harus lebih besar dari 0.", "Validasi Gagal");
      return;
    }

    setIsSubmittingJoin(true);
    try {
      const res = await joinPoolAction({
        poolId: selectedPoolForJoin.id,
        commodityId: commodity.id,
        orderQty: joinQty,
        deliveryMethod: joinMethod,
        finalDeliveryAddress: joinAddress.trim(),
        finalDeliveryLat: joinCoords.lat,
        finalDeliveryLng: joinCoords.lng,
        isUrgentAsap: selectedPoolForJoin.is_asap_allowed ?? false,
      });

      if (res.success) {
        toast.success(
          editingParticipant
            ? `Kebutuhan pesanan berhasil diperbarui menjadi ${joinQty} ${commodity.wholesaleUnit}.`
            : `Berhasil bergabung ke kamar pooling dengan kuota ${joinQty} ${commodity.wholesaleUnit}.`,
          editingParticipant ? "Perubahan Disimpan" : "Bergabung Berhasil"
        );
        // Optimistic update status pool lokal
        setPools((prev) =>
          prev.map((p) => {
            if (p.id === selectedPoolForJoin.id) {
              const oldQty = editingParticipant ? Number(editingParticipant.order_qty) : 0;
              const delta = joinQty - oldQty;
              const newAccum = Math.max(0, (Number(p.accumulated_qty) || 0) + delta);
              const isMet = newAccum >= Number(p.target_moq);

              let newParticipants: BEPoolParticipant[];
              if (editingParticipant) {
                newParticipants = (p.participants || []).map((part) =>
                  part.id === editingParticipant.id
                    ? {
                        ...part,
                        order_qty: joinQty,
                        delivery_method: joinMethod,
                        final_delivery_address: joinAddress.trim(),
                        final_delivery_lat: joinCoords.lat,
                        final_delivery_lng: joinCoords.lng,
                        allocated_shipping_fee: joinMethod === "HEMAT_HUB" ? 15000 : 35000,
                      }
                    : part
                );
              } else {
                newParticipants = [
                  ...(p.participants || []),
                  {
                    id: `local-${Date.now()}`,
                    pool_id: p.id,
                    umkm_role_id: currentRoleId || "local-user",
                    order_qty: joinQty,
                    delivery_method: joinMethod,
                    final_delivery_address: joinAddress.trim(),
                    final_delivery_lat: joinCoords.lat,
                    final_delivery_lng: joinCoords.lng,
                    allocated_shipping_fee: joinMethod === "HEMAT_HUB" ? 15000 : 35000,
                    umkm_name: userProfile?.legal_name || "Usaha Anda",
                    is_urgent_asap: Boolean(p.is_asap_allowed),
                  },
                ];
              }
              return {
                ...p,
                accumulated_qty: newAccum,
                pool_status: isMet ? "LOCKED" : "AGGREGATING",
                participants: newParticipants,
              };
            }
            return p;
          })
        );
        setSelectedPoolForJoin(null);
        setEditingParticipant(null);

        const snapToken = res.data?.snap_token;
        const snapRedirectUrl = res.data?.snap_redirect_url;
        const orderId = res.data?.order_id;

        if (snapToken && typeof window !== "undefined" && (window as any).snap) {
          (window as any).snap.pay(snapToken, {
            onSuccess: async () => {
              toast.success("Pembayaran berhasil diverifikasi!", "Transaksi Sukses");
              if (orderId) {
                await checkPaymentStatusAction(orderId);
              }
              window.location.href = "/pesanan";
            },
            onPending: () => {
              toast.info("Menunggu pembayaran diselesaikan via Midtrans", "Instruksi Pembayaran");
              window.location.href = "/pesanan";
            },
            onError: () => {
              toast.error("Pembayaran dibatalkan atau gagal", "Pembayaran");
              window.location.href = "/pesanan";
            },
            onClose: () => {
              toast.info(
                "Target pool tercapai! Anda dapat melanjutkan pembayaran di menu Pesanan",
                "Menunggu Pembayaran"
              );
              window.location.href = "/pesanan";
            },
          });
          return;
        }

        if (snapRedirectUrl) {
          window.location.href = snapRedirectUrl;
          return;
        }
      } else {
        toast.error(res.message || "Gagal memproses pesanan.", "Kendala");
      }
    } catch {
      toast.error("Terjadi kendala saat menghubungi server.", "Error");
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  // Filter pool aktif yang bisa diikuti:
  // HANYA untuk kondisi DI BAWAH MOQ yang sedang mencari UMKM lain dengan kebutuhan sama.
  // Jika pembelian melebihi/mencapai MOQ (atau berstatus LOCKED), pool tidak dimunculkan di UI pooling aktif.
  const activePools = pools.filter((p) => {
    const targetMoq = Number(p.target_moq) || commodity.baseMoq || 1;
    const accumulated = Number(p.accumulated_qty) || 0;
    const isUnderMoq = accumulated < targetMoq;
    const isOpenOrAggregating = p.pool_status === "OPEN" || p.pool_status === "AGGREGATING";

    return isUnderMoq && isOpenOrAggregating;
  });

  // Status MOQ untuk pool yang sedang dibuka di modal join
  const joinPoolTargetMoq =
    Number(selectedPoolForJoin?.target_moq) || commodity.baseMoq || 1;
  const joinPoolAccumulated = Number(selectedPoolForJoin?.accumulated_qty) || 0;
  const isSelectedPoolMoqReached =
    joinPoolAccumulated >= joinPoolTargetMoq ||
    selectedPoolForJoin?.pool_status === "LOCKED";
  const isSingleOrderMoqReached = joinQty >= (commodity.baseMoq || 1);
  const isMoqReachedForJoin = isSelectedPoolMoqReached || isSingleOrderMoqReached;

  // Jika pool atau kuantitas pesanan sudah mencapai MOQ, paksa metode ke Direct Door to Door
  React.useEffect(() => {
    if (isMoqReachedForJoin && joinMethod === "HEMAT_HUB") {
      setJoinMethod("DIRECT_DOOR_TO_DOOR");
    }
  }, [isMoqReachedForJoin, joinMethod]);

  return (
    <Card className="p-5 sm:p-6 bg-surface border-border shadow-elevation-1 rounded-2xl space-y-4">
      {/* Header Card Pooling (Tanpa tombol Buat Pool Baru karena sudah ada di header atas) */}
      <div className="border-b border-border/80 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="size-4" />
          </span>
          <h2 className="font-heading font-bold text-sm sm:text-base text-text-primary">
            Pooling Aktif
          </h2>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          Gabung bersama UMKM lain untuk memenuhi kuota minimum (MOQ) dan mengunci harga grosir.
        </p>
      </div>

      {/* List Card Pool yang Sedang Berjalan */}
      {activePools.length === 0 ? (
        /* Empty State */
        <div className="py-8 px-4 text-center rounded-xl bg-background border border-dashed border-border/80 space-y-3">
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Users className="size-6" />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h3 className="font-heading font-bold text-sm text-text-primary">
              Belum Ada Pool Berjalan
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Belum ada pooling aktif untuk komoditas ini. Silakan gunakan tombol &quot;Beli / Buat Pool&quot; di atas untuk memulai pemesanan atau membuka kamar patungan pertama.
            </p>
          </div>
        </div>
      ) : (
        /* Daftar Pool Cards */
        <div className="space-y-3">
          {activePools.map((pool) => {
            const targetMoq = Number(pool.target_moq) || commodity.baseMoq || 1;
            const accumulated = Number(pool.accumulated_qty) || 0;
            const shortage = Math.max(0, targetMoq - accumulated);
            const progressPct = Math.min(
              100,
              Math.round((accumulated / targetMoq) * 100)
            );
            const isLocked = pool.pool_status === "LOCKED";
            const participants = pool.participants || [];
            const isAsap = Boolean(pool.is_asap_allowed);

            // Cek apakah user saat ini sudah tergabung di pool ini
            const myParticipant = participants.find((p) => {
              if (currentRoleId && p.umkm_role_id === currentRoleId) return true;
              if (userProfile?.legal_name && p.umkm_name === userProfile.legal_name) return true;
              if (
                userProfile?.bank_account_info?.brand_name &&
                p.umkm_name === userProfile.bank_account_info.brand_name
              )
                return true;
              return false;
            });
            const isAlreadyJoined = Boolean(myParticipant);

            // Hitung countdown cut-off (tanggal kebutuhan dikurangi lead time)
            const countdown = getCutoffCountdown(
              pool.target_delivery_date,
              pool.cutoff_date,
              commodity.leadTimeDays || 1
            );

            return (
              <div
                key={pool.id}
                className="p-4 rounded-xl border border-border bg-background hover:border-primary/40 transition-all space-y-3 shadow-xs"
              >
                {/* Baris 1 (Top Card): Tanggal Kebutuhan, Icon API Saja (Dengan Hover Tooltip), dan Countdown Cut-off */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {/* Tanggal Kebutuhan di Top Card */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary bg-surface px-2.5 py-1 rounded-md border border-border">
                      <Calendar className="size-3.5 text-primary shrink-0" />
                      <span>
                        {pool.target_delivery_date
                          ? new Date(pool.target_delivery_date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Fleksibel"}
                      </span>
                    </div>

                    {/* Cukup icon API saja dengan tooltip penjelasan saat di-hover */}
                    {isAsap && (
                      <div
                        className="inline-flex items-center justify-center size-7 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/30 cursor-help transition-transform hover:scale-105"
                        title="Mode Secepatnya (ASAP): Kamar otomatis terkunci dan langsung diteruskan ke pemasok begitu kuota MOQ terpenuhi tanpa menunggu batas tanggal kebutuhan"
                      >
                        <Flame className="size-4 fill-amber-500 text-amber-600" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isLocked ? (
                      <Badge variant="success" className="text-[10px] font-bold">
                        Terkunci (MOQ Tercapai)
                      </Badge>
                    ) : countdown ? (
                      <div
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border cursor-help ${
                          countdown.isExpired
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-900 border-amber-200"
                        }`}
                        title="Countdown cut-off persiapan supplier (tanggal kebutuhan dikurangi lead time). Jika MOQ belum terpenuhi hingga batas ini, pool otomatis dibatalkan."
                      >
                        <Clock className="size-3 text-amber-700 shrink-0" />
                        <span>Sisa {countdown.text}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Baris 2: Anggota Pool (Kuantitas Ditulis Langsung Tanpa Tanda Kurung) */}
                <div className="text-xs pt-0.5">
                  <div className="space-y-1">
                    <span className="text-[11px] text-text-muted font-medium flex items-center gap-1">
                      <Users className="size-3 text-text-muted shrink-0" />
                      Anggota ({participants.length} UMKM):
                    </span>
                    {participants.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {participants.map((p, idx) => {
                          const isMe =
                            (currentRoleId && p.umkm_role_id === currentRoleId) ||
                            (userProfile?.legal_name && p.umkm_name === userProfile.legal_name);

                          return (
                            <span
                              key={p.id || idx}
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                                isMe
                                  ? "bg-primary/5 text-primary border-primary/30"
                                  : "bg-surface text-text-primary border-border/80"
                              }`}
                              title={p.final_delivery_address}
                            >
                              <span
                                className={`size-1.5 rounded-full shrink-0 ${
                                  isMe ? "bg-primary" : "bg-emerald-500"
                                }`}
                              />
                              <span className="max-w-[120px] truncate">
                                {isMe ? "Pesanan Anda" : p.umkm_name || `UMKM #${p.umkm_role_id?.slice(0, 4)}`}
                              </span>
                              {/* Kuantitas ditulis langsung tanpa tanda kurung */}
                              <span className="font-bold text-primary tabular-nums">
                                {p.order_qty} {commodity.wholesaleUnit}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-text-muted italic">
                        Belum ada anggota terdaftar
                      </p>
                    )}
                  </div>
                </div>

                {/* Baris 3: Kekurangan MOQ & Progress Bar */}
                <div className="space-y-1.5 pt-1 border-t border-border/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-secondary">
                      {isLocked ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="size-3.5" /> Target MOQ Terpenuhi
                        </span>
                      ) : (
                        <span className="text-amber-800 font-bold">
                          Kekurangan MOQ: {formatNumber(shortage)} {commodity.wholesaleUnit}
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-text-muted tabular-nums font-mono">
                      {formatNumber(accumulated)} / {formatNumber(targetMoq)}{" "}
                      {commodity.wholesaleUnit}
                    </span>
                  </div>

                  <div className="w-full bg-neutral-200/80 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLocked ? "bg-emerald-600" : "bg-primary"
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Baris 4: Tombol Aksi Detail & Join / Ubah Pool */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/60">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPoolForDetail(pool)}
                    className="text-xs font-semibold cursor-pointer h-8 px-3"
                  >
                    Detail Kamar
                  </Button>

                  {isBuyer && (
                    isAlreadyJoined ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isLocked}
                        onClick={() => handleOpenJoin(pool, myParticipant)}
                        className="text-xs font-bold cursor-pointer h-8 px-3 border-primary/50 text-primary hover:bg-primary/5 gap-1.5 shadow-xs"
                      >
                        <Pencil className="size-3 text-primary" />
                        <span>Ubah Pool</span>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={isLocked}
                        onClick={() => handleOpenJoin(pool)}
                        className="text-xs font-bold cursor-pointer h-8 px-3 shadow-xs"
                      >
                        {isLocked ? "Kuota Penuh" : "Gabung (Join)"}
                      </Button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. DIALOG DETAIL POOL LENGKAP (POP-UP INFORMASI)          */}
      {/* ========================================================= */}
      <Dialog
        open={Boolean(selectedPoolForDetail)}
        onOpenChange={(open) => {
          if (!open) setSelectedPoolForDetail(null);
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          {selectedPoolForDetail && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {selectedPoolForDetail.is_asap_allowed ? (
                    <Badge className="bg-amber-500/10 text-amber-700 border border-amber-500/30 text-[10px] font-bold gap-1">
                      <Flame className="size-3 text-amber-600 shrink-0" />
                      Mode Secepatnya (ASAP)
                    </Badge>
                  ) : (
                    <Badge variant="neutral" className="text-[10px]">
                      Jadwal Reguler
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-base sm:text-lg font-heading font-bold text-text-primary">
                  Rincian Kamar Patungan &amp; Anggota
                </DialogTitle>
                <DialogDescription className="text-xs text-text-secondary">
                  Informasi transparansi logistik, batas waktu pooling, dan lokasi anggota yang telah bergabung.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-2 text-xs">
                {/* Kartu Ringkasan Kuota & Batas Waktu */}
                <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-background border border-border">
                  <div>
                    <span className="text-[10px] text-text-muted block">Sisa Kurang Menuju MOQ:</span>
                    <span className="font-heading font-extrabold text-sm text-primary tabular-nums block mt-0.5">
                      {Math.max(
                        0,
                        Number(selectedPoolForDetail.target_moq) -
                          Number(selectedPoolForDetail.accumulated_qty)
                      )}{" "}
                      {commodity.wholesaleUnit}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      Target: {selectedPoolForDetail.target_moq} {commodity.wholesaleUnit}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-text-muted block">Batas Waktu Pooling:</span>
                    <span className="font-bold text-xs text-text-primary tabular-nums block mt-0.5">
                      {selectedPoolForDetail.cutoff_date
                        ? new Date(selectedPoolForDetail.cutoff_date).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short", year: "numeric" }
                          )
                        : new Date(selectedPoolForDetail.expires_at).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short", year: "numeric" }
                          )}
                    </span>
                    <span className="text-[10px] text-amber-700 font-medium">
                      Cut-off persiapan supplier
                    </span>
                  </div>

                  <div className="col-span-2 pt-2 border-t border-border/60 flex items-center justify-between">
                    <span className="text-[11px] text-text-muted">Target Pengiriman:</span>
                    <span className="font-bold text-xs text-text-primary tabular-nums">
                      {selectedPoolForDetail.target_delivery_date
                        ? new Date(selectedPoolForDetail.target_delivery_date).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "long", year: "numeric" }
                          )
                        : "-"}
                    </span>
                  </div>
                </div>

                {/* Grid 2 Kolom (Setengah-Setengah / 50% - 50%): Mode ASAP di Kiri, Peta Hemat Hub di Kanan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                  {/* Kolom 1 (Kiri): Info Mode Secepatnya (ASAP) & Cut-off */}
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs flex flex-col justify-between space-y-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Flame className="size-4 text-amber-600 fill-amber-500 shrink-0" />
                        <span>
                          {selectedPoolForDetail.is_asap_allowed
                            ? "Mode Pool: Secepatnya (ASAP)"
                            : "Mode Pool: Jadwal Reguler"}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        {selectedPoolForDetail.is_asap_allowed
                          ? "Kamar ini otomatis terkunci (LOCKED) dan langsung diproses ke pemasok begitu kuota MOQ tercapai, tanpa menunggu batas tanggal kebutuhan."
                          : "Kamar ini beroperasi sesuai jadwal pengiriman reguler yang disepakati bersama."}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-amber-200/80 text-[10px] text-amber-800 font-medium">
                      Batas Cut-off Persiapan Supplier:{" "}
                      <strong className="text-amber-950 font-bold">
                        {selectedPoolForDetail.cutoff_date
                          ? new Date(selectedPoolForDetail.cutoff_date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </strong>
                    </div>
                  </div>

                  {/* Kolom 2 (Kanan): Map Titik-Titik Pengantaran Anggota Hemat Hub */}
                  <PoolParticipantsMap
                    participants={selectedPoolForDetail.participants || []}
                    wholesaleUnit={commodity.wholesaleUnit}
                    className="min-h-[160px] h-full"
                  />
                </div>

                {/* Daftar Setiap Pemesan: Metode Pemesanan & Lokasi */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-text-primary flex items-center justify-between">
                    <span>Daftar Anggota Pemesan ({selectedPoolForDetail.participants?.length || 0})</span>
                    <span className="text-[10px] text-text-muted font-normal">
                      Transparansi logistik bersama
                    </span>
                  </h4>

                  {selectedPoolForDetail.participants &&
                  selectedPoolForDetail.participants.length > 0 ? (
                    <div className="divide-y divide-border rounded-xl border border-border bg-background overflow-hidden max-h-52 overflow-y-auto custom-scrollbar">
                      {selectedPoolForDetail.participants.map((p, idx) => (
                        <div key={p.id || idx} className="p-3 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-text-primary flex items-center gap-1.5 min-w-0">
                              <Building2 className="size-3.5 text-primary shrink-0" />
                              <span className="truncate" title={p.umkm_name || `UMKM #${p.umkm_role_id?.slice(0, 6)}`}>
                                {p.umkm_name || `UMKM #${p.umkm_role_id?.slice(0, 6)}`}
                              </span>
                            </span>
                            <span className="font-mono text-xs font-bold text-primary tabular-nums shrink-0">
                              {p.order_qty} {commodity.wholesaleUnit}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-text-secondary gap-2">
                            <span className="flex items-center gap-1">
                              <Truck className="size-3 text-text-muted shrink-0" />
                              Metode:{" "}
                              <strong className="text-text-primary font-semibold">
                                {p.delivery_method === "HEMAT_HUB"
                                  ? "Hemat Hub Logistik"
                                  : "Direct Door to Door"}
                              </strong>
                            </span>
                          </div>

                          <div className="flex items-start gap-1 text-[11px] text-text-muted min-w-0">
                            <MapPin className="size-3 text-text-muted shrink-0 mt-0.5" />
                            <span className="truncate text-text-secondary font-medium" title={`Lokasi: ${p.final_delivery_address || "-"}`}>
                              Lokasi: {p.final_delivery_address || "-"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center rounded-xl bg-background border border-dashed border-border text-xs text-text-muted">
                      Belum ada pemesan lain di kamar patungan ini.
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPoolForDetail(null)}
                  className="text-xs font-semibold cursor-pointer"
                >
                  Tutup
                </Button>

                {isBuyer && selectedPoolForDetail.pool_status !== "LOCKED" && (
                  (() => {
                    const myPart = selectedPoolForDetail.participants?.find((p) => {
                      if (currentRoleId && p.umkm_role_id === currentRoleId) return true;
                      if (userProfile?.legal_name && p.umkm_name === userProfile.legal_name) return true;
                      if (
                        userProfile?.bank_account_info?.brand_name &&
                        p.umkm_name === userProfile.bank_account_info.brand_name
                      )
                        return true;
                      return false;
                    });
                    const alreadyIn = Boolean(myPart);

                    return alreadyIn ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenJoin(selectedPoolForDetail, myPart)}
                        className="text-xs font-bold cursor-pointer border-primary/50 text-primary hover:bg-primary/5 gap-1.5 shadow-xs"
                      >
                        <Pencil className="size-3.5" />
                        <span>Ubah Kebutuhan Saya</span>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenJoin(selectedPoolForDetail)}
                        className="text-xs font-bold cursor-pointer shadow-xs"
                      >
                        <span>Gabung Kamar Ini (Join)</span>
                        <ArrowRight className="size-3.5 ml-1" />
                      </Button>
                    );
                  })()
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* 2. MODAL FORM INPUT JOIN RINGKAS DENGAN MAP PICKER        */}
      {/* ========================================================= */}
      <Dialog
        open={Boolean(selectedPoolForJoin)}
        onOpenChange={(open) => {
          if (!open && !isSubmittingJoin) setSelectedPoolForJoin(null);
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          {selectedPoolForJoin && (
            <form onSubmit={handleSubmitJoin}>
              <DialogHeader>
                <div className="flex items-center gap-1.5 mb-1">
                  {editingParticipant ? (
                    <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                      Ubah Kebutuhan
                    </Badge>
                  ) : null}
                  {selectedPoolForJoin.is_asap_allowed ? (
                    <Badge className="bg-amber-500/10 text-amber-700 border border-amber-500/30 text-[10px]">
                      Mode ASAP
                    </Badge>
                  ) : null}
                </div>
                <DialogTitle className="text-base font-heading font-bold text-text-primary">
                  {editingParticipant ? "Ubah Kebutuhan Patungan (Pool)" : "Gabung Kamar Patungan"}
                </DialogTitle>
                <DialogDescription className="text-xs text-text-secondary">
                  {editingParticipant ? (
                    <>
                      Perbarui kuantitas pasokan, metode pengiriman, atau alamat pengantaran Anda untuk kamar patungan ini.
                    </>
                  ) : (
                    <>
                      {commodity.name} &bull; Sisa kurang{" "}
                      <strong className="text-primary">
                        {Math.max(
                          1,
                          Number(selectedPoolForJoin.target_moq) -
                            Number(selectedPoolForJoin.accumulated_qty)
                        )}{" "}
                        {commodity.wholesaleUnit}
                      </strong>{" "}
                      menuju MOQ.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-3 text-xs">
                {/* 1. Input Jumlah (order_qty) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-text-primary flex items-center justify-between">
                    <span>Jumlah Kebutuhan ({commodity.wholesaleUnit})</span>
                    <span className="text-[11px] text-text-muted">
                      Min. 1 {commodity.wholesaleUnit}
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setJoinQty((prev) => Math.max(1, prev - 1))}
                      disabled={joinQty <= 1 || isSubmittingJoin}
                      className="size-9 p-0 rounded-lg shrink-0 cursor-pointer"
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      value={joinQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setJoinQty(isNaN(val) ? 1 : Math.max(1, val));
                      }}
                      disabled={isSubmittingJoin}
                      className="h-9 text-center font-bold text-sm font-heading tabular-nums"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setJoinQty((prev) => prev + 1)}
                      disabled={isSubmittingJoin}
                      className="size-9 p-0 rounded-lg shrink-0 cursor-pointer"
                    >
                      +
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setJoinQty((prev) => prev + 5)}
                      disabled={isSubmittingJoin}
                      className="h-9 px-2.5 text-xs font-semibold cursor-pointer"
                    >
                      +5
                    </Button>
                  </div>
                </div>

                {/* 2. Metode Pengiriman (Hemat Hub hanya bisa jika di bawah MOQ) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-text-primary block">
                    Metode Pengiriman
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Opsi Hemat Hub */}
                    <button
                      type="button"
                      onClick={() => setJoinMethod("HEMAT_HUB")}
                      disabled={isMoqReachedForJoin || isSubmittingJoin}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isMoqReachedForJoin
                          ? "border-border bg-neutral-100/80 opacity-60 cursor-not-allowed"
                          : joinMethod === "HEMAT_HUB"
                          ? "border-primary bg-primary/5 ring-1 ring-primary cursor-pointer"
                          : "border-border bg-background hover:border-primary/40 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-text-primary">Hemat Hub</span>
                        <Truck className="size-3.5 text-primary" />
                      </div>
                      {isMoqReachedForJoin ? (
                        <span className="text-[10px] text-neutral-500 font-medium block mt-1 leading-snug">
                          🔒 Tidak tersedia untuk pesanan yang telah mencapai batas MOQ ({commodity.baseMoq || 1} {commodity.wholesaleUnit}). Gunakan Direct to Door.
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
                      onClick={() => setJoinMethod("DIRECT_DOOR_TO_DOOR")}
                      disabled={isSubmittingJoin}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        joinMethod === "DIRECT_DOOR_TO_DOOR"
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

                {/* 3. Lokasi Pengantaran (Map Picker) */}
                <div className="space-y-2">
                  <label className="font-bold text-text-primary flex items-center justify-between">
                    <span>Titik Lokasi Pengantaran (Peta Interaktif)</span>
                    <span className="text-[10px] text-text-muted font-normal">
                      Pilih pin lokasi akurat
                    </span>
                  </label>

                  <MapPicker
                    latitude={joinCoords.lat}
                    longitude={joinCoords.lng}
                    onChange={({ lat, lng, locationName }) => {
                      setJoinCoords({ lat, lng });
                      if (locationName) setJoinAddress(locationName);
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
                        {joinAddress || "Geser pin pada peta untuk menentukan alamat pengantaran"}
                      </p>
                      <span className="text-[10px] text-text-muted font-mono block">
                        Koordinat: {joinCoords.lat.toFixed(5)}, {joinCoords.lng.toFixed(5)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ringkasan Estimasi Biaya */}
                <div className="p-3 rounded-xl bg-background border border-border space-y-1.5 text-xs">
                  <div className="flex justify-between text-text-secondary">
                    <span>Bahan ({joinQty} {commodity.wholesaleUnit}):</span>
                    <span className="font-semibold text-text-primary tabular-nums">
                      {formatCurrency(
                        joinQty *
                          (Number(selectedPoolForJoin.locked_tier_price) ||
                            commodity.priceTiers[0]?.pricePerUnit ||
                            0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Ongkir ({joinMethod === "HEMAT_HUB" ? "Hemat Hub" : "Direct Door"}):</span>
                    <span className="font-semibold text-text-primary tabular-nums">
                      {joinMethod === "HEMAT_HUB" ? (
                        <span className="text-primary font-bold">
                          Rp 15.000{" "}
                          <span className="text-[10px] text-text-muted font-normal block text-right">
                            (Dihitung di akhir: Rp 0 - Rp 15.000)
                          </span>
                        </span>
                      ) : (
                        "Rp 35.000"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border/60 font-bold text-text-primary">
                    <span>Total Estimasi:</span>
                    <span className="font-heading font-extrabold text-sm text-primary tabular-nums">
                      {formatCurrency(
                        joinQty *
                          (Number(selectedPoolForJoin.locked_tier_price) ||
                            commodity.priceTiers[0]?.pricePerUnit ||
                            0) +
                          (joinMethod === "HEMAT_HUB" ? 15000 : 35000)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmittingJoin}
                  onClick={() => setSelectedPoolForJoin(null)}
                  className="text-xs font-semibold cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingJoin}
                  className="text-xs font-bold cursor-pointer shadow-xs"
                >
                  {isSubmittingJoin ? (
                    <>
                      <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                      Memproses...
                    </>
                  ) : editingParticipant ? (
                    "Simpan Perubahan Kebutuhan"
                  ) : (
                    "Konfirmasi & Gabung Pool"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
