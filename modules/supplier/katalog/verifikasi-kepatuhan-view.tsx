"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Upload,
  FileCheck,
  FileText,
  Trash2,
  Thermometer,
  Snowflake,
  Sun,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { SupplierCommodity, StorageTemperature } from "@/constants/supplier";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { createCommodityBatchTagAction } from "@/actions/supplier-catalog";

interface VerifikasiKepatuhanViewProps {
  commodity: SupplierCommodity;
}

const STORAGE_TEMP_OPTIONS: Array<{
  value: StorageTemperature;
  label: string;
  range: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}> = [
  {
    value: "AMBIENT",
    label: "Suhu Ruang (Ambient)",
    range: "20°C - 25°C",
    desc: "Beras, biji-bijian, minyak goreng, gula, bumbu kering, dan bahan pangan non-perishable.",
    icon: Sun,
    accentColor: "border-amber-300 bg-amber-50/50 text-amber-700",
  },
  {
    value: "CHILLED",
    label: "Suhu Dingin (Chilled)",
    range: "0°C - 4°C",
    desc: "Sayuran segar, buah-buahan, susu pasteurisasi, telur, dan produk olahan basah.",
    icon: Thermometer,
    accentColor: "border-cyan-300 bg-cyan-50/50 text-cyan-700",
  },
  {
    value: "FROZEN",
    label: "Suhu Beku (Frozen)",
    range: "≤ -18°C",
    desc: "Daging karkas ayam, daging sapi, hasil tangkapan laut/ikan beku, dan frozen food.",
    icon: Snowflake,
    accentColor: "border-blue-300 bg-blue-50/50 text-blue-700",
  },
];

