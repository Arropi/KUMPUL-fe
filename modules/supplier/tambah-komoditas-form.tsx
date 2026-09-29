"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  WholesaleUnit,
  StorageTemperature,
  SectorType,
} from "@/constants/supplier";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";

export function TambahKomoditasForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [name, setName] = React.useState("");
  const [sku, setSku] = React.useState("AGRO-PAS-105");
  const [sector, setSector] = React.useState<SectorType>("Pertanian");
  const [description, setDescription] = React.useState("");
  const [wholesaleUnit, setWholesaleUnit] = React.useState<WholesaleUnit>("KARUNG");
  const [unitWeightKg, setUnitWeightKg] = React.useState<number>(50);
  const [baseMoq, setBaseMoq] = React.useState<number>(5);
  const [availableStock, setAvailableStock] = React.useState<number>(100);
  const [leadTimeDays, setLeadTimeDays] = React.useState<number>(2);

  // Tiered Pricing State
  const [tier1Price, setTier1Price] = React.useState<number>(750000);
  const [tier2MinQty, setTier2MinQty] = React.useState<number>(11);
  const [tier2Price, setTier2Price] = React.useState<number>(680000);

  // Quality Tagging State
  const [licenseNumber, setLicenseNumber] = React.useState("");
  const [productionDate, setProductionDate] = React.useState("2026-09-29");
  const [expiryDate, setExpiryDate] = React.useState("2027-03-29");
  const [storageTemperature, setStorageTemperature] =
    React.useState<StorageTemperature>("AMBIENT");
  const [originLocation, setOriginLocation] = React.useState("Jawa Barat");

  // Error State
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [toast, setToast] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const validate = () => {
    const err: Record<string, string> = {};

    if (!name.trim()) err.name = "Nama komoditas wajib diisi.";
    if (!sku.trim()) err.sku = "SKU wajib diisi.";
    if (unitWeightKg <= 0) err.unitWeightKg = "Berat per satuan harus lebih dari 0.";
    if (baseMoq <= 0) err.baseMoq = "Batas MOQ harus minimal 1.";
    if (availableStock <= 0) err.availableStock = "Stok siap kirim harus lebih dari 0.";
    if (tier1Price <= 0) err.tier1Price = "Harga Tier 1 wajib diisi.";

    // PRD Modul A.1: Validasi Harga Tier 2 harus lebih murah dari Tier 1
    if (tier2Price >= tier1Price) {
      err.tier2Price = "Harga diskon Tier 2 harus lebih murah dibandingkan Tier 1.";
    }

    if (!licenseNumber.trim()) {
      err.licenseNumber =
        "Nomor registrasi izin edar atau sertifikasi uji mutu wajib diisi (PRD A.2).";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      setToast({
        isOpen: true,
        title: "Periksa Isian Formulir",
        message: "Mohon lengkapi seluruh kolom wajib dan pastikan harga Tier 2 lebih murah dari Tier 1.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setToast({
        isOpen: true,
        title: "Komoditas Berhasil Ditambahkan",
        message: `Komoditas ${name} telah terdaftar dan paspor mutu tersimpan. Mengalihkan ke katalog...`,
        type: "success",
      });

      setTimeout(() => {
        router.push("/supplier/katalog");
      }, 900);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Toast
        isOpen={toast.isOpen}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Header Form */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/supplier/katalog"
            className="text-xs font-semibold text-[#0D3B2E] hover:underline flex items-center gap-1.5 mb-1"
          >
            &larr; Kembali ke Katalog
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
            Tambah Komoditas Pasokan Baru
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Daftarkan kuota pasokan partai besar, batas MOQ, dan tagging mutu kepatuhan pangan (PRD A.1 &amp; A.2).
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Bagian 1: Data Komoditas & Kuota Grosir */}
        <section className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-7 shadow-xs space-y-5">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-base font-bold text-[#0F172A]">
              1. Spesifikasi Komoditas &amp; Satuan Grosir (PRD A.1)
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Tentukan satuan partai besar dan batas MOQ awal untuk pengadaan UMKM.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="name"
              label="Nama Komoditas"
              placeholder="Contoh: Beras Ramos Cianjur Grade A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
            />

            <Input
              id="sku"
              label="Kode SKU (Otomatis / Manual)"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              error={errors.sku}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Pilihan Sektor */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sector" className="text-xs font-semibold text-neutral-700">
                Kategori Sektor
              </label>
              <select
                id="sector"
                value={sector}
                onChange={(e) => setSector(e.target.value as SectorType)}
                className="min-h-[42px] px-3 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]"
              >
                <option value="Pertanian">Pertanian</option>
                <option value="FnB / Pengolahan">FnB / Pengolahan</option>
                <option value="Peternakan">Peternakan</option>
                <option value="Perikanan">Perikanan</option>
                <option value="Perkebunan">Perkebunan</option>
                <option value="Ritel">Ritel</option>
                <option value="Logistik">Logistik</option>
              </select>
            </div>

            {/* Pilihan Satuan Grosir */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="wholesaleUnit" className="text-xs font-semibold text-neutral-700">
                Satuan Partai Besar
              </label>
              <select
                id="wholesaleUnit"
                value={wholesaleUnit}
                onChange={(e) => setWholesaleUnit(e.target.value as WholesaleUnit)}
                className="min-h-[42px] px-3 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]"
              >
                <option value="KARUNG">KARUNG (Beras, Padi, dll)</option>
                <option value="SAK">SAK (Kedelai, Terigu, dll)</option>
                <option value="KRAT">KRAT (Bawang, Telur, dll)</option>
                <option value="PETI">PETI (Daging, Ikan segar)</option>
                <option value="BAL">BAL (Tekstil, Perca, Daun)</option>
                <option value="PAX">PAX (Karton/Koli besar)</option>
              </select>
            </div>

            <Input
              id="unitWeightKg"
              type="number"
              label="Bobot per Satuan (kg)"
              value={unitWeightKg.toString()}
              onChange={(e) => setUnitWeightKg(Number(e.target.value))}
              error={errors.unitWeightKg}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              id="baseMoq"
              type="number"
              label={`Batas Minimum (Base MOQ - ${wholesaleUnit})`}
              value={baseMoq.toString()}
              onChange={(e) => setBaseMoq(Number(e.target.value))}
              error={errors.baseMoq}
              required
            />

            <Input
              id="availableStock"
              type="number"
              label={`Kapasitas Stok Siap (${wholesaleUnit})`}
              value={availableStock.toString()}
              onChange={(e) => setAvailableStock(Number(e.target.value))}
              error={errors.availableStock}
              required
            />

            <Input
              id="leadTimeDays"
              type="number"
              label="Estimasi Lead Time (Hari Kerja)"
              value={leadTimeDays.toString()}
              onChange={(e) => setLeadTimeDays(Number(e.target.value))}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-xs font-semibold text-neutral-700">
              Deskripsi Komoditas &amp; Spesifikasi Fisik
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Jelaskan karakteristik komoditas, kadar air, standar mutu, atau peruntukan olahan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] placeholder:text-neutral-400"
            />
          </div>
        </section>

        {/* Bagian 2: Skema Diskon Bertingkat (Tiered Pricing) */}
        <section className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-7 shadow-xs space-y-5">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-base font-bold text-[#0F172A]">
              2. Skema Harga Bertingkat (Tiered Pricing Setup)
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Sistem mewajibkan harga Tier 2 lebih rendah dibanding Tier 1 untuk mendorong pooling agregasi kuota grosir.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Kartu Konfigurasi Tier 1 */}
            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-700">Tier 1: Pesanan Standar</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
                  {baseMoq} s.d. {tier2MinQty - 1} {wholesaleUnit}
                </span>
              </div>
              <Input
                id="tier1Price"
                type="number"
                label={`Harga per ${wholesaleUnit} (Rp)`}
                value={tier1Price.toString()}
                onChange={(e) => setTier1Price(Number(e.target.value))}
                error={errors.tier1Price}
                required
              />
              <p className="text-[11px] text-neutral-500">
                Setara: Rp {unitWeightKg > 0 ? Math.round(tier1Price / unitWeightKg).toLocaleString("id-ID") : 0}/kg
              </p>
            </div>

            {/* Kartu Konfigurasi Tier 2 (Pooling Target) */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#B45309]">Tier 2: Diskon Volume / Pooling UMKM</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  &gt; {tier2MinQty - 1} {wholesaleUnit}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="tier2MinQty"
                  type="number"
                  label={`Mulai Jumlah (${wholesaleUnit})`}
                  value={tier2MinQty.toString()}
                  onChange={(e) => setTier2MinQty(Number(e.target.value))}
                  required
                />
                <Input
                  id="tier2Price"
                  type="number"
                  label={`Harga Diskon (Rp)`}
                  value={tier2Price.toString()}
                  onChange={(e) => setTier2Price(Number(e.target.value))}
                  error={errors.tier2Price}
                  required
                />
              </div>
              <p className="text-[11px] text-amber-800">
                Setara: Rp {unitWeightKg > 0 ? Math.round(tier2Price / unitWeightKg).toLocaleString("id-ID") : 0}/kg (Hemat Rp {Math.max(0, tier1Price - tier2Price).toLocaleString("id-ID")}/{wholesaleUnit})
              </p>
            </div>
          </div>
        </section>

        {/* Bagian 3: Batch Health, Quality & Safety Tagging (PRD A.2) */}
        <section className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-7 shadow-xs space-y-5">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-base font-bold text-[#0F172A]">
              3. Paspor Mutu, Kepatuhan &amp; Batch Tagging (PRD A.2)
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Komoditas tidak dapat berstatus aktif di katalog sebelum data sertifikasi sanitasi dan suhu simpan terisi lengkap.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="licenseNumber"
              label="Nomor Izin Edar / Uji Residu / Sertifikasi Lab"
              placeholder="Contoh: KEMTAN-RI-PD.32.01-0021 / UJI-LAB-2026"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              error={errors.licenseNumber}
              required
            />

            <Input
              id="originLocation"
              label="Lokasi Asal Panen / Produksi"
              placeholder="Contoh: Cianjur, Jawa Barat"
              value={originLocation}
              onChange={(e) => setOriginLocation(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Pilihan Suhu Simpan */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="storageTemp" className="text-xs font-semibold text-neutral-700">
                Instruksi Suhu Simpan Aman
              </label>
              <select
                id="storageTemp"
                value={storageTemperature}
                onChange={(e) => setStorageTemperature(e.target.value as StorageTemperature)}
                className="min-h-[42px] px-3 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]"
              >
                <option value="AMBIENT">Suhu Ruang (Ambient)</option>
                <option value="CHILLED">Dingin (Chilled 0 s.d. 4°C)</option>
                <option value="FROZEN">Beku (Frozen &lt; -18°C)</option>
              </select>
            </div>

            <Input
              id="productionDate"
              type="date"
              label="Tanggal Panen / Olah Lot"
              value={productionDate}
              onChange={(e) => setProductionDate(e.target.value)}
              required
            />

            <Input
              id="expiryDate"
              type="date"
              label="Masa Simpan Aman (Expired)"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </div>
        </section>

        {/* Tombol Simpan & Batal */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/supplier/katalog">
            <Button type="button" variant="outline" size="md" className="font-semibold">
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="font-semibold px-8 shadow-xs"
          >
            {isSubmitting ? "Mendaftarkan Komoditas..." : "Simpan & Publikasikan ke Bursa"}
          </Button>
        </div>
      </form>
    </div>
  );
}
