"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Sparkles,
  FileText,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  ScanLine,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StorageTemperature } from "@/constants/supplier";

export interface AiAuditLoadingDialogProps {
  open: boolean;
  fileName: string;
  fileSize?: string;
  commodityName: string;
  storageTemp: StorageTemperature;
  isCompleted?: boolean;
  isVerified?: boolean;
  verificationNotes?: string | null;
}

interface AuditStep {
  id: number;
  title: string;
  description: string;
}

const AUDIT_STEPS: AuditStep[] = [
  {
    id: 1,
    title: "Enkripsi & Unggah Dokumen Mutu",
    description: "Memvalidasi integritas berkas digital ke penyimpanan aman KUMPUL",
  },
  {
    id: 2,
    title: "Pemindaian Teks & Verifikasi Sertifikasi Resmi",
    description: "AI Gemini mendeteksi nomor izin Halal MUI, BPOM MD, atau sertifikat uji lab (CoA)",
  },
  {
    id: 3,
    title: "Evaluasi Parameter Sanitasi & Rantai Pasok",
    description: "Menganalisis residu kontaminan dan instruksi suhu penyimpanan komoditas",
  },
  {
    id: 4,
    title: "Penerbitan Hasil Evaluasi & Paspor Mutu",
    description: "Mengesahkan status verifikasi kepatuhan untuk bursa pasokan",
  },
];

const STORAGE_TEMP_LABELS: Record<StorageTemperature, string> = {
  AMBIENT: "Suhu Ruang (20°C - 25°C)",
  CHILLED: "Suhu Dingin (0°C - 4°C)",
  FROZEN: "Suhu Beku (≤ -18°C)",
};

export function AiAuditLoadingDialog({
  open,
  fileName,
  fileSize,
  commodityName,
  storageTemp,
  isCompleted = false,
  isVerified = true,
  verificationNotes,
}: AiAuditLoadingDialogProps) {
  const [currentStep, setCurrentStep] = React.useState<number>(1);

  // Simulasi langkah audit progresif secara otomatis selama request backend berlangsung
  React.useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      return;
    }

    if (isCompleted) {
      setCurrentStep(4);
      return;
    }

    const timer1 = setTimeout(() => setCurrentStep(2), 1200);
    const timer2 = setTimeout(() => setCurrentStep(3), 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [open, isCompleted]);

  const storageLabel = STORAGE_TEMP_LABELS[storageTemp] || storageTemp;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md sm:max-w-lg rounded-2xl sm:rounded-3xl border border-border bg-surface p-5 sm:p-7 shadow-elevation-2 overflow-hidden focus:outline-none">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-2xs">
              {isCompleted ? (
                <CheckCircle2 className="size-6 text-emerald-600 animate-in zoom-in-75 duration-200" />
              ) : (
                <Sparkles className="size-5 text-primary animate-pulse" />
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-light border border-primary/20 text-[11px] font-bold text-primary shadow-2xs">
              <span className="size-1.5 rounded-full bg-primary animate-ping" />
              <span>AI Audit Engine Aktif</span>
            </div>
          </div>

          <div>
            <DialogTitle className="font-heading text-lg sm:text-xl font-bold text-text-primary text-balance">
              {isCompleted
                ? isVerified
                  ? "Audit Selesai: Lulus Verifikasi Mutu!"
                  : "Audit Selesai: Dokumen Tersimpan"
                : "Audit Dokumen Mutu oleh AI KUMPUL"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-text-secondary leading-relaxed mt-1 text-pretty">
              {isCompleted
                ? `Hasil evaluasi kepatuhan untuk komoditas ${commodityName} telah berhasil diterbitkan.`
                : `Sistem cerdas sedang memindai keabsahan berkas mutu dan parameter rantai pasok untuk ${commodityName}.`}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Visual Scanner Box */}
        <div className="relative mt-2 p-4 rounded-2xl bg-surface-subtle border border-border/80 overflow-hidden shadow-xs">
          {/* Scanning Beam (Hanya tampil saat proses berlangsung) */}
          {!isCompleted && (
            <motion.div
              className="absolute left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_12px_rgba(16,185,129,0.9),0_0_4px_rgba(13,59,46,0.8)] z-20 pointer-events-none"
              initial={{ top: "0%" }}
              animate={{ top: ["5%", "90%", "5%"] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}

          <div className="relative z-10 flex items-start gap-3">
            <div className="size-12 rounded-xl bg-surface border border-border/70 flex items-center justify-center shrink-0 shadow-2xs text-primary">
              {isCompleted ? (
                <FileCheck className="size-6 text-emerald-600" />
              ) : (
                <ScanLine className="size-6 text-primary animate-pulse" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Berkas Audit
                </span>
                <span className="text-[10px] font-semibold text-text-secondary font-mono">
                  {fileSize || "PDF / Gambar"}
                </span>
              </div>
              <p
                className="text-xs font-bold text-text-primary truncate"
                title={fileName}
              >
                {fileName || "Dokumen_Kepatuhan_Mutu.pdf"}
              </p>
              <p className="text-[11px] text-text-muted truncate">
                Instruksi Suhu: <strong className="text-text-secondary">{storageLabel}</strong>
              </p>
            </div>
          </div>

          {/* Mini Document Wireframe Shimmer */}
          <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-4 gap-2 opacity-60">
            <div className="h-2 rounded-full bg-border/80 col-span-2" />
            <div className="h-2 rounded-full bg-border/80 col-span-1" />
            <div className="h-2 rounded-full bg-border/80 col-span-1" />
            <div className="h-2 rounded-full bg-border/80 col-span-3" />
            <div className="h-2 rounded-full bg-border/80 col-span-1" />
          </div>
        </div>

        {/* Step-by-Step Audit Progress */}
        <div className="space-y-2.5 my-1">
          {AUDIT_STEPS.map((step) => {
            const isDone = isCompleted || currentStep > step.id;
            const isCurrent = !isCompleted && currentStep === step.id;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-2.5 rounded-xl transition-all duration-300 ${
                  isCurrent
                    ? "bg-primary-light/70 border border-primary/20 shadow-2xs"
                    : isDone
                    ? "bg-surface-subtle/50 opacity-90"
                    : "opacity-40"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  ) : isCurrent ? (
                    <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  ) : (
                    <div className="size-4 rounded-full border border-border bg-surface-subtle" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-bold leading-tight ${
                      isCurrent
                        ? "text-primary"
                        : isDone
                        ? "text-text-primary"
                        : "text-text-muted"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[11px] text-text-muted leading-relaxed mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Notes Result Banner saat selesai */}
        {isCompleted && verificationNotes && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-950 space-y-1 shadow-2xs"
          >
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <ShieldCheck className="size-3.5 text-emerald-700" />
              <span>Kesimpulan Evaluasi AI Gemini</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-800">
              {verificationNotes}
            </p>
          </motion.div>
        )}

        {/* Bottom Status & Safety Info */}
        <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px] text-text-muted">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {isCompleted
                ? "Mengalihkan ke detail komoditas..."
                : "Harap jangan menutup halaman saat audit berlangsung."}
            </span>
          </div>

          <span className="font-mono font-semibold text-text-secondary">
            {isCompleted ? "100%" : `${Math.min(90, currentStep * 28)}%`}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AiAuditLoadingDialog;
