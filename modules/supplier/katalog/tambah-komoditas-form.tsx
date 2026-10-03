"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { KomoditasInfoSection } from "@/components/katalog/komoditas-info-section";
import { PanenJadwalSection } from "@/components/katalog/panen-jadwal-section";
import { EceranDanHargaSection } from "@/components/katalog/eceran-dan-harga-section";
import type { PriceTierRange, KatalogFormErrors } from "./types";
import { createSupplierCommodityAction } from "@/actions/supplier-catalog";
import type { BEWholesaleUnit } from "@/lib/api/types";

export function TambahKomoditasForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [name, setName] = React.useState("");
  const [unit, setUnit] = React.useState("kg");
  const [basePrice, setBasePrice] = React.useState<number>(750000);
  const [minOrderQty, setMinOrderQty] = React.useState<number>(5);
  const [estimatedStock, setEstimatedStock] = React.useState<number>(500);
  const [leadTimeDays, setLeadTimeDays] = React.useState<number>(2);
  const [description, setDescription] = React.useState("");

  // Foto Komoditas State
  const [, setImageFile] = React.useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(
    null,
  );

  // Harvest & Marketplace State
  const [harvestDate, setHarvestDate] = React.useState("2026-10-15");
  const [autoActivateMarketplace, setAutoActivateMarketplace] =
    React.useState<boolean>(true);

  // Retail & Pricing State
  const [allowRetail, setAllowRetail] = React.useState<boolean>(false);
  const [retailPrice, setRetailPrice] = React.useState<number>(18000);
  const [enablePriceTiers, setEnablePriceTiers] =
    React.useState<boolean>(false);
  const [priceTiers, setPriceTiers] = React.useState<PriceTierRange[]>([
    {
      id: "tier-initial-1",
      minQty: 5,
      maxQty: 25,
      price: 720000,
    },
  ]);

  // Error State
  const [errors, setErrors] = React.useState<KatalogFormErrors>({});

  const validate = (): boolean => {
    const err: KatalogFormErrors = {};

    if (!name.trim()) {
      err.name = "Nama komoditas wajib diisi.";
    }
    if (basePrice <= 0) {
      err.basePrice = "Harga utama wajib diisi dan harus lebih dari 0.";
    }
    if (minOrderQty <= 0) {
      err.minOrderQty = "Batas minimum penjualan harus lebih dari 0.";
    }
    if (estimatedStock <= 0) {
      err.estimatedStock = "Perkiraan stock harus lebih dari 0.";
    }
    if (leadTimeDays < 0) {
      err.leadTimeDays = "Waktu tunggu pengiriman tidak boleh negatif.";
    }
    if (!harvestDate.trim()) {
      err.harvestDate = "Perkiraan tanggal panen/produksi wajib diisi.";
    }

    if (allowRetail && retailPrice <= 0) {
      err.retailPrice =
        "Harga eceran harus lebih dari 0 jika penjualan eceran diterima.";
    }

    if (enablePriceTiers) {
      if (priceTiers.length === 0) {
        err.priceTiers =
          "Mohon tambahkan minimal satu rentang harga bertingkat.";
      } else {
        const hasInvalidTier = priceTiers.some(
          (tier) =>
            tier.minQty <= 0 || tier.maxQty < tier.minQty || tier.price <= 0,
        );
        if (hasInvalidTier) {
          err.priceTiers =
            "Pastikan batas bawah lebih dari 0, batas atas lebih besar atau sama dengan batas bawah, dan harga lebih dari 0.";
        }
      }
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error(
        "Mohon periksa kembali formulir dan lengkapi data yang belum sesuai.",
        "Formulir Belum Lengkap",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedUnit: BEWholesaleUnit =
        unit.toUpperCase() === "SAK"
          ? "SAK"
          : unit.toUpperCase() === "KRAT"
          ? "KRAT"
          : unit.toUpperCase() === "PAX"
          ? "PAX"
          : unit.toUpperCase() === "BAL"
          ? "BAL"
          : "KARUNG";

      const formattedTiers = enablePriceTiers
        ? priceTiers.map((t) => ({
            min_qty: Number(t.minQty),
            max_qty: Number(t.maxQty),
            tier_price: Number(t.price),
          }))
        : [];

      const res = await createSupplierCommodityAction({
        name: name.trim(),
        wholesaleUnit: normalizedUnit,
        basePrice: Number(basePrice),
        stock: Number(estimatedStock),
        baseMoq: Number(minOrderQty),
        leadTimeDays: Number(leadTimeDays) || 1,
        description: description.trim() || undefined,
        productionDate: harvestDate || undefined,
        autoActivateMarketplace: Boolean(autoActivateMarketplace),
        allowsUnderMoq: Boolean(allowRetail),
        underMoqPricePerKg: allowRetail ? Number(retailPrice) : undefined,
        isMarketplaceActive: true,
        priceTiers: formattedTiers,
      });

      if (res.success) {
        toast.success(
          `Komoditas ${name} berhasil disimpan ke katalog pasokan backend.`,
          "Katalog Berhasil Ditambahkan",
        );
        router.push("/katalog");
      } else {
        toast.error(res.message || "Gagal menyimpan komoditas ke backend.");
      }
    } catch {
      toast.error("Terjadi kendala saat menghubungi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Form */}
      <div>
        <Link
          href="/katalog"
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
        >
          &larr; Kembali ke Katalog
        </Link>
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary">
          Tambah Pasokan Komoditas Baru
        </h1>
        <p className="font-body text-xs sm:text-sm text-text-secondary mt-1">
          Daftarkan kuota panen, atur harga utama, foto produk, batas minimum
          pesanan, serta skema harga bertingkat.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Section 1: Informasi Komoditas & Foto */}
        <KomoditasInfoSection
          name={name}
          setName={setName}
          unit={unit}
          setUnit={setUnit}
          basePrice={basePrice}
          setBasePrice={setBasePrice}
          minOrderQty={minOrderQty}
          setMinOrderQty={setMinOrderQty}
          estimatedStock={estimatedStock}
          setEstimatedStock={setEstimatedStock}
          leadTimeDays={leadTimeDays}
          setLeadTimeDays={setLeadTimeDays}
          description={description}
          setDescription={setDescription}
          imagePreviewUrl={imagePreviewUrl}
          setImagePreviewUrl={setImagePreviewUrl}
          setImageFile={setImageFile}
          errors={errors}
        />

        {/* Section 2: Panen & Jadwal */}
        <PanenJadwalSection
          harvestDate={harvestDate}
          setHarvestDate={setHarvestDate}
          autoActivateMarketplace={autoActivateMarketplace}
          setAutoActivateMarketplace={setAutoActivateMarketplace}
          errors={errors}
        />

        {/* Section 3: Eceran & Skema Harga */}
        <EceranDanHargaSection
          unit={unit}
          minOrderQty={minOrderQty}
          allowRetail={allowRetail}
          setAllowRetail={setAllowRetail}
          retailPrice={retailPrice}
          setRetailPrice={setRetailPrice}
          enablePriceTiers={enablePriceTiers}
          setEnablePriceTiers={setEnablePriceTiers}
          priceTiers={priceTiers}
          setPriceTiers={setPriceTiers}
          errors={errors}
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/katalog">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="font-semibold min-h-[44px]"
            >
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="font-semibold px-8 min-h-[44px]"
          >
            {isSubmitting ? "Menyimpan Komoditas..." : "Simpan & Publikasikan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
