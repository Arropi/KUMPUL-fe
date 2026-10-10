"use client";

import * as React from "react";
import Link from "next/link";
import { ConsolidatedPO, POStatus, PoolParticipantInfo } from "@/constants/supplier";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getOrderStatusBadge } from "./helpers";
import {
  getSupplierPoDetailAction,
  assignPoolHostAction,
  shipSupplierPoAction,
  updateSupplierPoStatusAction,
} from "@/actions/orders";
import { uploadFileAction } from "@/actions/upload";

interface PesananDetailViewProps {
  poId: string;
}

export function PesananDetailView({ poId }: PesananDetailViewProps) {
  const [po, setPo] = React.useState<ConsolidatedPO | null>(null);
  const [pool, setPool] = React.useState<any | null>(null);
  const [commodity, setCommodity] = React.useState<any | null>(null);
  const [participants, setParticipants] = React.useState<PoolParticipantInfo[]>([]);
  const [hostParticipant, setHostParticipant] = React.useState<any | null>(null);
  const [totalHubVolume, setTotalHubVolume] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal Ubah Host Hub
  const [showHostModal, setShowHostModal] = React.useState(false);
  const [selectedCandidateRoleId, setSelectedCandidateRoleId] = React.useState<string>("");
  const [isSavingHost, setIsSavingHost] = React.useState(false);

  // Modal Kirim Barang
  const [showShipModal, setShowShipModal] = React.useState(false);
  const [driverNameInput, setDriverNameInput] = React.useState("");
  const [trackingNumberInput, setTrackingNumberInput] = React.useState("");
  const [deliveryProofFile, setDeliveryProofFile] = React.useState<File | null>(null);
  const [deliveryProofPreview, setDeliveryProofPreview] = React.useState<string | null>(null);
  const [isSubmittingShip, setIsSubmittingShip] = React.useState(false);

  // Status transition loader
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  const loadPODetail = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSupplierPoDetailAction(poId);
      if (res.success && res.data) {
        setPo(res.data.po);
        setPool(res.data.pool);
        setCommodity(res.data.commodity);
        setParticipants(res.data.participants || []);
        setHostParticipant(res.data.hostParticipant || null);
        setTotalHubVolume(res.data.totalHubVolume ?? 0);

        if (res.data.po?.driverName) setDriverNameInput(res.data.po.driverName);
        if (res.data.po?.trackingNumber) setTrackingNumberInput(res.data.po.trackingNumber);
        if (res.data.po?.deliveryProofUrl) setDeliveryProofPreview(res.data.po.deliveryProofUrl);

        if (res.data.pool?.host_umkm_role_id) {
          setSelectedCandidateRoleId(res.data.pool.host_umkm_role_id);
        }
      } else {
        setError(res.message || "Gagal memuat rincian pesanan");
      }
    } catch (err: any) {
      console.error(err);
      setError("Gagal memuat rincian pesanan");
    } finally {
      setLoading(false);
    }
  }, [poId]);

  React.useEffect(() => {
    loadPODetail();
  }, [loadPODetail]);

  // Hitung muatan khusus Hemat Hub
  const computedHubVolume = React.useMemo(() => {
    if (totalHubVolume > 0) return totalHubVolume;
    return participants
      .filter((p) => p.deliveryMethod === "HEMAT_HUB")
      .reduce((acc, curr) => acc + (curr.orderWeightKg || 0), 0);
  }, [totalHubVolume, participants]);

  // Kandidat Host terpilih di dialog
  const selectedCandidate = React.useMemo(() => {
    return participants.find((p) => p.umkmRoleId === selectedCandidateRoleId);
  }, [participants, selectedCandidateRoleId]);

  // Cek apakah kandidat terpilih memiliki kapasitas gudang yang kurang
  const isSelectedCandidateDeficit = React.useMemo(() => {
    if (!selectedCandidate) return false;
    const capacity = selectedCandidate.storageCapacity ?? 0;
    return capacity < computedHubVolume;
  }, [selectedCandidate, computedHubVolume]);

  // Handler: Ubah Titik Host Hub
  const handleSaveHostChange = async () => {
    if (!po?.poolId || !selectedCandidateRoleId) return;
    setIsSavingHost(true);
    try {
      const res = await assignPoolHostAction(po.poolId, selectedCandidateRoleId);
      if (res.success) {
        if (res.warning) {
          toast.info(res.warning, "Catatan Kapasitas Gudang");
        } else {
          toast.success("Titik Host Hub berhasil diperbarui", "Berhasil");
        }
        setShowHostModal(false);
        await loadPODetail();
      } else {
        toast.error(res.message || "Gagal mengubah titik Host Hub", "Gagal");
      }
    } catch (err: any) {
      toast.error(err?.message || "Terjadi kesalahan sistem", "Gagal");
    } finally {
      setIsSavingHost(false);
    }
  };

  // Handler: Pilih file bukti foto
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDeliveryProofFile(file);
      const url = URL.createObjectURL(file);
      setDeliveryProofPreview(url);
    }
  };

  // Handler: Kirim Barang & Upload Bukti
  const handleSubmitShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!po) return;

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
      let finalProofUrl = po.deliveryProofUrl || null;

      // Jika ada file baru yang dipilih, upload ke storage dahulu
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

      const shipRes = await shipSupplierPoAction(po.id, {
        driver_name: driverNameInput.trim(),
        tracking_number: trackingNumberInput.trim(),
        delivery_proof_url: finalProofUrl,
      });

      if (shipRes.success) {
        toast.success(
          "Pesanan berhasil dikirim dan armada sedang dalam perjalanan",
          "Pengiriman Dimulai"
        );
        setShowShipModal(false);
        await loadPODetail();
      } else {
        toast.error(shipRes.message || "Gagal memperbarui status pengiriman", "Gagal");
      }
    } catch (err: any) {
      toast.error(err?.message || "Terjadi kesalahan saat memproses pengiriman", "Gagal");
    } finally {
      setIsSubmittingShip(false);
    }
  };

  // Handler: Konfirmasi Pesanan Tiba (DELIVERED)
  const handleMarkDelivered = async () => {
    if (!po) return;
    setIsUpdatingStatus(true);
    try {
      const res = await updateSupplierPoStatusAction(po.id, "DELIVERED");
      if (res.success) {
        toast.success("Pesanan telah ditandai tiba di titik tujuan", "Pengiriman Tuntas");
        await loadPODetail();
      } else {
        toast.error(res.message || "Gagal mengubah status pesanan", "Gagal");
      }
    } catch (err: any) {
      toast.error(err?.message || "Terjadi kesalahan", "Gagal");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 rounded-full border-3 border-primary border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-text-muted">
          Memuat rincian Purchase Order dan manifest peserta...
        </p>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="p-8 rounded-3xl border border-dashed border-border bg-surface text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h3 className="font-heading font-bold text-base text-text-primary">
          {error || "Pesanan Tidak Ditemukan"}
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Pesanan dengan ID yang diminta tidak ditemukan atau Anda tidak memiliki hak akses sebagai supplier untuk PO ini.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/pesanan">
            <Button variant="outline" size="sm">
              Kembali ke Daftar Pesanan
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => loadPODetail()}>
            Muat Ulang
          </Button>
        </div>
      </div>
    );
  }

  const canEditHost = po.status === "ISSUED" || po.status === "PAID_TO_ESCROW";
  const canShip =
    po.status === "PAID_TO_ESCROW" ||
    po.status === "ISSUED" ||
    (po.status as string) === "PROCESSING";
  const isShipped = po.status === "SHIPPED";
  const isDelivered = po.status === "DELIVERED";

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/pesanan"
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-primary transition-colors w-fit"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Daftar Pesanan
        </Link>
        <div className="flex items-center gap-2">
          {getOrderStatusBadge(po.status)}
          <span className="text-xs font-mono text-text-muted bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-border">
            ID: {po.id.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border shadow-elevation-1">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-text-primary truncate" title={po.poNumber}>
              {po.poNumber}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-primary border border-primary/20 shrink-0">
              Grosir Agregasi Pooling
            </span>
          </div>
          <p className="text-xs text-text-secondary">
            Diterbitkan pada {formatDate(po.createdAt, "medium")} • Estimasi Target Tiba:{" "}
            <strong className="text-text-primary">{formatDate(po.estimatedDeliveryDate, "medium")}</strong>
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {canShip && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowShipModal(true)}
              className="font-bold text-xs min-h-[44px]"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1m-6 0a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
              Kirim Barang &amp; Input Bukti
            </Button>
          )}

          {isShipped && (
            <Button
              variant="primary"
              size="md"
              onClick={handleMarkDelivered}
              disabled={isUpdatingStatus}
              className="font-bold text-xs min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isUpdatingStatus ? "Memproses..." : "Konfirmasi Tiba di Tujuan (Delivered)"}
            </Button>
          )}

          {isDelivered && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700 text-xs font-bold">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Pengiriman Selesai &amp; Tuntas
            </div>
          )}
        </div>
      </div>

      {/* Grid Overview Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Komoditas & Muatan */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Muatan &amp; Komoditas
            </span>
            <Badge variant="neutral">{po.wholesaleUnit}</Badge>
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-text-primary line-clamp-2" title={po.commodityName}>
              {po.commodityName}
            </h3>
            <p className="text-2xl font-extrabold text-primary mt-1 tabular-nums">
              {po.totalQuantity} <span className="text-sm font-semibold text-text-secondary">{po.wholesaleUnit}</span>
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              Setara total berat kargo: <strong>{po.totalWeightKg} kg</strong>
            </p>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-text-secondary">
            <span>Harga Terkunci (Tier)</span>
            <strong className="text-text-primary tabular-nums">
              {formatCurrency(
                po.lockedTierPrice ||
                  (po.totalQuantity > 0 ? Math.round(po.grandTotalAmount / po.totalQuantity) : 0)
              )}{" "}
              / {po.wholesaleUnit}
            </strong>
          </div>
        </Card>

        {/* Card 2: Escrow & Finansial */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Finansial &amp; Escrow
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
              Escrow KUMPUL Terkunci
            </span>
          </div>
          <div>
            <span className="text-xs text-text-muted">Total Nilai Tagihan Konsolidasi</span>
            <p className="text-2xl font-extrabold text-primary mt-1 tabular-nums">
              {formatCurrency(po.grandTotalAmount)}
            </p>
            <p className="text-xs text-emerald-700 font-medium mt-0.5">
              100% dana diamankan di Rekening Bersama Escrow
            </p>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-text-secondary">
            <span>Jumlah Anggota</span>
            <strong className="text-text-primary tabular-nums">
              {participants.length} UMKM Tergabung
            </strong>
          </div>
        </Card>

        {/* Card 3: Titik Drop Host Hub */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Titik Drop Host Hub
            </span>
            {canEditHost && (
              <button
                type="button"
                onClick={() => setShowHostModal(true)}
                className="text-[11px] font-bold text-primary hover:underline hover:text-primary/80 transition-colors cursor-pointer"
              >
                Ubah Titik Host Hub
              </button>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <h3 className="font-heading font-bold text-sm text-text-primary truncate" title={po.hubName || hostParticipant?.umkmName || "Host Hub Konsolidasi"}>
                {po.hubName || hostParticipant?.umkmName || "Host Hub Konsolidasi"}
              </h3>
            </div>
            <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed" title={po.hubAddress || hostParticipant?.destinationAddress || "Alamat kumpul terpadu"}>
              {po.hubAddress || hostParticipant?.destinationAddress || "Alamat kumpul terpadu"}
            </p>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-text-secondary">
            <span>Kapasitas Gudang Host:</span>
            <span className="font-bold text-text-primary tabular-nums">
              {hostParticipant?.storageCapacity ?? 0} kg
            </span>
          </div>
        </Card>
      </div>

      {/* Informasi Pengiriman (Jika Sudah Shipped / Delivered) */}
      {(isShipped || isDelivered || po.trackingNumber || po.driverName) && (
        <Card className="p-5 sm:p-6 bg-surface border border-primary/20 shadow-elevation-1 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                🚚
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-text-primary">
                  Informasi Pengiriman &amp; Ekspedisi
                </h3>
                <p className="text-[11px] text-text-muted">
                  Detail armada pengantaran logistik ke lokasi Drop Point / Hub
                </p>
              </div>
            </div>
            {getOrderStatusBadge(po.status)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-background border border-border">
              <span className="text-[10px] text-text-muted font-semibold block uppercase">
                Nama Pengemudi / Kurir
              </span>
              <p className="font-bold text-sm text-text-primary mt-1 truncate" title={po.driverName || "-"}>
                {po.driverName || "-"}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-background border border-border">
              <span className="text-[10px] text-text-muted font-semibold block uppercase">
                No. Resi / Plat Armada
              </span>
              <p className="font-mono font-bold text-sm text-text-primary mt-1 tabular-nums truncate" title={po.trackingNumber || "-"}>
                {po.trackingNumber || "-"}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-background border border-border">
              <span className="text-[10px] text-text-muted font-semibold block uppercase">
                Bukti Foto Surat Jalan
              </span>
              {po.deliveryProofUrl ? (
                <a
                  href={po.deliveryProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                >
                  Lihat Foto Bukti Pengantaran ↗
                </a>
              ) : (
                <span className="text-text-muted mt-1 block">Belum ada foto bukti</span>
              )}
            </div>
          </div>

          {po.deliveryProofUrl && (
            <div className="pt-2">
              <span className="text-xs font-semibold text-text-secondary block mb-2">
                Preview Bukti Serah Terima:
              </span>
              <div className="relative w-full max-w-sm h-48 rounded-2xl border border-border overflow-hidden bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={po.deliveryProofUrl}
                  alt="Bukti Pengantaran PO"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Manifest Peserta Pooling (PRD Halaman 8) */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <h2 className="font-heading font-bold text-base sm:text-lg text-text-primary">
              Manifest Peserta Pooling ({participants.length} UMKM)
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Rincian kuota, metode logistik (Hemat Hub vs Direct), dan status pengambilan masing-masing anggota.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-text-muted">
              Total Volume Kargo:
            </span>
            <Badge variant="neutral" className="font-mono font-bold">
              {po.totalWeightKg} kg
            </Badge>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead>Nama UMKM &amp; Kontak</TableHead>
                <TableHead>Alamat Pengantaran</TableHead>
                <TableHead>Opsi Logistik</TableHead>
                <TableHead className="text-right">Volume (Kg)</TableHead>
                <TableHead className="text-right">Kapasitas Gudang</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-center w-28">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((p, idx) => (
                <TableRow key={p.id || idx}>
                  <TableCell className="text-center font-medium text-text-muted">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong className="text-xs font-bold text-text-primary truncate" title={p.umkmName}>
                          {p.umkmName}
                        </strong>
                        {p.isHost && (
                          <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                            Titik Host Hub
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-secondary truncate" title={`${p.ownerName} • ${p.phone}`}>
                        {p.ownerName} • {p.phone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-xs text-text-secondary line-clamp-2" title={p.destinationAddress}>
                      {p.destinationAddress}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        p.deliveryMethod === "HEMAT_HUB"
                          ? "bg-[#EBF5F0] text-primary border border-primary/20"
                          : "bg-neutral-100 text-neutral-700 border border-neutral-200"
                      }`}
                    >
                      {p.deliveryMethod === "HEMAT_HUB" ? "Opsi Hemat (Hub)" : "Antar Langsung"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-xs tabular-nums text-text-primary">
                    {p.orderWeightKg} kg
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-text-secondary">
                    {p.storageCapacity !== undefined ? `${p.storageCapacity} kg` : "-"}
                  </TableCell>
                  <TableCell className="text-right font-bold text-xs tabular-nums text-primary">
                    {formatCurrency(p.subtotalAmount)}
                  </TableCell>
                  <TableCell className="text-center">
                    {p.isPickedUp ? (
                      <Badge variant="success" className="text-[10px]">
                        Sudah Diambil
                      </Badge>
                    ) : (
                      <Badge variant="neutral" className="text-[10px]">
                        Menunggu Serah
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {participants.map((p, idx) => (
            <div
              key={p.id || idx}
              className="p-4 rounded-2xl bg-background border border-border space-y-3 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-text-primary truncate" title={p.umkmName}>{p.umkmName}</span>
                    {p.isHost && (
                      <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                        Host Hub
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-text-muted block mt-0.5 truncate" title={`${p.ownerName} • ${p.phone}`}>
                    {p.ownerName} • {p.phone}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    p.deliveryMethod === "HEMAT_HUB"
                      ? "bg-[#EBF5F0] text-primary"
                      : "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {p.deliveryMethod === "HEMAT_HUB" ? "Opsi Hemat" : "Direct"}
                </span>
              </div>

              <p className="text-text-secondary text-[11px] line-clamp-2" title={p.destinationAddress}>
                📍 {p.destinationAddress}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <div>
                  <span className="text-[10px] text-text-muted block">Volume / Kuantitas</span>
                  <strong className="text-text-primary tabular-nums">{p.orderWeightKg} kg</strong>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">Kapasitas Gudang</span>
                  <span className="text-text-secondary tabular-nums">
                    {p.storageCapacity !== undefined ? `${p.storageCapacity} kg` : "-"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="font-bold text-primary tabular-nums">
                  {formatCurrency(p.subtotalAmount)}
                </span>
                {p.isPickedUp ? (
                  <Badge variant="success" className="text-[10px]">
                    Sudah Diambil
                  </Badge>
                ) : (
                  <Badge variant="neutral" className="text-[10px]">
                    Menunggu Serah
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* DIALOG 1: Ubah Titik Host Hub (PRD Halaman 8)                             */}
      {/* ========================================================================= */}
      <Dialog open={showHostModal} onOpenChange={setShowHostModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Ubah Titik Drop Host Hub</DialogTitle>
            <DialogDescription>
              Pilih salah satu UMKM peserta pool sebagai titik kumpul pengiriman konsolidasi.
              Pastikan kapasitas gudang memadai untuk total muatan ({computedHubVolume} kg).
            </DialogDescription>
          </DialogHeader>

          {/* Warning Badge jika kapasitas kurang dari total muatan */}
          {isSelectedCandidateDeficit && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <span className="text-base shrink-0">⚠️</span>
              <div>
                <p className="font-bold">Peringatan Kapasitas Gudang</p>
                <p className="mt-0.5 leading-relaxed">
                  Kapasitas penyimpanan UMKM ini ({selectedCandidate?.storageCapacity ?? 0} kg) lebih kecil dari total muatan hub ({computedHubVolume} kg)
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {participants.map((candidate) => {
              const isSelected = selectedCandidateRoleId === candidate.umkmRoleId;
              const isCurrentHost = candidate.isHost;
              const cap = candidate.storageCapacity ?? 0;
              const isDeficit = cap < computedHubVolume;

              return (
                <div
                  key={candidate.id}
                  onClick={() => {
                    if (candidate.umkmRoleId) {
                      setSelectedCandidateRoleId(candidate.umkmRoleId);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border bg-surface hover:bg-surface-subtle"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-xs font-bold text-text-primary truncate" title={candidate.umkmName}>
                          {candidate.umkmName}
                        </strong>
                        {isCurrentHost && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                            Host Saat Ini
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-secondary leading-snug line-clamp-2" title={candidate.destinationAddress}>
                        {candidate.destinationAddress}
                      </p>
                      <p className="text-[10px] text-text-muted truncate" title={`Kontak: ${candidate.ownerName} (${candidate.phone})`}>
                        Kontak: {candidate.ownerName} ({candidate.phone})
                      </p>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-xl inline-block ${
                          isDeficit
                            ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        Kapasitas: {cap} kg
                      </span>
                      <span className="text-[10px] text-text-muted block">
                        Pesanan: {candidate.orderWeightKg} kg
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowHostModal(false)}
              disabled={isSavingHost}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveHostChange}
              disabled={isSavingHost || !selectedCandidateRoleId}
            >
              {isSavingHost ? "Menyimpan..." : "Simpan Titik Host Hub"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 2: Konfirmasi Kirim Barang & Unggah Bukti (PRD Halaman 8)          */}
      {/* ========================================================================= */}
      <Dialog open={showShipModal} onOpenChange={setShowShipModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Kirim Barang &amp; Input Bukti Pengantaran</DialogTitle>
            <DialogDescription>
              Lengkapi data pengemudi, nomor plat atau resi pelacakan, dan unggah foto bukti pengantaran/surat jalan untuk memulai pengiriman.
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
                placeholder="Contoh: B 9123 KMP / JNE-88291039"
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
                onClick={() => setShowShipModal(false)}
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