"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  RefreshCw,
  Plus,
  ArrowRight,
  Package,
  ShieldCheck,
  TrendingUp,
  BarChart2,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { getOrderStatusBadge } from "./helpers";
import {
  getSupplierDashboardDataAction,
  type SupplierDashboardData,
  type SupplierActivePoolItem,
  type SupplierCompetitivenessBenchmarkItem,
  type SupplierDashboardPOItem,
  type SupplierDashboardCommodityItem,
} from "@/actions/dashboard";
import type { POStatus } from "@/constants/supplier";

function useGreeting(companyName: string) {
  return React.useMemo(() => {
    const hour = new Date().getHours();
    const shortName = companyName.split(" ")[0] ?? companyName;

    if (hour < 11) return `Selamat Pagi, ${shortName}`;
    if (hour < 15) return `Selamat Siang, ${shortName}`;
    if (hour < 18) return `Selamat Sore, ${shortName}`;
    return `Selamat Malam, ${shortName}`;
  }, [companyName]);
}

export function SupplierDashboardView() {
  const searchParams = useSearchParams();
  const [dashboardData, setDashboardData] = React.useState<SupplierDashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const isStoragePending = React.useSyncExternalStore(
    (callback) => {
      window.addEventListener("storage", callback);
      return () => window.removeEventListener("storage", callback);
    },
    () => {
      const savedComplete = localStorage.getItem("kumpul_supplier_profile_complete");
      const pendingOnboarding = localStorage.getItem("kumpul_pending_onboarding");
      return Boolean(pendingOnboarding) && savedComplete !== "true";
    },
    () => false
  );

  const isProfilePending = searchParams.get("onboarding") === "pending" || isStoragePending;

  const loadDashboard = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getSupplierDashboardDataAction();
      if (res.success && res.data) {
        setDashboardData(res.data);
      } else {
        toast.error("Gagal memuat analitik dashboard supplier.");
      }
    } catch {
      toast.error("Terjadi kendala saat menghubungkan dashboard ke server backend.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const companyName = dashboardData?.session?.name || "Mitra Supplier Agribisnis";
  const greeting = useGreeting(companyName);

  const activePools = dashboardData?.active_pools || [];
  const benchmarks = dashboardData?.competitiveness_benchmarks || [];
  const recentPos = dashboardData?.recent_pos || [];
  const commodities = dashboardData?.commodities || [];

  return (
    <div className="flex flex-col gap-6 sm:gap-7">
      {/* 1. Header Section: Greeting + Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-semibold text-text-secondary">
              {companyName} &bull; Agribisnis Hulu &amp; Pasokan Pangan
            </span>
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text-primary tracking-tight mt-0.5">
            {greeting}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadDashboard}
            disabled={isLoading}
            className="rounded-xl font-bold gap-1.5 cursor-pointer text-xs"
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            <span>Segarkan</span>
          </Button>

          <Button asChild variant="primary" size="sm" className="rounded-xl font-bold gap-1.5 text-xs">
            <Link href="/katalog/tambah">
              <Plus className="size-3.5" />
              <span>Tambah Komoditas</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Banner Peringatan Kelengkapan Profiling */}
      {isProfilePending && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 font-bold text-base shadow-xs">
              !
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-sm font-bold text-text-primary">
                  Profil Usaha Perlu Dilengkapi
                </h3>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-md border border-amber-300">
                  Wajib Diisi
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Tentukan Sektor Usaha resmi, Kapasitas Storage Gudang, dan Rekening Bank Escrow sebelum menerbitkan katalog komoditas baru.
              </p>
            </div>
          </div>

          <Button asChild variant="accent" size="sm" className="font-bold shrink-0 self-start sm:self-auto min-h-[40px] rounded-xl text-xs">
            <Link href="/profil?onboarding=pending">
              <span>Lengkapi Profil Sekarang &rarr;</span>
            </Link>
          </Button>
        </div>
      )}

      {/* 2. 4 Kartu Metrik Riil dari Backend (GET /api/dashboards/supplier) */}
      {isLoading && !dashboardData ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3 min-h-[148px]"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-7 w-36 rounded-lg" />
                <Skeleton className="h-3.5 w-44 rounded-md" />
              </div>
              <div className="pt-2 border-t border-border/70 flex items-center justify-between">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Escrow Balance Held */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">Dana Terkunci di Escrow</span>
              <Badge variant="primary" className="text-[10px]">
                Kliring Aman
              </Badge>
            </div>
            <div>
              <p className="font-heading text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
                {formatCurrency(dashboardData?.escrow_balance_held || 0)}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                100% kliring terjamin oleh sistem platform
              </p>
            </div>
            <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px] text-text-secondary">
              <span>Proteksi Transaksi</span>
              <span className="font-bold text-primary">Rekening Bersama</span>
            </div>
          </div>

          {/* Card 2: Total Revenue Settled */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">Total Pendapatan Selesai</span>
              <Badge variant="waste" className="text-[10px]">
                Settled
              </Badge>
            </div>
            <div>
              <p className="font-heading text-xl sm:text-2xl font-bold text-circular-waste tabular-nums">
                {formatCurrency(dashboardData?.total_revenue || 0)}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                Dari {dashboardData?.total_orders_received || 0} pesanan PO berhasil diselesaikan
              </p>
            </div>
            <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px] text-text-secondary">
              <span>Pencairan Dana</span>
              <span className="font-bold text-circular-waste">Terkonfirmasi Sukses</span>
            </div>
          </div>

          {/* Card 3: Total Commodities */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">Katalog Komoditas Aktif</span>
              <Badge variant="secondary" className="text-[10px]">
                Pasokan
              </Badge>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <p className="font-heading text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
                  {dashboardData?.total_commodities || commodities.length}
                </p>
                <span className="text-xs font-semibold text-text-muted">Komoditas</span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Siap diagregasikan dalam bursa pooling
              </p>
            </div>
            <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px] text-text-secondary">
              <span>Kesiapan Pasokan</span>
              <span className="font-bold text-primary">Katalog Terbuka</span>
            </div>
          </div>

          {/* Card 4: Active Pools Count */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">Patungan Kuota Berjalan</span>
              <Badge variant="primary" className="text-[10px]">
                MOQ Pooling
              </Badge>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <p className="font-heading text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
                  {dashboardData?.active_pools_count || activePools.length}
                </p>
                <span className="text-xs font-semibold text-text-muted">Pool</span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Kamar pooling yang sedang mengumpulkan kuota
              </p>
            </div>
            <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px] text-text-secondary">
              <span>Skala Pengadaan</span>
              <span className="font-bold text-primary">Agregasi Pembeli</span>
            </div>
          </div>
        </section>
      )}

      {/* 3. Radar Autonomous MOQ Pooling Supplier (Backed by backend active_pools) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border/70">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-base sm:text-lg font-bold text-text-primary">
                Radar Autonomous MOQ Pooling Berjalan
              </h2>
              {activePools.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary border border-primary/20">
                  {activePools.length} Pool
                </span>
              )}
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-bold gap-1 self-start sm:self-auto">
            <Link href="/katalog">
              <span>Buka Seluruh Katalog</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        {isLoading && !dashboardData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-surface shadow-elevation-1 p-5 space-y-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <Skeleton className="h-5 w-36 rounded-md" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-24 rounded-md" />
                    <Skeleton className="h-3 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <div className="p-3 rounded-xl bg-surface-subtle/80 border border-border/80 flex justify-between">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : activePools.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-border py-8 text-center">
            <CardContent className="space-y-2 max-w-md mx-auto">
              <p className="font-heading font-bold text-sm text-text-primary">
                Belum ada kamar pooling aktif
              </p>
              <p className="text-xs text-text-secondary">
                Komoditas Anda yang berstatus aktif di bursa akan otomatis membuka kamar pooling ketika pembeli UMKM mulai patungan kuota.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePools.slice(0, 6).map((pool) => {
              const percentage = Math.min(100, pool.progress_percentage || 0);
              const isLocked = pool.pool_status === "LOCKED";

              return (
                <Card
                  key={pool.pool_id}
                  className="rounded-2xl border border-border bg-surface shadow-elevation-1 p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-text-primary line-clamp-1">
                        {pool.commodity_name}
                      </h4>
                      {isLocked ? (
                        <Badge variant="success">Kuota Terkunci</Badge>
                      ) : (
                        <Badge variant="primary" className="font-bold text-[10px]">
                          {percentage}% Terkumpul
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-text-secondary">
                        <span>Akumulasi Kuota:</span>
                        <span className="font-bold text-text-primary tabular-nums">
                          {pool.accumulated_qty} / {pool.target_moq} kg
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-border/80 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs text-text-secondary">
                    <span>
                      Target Kirim: <strong className="text-text-primary">{pool.target_delivery_date || "Segera"}</strong>
                    </span>
                    <span className="font-semibold text-primary">
                      Status: {pool.pool_status}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Tolok Ukur Daya Saing Harga Pasar (Backed by backend competitiveness_benchmarks) */}
      {benchmarks.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border/70">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-base sm:text-lg font-bold text-text-primary">
                  Tolok Ukur Daya Saing Harga Pasar
                </h2>
                <Badge variant="primary" className="text-[10px] font-bold">
                  Bursa KUMPUL AI
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benchmarks.slice(0, 6).map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-border bg-surface shadow-elevation-1 flex flex-col justify-between gap-3 hover:border-border-strong transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-text-primary line-clamp-1">
                      {item.commodity_name}
                    </h4>
                    {item.status === "COMPETITIVE" ? (
                      <Badge variant="success" className="text-[10px] font-bold shrink-0">
                        Harga Sangat Kompetitif
                      </Badge>
                    ) : item.status === "EXPENSIVE" ? (
                      <Badge variant="warning" className="text-[10px] font-bold shrink-0">
                        Di Atas Rata-rata
                      </Badge>
                    ) : (
                      <Badge variant="primary" className="text-[10px] font-bold shrink-0">
                        Standar Pasar
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-surface-subtle/80 border border-border/80">
                      <span className="text-[10px] text-text-muted block">Harga Dasar Anda:</span>
                      <strong className="text-text-primary tabular-nums block font-bold mt-0.5">
                        {formatCurrency(item.your_price)}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-surface-subtle/80 border border-border/80">
                      <span className="text-[10px] text-text-muted block">Rata-rata Pasar:</span>
                      <strong className="text-text-secondary tabular-nums block font-bold mt-0.5">
                        {formatCurrency(item.market_average)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs text-text-muted">
                  <span>Daya Serap Kuota:</span>
                  <span className={cn(
                    "font-bold",
                    item.status === "COMPETITIVE" ? "text-success" : item.status === "EXPENSIVE" ? "text-warning" : "text-primary"
                  )}>
                    {item.status === "COMPETITIVE" ? "Tinggi" : item.status === "EXPENSIVE" ? "Perlu Efisiensi" : "Stabil"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Dua Kolom: Pesanan Terpadu Masuk (Consolidated PO) & Katalog Pasokan Gudang */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
        {/* Kolom Kiri: Consolidated PO Table (Span 7) */}
        <Card className="lg:col-span-7 rounded-2xl shadow-elevation-1 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                Pesanan Terpadu Masuk (Consolidated PO)
              </CardTitle>
            </div>
            <CardAction>
              <Link
                href="/pesanan"
                className="text-xs font-bold text-primary hover:underline"
              >
                Lihat Semua &rarr;
              </Link>
            </CardAction>
          </CardHeader>

          <CardContent className="p-0">
            {recentPos.length === 0 ? (
              <div className="p-8 text-center bg-surface-subtle/50 text-xs text-text-muted space-y-2">
                <p className="font-semibold text-text-primary">Belum ada pesanan PO terpadu</p>
                <p>Ketika kuota pooling komoditas Anda terpenuhi dan terkunci, pesanan PO terpadu akan muncul otomatis di sini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. PO &amp; Komoditas</TableHead>
                      <TableHead>Volume Total</TableHead>
                      <TableHead>Nilai Escrow</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPos.slice(0, 5).map((po) => (
                      <TableRow key={po.id}>
                        <TableCell>
                          <p className="font-mono text-xs font-bold text-text-primary tabular-nums">
                            {po.po_number}
                          </p>
                          <p className="font-semibold text-xs text-text-secondary mt-0.5">
                            {po.commodity_name || "Komoditas Terpadu"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-text-primary tabular-nums text-xs">
                            {po.total_quantity} {po.wholesale_unit}
                          </p>
                          {po.total_weight_kg && (
                            <p className="text-[11px] text-text-muted tabular-nums">
                              {po.total_weight_kg} kg
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-primary tabular-nums text-xs">
                            {formatCurrency(Number(po.grand_total_amount) || 0)}
                          </p>
                          <span className="text-[10px] text-text-muted">
                            {po.delivery_method || "Hub"}
                          </span>
                        </TableCell>
                        <TableCell>{getOrderStatusBadge(po.po_status as POStatus)}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
                            <Link href={`/pesanan/${po.id}`}>
                              Detail
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kolom Kanan: Inventory Quick Ledger / Pasokan Komoditas (Span 5) */}
        <Card className="lg:col-span-5 rounded-2xl shadow-elevation-1 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                Katalog Pasokan Gudang
              </CardTitle>
            </div>
            <CardAction>
              <Link
                href="/katalog"
                className="text-xs font-bold text-primary hover:underline"
              >
                Kelola &rarr;
              </Link>
            </CardAction>
          </CardHeader>

          <CardContent className="space-y-3">
            {commodities.length === 0 ? (
              <div className="p-8 text-center bg-surface-subtle/50 text-xs text-text-muted space-y-2 rounded-xl">
                <p className="font-semibold text-text-primary">Belum ada komoditas terdaftar</p>
                <p>Daftarkan komoditas agribisnis Anda untuk membuka peluang pooling kuota dengan ratusan UMKM.</p>
              </div>
            ) : (
              commodities.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-border bg-surface-subtle/50 hover:bg-surface-subtle transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading text-xs font-bold text-text-primary line-clamp-1">
                      {item.name}
                    </span>
                    <Badge variant={item.is_active ? "success" : "neutral"} className="text-[10px]">
                      {item.is_active ? "Aktif" : "Draft"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-secondary tabular-nums">
                    <span>Stok: <strong>{item.stock} {item.wholesale_unit}</strong></span>
                    <span className="text-primary font-semibold">
                      MOQ: {item.base_moq} {item.wholesale_unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-text-muted pt-1 border-t border-border/80">
                    <span>SKU: {item.sku}</span>
                    <span className="font-bold text-text-primary tabular-nums">
                      {formatCurrency(Number(item.base_price) || 0)} / {item.wholesale_unit}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>

          <div className="p-5 pt-0">
            <Button asChild variant="secondary" size="default" className="w-full font-bold text-xs min-h-[40px] rounded-xl">
              <Link href="/katalog/tambah">
                <span>+ Tambah Komoditas Baru</span>
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
