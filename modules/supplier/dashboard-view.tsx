"use client";

import * as React from "react";
import Link from "next/link";
import {
  MOCK_SUPPLIER_PROFILE,
  MOCK_SUPPLIER_COMMODITIES,
  MOCK_CONSOLIDATED_POS,
  ConsolidatedPO,
} from "@/constants/supplier";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { getOrderStatusBadge } from "./helpers";

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

// Donut Score Gauge Component bergaya Bionis Dashboard
function ScoreDonut({ value = 98, label = "Skor Kesiapan" }: { value?: number; label?: string }) {
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

export function SupplierDashboardView() {
  const greeting = useGreeting(MOCK_SUPPLIER_PROFILE.legalName);
  const [timeline, setTimeline] = React.useState<TimelineOptionValue>("7d");
  const [orders] = React.useState<ConsolidatedPO[]>(MOCK_CONSOLIDATED_POS);
  const commodities = MOCK_SUPPLIER_COMMODITIES;

  const selectedLabel =
    TIMELINE_OPTIONS.find((opt) => opt.value === timeline)?.label ?? "7 Hari Terakhir";

  const activeOrdersCount = orders.filter(
    (o) => o.status === "PAID_TO_ESCROW" || o.status === "PROCESSING" || o.status === "SHIPPED"
  ).length;

  const totalWeightInFulfillment = orders
    .filter((o) => o.status !== "DELIVERED")
    .reduce((acc, curr) => acc + curr.totalWeightKg, 0);

  const totalEscrowAmount = orders
    .filter((o) => o.status !== "DELIVERED")
    .reduce((acc, curr) => acc + curr.grandTotalAmount, 0);

  return (
    <div className="flex flex-col gap-6 sm:gap-7">
      {/* 1. Header Section: Greeting + Timeline Filter Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-text-muted">
              {MOCK_SUPPLIER_PROFILE.legalName} &bull; {MOCK_SUPPLIER_PROFILE.npwpNib}
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

          <Link href="/supplier/katalog/tambah">
            <Button variant="primary" size="default" className="font-bold">
              + Tambah Komoditas
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Hero Section: Overall Operational Wellness with Score Donut */}
      <section className="bg-surface rounded-3xl border border-border/80 p-6 sm:p-7 shadow-elevation-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-primary/5 pointer-events-none blur-2xl" />

        <div className="flex min-h-28 flex-col justify-between gap-3 max-w-xl relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-xl bg-primary/10 px-3 py-1 text-xs font-bold text-primary border border-primary/20">
                Status Operasional: Sangat Optimal
              </span>
              <span className="text-xs text-text-muted font-medium">
                Pembaruan Sistem Real-time
              </span>
            </div>
            <h2 className="font-heading text-lg sm:text-xl font-bold text-text-primary">
              Kesiapan Pasokan Hulu &amp; Hub Logistik
            </h2>
          </div>

          <p className="font-sans text-xs sm:text-sm leading-relaxed text-text-secondary">
            Tingkat kepatuhan jadwal pasokan dan kualitas komoditas berada pada level{" "}
            <span className="font-bold text-text-primary">98.4%</span>, melampaui standar SLA regional Jawa Timur. Seluruh batch pesanan teragregasi telah teralokasi ke armada Hub Margomulyo.
          </p>

          <div className="flex items-center gap-3 pt-1 text-xs text-text-muted">
            <span>Sertifikasi Paspor Mutu: <strong className="text-success font-semibold">Grade A Valid</strong></span>
            <span>&bull;</span>
            <span>Gudang Siaga: <strong className="text-text-primary font-semibold">500 Ton</strong></span>
          </div>
        </div>

        <div className="flex items-center justify-center shrink-0 w-full md:w-auto relative z-10">
          <ScoreDonut value={98} label="Kesiapan" />
        </div>
      </section>

      {/* 3. Key Metrics Section: 4-Column Grid Snapshot */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-bold text-text-primary">
            Metrik Kunci Operasional
          </h2>
          <span className="text-xs text-text-muted font-medium">
            Snapshot hari ini vs rata-rata {selectedLabel.toLowerCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Escrow Protection */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">Dana Terkunci di Escrow</span>
              <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs font-bold">
                Rp
              </span>
            </div>
            <div>
              <p className="font-heading text-xl sm:text-2xl font-black text-text-primary tabular-nums">
                {formatCurrency(totalEscrowAmount)}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                100% kliring terjamin oleh sistem platform
              </p>
            </div>
            <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px]">
              <span className="text-success font-bold">+14.2%</span>
              <span className="text-text-muted">vs minggu lalu</span>
            </div>
          </div>

          {/* Card 2: Volume Terjadwal */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">Volume Siap Kirim</span>
              <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-bold">
                Kg
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-xl sm:text-2xl font-black text-text-primary tabular-nums">
                  {formatNumber(totalWeightInFulfillment)}
                </span>
                <span className="text-xs font-semibold text-text-muted">kg</span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Setara {(totalWeightInFulfillment / 1000).toFixed(1)} ton komoditas hulu
              </p>
            </div>
            <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px]">
              <span className="text-text-primary font-semibold">{activeOrdersCount} batch konsolidasi</span>
              <span className="text-primary font-semibold">Truk Siaga</span>
            </div>
          </div>

          {/* Card 3: Fulfillment SLA */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">Ketepatan Pemenuhan SLA</span>
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                %
              </span>
            </div>
            <div>
              <p className="font-heading text-xl sm:text-2xl font-black text-text-primary tabular-nums">
                99.1%
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                Rata-rata serah terima tepat waktu di Hub
              </p>
            </div>
            <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px]">
              <span className="text-success font-bold">+2.3%</span>
              <span className="text-text-muted">di atas target 97%</span>
            </div>
          </div>

          {/* Card 4: Paspor Mutu */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">Paspor Mutu &amp; Traceability</span>
              <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center text-xs font-bold">
                ★
              </span>
            </div>
            <div>
              <p className="font-heading text-xl sm:text-2xl font-black text-primary tabular-nums">
                Grade A
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                Bebas residu &amp; lolos uji sanitasi berkala
              </p>
            </div>
            <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px]">
              <span className="text-text-secondary font-semibold">Audit Lab: 28 Sep</span>
              <span className="text-success font-bold">Lolos 100%</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Charts Section (2 Columns: Demand Pooling Trend & Dispatch Activity) */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Chart 1: Demand Pooling & Aggregated Volume */}
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-elevation-1 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-sm sm:text-base font-bold text-text-primary">
                Tren Agregasi Permintaan UMKM
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Volume pemesanan kolektif per hari ({selectedLabel})
              </p>
            </div>
            <InsightBadge>Hub Jawa Timur</InsightBadge>
          </div>

          {/* Visual Bar Chart SVG */}
          <div className="h-44 w-full flex items-end justify-between gap-2 pt-6 pb-2 px-1">
            {[
              { day: "Sen", vol: 2400, percent: 55, active: false },
              { day: "Sel", vol: 3100, percent: 70, active: false },
              { day: "Rab", vol: 2800, percent: 62, active: false },
              { day: "Kam", vol: 3900, percent: 88, active: false },
              { day: "Jum", vol: 4500, percent: 100, active: true },
              { day: "Sab", vol: 3600, percent: 80, active: false },
              { day: "Min", vol: 1900, percent: 42, active: false },
            ].map((item) => (
              <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-semibold text-text-muted opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                  {(item.vol / 1000).toFixed(1)}t
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
            <span>Puncak Permintaan: <strong className="text-text-primary">Jumat (4.5 Ton)</strong></span>
            <span>Total Siklus: <strong className="text-primary">22.2 Ton</strong></span>
          </div>
        </div>

        {/* Chart 2: Dispatch & Fulfillment Activity */}
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-elevation-1 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-sm sm:text-base font-bold text-text-primary">
                Aktivitas Armada &amp; Pengiriman Hub
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Keterisian armada logistik vs kuota kapasitas harian
              </p>
            </div>
            <InsightBadge>Armada Terjadwal</InsightBadge>
          </div>

          {/* Visual Step Activity Chart SVG */}
          <div className="h-44 w-full flex flex-col justify-between pt-2 pb-1">
            <div className="space-y-3">
              {[
                { route: "Rute Hub Margomulyo (Beras Premium)", status: "Berangkat 08:30", progress: 85, color: "bg-emerald-500" },
                { route: "Rute Hub Rungkut (Bawang Merah & Cabai)", status: "Loading Gudang", progress: 65, color: "bg-primary" },
                { route: "Rute Hub Sidoarjo (Daging Ayam Beku)", status: "Siap Berangkat 13:00", progress: 40, color: "bg-accent" },
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
              <span>Armada Aktif: <strong className="text-text-primary">3 Truk CDD</strong></span>
              <span className="text-success font-semibold">Semua Rute Terlacak GPS</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Tri-Column Deep Insights Section (Market Prediction, Vitals, Recommended Actions) */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Card 1: AI Market & Demand Prediction (Gradient Violet/Indigo) */}
        <article className="flex min-h-[340px] flex-col justify-between gap-5 rounded-3xl border border-indigo-500/20 bg-[linear-gradient(180deg,rgb(99_102_241/0.08)_0%,transparent_45%)] p-5 shadow-elevation-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              <h3 className="font-heading text-sm font-bold text-text-primary">
                Prediksi Permintaan AI
              </h3>
            </div>
            <InsightBadge>Outlook 7 Hari</InsightBadge>
          </div>

          <div className="flex flex-1 flex-col gap-2.5">
            <div className="flex items-start gap-3 rounded-2xl bg-surface/80 border border-border/70 p-3 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-xs font-bold text-text-primary">Lonjakan Permintaan Beras (+35%)</p>
                <p className="text-[11px] text-text-secondary leading-snug">
                  Klaster UMKM kuliner Surabaya diperkirakan menaikkan kuota akhir pekan.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-surface/80 border border-border/70 p-3 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-xs font-bold text-text-primary">Stabilitas Harga Bawang Merah</p>
                <p className="text-[11px] text-text-secondary leading-snug">
                  Pasokan petani mitra stabil dengan estimasi panen 12 ton pekan depan.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-surface/80 border border-border/70 p-3 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-xs font-bold text-text-primary">Peringatan Defisit Cabai Rawit</p>
                <p className="text-[11px] text-text-secondary leading-snug">
                  Disarankan menambah kuota alokasi 500 kg di Hub Sidoarjo sebelum Rabu.
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* Card 2: Warehouse & Storage Vitals (Gradient Rose/Merah) */}
        <article className="flex min-h-[340px] flex-col justify-between gap-5 rounded-3xl border border-rose-500/20 bg-[linear-gradient(180deg,rgb(244_63_94/0.08)_0%,transparent_45%)] p-5 shadow-elevation-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </span>
              <h3 className="font-heading text-sm font-bold text-text-primary">
                Vitalitas Fasilitas Gudang
              </h3>
            </div>
            <InsightBadge>Semua Stabil</InsightBadge>
          </div>

          <div className="flex flex-1 flex-col justify-between rounded-2xl bg-surface/80 border border-border/70 p-3.5 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between text-xs py-1 border-b border-border/60">
              <span className="text-text-secondary">Suhu Cold Storage (Chiller)</span>
              <span className="font-mono font-bold text-emerald-600">2.4&deg;C (Aman)</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-border/60">
              <span className="text-text-secondary">Kelembapan Dry Storage</span>
              <span className="font-mono font-bold text-text-primary">58% RH (Optimal)</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-border/60">
              <span className="text-text-secondary">Kapasitas Gudang Terpakai</span>
              <span className="font-mono font-bold text-primary">74% (370/500 Ton)</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-text-secondary">Sanitasi &amp; Residu Hama</span>
              <span className="font-bold text-success">Nol Kontaminasi</span>
            </div>
          </div>
        </article>

        {/* Card 3: Recommended Actions (Gradient Teal/Emerald) */}
        <article className="flex min-h-[340px] flex-col justify-between gap-5 rounded-3xl border border-teal-500/20 bg-[linear-gradient(180deg,rgb(20_184_166/0.08)_0%,transparent_45%)] p-5 shadow-elevation-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <h3 className="font-heading text-sm font-bold text-text-primary">
                Rekomendasi Tindakan
              </h3>
            </div>
            <InsightBadge>3 Prioritas</InsightBadge>
          </div>

          <div className="flex flex-1 flex-col gap-2.5">
            <div className="flex items-start gap-3 rounded-2xl bg-surface/80 border border-border/70 p-3 shadow-xs hover:border-teal-500/40 transition-colors cursor-pointer">
              <span className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                1
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-xs font-bold text-text-primary">Konfirmasi PO Terpadu #PO-KMPL-088</p>
                <p className="text-[11px] text-text-secondary leading-snug">
                  5.000 kg Beras telah lunas di Escrow siap dikemas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-surface/80 border border-border/70 p-3 shadow-xs hover:border-teal-500/40 transition-colors cursor-pointer">
              <span className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                2
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-xs font-bold text-text-primary">Buka Kuota Pooling Bawang Merah</p>
                <p className="text-[11px] text-text-secondary leading-snug">
                  Tersedia 3.000 kg kapasitas buffer untuk klaster kuliner.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-surface/80 border border-border/70 p-3 shadow-xs hover:border-teal-500/40 transition-colors cursor-pointer">
              <span className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                3
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-xs font-bold text-text-primary">Rilis Batch Paspor Mutu Digital</p>
                <p className="text-[11px] text-text-secondary leading-snug">
                  Unggah hasil lab uji kadar air untuk batch beras Rojolele.
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* 6. Consolidated PO Table (Span 8) + Inventory Ledger (Span 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
        {/* Consolidated PO Table */}
        <Card className="lg:col-span-8 rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                Pesanan Terpadu Masuk (Consolidated PO)
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary mt-0.5">
                Pesanan agregasi pooling yang telah terkunci dan siap diproses ke Hub.
              </CardDescription>
            </div>
            <CardAction>
              <Link
                href="/supplier/pesanan"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Lihat Semua ({orders.length}) &rarr;
              </Link>
            </CardAction>
          </CardHeader>

          <CardContent className="p-0">
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
                {orders.slice(0, 3).map((po) => (
                  <TableRow key={po.id}>
                    <TableCell>
                      <p className="font-mono text-xs font-bold text-text-primary tabular-nums">
                        {po.poNumber}
                      </p>
                      <p className="font-semibold text-xs text-text-secondary mt-0.5">
                        {po.commodityName}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5 line-clamp-1">
                        {po.hubName}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-text-primary tabular-nums">
                        {po.totalQuantity} {po.wholesaleUnit}
                      </p>
                      <p className="text-[11px] text-text-muted tabular-nums">
                        {po.totalWeightKg} kg &bull; {po.participants.length} UMKM
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-extrabold text-primary tabular-nums">
                        {formatCurrency(po.grandTotalAmount)}
                      </p>
                      <span className="text-[10px] text-text-muted">
                        {po.primaryDeliveryMethod === "HEMAT_HUB" ? "Opsi Hemat (Hub)" : "Direct"}
                      </span>
                    </TableCell>
                    <TableCell>{getOrderStatusBadge(po.status)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/supplier/pesanan/${po.id}`}>
                        <Button variant="secondary" size="sm">
                          Detail PO
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Inventory Quick Ledger */}
        <Card className="lg:col-span-4 rounded-3xl flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                Katalog Pasokan
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary mt-0.5">
                Kesiapan komoditas di gudang
              </CardDescription>
            </div>
            <CardAction>
              <Link
                href="/supplier/katalog"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Kelola &rarr;
              </Link>
            </CardAction>
          </CardHeader>

          <CardContent className="space-y-3">
            {commodities.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl border border-border bg-surface-subtle/50 hover:bg-surface-subtle transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-heading text-xs font-semibold text-text-primary line-clamp-1">
                    {item.name}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      item.isActive ? "bg-emerald-500" : "bg-neutral-300"
                    }`}
                    title={item.isActive ? "Aktif di Bursa" : "Nonaktif"}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-secondary tabular-nums">
                  <span>Stok: <strong>{item.availableStock} {item.wholesaleUnit}</strong></span>
                  <span className="text-accent font-semibold">
                    MOQ: {item.baseMoq} {item.wholesaleUnit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-text-muted pt-1 border-t border-border/80">
                  <span>Suhu: {item.batchTag.storageTemperature}</span>
                  <span className="text-emerald-700 font-semibold">Sertifikasi Valid</span>
                </div>
              </div>
            ))}
          </CardContent>

          <div className="p-5 pt-0">
            <Link href="/supplier/katalog/tambah" className="block">
              <Button variant="secondary" size="default" className="w-full font-bold">
                + Tambah Komoditas Baru
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
