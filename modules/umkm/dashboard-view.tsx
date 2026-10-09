"use client";

import * as React from "react";
import Link from "next/link";
import {
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  TrendingDown,
  Layers,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { beFetch } from "@/lib/api/be-client";
import {
  getUmkmDashboardDataAction,
  type UmkmDashboardData,
  type KitchenRunoutAlert,
  type RecentOrderSummary,
  type RecentWasteSummary,
} from "@/actions/dashboard";

export interface MappedActivePool {
  id: string;
  commodityId: string;
  commodityName: string;
  category: string;
  targetMoqKg: number;
  accumulatedKg: number;
  pricePerKgWholesale: number;
  pricePerKgRetailMarket: number;
  supplierName: string;
  status: string;
  targetDeliveryDate: string | null;
  cutoffDate: string | null;
}

export function UmkmDashboardView() {
  const [dashboardData, setDashboardData] = React.useState<UmkmDashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("Semua");

  // State modal gabung pool
  const [activeJoinPool, setActiveJoinPool] = React.useState<MappedActivePool | null>(null);
  const [joinQuantity, setJoinQuantity] = React.useState<number>(50);
  const [deliveryMethod, setDeliveryMethod] = React.useState<"HEMAT_HUB" | "DIRECT_DELIVERY">("HEMAT_HUB");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const loadDashboard = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getUmkmDashboardDataAction();
      if (res.success && res.data) {
        setDashboardData(res.data);
      } else {
        toast.error("Gagal memuat data analitik dashboard dari backend.");
      }
    } catch {
      toast.error("Terjadi kendala saat menghubungkan dashboard ke backend.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Greeting berdasar jam saat ini
  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    const name = dashboardData?.session?.name || "Mitra UMKM";
    const shortName = name.split(" ")[0] ?? name;

    if (hour < 11) return `Selamat Pagi, ${shortName}`;
    if (hour < 15) return `Selamat Siang, ${shortName}`;
    if (hour < 18) return `Selamat Sore, ${shortName}`;
    return `Selamat Malam, ${shortName}`;
  }, [dashboardData?.session?.name]);

  // Map backend pools with rich commodity metadata
  const mappedPools: MappedActivePool[] = React.useMemo(() => {
    if (!dashboardData?.pools || dashboardData.pools.length === 0) return [];

    return dashboardData.pools.map((p) => {
      const name = p.commodity_name || "Komoditas Pertanian Pilihan";
      const category = "Pertanian";
      const targetMoq = Number(p.target_moq) || 50;
      const acc = Number(p.accumulated_qty) || 0;
      const price = Number(p.locked_tier_price) || 35000;
      const retail = Math.round(price * 1.22);

      return {
        id: p.id,
        commodityId: p.commodity_id,
        commodityName: name,
        category,
        targetMoqKg: targetMoq,
        accumulatedKg: acc,
        pricePerKgWholesale: price,
        pricePerKgRetailMarket: retail,
        supplierName: "Supplier Agribisnis Terverifikasi",
        status: p.pool_status,
        targetDeliveryDate: p.target_delivery_date,
        cutoffDate: p.cutoff_date,
      };
    });
  }, [dashboardData?.pools]);

  const categories = ["Semua", "Pertanian", "FnB / Pengolahan", "Peternakan", "Perikanan"];

  const filteredPools = React.useMemo(() => {
    if (selectedCategory === "Semua") return mappedPools;
    return mappedPools.filter((p) => p.category.toLowerCase().includes(selectedCategory.toLowerCase()));
  }, [mappedPools, selectedCategory]);

  const handleJoinPoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJoinPool) return;

    setIsSubmitting(true);
    try {
      const res = await beFetch<{
        participant?: unknown;
        pool?: unknown;
        order_id?: string;
      }>("/pre-orders/join", {
        method: "POST",
        body: JSON.stringify({
          pool_id: activeJoinPool.id,
          order_qty: joinQuantity,
          delivery_method: deliveryMethod,
          required_delivery_date: activeJoinPool.targetDeliveryDate || new Date().toISOString().slice(0, 10),
        }),
      });

      if (res.success) {
        toast.success(`Berhasil bergabung ke kuota patungan ${activeJoinPool.commodityName}!`);
        setActiveJoinPool(null);
        loadDashboard();
      } else {
        toast.error(res.message || "Gagal bergabung ke kuota pool.");
      }
    } catch {
      toast.error("Terjadi kendala saat menghubungi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const businessName = dashboardData?.session?.name || "Unit Usaha Dapur UMKM";

  return (
    <div className="flex flex-col gap-6 sm:gap-7">
      {/* 1. Header Section: Identitas Akun & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-semibold text-text-secondary">
              {businessName} &bull; Sektor Kuliner &amp; Pengolahan
            </span>
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text-primary tracking-tight mt-0.5">
            {greeting}
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Sentral pengadaan pasokan bahan baku, efisiensi modal, dan pemantauan stok dapur terintegrasi.
          </p>
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
            <Link href="/home">
              <ShoppingBag className="size-3.5" />
              <span>Beli Bahan Baku</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Empat Kartu Metrik Riil dari Backend (GET /api/dashboards/umkm) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Akumulasi Pengeluaran Belanja */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Total Belanja Pengadaan</span>
            <Badge variant="primary" className="text-[10px]">
              Terselesaikan
            </Badge>
          </div>
          <div>
            <p className="font-heading text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
              {formatCurrency(dashboardData?.total_procurement_spent || 0)}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Belanja pasokan grosir terverifikasi
            </p>
          </div>
          <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px] text-text-secondary">
            <span>Transaksi Settled</span>
            <span className="font-bold text-primary">Sistem Escrow</span>
          </div>
        </div>

        {/* Card 2: Estimasi Penghematan Belanja */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Estimasi Hemat Belanja</span>
            <Badge variant="waste" className="text-[10px]">
              Pooling MOQ
            </Badge>
          </div>
          <div>
            <p className="font-heading text-xl sm:text-2xl font-bold text-circular-waste tabular-nums">
              {formatCurrency(dashboardData?.estimated_procurement_savings || 0)}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Efisiensi modal belanja vs harga eceran pasar
            </p>
          </div>
          <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px] text-text-secondary">
            <span>Diskon Grosir Kolektif</span>
            <span className="font-bold text-circular-waste">~12% - 25%</span>
          </div>
        </div>

        {/* Card 3: Patungan Kuota Aktif */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Patungan Kuota Aktif</span>
            <Badge variant="secondary" className="text-[10px]">
              Bursa Berjalan
            </Badge>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <p className="font-heading text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
                {dashboardData?.active_participations_count || mappedPools.length}
              </p>
              <span className="text-xs font-semibold text-text-muted">Pool</span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              Kamar pooling yang sedang berjalan
            </p>
          </div>
          <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px] text-text-secondary">
            <span>Amankan Kuota</span>
            <span className="font-bold text-primary">Autonomous Aggregation</span>
          </div>
        </div>

        {/* Card 4: Monetisasi Residu & Sirkular */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Kas Limbah Sirkular</span>
            <Badge variant="waste" className="text-[10px]">
              Waste-to-Value
            </Badge>
          </div>
          <div>
            <p className="font-heading text-xl sm:text-2xl font-bold text-circular-waste tabular-nums">
              +{formatCurrency(dashboardData?.waste_revenue_earned || 0)}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              ~{dashboardData?.waste_diverted_kg || 0} kg residu dialihkan dari TPA
            </p>
          </div>
          <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px] text-text-secondary">
            <span>Dampak Lingkungan (ESG)</span>
            <span className="font-bold text-circular-waste">Tersalurkan Offtaker</span>
          </div>
        </div>
      </section>

      {/* 3. Radar Autonomous MOQ Pooling Aktif (Data dari /api/pre-orders/pools) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-base sm:text-lg font-bold text-text-primary">
                Radar Autonomous MOQ Pooling Aktif
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-text-inverse tabular-nums">
                {filteredPools.length}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Agregasi kuota pengadaan kolektif langsung terhubung dengan supplier hulu KUMPUL.
            </p>
          </div>

          {/* Filter Kategori */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-subtle rounded-xl border border-border overflow-x-auto max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer",
                  selectedCategory === cat
                    ? "bg-surface text-primary shadow-xs font-bold border border-border/80"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface/60"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Kartu Pool Aktif */}
        {filteredPools.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-border py-10 text-center">
            <CardContent className="space-y-2">
              <p className="font-heading font-bold text-sm text-text-primary">
                Belum ada pool aktif untuk kategori ini
              </p>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                Anda dapat memulai pengadaan bahan baku mandiri di Beranda atau menunggu kamar patungan baru dibuka.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredPools.map((pool) => {
              const percentage = Math.min(
                100,
                Math.round((pool.accumulatedKg / Math.max(1, pool.targetMoqKg)) * 100)
              );
              const savingsPerKg = Math.max(0, pool.pricePerKgRetailMarket - pool.pricePerKgWholesale);
              const isLocked = pool.status === "LOCKED";

              return (
                <Card
                  key={pool.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface shadow-elevation-1 transition-all duration-200 hover:shadow-elevation-2"
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Header Komoditas & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-md border border-primary/20">
                          {pool.category}
                        </span>
                        <h3 className="font-heading font-bold text-base text-text-primary leading-snug line-clamp-1" title={pool.commodityName}>
                          {pool.commodityName}
                        </h3>
                        <p className="text-xs text-text-muted truncate" title={pool.supplierName}>
                          {pool.supplierName}
                        </p>
                      </div>

                      {isLocked ? (
                        <Badge variant="success">Kuota Terkunci</Badge>
                      ) : (
                        <Badge variant="primary" className="gap-1.5 font-bold">
                          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                          <span>{percentage}% Tercapai</span>
                        </Badge>
                      )}
                    </div>

                    {/* Progress Bar Kuota MOQ */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary font-medium">Akumulasi Kuota:</span>
                        <span className="font-bold text-text-primary tabular-nums">
                          {pool.accumulatedKg} / {pool.targetMoqKg} kg
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-border/80 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Snapshot Harga & Target Kirim */}
                    <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-surface-subtle/80 border border-border/80 text-xs">
                      <div>
                        <span className="text-[10px] text-text-muted block">Harga Patungan:</span>
                        <span className="font-bold text-text-primary tabular-nums block">
                          {formatCurrency(pool.pricePerKgWholesale)}/kg
                        </span>
                        <span className="text-[10px] text-circular-waste font-semibold">
                          Hemat {formatCurrency(savingsPerKg)}/kg
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted block">Target Delivery:</span>
                        <span className="font-semibold text-text-primary block">
                          {pool.targetDeliveryDate || "Sesuai Jadwal Hub"}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          Batas: {pool.cutoffDate || "Segera"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi Gabung Kuota */}
                  <div className="p-4 sm:px-6 bg-surface-subtle/40 border-t border-border/70 flex items-center justify-between gap-3">
                    <span className="text-xs text-text-secondary">
                      {isLocked ? "Kuotanya sudah penuh & terkunci." : "Kunci kuota sekarang."}
                    </span>

                    <Button
                      type="button"
                      variant={isLocked ? "outline" : "primary"}
                      size="sm"
                      disabled={isLocked}
                      onClick={() => {
                        setActiveJoinPool(pool);
                        setJoinQuantity(50);
                      }}
                      className="rounded-xl font-bold text-xs"
                    >
                      {isLocked ? "Terkunci" : "Gabung Kuota"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Ketahanan Stok Dapur (Kitchen Runout Predictor dari Resep Database) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border/70">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-base sm:text-lg font-bold text-text-primary">
                Ketahanan Stok Dapur (Kitchen Runout Predictor)
              </h2>
              {dashboardData?.kitchen_runout_alerts && dashboardData.kitchen_runout_alerts.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-subtle text-text-secondary border border-border">
                  {dashboardData.kitchen_runout_alerts.length} Bahan
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Prediksi laju konsumsi harian bahan baku dihitung langsung dari komposisi resep menu produk UMKM Anda.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-bold gap-1 self-start sm:self-auto">
            <Link href="/produk#kitchen-inventory">
              <span>Kelola Stok Lengkap</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        {(!dashboardData?.kitchen_runout_alerts || dashboardData.kitchen_runout_alerts.length === 0) ? (
          <Card className="rounded-2xl border border-dashed border-border py-8 text-center">
            <p className="text-xs text-text-secondary">
              Belum ada bahan baku resep terdaftar. Tambahkan resep di halaman Produk untuk mengaktifkan pemantau stok dapur otomatis.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.kitchen_runout_alerts.slice(0, 6).map((alert, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-border bg-surface shadow-elevation-1 flex flex-col justify-between gap-3 hover:border-border-strong transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-text-primary line-clamp-1" title={alert.ingredient_name}>
                        {alert.ingredient_name}
                      </h4>
                      {alert.is_urgent ? (
                        <Badge variant="warning" className="text-[10px] font-bold shrink-0">
                          Perlu Restok
                        </Badge>
                       ) : (
                        <Badge variant="primary" className="text-[10px] shrink-0">
                          Aman
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-text-secondary">
                      Laju Pemakaian: <strong className="text-text-primary tabular-nums">{alert.daily_consumption_rate} {alert.unit}</strong>/hari
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs">
                    <span className="text-text-muted">
                      Sisa Ketahanan: <strong className="text-primary font-bold">{alert.days_until_runout} Hari</strong>
                    </span>

                    <Button asChild variant="primary" size="sm" className="rounded-xl text-xs font-bold">
                      <Link href={`/home?search=${encodeURIComponent(alert.ingredient_name)}`}>
                        <span>Restok di Bursa</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {dashboardData.kitchen_runout_alerts.length > 6 && (
              <div className="p-4 rounded-2xl bg-surface-subtle/80 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-text-primary block">
                    Tersisa {dashboardData.kitchen_runout_alerts.length - 6} bahan baku lainnya dalam pantauan dapur
                  </span>
                  <p className="text-[11px] text-text-secondary">
                    Buka tabel buku besar pengolahan stok untuk melihat seluruh daftar bahan, opname fisik aktual, dan navigasi halaman.
                  </p>
                </div>
                <Button asChild variant="primary" size="sm" className="rounded-xl text-xs font-bold gap-1.5 shrink-0 self-start sm:self-auto">
                  <Link href="/produk#kitchen-inventory">
                    <span>Buka Pengolahan Stok Dapur</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. Dua Kolom: Pengadaan Bersama Terkini & Bursa Limbah Produktif */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
        {/* Kolom Kiri: Riwayat Pengadaan / Pesanan Terkini */}
        <Card className="lg:col-span-7 rounded-2xl shadow-elevation-1 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                Pesanan Pengadaan Terkini
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary mt-0.5">
                Daftar pesanan bahan baku yang sedang diproses atau siap diambil.
              </CardDescription>
            </div>
            <Link href="/pesanan" className="text-xs font-bold text-primary hover:underline">
              Lihat Semua &rarr;
            </Link>
          </CardHeader>

          <CardContent className="space-y-3">
            {(!dashboardData?.recent_orders || dashboardData.recent_orders.length === 0) ? (
              <div className="p-8 text-center rounded-xl bg-surface-subtle text-xs text-text-muted space-y-2">
                <p className="font-semibold text-text-primary">Belum ada pesanan pengadaan aktif</p>
                <p>Ikuti kamar pooling atau beli bahan langsung di bursa untuk melacak status pesanan di sini.</p>
                <Button asChild variant="primary" size="sm" className="rounded-xl text-xs font-bold mt-2">
                  <Link href="/home">Mulai Pengadaan</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/80">
                {dashboardData.recent_orders.map((o) => (
                  <div key={o.order_id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h5 className="font-bold text-text-primary truncate" title={o.commodity_name}>{o.commodity_name}</h5>
                      <span className="text-[11px] text-text-muted block truncate">
                        Volume: {o.order_qty} kg &bull; Delivery: {o.delivery_method || "Hub"}
                      </span>
                    </div>

                    <div className="text-right space-y-1 shrink-0">
                      <span className="font-bold text-text-primary block tabular-nums">
                        {formatCurrency(o.grand_total)}
                      </span>
                      <Badge variant={o.payment_status === "SETTLED" ? "success" : "primary"} className="text-[10px]">
                        {o.payment_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kolom Kanan: Bursa Limbah Produktif (Waste-to-Value) */}
        <Card className="lg:col-span-5 rounded-2xl shadow-elevation-1 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                Bursa Limbah Produktif
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary mt-0.5">
                Listing sisa olahan dapur yang terhubung ke offtaker bursa.
              </CardDescription>
            </div>
            <Badge variant="waste">Sirkular</Badge>
          </CardHeader>

          <CardContent className="space-y-3">
            {(!dashboardData?.recent_waste_listings || dashboardData.recent_waste_listings.length === 0) ? (
              <div className="p-8 text-center rounded-xl bg-surface-subtle text-xs text-text-muted space-y-2">
                <p className="font-semibold text-text-primary">Belum ada listing limbah aktif</p>
                <p>Monetisasi residu dapur katering atau minyak jelantah Anda ke offtaker terverifikasi.</p>
              </div>
            ) : (
              dashboardData.recent_waste_listings.map((w) => (
                <div
                  key={w.listing_id}
                  className="p-3 rounded-xl border border-border bg-surface-subtle/50 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-bold text-text-primary truncate" title={w.listing_title}>{w.listing_title}</h5>
                    <Badge variant="waste" className="text-[10px] shrink-0">
                      {w.listing_status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-text-secondary text-[11px]">
                    <span className="truncate">Kategori: {w.waste_category}</span>
                    <span className="font-bold text-circular-waste tabular-nums shrink-0">{w.available_weight} kg</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>

          <div className="p-5 pt-0">
            <Button asChild variant="secondary" size="default" className="w-full font-bold text-xs min-h-[40px] rounded-xl">
              <Link href="/limbah">
                <span>Kelola Bursa Limbah &rarr;</span>
              </Link>
            </Button>
          </div>
        </Card>
      </section>

      {/* 6. Modal Interaktif: Gabung Kuota Pooling (POST /api/pre-orders/join) */}
      {activeJoinPool && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-surface rounded-3xl border border-border p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-border/80 pb-3.5 gap-2">
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-bold text-primary bg-primary-light px-2.5 py-0.5 rounded-md border border-primary/20">
                  {activeJoinPool.category}
                </span>
                <h3 className="font-heading text-lg font-bold text-text-primary leading-tight line-clamp-2" title={`Gabung Kuota: ${activeJoinPool.commodityName}`}>
                  Gabung Kuota: {activeJoinPool.commodityName}
                </h3>
                <p className="text-xs text-text-muted truncate" title={activeJoinPool.supplierName}>
                  {activeJoinPool.supplierName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveJoinPool(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
                aria-label="Tutup modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinPoolSubmit} className="space-y-4">
              {/* Input Kuantitas Pembelian */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary block">
                  Kebutuhan Volume Belanja (kg) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={10}
                    step={5}
                    value={joinQuantity}
                    onChange={(e) => setJoinQuantity(Math.max(1, Number(e.target.value)))}
                    className="flex-1 h-[44px] px-3.5 rounded-xl border border-border bg-surface text-text-primary font-heading text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                  <span className="text-xs font-semibold text-text-muted px-2">kg</span>
                </div>
                <p className="text-[11px] text-text-muted">
                  Target kuota MOQ pool: <strong>{activeJoinPool.targetMoqKg} kg</strong> (Terkumpul: {activeJoinPool.accumulatedKg} kg)
                </p>
              </div>

              {/* Opsi Logistik Pengiriman */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-primary block">
                  Opsi Logistik Pengiriman *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("HEMAT_HUB")}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all cursor-pointer",
                      deliveryMethod === "HEMAT_HUB"
                        ? "border-primary bg-primary-light/40 ring-2 ring-primary/20"
                        : "border-border bg-surface hover:bg-surface-subtle"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">Hemat Hub</span>
                      <span className="text-[10px] font-bold text-circular-waste bg-circular-waste-light px-1.5 py-0.5 rounded">
                        Gratis Ongkir
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-1 leading-snug">
                      Ambil di Hub Konsolidasi terdekat (Bagi ongkir armada).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("DIRECT_DELIVERY")}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all cursor-pointer",
                      deliveryMethod === "DIRECT_DELIVERY"
                        ? "border-primary bg-primary-light/40 ring-2 ring-primary/20"
                        : "border-border bg-surface hover:bg-surface-subtle"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">Direct Delivery</span>
                      <span className="text-[10px] text-text-muted">+Rp 25.000</span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-1 leading-snug">
                      Diantar langsung ke alamat dapur/usaha UMKM Anda.
                    </p>
                  </button>
                </div>
              </div>

              {/* Rangkuman Finansial */}
              <div className="p-4 rounded-2xl bg-surface-subtle/80 border border-border space-y-2 text-xs">
                <div className="flex justify-between items-center text-text-secondary">
                  <span>Harga Patungan ({joinQuantity} kg):</span>
                  <span className="font-bold text-text-primary tabular-nums">
                    {formatCurrency(joinQuantity * activeJoinPool.pricePerKgWholesale)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-text-secondary">
                  <span>Harga Eceran Pasar:</span>
                  <span className="line-through text-text-muted tabular-nums">
                    {formatCurrency(joinQuantity * activeJoinPool.pricePerKgRetailMarket)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-text-secondary">
                  <span>Biaya Pengiriman:</span>
                  <span className="font-bold text-circular-waste">
                    {deliveryMethod === "HEMAT_HUB" ? "GRATIS (Hub Konsolidasi)" : "+Rp 25.000"}
                  </span>
                </div>

                <div className="pt-2 border-t border-border flex justify-between items-center text-sm font-bold">
                  <span className="text-text-primary">Total Bayar:</span>
                  <span className="text-primary text-base font-bold tabular-nums">
                    {formatCurrency(
                      joinQuantity * activeJoinPool.pricePerKgWholesale +
                        (deliveryMethod === "DIRECT_DELIVERY" ? 25000 : 0)
                    )}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-circular-waste-light text-circular-waste text-center font-bold text-xs border border-circular-waste/20">
                  Hemat {formatCurrency(joinQuantity * (activeJoinPool.pricePerKgRetailMarket - activeJoinPool.pricePerKgWholesale))} pada transaksi patungan ini!
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveJoinPool(null)}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-semibold"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-bold"
                >
                  {isSubmitting ? "Memproses..." : "Konfirmasi & Gabung Kuota"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
