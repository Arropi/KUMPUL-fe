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
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { SupplierCommodity, StorageTemperature } from "@/constants/supplier";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    desc: "Beras, biji-bijian, minyak goreng, gula, bumbu kering, dan bahan non-perishable.",
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
    (commodity.batchTag.storageTemperature as StorageTemperature) || "AMBIENT"
  );
  const [licenseNumber, setLicenseNumber] = React.useState(
    commodity.batchTag.licenseNumber || ""
  );
  const [productionDate, setProductionDate] = React.useState(
    commodity.batchTag.productionDate || new Date().toISOString().split("T")[0]
  );
  const [expiryDate, setExpiryDate] = React.useState(
    commodity.batchTag.expiryDate || ""
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
    toast.success(`File "${file.name}" berhasil diunggah.`);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    toast.info("File lampiran penunjang dihapus.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedFile) {
      toast.error("Wajib mengunggah minimal 1 file penunjang sertifikasi / uji lab.");
      return;
    }
    if (!licenseNumber.trim()) {
      toast.error("Nomor izin / lisensi / CoA mutu wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createCommodityBatchTagAction({
        commodityId: commodity.id,
        supportingFileUrl: uploadedFile ? `https://storage.supabase.co/kumpul-files/docs/${encodeURIComponent(uploadedFile.name)}` : null,
        storageTemperatureType: storageTemp,
        isVerified: true,
      });

      if (res.success) {
        setIsSuccess(true);
        toast.success(
          `Kepatuhan mutu ${commodity.name} berhasil disimpan ke sistem!`,
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Navigasi */}
      <div>
        <Link
          href={`/katalog/${commodity.id}`}
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5 mb-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Rincian Komoditas
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="neutral">{commodity.sku}</Badge>
          <Badge variant="neutral">{commodity.sector}</Badge>
          <span className="text-xs font-bold text-text-primary">{commodity.name}</span>
        </div>
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary mt-2 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          Verifikasi Kepatuhan Mutu &amp; Rantai Pasok
        </h1>
        <p className="font-body text-xs sm:text-sm text-text-secondary mt-1">
          Lengkapi data paspor sanitasi digital, tentukan instruksi suhu penyimpanan rantai dingin, dan unggah dokumen uji laboratorium terakreditasi.
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
            Data paspor mutu, instruksi suhu penyimpanan ({storageTemp}), dan dokumen uji lab telah berhasil disimpan. Mengalihkan kembali ke rincian komoditas...
          </p>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Pengaturan Suhu Penyimpanan (storage_temp_enum) */}
          <Card className="p-5 sm:p-6 bg-surface border-border shadow-elevation-1 rounded-2xl space-y-4">
            <div>
              <h2 className="font-heading font-bold text-sm sm:text-base text-text-primary flex items-center gap-2">
                <Thermometer className="w-4.5 h-4.5 text-primary" />
                1. Suhu Penyimpanan Rantai Pasok (Storage Temperature)
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Tentukan kategori suhu penanganan komoditas sesuai regulasi sanitasi keamanan pangan (BPOM/Kementan).
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
                        ENUM: {opt.value}
                      </span>
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
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
                2. Berkas Penunjang Kepatuhan &amp; Uji Mutu (Supporting Files)
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Unggah salinan dokumen sertifikat uji lab mutu, Certificate of Analysis (CoA), sertifikasi Halal, atau hasil audit higienitas batch komoditas.
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
                      {uploadedFile.size} • Terverifikasi Siap Submit
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
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors bg-background">
                <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-xs font-bold text-text-primary">
                  Tarik &amp; lepas berkas di sini, atau klik untuk memilih file
                </p>
                <p className="text-[11px] text-text-muted mt-1">
                  Format yang didukung: PDF, PNG, JPG (Maksimal 10 MB)
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
                  className="mt-3 text-xs font-semibold cursor-pointer"
                >
                  Pilih File Penunjang
                </Button>
              </div>
            )}
          </Card>

          {/* 3. Parameter Lisensi & Tanggal Operasional */}
          <Card className="p-5 sm:p-6 bg-surface border-border shadow-elevation-1 rounded-2xl space-y-4">
            <div>
              <h2 className="font-heading font-bold text-sm sm:text-base text-text-primary flex items-center gap-2">
                <AlertCircle className="w-4.5 h-4.5 text-primary" />
                3. Identitas Lisensi &amp; Masa Edar
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-text-secondary block mb-1">
                  Nomor Sertifikat / Lisensi Resmi
                </label>
                <Input
                  placeholder="Contoh: BPOM-RI-MD-12345678"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-secondary block mb-1">
                  Tanggal Produksi / Panen
                </label>
                <Input
                  type="date"
                  value={productionDate}
                  onChange={(e) => setProductionDate(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-secondary block mb-1">
                  Masa Kedaluwarsa (Expired)
                </label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
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
              disabled={isSubmitting}
              className="font-semibold text-xs sm:text-sm min-h-[44px] px-6 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              {isSubmitting ? "Memproses Verifikasi..." : "Kirim Pengajuan Verifikasi"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
