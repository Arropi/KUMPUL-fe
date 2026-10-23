"use client";

import * as React from "react";
import Link from "next/link";
import { ConsolidatedPO } from "@/constants/supplier";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Truck,
  CheckCircle2,
  Package,
  SearchX,
  Store,
  LayoutDashboard,
  Sparkles,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getOrderStatusBadge } from "./helpers";
import {
  getSupplierPosAction,
  shipSupplierPoAction,
  updateSupplierPoStatusAction,
} from "@/actions/orders";
import { uploadFileAction } from "@/actions/upload";

export function SupplierPesananView() {
  const [orders, setOrders] = React.useState<ConsolidatedPO[]>([]);
  const [loadingOrders, setLoadingOrders] = React.useState<boolean>(true);
  const [errorOrders, setErrorOrders] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modal Kirim Pesanan
  const [shippingPo, setShippingPo] = React.useState<ConsolidatedPO | null>(null);
  const [driverNameInput, setDriverNameInput] = React.useState("");
  const [trackingNumberInput, setTrackingNumberInput] = React.useState("");
  const [deliveryProofFile, setDeliveryProofFile] = React.useState<File | null>(null);
  const [deliveryProofPreview, setDeliveryProofPreview] = React.useState<string | null>(null);
  const [isSubmittingShip, setIsSubmittingShip] = React.useState(false);
  const [updatingPoId, setUpdatingPoId] = React.useState<string | null>(null);

  const loadOrders = React.useCallback(async () => {
    setLoadingOrders(true);
    setErrorOrders(null);
    try {
      const res = await getSupplierPosAction();
      if (res.success) {
        const safeOrders = (res.data ?? []).map((o) => ({
          ...o,
          participants: Array.isArray(o.participants) ? o.participants : [],
          lockedTierPrice:
            o.lockedTierPrice ??
            (o.totalQuantity > 0 ? Math.round(o.grandTotalAmount / o.totalQuantity) : 0),
        }));
        setOrders(safeOrders);
      } else {
        setOrders([]);
        setErrorOrders(res.message ?? "Gagal memuat daftar pesanan");
      }
    } catch (err) {
      console.error(err);
      setOrders([]);
      setErrorOrders("Gagal memuat daftar pesanan");
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  React.useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleOpenShipModal = (po: ConsolidatedPO) => {
    setShippingPo(po);
    setDriverNameInput(po.driverName || "");
    setTrackingNumberInput(po.trackingNumber || "");
    setDeliveryProofFile(null);
    setDeliveryProofPreview(po.deliveryProofUrl || null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDeliveryProofFile(file);
      const url = URL.createObjectURL(file);
      setDeliveryProofPreview(url);
    }
  };

  const handleSubmitShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingPo) return;

    if (!driverNameInput.trim()) {
      toast.error("Nama pengemudi / armada wajib diisi", "Validasi Gagal");
      return;
    }
    if (!trackingNumberInput.trim()) {
      toast.error("Nomor resi / plat nomor armada wajib diisi", "Validasi Gagal");
      return;
    }

    setIsSubmittingShip(true);
    try {
      let finalProofUrl = shippingPo.deliveryProofUrl || null;

      if (deliveryProofFile) {
        try {
          const formData = new FormData();
          formData.append("file", deliveryProofFile);
          formData.append("folder", "surat-jalan");
          const uploadRes = await uploadFileAction(formData);
          if (uploadRes.success && uploadRes.url) {
            finalProofUrl = uploadRes.url;
          } else {
            console.warn("Upload proof error:", uploadRes.message);
          }
        } catch (uploadErr) {
          console.warn("Upload proof error:", uploadErr);
        }
      }

      const shipRes = await shipSupplierPoAction(shippingPo.id, {
        driver_name: driverNameInput.trim(),
        tracking_number: trackingNumberInput.trim(),
        delivery_proof_url: finalProofUrl,
      });

      if (shipRes.success) {
        toast.success(
          "Pesanan berhasil dikirim dan armada sedang dalam perjalanan",
          "Pengiriman Dimulai"
        );
        setShippingPo(null);
        await loadOrders();
      } else {
        toast.error(shipRes.message || "Gagal memperbarui status pengiriman", "Gagal");
      }
    } catch (err: any) {
      toast.error(err?.message || "Terjadi kesalahan saat memproses pengiriman", "Gagal");
    } finally {
      setIsSubmittingShip(false);
    }
  };

  const handleMarkDelivered = async (poId: string) => {
    setUpdatingPoId(poId);
    try {
      const res = await updateSupplierPoStatusAction(poId, "DELIVERED");
      if (res.success) {
        toast.success("Pesanan telah ditandai tiba di titik tujuan", "Pengiriman Tuntas");
        await loadOrders();
      } else {
        toast.error(res.message || "Gagal mengubah status pesanan", "Gagal");
      }
    } catch (err: any) {
      toast.error(err?.message || "Terjadi kesalahan saat memperbarui status", "Gagal");
    } finally {
      setUpdatingPoId(null);
    }
  };

  const filteredOrders = orders.filter((po) => {
    const poNum = po.poNumber || "";
    const comName = po.commodityName || "";
    const hubName = po.hubName || "";
    const q = searchQuery.toLowerCase();

    const matchSearch =
      poNum.toLowerCase().includes(q) ||
      comName.toLowerCase().includes(q) ||
      hubName.toLowerCase().includes(q);

    const matchTab =
      activeTab === "ALL" ||
      (activeTab === "ACTION_NEEDED" &&
        (po.status === "PAID_TO_ESCROW" || po.status === "ISSUED" || (po.status as string) === "PROCESSING")) ||
      (activeTab === "IN_TRANSIT" && po.status === "SHIPPED") ||
      (activeTab === "DELIVERED" && po.status === "DELIVERED");

    return matchSearch && matchTab;
  });

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary text-balance">
            Pesanan Terpadu (Consolidated PO)
          </h1>
          <p className="font-body text-xs sm:text-sm text-text-secondary mt-1 text-pretty">
            Daftar pesanan grosir dari hasil agregasi pooling UMKM yang telah mengunci tier diskon kuota (PRD Modul A.1).
          </p>
        </div>
      </div>

      {/* Tab Filter Status & Pencarian */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-background rounded-xl border border-border overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-surface text-primary shadow-[inset_0_1px_0_#FFFFFF,inset_0_-1px_0_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.06)] font-bold border border-border"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-[0.5px]"
              }`}
            >
              Semua Pesanan {loadingOrders ? '(memuat...)' : `(${orders.length})`}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ACTION_NEEDED")}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                activeTab === "ACTION_NEEDED"
                  ? "bg-surface text-primary shadow-[inset_0_1px_0_#FFFFFF,inset_0_-1px_0_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.06)] font-bold border border-border"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-[0.5px]"
              }`}
            >
              Perlu Dikemas / Kirim
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("IN_TRANSIT")}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                activeTab === "IN_TRANSIT"
                  ? "bg-surface text-primary shadow-[inset_0_1px_0_#FFFFFF,inset_0_-1px_0_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.06)] font-bold border border-border"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-[0.5px]"
              }`}
            >
              Dalam Pengiriman
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("DELIVERED")}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                activeTab === "DELIVERED"
                  ? "bg-surface text-primary shadow-[inset_0_1px_0_#FFFFFF,inset_0_-1px_0_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.06)] font-bold border border-border"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-[0.5px]"
              }`}
            >
              Selesai / Tiba
            </button>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-72">
            <Input
              id="search-po"
              placeholder="Cari No. PO, Komoditas, Hub..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftElement={<Search className="w-4 h-4" />}
              className="min-h-[44px]"
            />
          </div>
        </div>
      </Card>

      {/* Konten Daftar Pesanan: Table View untuk Desktop & Card View untuk Mobile */}
      {loadingOrders ? (
        <div className="space-y-4">
          {/* Desktop Table Skeleton */}
          <div className="hidden lg:block bg-surface rounded-2xl border border-border shadow-elevation-1 overflow-hidden p-5">
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border/70 last:border-b-0 gap-4">
                  <div className="space-y-1.5 w-[160px]">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-5 w-20 rounded-md" />
                  </div>
                  <div className="space-y-1.5 flex-1 max-w-[200px]">
                    <Skeleton className="h-4 w-36 rounded-md" />
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-40 rounded-md" />
                    <Skeleton className="h-3 w-28 rounded-md" />
                  </div>
                  <div className="space-y-1 w-[120px] text-right">
                    <Skeleton className="h-4 w-20 rounded-md ml-auto" />
                  </div>
                  <div className="space-y-1 w-[120px] text-right">
                    <Skeleton className="h-4 w-24 rounded-md ml-auto" />
                  </div>
                  <div className="w-[120px] flex justify-end">
                    <Skeleton className="h-8 w-24 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Mobile Card Skeleton */}
          <div className="lg:hidden space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface rounded-2xl border border-border shadow-elevation-1 p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-5 w-20 rounded-md" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-5 w-40 rounded-md" />
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                </div>
                <div className="p-3 rounded-xl bg-surface-subtle/80 border border-border/80 flex justify-between">
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-4 w-28 rounded-md" />
                </div>
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      ) : errorOrders ? (
        <Card className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center space-y-4 shadow-elevation-1">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-accent flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="font-heading font-bold text-base text-text-primary">
              Gagal Memuat Pesanan
            </h2>
            <p className="font-body text-xs text-text-secondary max-w-sm mx-auto">
              {errorOrders}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadOrders}
            className="rounded-xl font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            <span>Muat Ulang</span>
          </Button>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card className="rounded-2xl border border-border bg-surface p-8 sm:p-14 text-center shadow-elevation-1">
          <div className="max-w-md mx-auto space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-primary-light border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-xs">
              {orders.length === 0 ? (
                <Package className="w-8 h-8" />
              ) : (
                <SearchX className="w-8 h-8 text-text-muted" />
              )}
            </div>

            <div className="space-y-2">
              <h2 className="font-heading font-bold text-lg sm:text-xl text-text-primary">
                {orders.length === 0
                  ? "Belum Ada Pesanan Terpadu"
                  : "Tidak Ada Pesanan yang Sesuai"}
              </h2>
              <p className="font-body text-xs sm:text-sm text-text-secondary leading-relaxed">
                {orders.length === 0
                  ? "Pesanan grosir terkonsolidasi (PO) akan terbentuk secara otomatis setelah kelompok UMKM menyelesaikan patungan kuota pooling komoditas Anda."
                  : searchQuery
                  ? `Tidak ditemukan pesanan dengan kata kunci "${searchQuery}". Silakan periksa ejaan atau bersihkan filter.`
                  : `Tidak ada pesanan dalam tab filter "${
                      activeTab === "ACTION_NEEDED"
                        ? "Perlu Dikemas / Kirim"
                        : activeTab === "IN_TRANSIT"
                        ? "Dalam Pengiriman"
                        : "Selesai / Tiba"
                    }".`}
              </p>
            </div>

            {orders.length === 0 && (
              <div className="p-4 rounded-xl bg-surface-subtle/80 border border-border text-left text-xs text-text-secondary flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-accent-light text-accent flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-text-primary block text-xs">
                    Tips Mitra Pemasok KUMPUL
                  </span>
                  <p className="leading-relaxed text-[11px] sm:text-xs">
                    Pastikan katalog pasokan dan tier harga grosir MOQ Anda selalu aktif agar UMKM dapat membuka atau bergabung ke kamar pooling pengadaan bahan baku.
                  </p>
                </div>
              </div>
            )}

            {orders.length === 0 ? (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild variant="primary" size="md" className="rounded-xl font-bold cursor-pointer w-full sm:w-auto">
                  <Link href="/katalog" className="flex items-center justify-center gap-2">
                    <Store className="w-4 h-4" />
                    <span>Kelola Katalog Komoditas</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="md" className="rounded-xl font-semibold cursor-pointer w-full sm:w-auto">
                  <Link href="/dashboard" className="flex items-center justify-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Lihat Radar Pooling</span>
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="pt-2 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setActiveTab("ALL");
                    setSearchQuery("");
                  }}
                  className="rounded-xl font-semibold cursor-pointer gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filter &amp; Pencarian</span>
                </Button>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <>
          {/* Desktop Table View (Watermelon UI Table-10) */}
          <div className="hidden lg:block bg-surface rounded-2xl border border-border shadow-elevation-1 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">No. PO &amp; Status</TableHead>
                  <TableHead>Komoditas &amp; Volume</TableHead>
                  <TableHead>Destinasi &amp; Logistik</TableHead>
                  <TableHead className="text-right">Harga Tier Grosir</TableHead>
                  <TableHead className="text-right">Nilai Escrow</TableHead>
                  <TableHead className="text-right w-[140px]">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium align-top">
                      <div className="space-y-1.5">
                        <span className="font-mono text-xs font-bold text-text-primary bg-neutral-100 px-2.5 py-0.5 rounded-md tabular-nums border border-neutral-200 block w-fit">
                          {po.poNumber}
                        </span>
                        <div>{getOrderStatusBadge(po.status)}</div>
                        <span className="text-[10px] text-text-muted block tabular-nums">
                          {formatDate(po.createdAt, "medium")}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="align-top">
                      <div className="space-y-1 min-w-0 max-w-[200px]">
                        <p className="font-heading font-bold text-sm text-text-primary line-clamp-1" title={po.commodityName}>
                          {po.commodityName}
                        </p>
                        <p className="text-xs text-text-secondary tabular-nums">
                          <strong className="text-text-primary">{po.totalQuantity} {po.wholesaleUnit}</strong> ({po.totalWeightKg} kg)
                        </p>
                        <p className="text-[11px] text-accent font-semibold">
                          {Array.isArray(po.participants) && po.participants.length > 0
                            ? `${po.participants.length} UMKM Anggota Tergabung`
                            : "Konsolidasi Pooling UMKM"}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="align-top">
                      <div className="space-y-1 min-w-0 max-w-xs">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EBF5F0] text-primary border border-primary/20 inline-block">
                          {po.primaryDeliveryMethod === "HEMAT_HUB" ? "Opsi Hemat (Hub)" : "Antar Langsung"}
                        </span>
                        <p className="text-xs font-semibold text-text-primary truncate" title={po.hubName || "Alamat Direct UMKM"}>
                          {po.hubName || "Alamat Direct UMKM"}
                        </p>
                        <p className="text-[11px] text-text-muted line-clamp-1 max-w-xs" title={po.hubAddress}>
                          {po.hubAddress}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="text-right align-top">
                      <p className="text-xs font-bold text-text-primary tabular-nums">
                        {formatCurrency(
                          po.lockedTierPrice ||
                            (po.totalQuantity > 0 ? Math.round(po.grandTotalAmount / po.totalQuantity) : 0)
                        )}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        per {po.wholesaleUnit}
                      </p>
                    </TableCell>

                    <TableCell className="text-right align-top">
                      <p className="text-sm font-extrabold text-primary tabular-nums">
                        {formatCurrency(po.grandTotalAmount)}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-medium">
                        Tersimpan di Escrow
                      </p>
                    </TableCell>

                    <TableCell className="text-right align-top">
                      <div className="flex flex-col items-end gap-1.5">
                        {(po.status === "PAID_TO_ESCROW" || po.status === "ISSUED" || (po.status as string) === "PROCESSING") && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenShipModal(po)}
                            className="font-bold text-xs min-h-[38px] w-full max-w-[130px] cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5 mr-1" />
                            <span>Kirim Barang</span>
                          </Button>
                        )}

                        {po.status === "SHIPPED" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleMarkDelivered(po.id)}
                            disabled={updatingPoId === po.id}
                            className="font-bold text-xs min-h-[38px] w-full max-w-[130px] bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            <span>{updatingPoId === po.id ? "Memproses..." : "Tiba di Tujuan"}</span>
                          </Button>
                        )}

                        <Link href={`/pesanan/${po.id}`} className="w-full max-w-[130px]">
                          <Button variant="outline" size="sm" className="font-semibold text-xs min-h-[36px] w-full cursor-pointer">
                            Buka Rincian
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile & Tablet Card View (Antislop Responsive Layout) */}
          <div className="lg:hidden space-y-4">
            {filteredOrders.map((po) => (
              <Card key={po.id} className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-text-primary bg-neutral-100 px-2.5 py-0.5 rounded-md tabular-nums border border-neutral-200">
                      {po.poNumber}
                    </span>
                    {getOrderStatusBadge(po.status)}
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EBF5F0] text-primary border border-primary/20">
                    {po.primaryDeliveryMethod === "HEMAT_HUB" ? "Opsi Hemat" : "Direct"}
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="font-heading font-bold text-base text-text-primary leading-snug line-clamp-1" title={po.commodityName}>
                    {po.commodityName}
                  </h2>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-background border border-border">
                      <span className="text-[10px] text-text-muted font-semibold block">Volume Dipesan</span>
                      <p className="font-bold text-text-primary mt-0.5 tabular-nums">
                        {po.totalQuantity} {po.wholesaleUnit} ({po.totalWeightKg} kg)
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border min-w-0">
                      <span className="text-[10px] text-text-muted font-semibold block">Tujuan Drop Point</span>
                      <p className="font-bold text-text-primary mt-0.5 truncate" title={po.hubName || "Direct UMKM"}>
                        {po.hubName || "Direct UMKM"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border gap-2 flex-wrap">
                  <div>
                    <span className="text-[10px] text-text-muted font-semibold block">Total Escrow</span>
                    <p className="text-base font-extrabold text-primary tabular-nums">
                      {formatCurrency(po.grandTotalAmount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(po.status === "PAID_TO_ESCROW" || po.status === "ISSUED" || (po.status as string) === "PROCESSING") && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenShipModal(po)}
                        className="font-bold text-xs min-h-[44px] px-3.5 cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5 mr-1" />
                        <span>Kirim</span>
                      </Button>
                    )}

                    {po.status === "SHIPPED" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleMarkDelivered(po.id)}
                        disabled={updatingPoId === po.id}
                        className="font-bold text-xs min-h-[44px] px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        <span>{updatingPoId === po.id ? "..." : "Tiba"}</span>
                      </Button>
                    )}

                    <Link href={`/pesanan/${po.id}`}>
                      <Button variant="outline" size="sm" className="font-semibold text-xs min-h-[44px] px-3.5 cursor-pointer">
                        Rincian
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Modal Kirim Barang Langsung dari Halaman Pesanan */}
      <Dialog open={!!shippingPo} onOpenChange={(open) => !open && setShippingPo(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Kirim Barang &amp; Input Bukti Pengantaran</DialogTitle>
            <DialogDescription>
              Lengkapi data pengemudi, nomor plat atau resi pelacakan untuk Purchase Order:{" "}
              <strong>{shippingPo?.poNumber}</strong> ({shippingPo?.commodityName}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitShipment} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary block">
                Nama Pengemudi / Kurir Armada <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Contoh: Budi Santoso"
                value={driverNameInput}
                onChange={(e) => setDriverNameInput(e.target.value)}
                required
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary block">
                Nomor Resi / Plat Nomor Armada <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Contoh: AB 9123 KP / KMPL-LOG-88"
                value={trackingNumberInput}
                onChange={(e) => setTrackingNumberInput(e.target.value)}
                required
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary block">
                Unggah Bukti Pengantaran (Foto / Surat Jalan)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="block w-full text-xs text-text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-border file:text-xs file:font-semibold file:bg-surface hover:file:bg-surface-subtle file:cursor-pointer cursor-pointer"
              />
              {deliveryProofPreview && (
                <div className="mt-2 relative w-full h-36 rounded-xl border border-border overflow-hidden bg-background">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={deliveryProofPreview}
                    alt="Preview Bukti Pengantaran"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-4">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShippingPo(null)}
                disabled={isSubmittingShip}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmittingShip || !driverNameInput.trim() || !trackingNumberInput.trim()}
              >
                {isSubmittingShip ? "Memproses Pengiriman..." : "Konfirmasi Kirim Pesanan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}