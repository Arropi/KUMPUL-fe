"use client";

import * as React from "react";
import Link from "next/link";
import {
  MOCK_UMKM_PROFILE,
  MOCK_ACTIVE_POOLS,
  MOCK_UMKM_PURCHASE_HISTORY,
  MOCK_WASTE_LISTINGS,
  ActivePoolItem,
} from "@/constants/umkm";
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

type TimelineOptionValue = "7d" | "30d" | "90d";

interface TimelineOption {
  value: TimelineOptionValue;
  label: string;
}

const TIMELINE_OPTIONS: TimelineOption[] = [
  { value: "7d", label: "7 Hari Terakhir" },
  { value: "30d", label: "30 Hari Terakhir" },
  { value: "90d", label: "Kuartal Ini" },
];

function useGreeting(ownerName: string) {
  return React.useMemo(() => {
    const hour = new Date().getHours();
    const shortName = ownerName.split(" ")[0] ?? ownerName;

    if (hour < 11) return `Selamat Pagi, ${shortName}`;
    if (hour < 15) return `Selamat Siang, ${shortName}`;
    if (hour < 18) return `Selamat Sore, ${shortName}`;
    return `Selamat Malam, ${shortName}`;
  }, [ownerName]);
}

// Donut Score Gauge Component bergaya Bionis Dashboard
function ScoreDonut({ value = 88, label = "Efisiensi" }: { value?: number; label?: string }) {
  const radius = 48;
  const strokeWidth = 9;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="text-surface-sunken"
        />
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="text-primary transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-heading text-2xl font-black text-text-primary tabular-nums">
          {value}%
        </span>
        <span className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">
          {label}
        </span>
      </div>
    </div>
  );
}

function InsightBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-xl bg-surface border border-border/80 px-2.5 py-1 text-[11px] font-semibold tracking-tight text-text-secondary shadow-xs">
      {children}
    </span>
  );
}

