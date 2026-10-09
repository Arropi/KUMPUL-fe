"use client";

import * as React from "react";
import {
  MOCK_HYGIENE_CHECKLIST_TEMPLATE,
  MOCK_PAST_HYGIENE_AUDITS,
  type HygieneInspectionItem,
} from "@/constants/umkm";
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
} from "@/components/ui/dialog";

// Donut Score Gauge Component bergaya Bionis Dashboard
function ScoreDonut({ value = 94, label = "Higienitas" }: { value?: number; label?: string }) {
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

export function UmkmPasporMutuView() {
  const [checklist, setChecklist] = React.useState<HygieneInspectionItem[]>(
    MOCK_HYGIENE_CHECKLIST_TEMPLATE
  );
  const [isSuccessModalOpen, setIsSuccessModalOpen] = React.useState(false);

  const toggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  };

  const handleNotesChange = (id: string, notes: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item))
    );
  };

  const passedCount = checklist.filter((item) => item.isChecked).length;
  const currentScore = Math.round((passedCount / checklist.length) * 100);
  const isGradeA = currentScore >= 85;

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* 1. Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-text-muted">
              Standar Keamanan Pangan &amp; Sanitasi Dapur Mandiri
            </span>
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight mt-0.5">
            Paspor Mutu Mandiri Dapur UMKM
          </h1>
        </div>

        <Button
          type="button"
          variant="primary"
          size="default"
          onClick={() => setIsSuccessModalOpen(true)}
          className="font-bold min-h-[44px]"
        >
          Simpan &amp; Terbitkan Paspor Mutu
        </Button>
      </div>

      {/* 2. Hero Section: Overall Hygiene Readiness with Score Donut */}
      <section className="bg-surface rounded-3xl border border-border/80 p-6 sm:p-7 shadow-elevation-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-primary/5 pointer-events-none blur-2xl" />

        <div className="flex min-h-28 flex-col justify-between gap-3 max-w-xl relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-xl bg-primary/10 px-3 py-1 text-xs font-bold text-primary border border-primary/20">
                Predikat: {isGradeA ? "Sangat Higienis (Grade A)" : "Perlu Peningkatan"}
              </span>
              <span className="text-xs text-text-muted font-medium">
                Pembaruan Harian Dapur
              </span>
            </div>
            <h2 className="font-heading text-lg sm:text-xl font-bold text-text-primary">
              Audit Mandiri Mutu &amp; Kepatuhan HACCP
            </h2>
          </div>

          <p className="font-sans text-xs sm:text-sm leading-relaxed text-text-secondary">
            Dapur yang rutin memperbarui paspor mutu mandiri mendapatkan prioritas alokasi pool harga grosir serta tanda lencana resmi kepercayaan bagi pelanggan katering.
          </p>

          <div className="flex items-center gap-3 pt-1 text-xs text-text-muted">
            <span>Indikator Terpenuhi: <strong className="text-success font-semibold tabular-nums">{passedCount} dari {checklist.length} Poin</strong></span>
            <span>&bull;</span>
            <span>Sertifikat Digital: <strong className="text-text-primary font-semibold">KMPL-MUTU-SBY-2026-0941</strong></span>
          </div>
        </div>

        <div className="flex items-center justify-center shrink-0 w-full md:w-auto relative z-10">
          <ScoreDonut value={currentScore} label="Higienitas" />
        </div>
      </section>

      {/* 3. Checklist Inspeksi Mandiri */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-bold text-text-primary">
            Daftar Periksa Kepatuhan Harian
          </h2>
          <span className="text-xs text-text-muted">
            Lengkap: <strong className="text-success tabular-nums">{passedCount}</strong> / {checklist.length} Terverifikasi
          </span>
        </div>

        <div className="space-y-3">
          {checklist.map((item, index) => (
            <Card
              key={item.id}
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                item.isChecked
                  ? "bg-surface border-border shadow-elevation-1"
                  : "bg-surface-subtle/50 border-border/70"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Custom Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleCheck(item.id)}
                  className={`mt-1 w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                    item.isChecked
                      ? "bg-primary border-primary text-text-inverse shadow-xs"
                      : "border-border bg-surface hover:border-primary/50"
                  }`}
                >
                  {item.isChecked && (
                    <svg className="w-3.5 h-3.5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-text-muted">
                        #{index + 1}
                      </span>
                      <h3 className="font-heading text-sm font-bold text-text-primary line-clamp-1" title={item.title}>
                        {item.title}
                      </h3>
                    </div>
                    <Badge variant="neutral" className="text-[10px] font-semibold">
                      {item.category}
                    </Badge>
                  </div>

                  <p className="font-sans text-xs text-text-secondary leading-relaxed">
                    {item.description}
                  </p>

                  <p className="text-[11px] text-text-muted pt-0.5">
                    Rujukan Standar: <strong className="text-text-secondary">{item.standardReference}</strong>
                  </p>

                  <div className="pt-2">
                    <Input
                      type="text"
                      value={item.notes || ""}
                      onChange={(e) => handleNotesChange(item.id, e.target.value)}
                      placeholder="Catatan observasi atau kondisi bahan baku (opsional)..."
                      className="w-full h-9 text-xs"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 4. Riwayat Sertifikat Audit */}
      <div className="space-y-4 pt-2">
        <h2 className="font-heading text-base font-bold text-text-primary">
          Riwayat Paspor Mutu Diterbitkan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_PAST_HYGIENE_AUDITS.map((audit) => (
            <Card
              key={audit.id}
              className="p-5 rounded-2xl border-border bg-surface shadow-elevation-1 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary truncate max-w-[200px]" title={audit.certificateId}>
                  {audit.certificateId}
                </span>
                <Badge variant="success" className="font-bold text-xs">
                  {audit.status === "MEMENUHI_STANDAR" ? "Memenuhi Standar" : "Perlu Perbaikan"}
                </Badge>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">Tanggal Audit:</span>
                  <span className="font-semibold text-text-primary">{audit.date}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-text-muted shrink-0">Inspektur Penanggung Jawab:</span>
                  <span className="font-semibold text-text-primary truncate max-w-[200px]" title={audit.inspectorName}>{audit.inspectorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Skor Higienitas:</span>
                  <span className="font-bold text-success tabular-nums">{audit.score} / 100</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-text-muted">
                <span>Jadwal Audit Berikutnya:</span>
                <strong className="text-text-primary">{audit.nextAuditDate}</strong>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal Sukses Audit Mandiri */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 text-center">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 mx-auto flex items-center justify-center font-bold text-xl">
              ✓
            </div>
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="font-heading text-lg font-bold text-text-primary">
                Paspor Mutu Mandiri Berhasil Diperbarui
              </DialogTitle>
              <DialogDescription className="text-xs text-text-muted mt-1">
                Skor kepatuhan dapur tercatat <strong className="text-success font-bold tabular-nums">{currentScore}/100</strong>.
                Badge higienitas dapur aktif dan tampil pada profil usahamu.
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 rounded-xl bg-surface-subtle border border-border text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-text-muted">Nomor Paspor Digital:</span>
                <span className="font-mono font-bold text-text-primary">KMPL-MUTU-SBY-2026-1002</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Indikator Terpenuhi:</span>
                <span className="font-bold text-success tabular-nums">{passedCount} dari {checklist.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Masa Berlaku:</span>
                <span className="font-semibold text-text-primary">7 Hari ke Depan</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="default"
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full font-bold min-h-[44px]"
            >
              Kembali ke Dapur
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
