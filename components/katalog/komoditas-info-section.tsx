"use client";

import * as React from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { KatalogFormErrors } from "../../modules/supplier/katalog/types";

interface KomoditasInfoSectionProps {
  name: string;
  setName: (val: string) => void;
  unit: string;
  setUnit: (val: string) => void;
  basePrice: number;
  setBasePrice: (val: number) => void;
  minOrderQty: number;
  setMinOrderQty: (val: number) => void;
  estimatedStock: number;
  setEstimatedStock: (val: number) => void;
  leadTimeDays: number;
  setLeadTimeDays: (val: number) => void;
  description: string;
  setDescription: (val: string) => void;
  imagePreviewUrl: string | null;
  setImagePreviewUrl: (val: string | null) => void;
  setImageFile: (val: File | null) => void;
  errors: KatalogFormErrors;
}

const UNIT_OPTIONS = [
  { value: "Karung", label: "Karung" },
  { value: "Sak", label: "Sak" },
  { value: "Krat", label: "Krat" },
  { value: "Pax", label: "Pax" },
  { value: "Bal", label: "Bal" },
  { value: "Kg", label: "Kilogram (Kg)" },
  { value: "Gram", label: "Gram" },
  { value: "Ton", label: "Ton" },
  { value: "Kuintal", label: "Kuintal" },
  { value: "Liter", label: "Liter" },
  { value: "Ml", label: "Mililiter (Ml)" },
  { value: "Kubik", label: "Kubik" },
  { value: "Pcs", label: "Pieces (Pcs)" },
  { value: "Pack", label: "Pack" },
  { value: "Dus", label: "Dus" },
  { value: "Box", label: "Box" },
  { value: "Karton", label: "Karton" },
  { value: "Botol", label: "Botol" },
  { value: "Kaleng", label: "Kaleng" },
  { value: "Tray", label: "Tray" },
  { value: "Keranjang", label: "Keranjang" },
  { value: "Baskom", label: "Baskom" },
  { value: "Ekor", label: "Ekor" },
  { value: "Butir", label: "Butir" },
  { value: "Lembar", label: "Lembar" },
  { value: "Ikat", label: "Ikat" },
  { value: "Porsi", label: "Porsi" },
  { value: "Cup", label: "Cup" },
  { value: "Bungkus", label: "Bungkus" },
  { value: "Lusin", label: "Lusin" },
  { value: "Pallet", label: "Pallet" },
  { value: "Koli", label: "Koli" },
];

export function KomoditasInfoSection({
  name,
  setName,
  unit,
  setUnit,
  basePrice,
  setBasePrice,
  minOrderQty,
  setMinOrderQty,
  estimatedStock,
  setEstimatedStock,
  leadTimeDays,
  setLeadTimeDays,
  description,
  setDescription,
  imagePreviewUrl,
  setImagePreviewUrl,
  setImageFile,
  errors,
}: KomoditasInfoSectionProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="p-5 sm:p-6 space-y-5 bg-surface border-border shadow-elevation-1 rounded-2xl">
      <div className="border-b border-border/80 pb-3">
        <h2 className="font-heading font-bold text-base text-text-primary">
          1. Informasi Komoditas, Foto &amp; Harga Utama
        </h2>
        <p className="font-body text-xs text-text-secondary mt-0.5">
          Tentukan identitas komoditas, foto visual produk, kuota batas minimum,
          dan harga dasar utama.
        </p>
      </div>

      {/* Bagian Upload Gambar Opsional */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-text-primary">
          Foto Komoditas (Opsional)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {imagePreviewUrl ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 rounded-xl border border-border bg-background">
            <div className="relative size-24 shrink-0 rounded-lg overflow-hidden border border-border bg-neutral-100">
              <Image
                src={imagePreviewUrl}
                alt="Pratinjau Foto Komoditas"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                Pratinjau Sementara
              </span>
              <p className="text-xs text-text-secondary truncate">
                Foto siap diunggah ke database saat komoditas disimpan.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm py-1 px-1.5 cursor-pointer"
                >
                  Ganti Foto
                </button>
                <span className="text-text-muted">&bull;</span>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-xs font-semibold text-error hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error rounded-sm py-1 px-1.5 cursor-pointer"
                >
                  Hapus Foto
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border hover:border-primary/50 hover:bg-surface-subtle transition-colors rounded-xl cursor-pointer text-center group"
          >
            <div className="size-10 rounded-full bg-background border border-border flex items-center justify-center text-text-muted group-hover:text-primary mb-2 transition-colors">
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-text-primary">
              Pilih foto komoditas dari komputer
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Format JPG, PNG, atau WEBP (Maksimal 5 MB)
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Input
            id="commodity-name"
            label="Nama Komoditas"
            placeholder="Contoh: Beras Ramos Sentra Cianjur Grade A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
            className="min-h-[44px]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="commodity-unit"
            className="text-xs font-semibold text-text-primary"
          >
            Satuan Penjualan
          </label>
          <select
            id="commodity-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="min-h-[44px] px-3.5 py-2.5 rounded-xl border border-border bg-surface text-xs sm:text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer"
          >
            {UNIT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Input Harga Utama Wajib */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="base-price"
          type="number"
          min={1}
          label={`Harga Utama per ${unit} (Rp)`}
          placeholder="Contoh: 750000"
          value={basePrice <= 0 ? "" : basePrice.toString()}
          onChange={(e) => setBasePrice(Math.max(0, Number(e.target.value)))}
          error={errors.basePrice}
          helperText="Harga patokan utama sebelum atau tanpa skema tingkatan harga"
          required
          className="min-h-[44px] tabular-nums font-semibold"
        />

        <Input
          id="min-order-qty"
          type="number"
          min={1}
          label={`Batas Minimum Penjualan (MOQ - ${unit})`}
          placeholder="Contoh: 5"
          value={minOrderQty <= 0 ? "" : minOrderQty.toString()}
          onChange={(e) => setMinOrderQty(Math.max(0, Number(e.target.value)))}
          error={errors.minOrderQty}
          helperText="Pesanan paling sedikit. Rentang harga tingkatan pertama akan otomatis dimulai dari nilai ini."
          required
          className="min-h-[44px] tabular-nums"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="estimated-stock"
          type="number"
          min={0}
          label={`Perkiraan Stock Siap Pasok (${unit})`}
          placeholder="Contoh: 500"
          value={estimatedStock <= 0 ? "" : estimatedStock.toString()}
          onChange={(e) =>
            setEstimatedStock(Math.max(0, Number(e.target.value)))
          }
          error={errors.estimatedStock}
          helperText="Total estimasi kapasitas stok yang siap dialokasikan"
          required
          className="min-h-[44px] tabular-nums"
        />

        <Input
          id="lead-time-days"
          type="number"
          min={0}
          label="Waktu Tunggu Pengiriman (Hari Kerja)"
          placeholder="Contoh: 2"
          value={leadTimeDays <= 0 ? "" : leadTimeDays.toString()}
          onChange={(e) => setLeadTimeDays(Math.max(0, Number(e.target.value)))}
          error={errors.leadTimeDays}
          helperText="Durasi dari pemesanan hingga barang siap dikirim"
          required
          className="min-h-[44px] tabular-nums"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="commodity-description"
          className="text-xs font-semibold text-text-primary"
        >
          Deskripsi &amp; Spesifikasi Produk (Opsional)
        </label>
        <textarea
          id="commodity-description"
          rows={3}
          placeholder="Jelaskan karakteristik komoditas, tingkat kadar air, metode pengemasan, atau catatan penanganan..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs sm:text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface transition-colors"
        />
      </div>
    </Card>
  );
}