export function VerifikasiKepatuhanView({ commodity }: VerifikasiKepatuhanViewProps) {
  const router = useRouter();

  const [storageTemp, setStorageTemp] = React.useState<StorageTemperature>(
    (commodity.batchTag?.storageTemperature as StorageTemperature) || "AMBIENT"
  );
  const [uploadedFile, setUploadedFile] = React.useState<{
    name: string;
    size: string;
    type: string;
  } | null>({
    name: "Sertifikat_Uji_Mutu_Laboratorium_2026.pdf",
    size: "1.4 MB",
    type: "application/pdf",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setUploadedFile({
      name: file.name,
      size: `${sizeMb} MB`,
      type: file.type || "Dokumen",
    });
    toast.success(`Berkas "${file.name}" berhasil dipilih.`);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    toast.info("Berkas lampiran penunjang dihapus.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedFile) {
      toast.error("Wajib mengunggah minimal 1 berkas penunjang dokumen sertifikasi / uji lab.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createCommodityBatchTagAction({
        commodityId: commodity.id,
        supportingFileUrl: `https://storage.supabase.co/kumpul-files/docs/${encodeURIComponent(uploadedFile.name)}`,
        storageTemperatureType: storageTemp,
        isVerified: true,
      });

      if (res.success) {
        setIsSuccess(true);
        toast.success(
          `Kepatuhan mutu & cara penyimpanan ${commodity.name} berhasil disimpan!`,
          "Verifikasi Berhasil"
        );
        setTimeout(() => {
          router.push(`/katalog/${commodity.id}`);
        }, 1200);
      } else {
        toast.error(res.message || "Gagal menyimpan verifikasi kepatuhan.");
      }
    } catch {
      toast.error("Terjadi kendala koneksi ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header Navigasi */}
      <div>
        <Link
          href={`/katalog/${commodity.id}`}
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5 mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Rincian Komoditas</span>
        </Link>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge variant="neutral">{commodity.sku}</Badge>
          <Badge variant="neutral">{commodity.sector}</Badge>
          <span className="text-xs font-bold text-text-primary">{commodity.name}</span>
        </div>
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <span>Verifikasi Kepatuhan Mutu &amp; Penyimpanan</span>
        </h1>
        <p className="font-body text-xs sm:text-sm text-text-secondary mt-1">
          Tentukan instruksi cara penyimpanan suhu rantai pasok dan unggah berkas penunjang dokumen sertifikasi mutu untuk komoditas Anda.
        </p>
      </div>

      {isSuccess ? (
        <Card className="p-8 text-center bg-surface border-border shadow-elevation-1 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-text-primary font-heading">
            Pengajuan Verifikasi Kepatuhan Berhasil!
          </h2>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Instruksi cara penyimpanan ({storageTemp}) dan berkas penunjang dokumen mutu telah tersimpan di sistem. Mengalihkan kembali ke rincian komoditas...
          </p>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Pengaturan Cara / Suhu Penyimpanan (storage_temp_enum) */}
          <Card className="p-5 sm:p-6 bg-surface border-border shadow-elevation-1 rounded-2xl space-y-4">
            <div>
              <h2 className="font-heading font-bold text-sm sm:text-base text-text-primary flex items-center gap-2">
                <Thermometer className="w-4.5 h-4.5 text-primary" />
                <span>1. Cara &amp; Suhu Penyimpanan Rantai Pasok</span>
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Pilih metode dan kategori suhu penyimpanan yang disyaratkan untuk menjaga higienitas dan mutu komoditas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {STORAGE_TEMP_OPTIONS.map((opt) => {
                const isSelected = storageTemp === opt.value;
                const IconComponent = opt.icon;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStorageTemp(opt.value)}
                    className={cn(
                      "p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative",
                      isSelected
                        ? cn("border-primary ring-2 ring-primary/20 shadow-xs", opt.accentColor)
                        : "border-border bg-background hover:bg-surface-subtle"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="p-2 rounded-lg bg-surface shadow-2xs border border-border/60">
                          <IconComponent className="w-4.5 h-4.5" />
                        </span>
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface border border-border/80">
                          {opt.range}
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-xs text-text-primary">
                        {opt.label}
                      </h3>
                      <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase font-bold text-text-muted">
                        Kategori: {opt.value}
                      </span>
                      <span
                        className={cn(
                          "w-2.5 h-2.5 rounded-full transition-colors",
                          isSelected ? "bg-primary" : "bg-neutral-300"
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* 2. Berkas & Dokumen Penunjang (Supporting Files) */}
          <Card className="p-5 sm:p-6 bg-surface border-border shadow-elevation-1 rounded-2xl space-y-4">
            <div>
              <h2 className="font-heading font-bold text-sm sm:text-base text-text-primary flex items-center gap-2">
                <FileCheck className="w-4.5 h-4.5 text-primary" />
                <span>2. Berkas Penunjang Dokumen Mutu (Supporting Files)</span>
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Unggah salinan dokumen sertifikat uji lab mutu, Certificate of Analysis (CoA), sertifikasi Halal, atau hasil audit higienitas komoditas.
              </p>
            </div>

            {uploadedFile ? (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">
                      {uploadedFile.name}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      {uploadedFile.size} &bull; Berkas Siap Diajukan
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-2 text-text-muted hover:text-danger rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Hapus berkas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors bg-background">
                <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-xs font-bold text-text-primary">
                  Tarik &amp; lepas berkas di sini, atau klik untuk memilih file
                </p>
                <p className="text-[11px] text-text-muted mt-1">
                  Format dokumen yang didukung: PDF, PNG, JPG, JPEG (Maksimal 10 MB)
                </p>
                <input
                  type="file"
                  id="supporting-file-input"
                  onChange={handleFileUpload}
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("supporting-file-input")?.click()}
                  className="mt-4 text-xs font-semibold cursor-pointer"
                >
                  Pilih Berkas Dokumen
                </Button>
              </div>
            )}
          </Card>

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href={`/katalog/${commodity.id}`}>
              <Button type="button" variant="outline" size="md" className="font-semibold text-xs cursor-pointer">
                Batal
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting || !uploadedFile}
              className="font-semibold text-xs sm:text-sm min-h-[44px] px-6 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              <span>{isSubmitting ? "Memproses Verifikasi..." : "Kirim Verifikasi Kepatuhan"}</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