export function UmkmDashboardView() {
  const greeting = useGreeting(MOCK_UMKM_PROFILE.ownerName);
  const [timeline, setTimeline] = React.useState<TimelineOptionValue>("7d");
  const [pools, setPools] = React.useState<ActivePoolItem[]>(MOCK_ACTIVE_POOLS);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("Semua");
  const [activeJoinPool, setActiveJoinPool] = React.useState<ActivePoolItem | null>(null);
  const [joinQuantity, setJoinQuantity] = React.useState<number>(50);
  const [deliveryMethod, setDeliveryMethod] = React.useState<"HEMAT_HUB" | "DIRECT_DELIVERY">("HEMAT_HUB");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const selectedLabel =
    TIMELINE_OPTIONS.find((opt) => opt.value === timeline)?.label ?? "7 Hari Terakhir";

  const totalSavings = MOCK_UMKM_PURCHASE_HISTORY.reduce(
    (acc, curr) => acc + curr.savingsAmount,
    0
  );

  const totalVolumeBought = MOCK_UMKM_PURCHASE_HISTORY.reduce(
    (acc, curr) => acc + curr.volumeKg,
    0
  );

  const categories = [
    "Semua",
    "Beras & Biji-bijian",
    "Bumbu & Rempah",
    "Minyak & Gula",
    "Unggas & Daging",
  ];

  const filteredPools =
    selectedCategory === "Semua"
      ? pools
      : pools.filter((p) => p.category === selectedCategory);

  const handleJoinPoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJoinPool) return;

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const addedKg = Number(joinQuantity);

      setPools((prev) =>
        prev.map((p) => {
          if (p.id === activeJoinPool.id) {
            const newAccumulated = p.accumulatedKg + addedKg;
            return {
              ...p,
              accumulatedKg: newAccumulated,
              participantsCount: p.participantsCount + 1,
              status: newAccumulated >= p.targetMoqKg ? "LOCKED" : "AGGREGATING",
            };
          }
          return p;
        })
      );

      toast.success(
        `Berhasil bergabung ke pooling ${activeJoinPool.commodityName} sebesar ${addedKg} kg dengan Opsi ${
          deliveryMethod === "HEMAT_HUB" ? "Hemat (Ambil di Hub)" : "Kirim Langsung"
        }.`,
        "Kuota Pooling Berhasil Ditambahkan"
      );

      setActiveJoinPool(null);
    }, 600);
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-7">
      {/* 1. Header Section: Greeting + Profile Badge + Timeline Filter Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-text-muted">
              {MOCK_UMKM_PROFILE.name} &bull; {MOCK_UMKM_PROFILE.sectorLabel}
            </span>
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight mt-0.5">
            {greeting}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                size="default"
                className="h-10 shrink-0 gap-2 rounded-xl px-3.5 text-xs sm:text-sm font-semibold shadow-xs"
              >
                <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{selectedLabel}</span>
                <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuRadioGroup
                value={timeline}
                onValueChange={(val) => setTimeline(val as TimelineOptionValue)}
              >
                {TIMELINE_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/umkm/katalog">
            <Button variant="primary" size="default" className="font-bold">
              + Cari Bahan Baku
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Hero Section: Overall Procurement Wellness with Score Donut */}
      <section className="bg-surface rounded-3xl border border-border/80 p-6 sm:p-7 shadow-elevation-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-primary/5 pointer-events-none blur-2xl" />

        <div className="flex min-h-28 flex-col justify-between gap-3 max-w-xl relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-xl bg-primary/10 px-3 py-1 text-xs font-bold text-primary border border-primary/20">
                Efisiensi Arus Kas: Sangat Baik
              </span>
              <span className="text-xs text-text-muted font-medium">
                Autonomous Pooling Terverifikasi
              </span>
            </div>
            <h2 className="font-heading text-lg sm:text-xl font-bold text-text-primary">
              Sentral Pengadaan Bahan Baku &amp; Autonomous Pooling
            </h2>
          </div>

          <p className="font-sans text-xs sm:text-sm leading-relaxed text-text-secondary">
            Melalui agregasi kuota pesanan bersama UMKM regional, tokomu telah menghemat biaya modal belanja hingga{" "}
            <span className="font-bold text-text-primary">22.4%</span> dari harga eceran pasar tradisional. Seluruh bahan baku terjamin oleh Paspor Mutu produsen hulu.
          </p>

          <div className="flex items-center gap-3 pt-1 text-xs text-text-muted">
            <span>Titik Hub Terdekat: <strong className="text-primary font-semibold">{MOCK_UMKM_PROFILE.preferredHubName}</strong></span>
            <span>&bull;</span>
            <span>Paket Siap Ambil: <strong className="text-success font-semibold">1 Pesanan di Hub</strong></span>
          </div>
        </div>

        <div className="flex items-center justify-center shrink-0 w-full md:w-auto relative z-10">
          <ScoreDonut value={88} label="Efisiensi" />
        </div>
      </section>

      {/* 3. Key Metrics Section: 4-Column Grid Snapshot */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-bold text-text-primary">
            Metrik Penghematan &amp; Pengadaan
          </h2>
          <span className="text-xs text-text-muted font-medium">
            Snapshot performa belanja vs harga pasar eceran
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Akumulasi Penghematan Belanja */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">Akumulasi Hemat Belanja</span>
              <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs font-bold">
                Rp
              </span>
            </div>
            <div>
              <p className="font-heading text-xl sm:text-2xl font-black text-text-primary tabular-nums">
                {formatCurrency(totalSavings)}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                Dibandingkan belanja di pasar tradisional
              </p>
            </div>
            <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px]">
              <span className="text-success font-bold">+22.4%</span>
              <span className="text-text-muted">margin hemat modal</span>
            </div>
          </div>

          {/* Card 2: Volume Bahan Terpenuhi */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">Volume Bahan Terpenuhi</span>
              <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-bold">
                Kg
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-xl sm:text-2xl font-black text-text-primary tabular-nums">
                  {formatNumber(totalVolumeBought)}
                </span>
                <span className="text-xs font-semibold text-text-muted">kg</span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Beras, bawang merah, &amp; minyak curah higienis
              </p>
            </div>
            <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px]">
              <span className="text-text-primary font-semibold">3 Transaksi PO</span>
              <span className="text-primary font-semibold">100% Paspor Mutu</span>
            </div>
          </div>

          {/* Card 3: Efisiensi Biaya Logistik */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">Efisiensi Logistik Hub</span>
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                %
              </span>
            </div>
            <div>
              <p className="font-heading text-xl sm:text-2xl font-black text-text-primary tabular-nums">
                100%
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                Bebas ongkir pengiriman via Hub Rungkut
              </p>
            </div>
            <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px]">
              <span className="text-success font-bold">Hemat Rp 75.000</span>
              <span className="text-text-muted">ongkir armada bersama</span>
            </div>
          </div>

          {/* Card 4: Kepatuhan Paspor Mutu Mandiri */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">Paspor Mutu Mandiri</span>
              <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center text-xs font-bold">
                ★
              </span>
            </div>
            <div>
              <p className="font-heading text-xl sm:text-2xl font-black text-primary tabular-nums">
                94 / 100
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                Standar Higienitas Dapur &amp; HACCP Terpenuhi
              </p>
            </div>
            <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px]">
              <span className="text-text-secondary font-semibold">Audit: 28 Sep</span>
              <span className="text-success font-bold">Grade A</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Charts Section (2 Columns: Penghematan Trend & Jadwal Hub) */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Chart 1: Tren Penghematan Modal Belanja UMKM */}
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-elevation-1 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-sm sm:text-base font-bold text-text-primary">
                Tren Penghematan Modal Belanja UMKM
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Akumulasi margin hemat harian vs harga eceran ({selectedLabel})
              </p>
            </div>
            <InsightBadge>Hub Rungkut Pangan</InsightBadge>
          </div>

          {/* Visual Bar Chart SVG */}
          <div className="h-44 w-full flex items-end justify-between gap-2 pt-6 pb-2 px-1">
            {[
              { day: "Sen", hemat: 145000, percent: 50, active: false },
              { day: "Sel", hemat: 210000, percent: 72, active: false },
              { day: "Rab", hemat: 185000, percent: 64, active: false },
              { day: "Kam", hemat: 260000, percent: 90, active: false },
              { day: "Jum", hemat: 290000, percent: 100, active: true },
              { day: "Sab", hemat: 220000, percent: 76, active: false },
              { day: "Min", hemat: 120000, percent: 42, active: false },
            ].map((item) => (
              <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-semibold text-text-muted opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                  Rp {(item.hemat / 1000).toFixed(0)}rb
                </span>
                <div className="w-full max-w-[36px] bg-surface-sunken rounded-t-lg h-full flex items-end p-0.5">
                  <div
                    className={cn(
                      "w-full rounded-md transition-all duration-500",
                      item.active
                        ? "bg-primary shadow-xs"
                        : "bg-primary/50 group-hover:bg-primary/80"
                    )}
                    style={{ height: `${item.percent}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-text-secondary">
                  {item.day}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs text-text-muted">
            <span>Puncak Hemat: <strong className="text-text-primary">Jumat (Rp 290.000)</strong></span>
            <span>Total Siklus: <strong className="text-primary">{formatCurrency(totalSavings)}</strong></span>
          </div>
        </div>

        {/* Chart 2: Status Pengiriman & Pengambilan Hub */}
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-elevation-1 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-sm sm:text-base font-bold text-text-primary">
                Status Distribusi &amp; Pengambilan Hub
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Alur pengiriman bahan baku menuju dapur tokomu
              </p>
            </div>
            <InsightBadge>Armada Terpadu</InsightBadge>
          </div>

          {/* Visual Step Activity Chart */}
          <div className="h-44 w-full flex flex-col justify-between pt-2 pb-1">
            <div className="space-y-3">
              {[
                { route: "Beras Ramos & Minyak Curah (PO-UMKM-0891)", status: "Siap Diambil di Hub", progress: 100, color: "bg-emerald-500" },
                { route: "Bawang Merah Brebes (PO-UMKM-0904)", status: "Dalam Perjalanan ke Hub", progress: 65, color: "bg-primary" },
                { route: "Daging Ayam Karkas Segar (PO-UMKM-0912)", status: "Dikemas Supplier", progress: 35, color: "bg-accent" },
              ].map((routeItem) => (
                <div key={routeItem.route} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary line-clamp-1">{routeItem.route}</span>
                    <span className="text-text-muted text-[11px] shrink-0 font-medium">{routeItem.status}</span>
                  </div>
                  <div className="w-full bg-surface-sunken h-2.5 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", routeItem.color)}
                      style={{ width: `${routeItem.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs text-text-muted">
              <span>Hub Pengambilan: <strong className="text-text-primary">Hub Rungkut Pangan</strong></span>
              <span className="text-success font-semibold">1 Kode Pick-Up Aktif</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Tri-Column Deep Insights Section (Prediksi AI, Vitalitas Stok, Rekomendasi Aksi) */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Card 1: AI Needs & Price Prediction (Gradient Indigo) */}
        <article className="flex min-h-[340px] flex-col justify-between gap-5 rounded-3xl border border-indigo-500/20 bg-[linear-gradient(180deg,rgb(99_102_241/0.08)_0%,transparent_45%)] p-5 shadow-elevation-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              <h3 className="font-heading text-sm font-bold text-text-primary">
                Prediksi Pengadaan AI
              </h3>
            </div>
            <InsightBadge>Outlook 7 Hari</InsightBadge>
          </div>

          <div className="flex flex-1 flex-col gap-2.5">
            <div className="flex items-start gap-3 rounded-2xl bg-surface/80 border border-border/70 p-3 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-xs font-bold text-text-primary">Sinyal Kenaikan Cabai &amp; Bawang</p>
                <p className="text-[11px] text-text-secondary leading-snug">
                  Harga grosir diprediksi naik +12% pekan depan akibat cuaca. Kunci kuota pooling sekarang.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-surface/80 border border-border/70 p-3 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-xs font-bold text-text-primary">Peluang Hemat Beras Rojolele</p>
                <p className="text-[11px] text-text-secondary leading-snug">
                  Tersisa 80 kg lagi menuju diskon grosir tier 2. Gabung sekarang untuk hemat Rp 2.500/kg.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-surface/80 border border-border/70 p-3 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-xs font-bold text-text-primary">Lonjakan Order Katering Akhir Pekan</p>
                <p className="text-[11px] text-text-secondary leading-snug">
                  Rekomendasi alokasi pasokan ayam potong 40 kg untuk antisipasi pesanan pesta.
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* Card 2: Kitchen Stock & Sanitation Vitals (Gradient Rose/Amber) */}
        <article className="flex min-h-[340px] flex-col justify-between gap-5 rounded-3xl border border-rose-500/20 bg-[linear-gradient(180deg,rgb(244_63_94/0.08)_0%,transparent_45%)] p-5 shadow-elevation-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </span>
              <h3 className="font-heading text-sm font-bold text-text-primary">
                Ketahanan Stok Dapur
              </h3>
            </div>
            <InsightBadge>Audit Mandiri</InsightBadge>
          </div>

          <div className="flex flex-1 flex-col justify-between rounded-2xl bg-surface/80 border border-border/70 p-3.5 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between text-xs py-1 border-b border-border/60">
              <span className="text-text-secondary">Stok Beras Ramos</span>
              <span className="font-bold text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-md">Sisa 3 Hari</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-border/60">
              <span className="text-text-secondary">Minyak Goreng Higienis</span>
              <span className="font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md">Sisa 8 Hari (Aman)</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-border/60">
              <span className="text-text-secondary">Suhu Chiller Katering</span>
              <span className="font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md">3.4°C (Optimal)</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-text-secondary">Skor Paspor Mutu Mandiri</span>
              <span className="font-bold text-primary">94 / 100 (Grade A)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs text-text-muted">
            <span>Sertifikasi: <strong className="text-success font-semibold">HACCP &amp; Higienis Valid</strong></span>
            <span className="text-primary font-semibold">Dapur Terstandarisasi</span>
          </div>
        </article>

        {/* Card 3: Circular & Quick Actions (Gradient Emerald) */}
        <article className="flex min-h-[340px] flex-col justify-between gap-5 rounded-3xl border border-emerald-500/20 bg-[linear-gradient(180deg,rgb(16_185_129/0.08)_0%,transparent_45%)] p-5 shadow-elevation-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <h3 className="font-heading text-sm font-bold text-text-primary">
                Rekomendasi Tindakan Cepat
              </h3>
            </div>
            <InsightBadge>Prioritas Tinggi</InsightBadge>
          </div>

          <div className="flex flex-1 flex-col gap-2.5">
            <Link
              href="/umkm/pesanan"
              className="group flex items-start justify-between gap-3 rounded-2xl bg-surface/80 border border-border/70 p-3 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all shadow-xs"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-xs font-bold text-text-primary group-hover:text-emerald-700 transition-colors">
                  Ambil Pesanan di Hub Rungkut
                </p>
                <p className="text-[11px] text-text-secondary leading-snug">
                  Kode Pick-Up: <strong className="font-mono text-primary">HUB-RNK-8812</strong>
                </p>
              </div>
              <span className="text-xs text-emerald-600 font-bold shrink-0 mt-0.5">&rarr;</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                const target = pools.find((p) => p.status === "AGGREGATING");
                if (target) {
                  setActiveJoinPool(target);
                  setJoinQuantity(50);
                }
              }}
              className="group flex items-start justify-between gap-3 rounded-2xl bg-surface/80 border border-border/70 p-3 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-xs text-left cursor-pointer"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                  Kunci Kuota Pooling Segera
                </p>
                <p className="text-[11px] text-text-secondary leading-snug">
                  Bergabung ke pooling terdekat untuk amankan harga grosir.
                </p>
              </div>
              <span className="text-xs text-primary font-bold shrink-0 mt-0.5">&rarr;</span>
            </button>

            <Link
              href="/umkm/sirkular"
              className="group flex items-start justify-between gap-3 rounded-2xl bg-surface/80 border border-border/70 p-3 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all shadow-xs"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-xs font-bold text-text-primary group-hover:text-emerald-700 transition-colors">
                  Jual Limbah Organik Dapur (Eco)
                </p>
                <p className="text-[11px] text-text-secondary leading-snug">
                  15 kg ampas kedelai siap diambil peternak mitra (+Rp 37.500).
                </p>
              </div>
              <span className="text-xs text-emerald-600 font-bold shrink-0 mt-0.5">&rarr;</span>
            </Link>
          </div>
        </article>
      </section>

      {/* 6. Autonomous MOQ Pooling Radar Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-base sm:text-lg font-bold text-text-primary">
                Radar Autonomous MOQ Pooling Aktif
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary text-text-inverse tabular-nums">
                {filteredPools.length}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Pilih komoditas yang sedang dikumpulkan bersama UMKM dalam radius logistik Jawa Timur.
            </p>
          </div>

          {/* Filter Kategori Pill Bergaya Watermelon UI */}
          <div className="flex items-center gap-1.5 p-1 bg-background rounded-xl border border-border overflow-x-auto max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[36px] px-3.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  selectedCategory === cat
                    ? "bg-surface text-primary shadow-[inset_0_1px_0_#FFFFFF,inset_0_-1px_0_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.06)] font-bold border border-border"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Kartu Radar Pooling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPools.map((pool) => {
            const percentage = Math.min(
              Math.round((pool.accumulatedKg / pool.targetMoqKg) * 100),
              100
            );
            const savingsPerKg = pool.pricePerKgRetailMarket - pool.pricePerKgWholesale;
            const isLocked = pool.status === "LOCKED";

            return (
              <Card
                key={pool.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border-border bg-surface shadow-elevation-1 transition-all duration-200 hover:shadow-elevation-2"
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Header Komoditas & Supplier */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md border border-primary/20">
                        {pool.category}
                      </span>
                      <h3 className="font-heading text-base font-bold text-text-primary mt-1.5">
                        {pool.commodityName}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        Pemasok: <strong className="text-text-secondary">{pool.supplierName}</strong> ({pool.supplierLocation})
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {isLocked ? (
                        <Badge variant="success" className="font-semibold">
                          Terkunci (Siap Kirim)
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="font-semibold tabular-nums gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                          {pool.expiryHoursRemaining}j lagi
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Paspor Mutu Badge */}
                  <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                    <span className="font-bold text-success flex items-center gap-1">
                      <span>✓</span> {pool.qualityBadge.grade}
                    </span>
                    <span>&bull;</span>
                    <span className="text-text-muted truncate">{pool.qualityBadge.certification}</span>
                  </div>

                  {/* Progress Bar Kuota MOQ Pooling */}
                  <div className="p-3.5 rounded-xl bg-surface-subtle border border-border/70 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary font-medium">
                        Kuota Terkumpul: <strong className="text-text-primary tabular-nums">{pool.accumulatedKg}</strong> / {pool.targetMoqKg} kg
                      </span>
                      <span className="font-black text-primary tabular-nums">
                        {percentage}%
                      </span>
                    </div>

                    <div className="w-full bg-border/60 h-2 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isLocked ? "bg-emerald-600" : "bg-primary"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-text-muted pt-0.5">
                      <span>{pool.participantsCount} UMKM telah bergabung</span>
                      <span>Satuan: {pool.unit}</span>
                    </div>
                  </div>

                  {/* Perbandingan Harga & Tombol Aksi */}
                  <div className="pt-2 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-heading text-xl font-extrabold text-primary tabular-nums">
                          {formatCurrency(pool.pricePerKgWholesale)}
                        </span>
                        <span className="text-xs text-text-muted">/ kg grosir</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 font-semibold">
                        Hemat {formatCurrency(savingsPerKg)}/kg vs pasar
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant={isLocked ? "secondary" : "primary"}
                      size="default"
                      onClick={() => {
                        setActiveJoinPool(pool);
                        setJoinQuantity(50);
                      }}
                      className="font-bold shrink-0 min-h-[40px]"
                      disabled={isLocked}
                    >
                      {isLocked ? "Kuota Penuh" : "Gabung Kuota (Join Pool)"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 5. Section Riwayat Pengadaan & Bursa Limbah */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
        {/* Kolom 8: Riwayat Pengadaan & Pesanan Bersama */}
        <Card className="lg:col-span-8 rounded-2xl shadow-elevation-1">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                Pengadaan Bersama Saya
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary mt-0.5">
                Daftar komoditas yang sedang diproses supplier atau siap diambil di Hub.
              </CardDescription>
            </div>
            <Link
              href="/umkm/pesanan"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Lihat Semua &rarr;
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {MOCK_UMKM_PURCHASE_HISTORY.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-subtle/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-text-primary">
                        {item.orderNumber}
                      </span>
                      <span className="text-text-muted">&bull;</span>
                      <span className="text-xs text-text-muted">{item.orderDate}</span>
                    </div>
                    <h4 className="font-heading text-sm font-bold text-text-primary">
                      {item.commodityName}
                    </h4>
                    <p className="text-xs text-text-secondary">
                      Jumlah: <strong className="text-text-primary">{item.unit}</strong> ({item.volumeKg} kg)
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-2">
                    <div>
                      <p className="font-heading text-base font-bold text-primary tabular-nums text-right">
                        {formatCurrency(item.totalWholesalePaid)}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-semibold text-right">
                        Hemat {formatCurrency(item.savingsAmount)}
                      </p>
                    </div>

                    {item.status === "TIBA_DI_HUB" && item.hubPickupCode ? (
                      <div className="bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 px-3 py-1 rounded-xl text-center">
                        <span className="text-[10px] block font-semibold">Kode Ambil Hub:</span>
                        <strong className="font-mono text-xs font-black tracking-wider">
                          {item.hubPickupCode}
                        </strong>
                      </div>
                    ) : item.status === "DIPROSES_SUPPLIER" ? (
                      <Badge variant="info">Sedang Dikemas Supplier</Badge>
                    ) : (
                      <Badge variant="success">Selesai</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Kolom 4: Widget Monetisasi Limbah Sirkular (Waste-to-Value) */}
        <Card className="lg:col-span-4 rounded-2xl shadow-elevation-1 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-text-primary">
                Bursa Limbah Produktif
              </CardTitle>
              <Badge variant="waste">Eco P2P</Badge>
            </div>
            <CardDescription className="text-xs text-text-secondary mt-0.5">
              Monetisasi sisa bahan olahan dapur kateringmu ke peternak atau off-taker.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {MOCK_WASTE_LISTINGS.map((waste) => (
              <div
                key={waste.id}
                className="p-3.5 rounded-xl border border-border bg-surface-subtle/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading text-xs font-bold text-text-primary line-clamp-1">
                    {waste.title}
                  </span>
                  <Badge variant="waste" className="text-[10px]">
                    {waste.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>Volume: <strong>{waste.volumeKg} kg</strong></span>
                  <span className="text-primary font-bold">
                    {formatCurrency(waste.potentialRevenue)}
                  </span>
                </div>

                <p className="text-[10px] text-text-muted line-clamp-1 border-t border-border/70 pt-1.5">
                  Mitra Pembeli: {waste.suitableOfftaker}
                </p>
              </div>
            ))}
          </CardContent>

          <div className="p-5 pt-0">
            <Link href="/umkm/sirkular" className="block">
              <Button variant="secondary" size="default" className="w-full font-bold min-h-[40px]">
                Buka Bursa Limbah P2P &rarr;
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* 6. Modal Interaktif: Gabung Kuota Pooling (Join Pool) */}
      {activeJoinPool && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-surface rounded-3xl border border-border p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-border/80 pb-3.5">
              <div>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md border border-primary/20">
                  {activeJoinPool.category}
                </span>
                <h3 className="font-heading text-lg font-bold text-text-primary mt-1">
                  Gabung Kuota: {activeJoinPool.commodityName}
                </h3>
                <p className="text-xs text-text-muted">
                  Supplier: {activeJoinPool.supplierName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveJoinPool(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinPoolSubmit} className="space-y-4">
              {/* Input Kuantitas Pembelian */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary block">
                  Kebutuhan Volume Belanja (kg)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={10}
                    max={activeJoinPool.targetMoqKg - activeJoinPool.accumulatedKg}
                    step={5}
                    value={joinQuantity}
                    onChange={(e) => setJoinQuantity(Math.max(1, Number(e.target.value)))}
                    className="flex-1 h-[48px] px-3.5 rounded-xl border border-border bg-surface text-text-primary font-heading text-base font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                  <span className="text-xs font-semibold text-text-muted px-2">kg</span>
                </div>
                <p className="text-[11px] text-text-muted">
                  Sisa kuota untuk menembus MOQ:{" "}
                  <strong>{activeJoinPool.targetMoqKg - activeJoinPool.accumulatedKg} kg</strong>
                </p>
              </div>

              {/* Pilihan Metode Pengiriman (Hybrid Logistics) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-primary block">
                  Opsi Logistik Pengiriman
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("HEMAT_HUB")}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all cursor-pointer",
                      deliveryMethod === "HEMAT_HUB"
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border bg-surface hover:bg-surface-subtle"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">Opsi Hemat (Hub)</span>
                      <span className="text-[10px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">
                        Gratis Ongkir
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-1 leading-snug">
                      Ambil di {MOCK_UMKM_PROFILE.preferredHubName} (Bagi ongkir armada).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("DIRECT_DELIVERY")}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all cursor-pointer",
                      deliveryMethod === "DIRECT_DELIVERY"
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
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

              {/* Rangkuman Biaya & Penghematan */}
              <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-2 text-xs">
                <div className="flex justify-between items-center text-text-secondary">
                  <span>Harga Grosir ({joinQuantity} kg x {formatCurrency(activeJoinPool.pricePerKgWholesale)}):</span>
                  <span className="font-bold text-text-primary tabular-nums">
                    {formatCurrency(joinQuantity * activeJoinPool.pricePerKgWholesale)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-text-secondary">
                  <span>Harga Pasar Tradisional:</span>
                  <span className="line-through text-text-muted tabular-nums">
                    {formatCurrency(joinQuantity * activeJoinPool.pricePerKgRetailMarket)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-text-secondary">
                  <span>Biaya Pengiriman:</span>
                  <span className="font-bold text-success">
                    {deliveryMethod === "HEMAT_HUB" ? "GRATIS (Hub Konsolidasi)" : "+Rp 25.000"}
                  </span>
                </div>

                <div className="pt-2 border-t border-border flex justify-between items-center text-sm font-bold">
                  <span className="text-text-primary">Total Bayar:</span>
                  <span className="text-primary text-base font-extrabold tabular-nums">
                    {formatCurrency(
                      joinQuantity * activeJoinPool.pricePerKgWholesale +
                        (deliveryMethod === "DIRECT_DELIVERY" ? 25000 : 0)
                    )}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-success/10 border border-success/20 text-success text-center font-bold text-xs">
                  🎉 Anda Menghemat{" "}
                  {formatCurrency(
                    joinQuantity *
                      (activeJoinPool.pricePerKgRetailMarket - activeJoinPool.pricePerKgWholesale)
                  )}{" "}
                  pada transaksi ini!
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="default"
                  onClick={() => setActiveJoinPool(null)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="default"
                  disabled={isSubmitting}
                  className="font-bold min-h-[44px]"
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
