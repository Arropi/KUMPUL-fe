"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { KomoditasInfoSection } from "@/components/katalog/komoditas-info-section";
import { EceranDanHargaSection } from "@/components/katalog/eceran-dan-harga-section";
import type { PriceTierRange, KatalogFormErrors } from "./types";
import {
  createSupplierCommodityAction,
  updateSupplierCommodityAction,
} from "@/actions/supplier-catalog";
import { uploadFileAction } from "@/actions/upload";
import type { BESupplierCommodity, BEWholesaleUnit } from "@/lib/api/types";

interface TambahKomoditasFormProps {
  initialCommodity?: BESupplierCommodity;
  isEdit?: boolean;
}

export function TambahKomoditasForm({
  initialCommodity,
  isEdit = false,
}: TambahKomoditasFormProps = {}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [name, setName] = React.useState(initialCommodity?.name || "");
  const [unit, setUnit] = React.useState(
    initialCommodity?.wholesale_unit
      ? initialCommodity.wholesale_unit.charAt(0).toUpperCase() +
        initialCommodity.wholesale_unit.slice(1).toLowerCase()
      : "Kg"
  );
  const [basePrice, setBasePrice] = React.useState<number>(
    initialCommodity ? Number(initialCommodity.base_price) : 750000
  );
  const [minOrderQty, setMinOrderQty] = React.useState<number>(
    initialCommodity ? Number(initialCommodity.base_moq) : 5
  );
  const [estimatedStock, setEstimatedStock] = React.useState<number>(
    initialCommodity ? Number(initialCommodity.stock) : 500
  );
  const [leadTimeDays, setLeadTimeDays] = React.useState<number>(
    initialCommodity?.lead_time_days ?? 2
  );
  const [description, setDescription] = React.useState(
    initialCommodity?.description || ""
  );

  // Foto Komoditas State
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(
    initialCommodity?.image_url || null
  );

  // Skema Harga Bertingkat State
  const [enablePriceTiers, setEnablePriceTiers] = React.useState<boolean>(
    Boolean(
      initialCommodity?.price_tiers && initialCommodity.price_tiers.length > 0
    )
  );
  const [priceTiers, setPriceTiers] = React.useState<PriceTierRange[]>(
    initialCommodity?.price_tiers && initialCommodity.price_tiers.length > 0
      ? initialCommodity.price_tiers.map((t, idx) => ({
          id: `tier-edit-${idx}`,
          minQty: Number(t.min_qty),
          maxQty: Number(t.max_qty),
          price: Number(t.tier_price),
        }))
      : [
          {
            id: "tier-initial-1",
            minQty: 5,
            maxQty: 25,
            price: 720000,
          },
        ]
  );

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

    if (enablePriceTiers) {
      if (priceTiers.length === 0) {
        err.priceTiers =
          "Mohon tambahkan minimal satu rentang harga bertingkat.";
      } else {
        const hasInvalidTier = priceTiers.some(
          (tier) =>
            tier.minQty <= 0 || tier.maxQty <= tier.minQty || tier.price <= 0,
        );
        if (hasInvalidTier) {
          err.priceTiers =
            "Pastikan batas bawah lebih dari 0, batas atas lebih besar dari batas bawah, dan harga lebih dari 0.";
        }
      }
    }

    setErrors(err);
    if (Object.keys(err).length > 0) {
      const firstError = Object.values(err)[0];
      toast.error(
        firstError || "Mohon periksa kembali formulir dan lengkapi data yang belum sesuai.",
        "Formulir Belum Lengkap",
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedUnit: BEWholesaleUnit =
        (unit.toUpperCase() as BEWholesaleUnit) || "KARUNG";

      const formattedTiers = enablePriceTiers
        ? priceTiers.map((t) => ({
            min_qty: Number(t.minQty),
            max_qty: Number(t.maxQty),
            tier_price: Number(t.price),
          }))
        : [];

      let finalImageUrl = imagePreviewUrl;

      // Jika ada file gambar lokal baru yang dipilih, unggah ke Supabase Storage
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);
        uploadFormData.append("folder", "catalog-images");

        const uploadRes = await uploadFileAction(uploadFormData);
        if (!uploadRes.success || !uploadRes.url) {
          toast.error(uploadRes.message || "Gagal mengunggah foto komoditas ke Supabase.");
          setIsSubmitting(false);
          return;
        }
        finalImageUrl = uploadRes.url;
      } else if (!imagePreviewUrl) {
        finalImageUrl = null;
      }

      const payload = {
        name: name.trim(),
        wholesaleUnit: normalizedUnit,
        basePrice: Number(basePrice),
        stock: Number(estimatedStock),
        baseMoq: Number(minOrderQty),
        leadTimeDays: Number(leadTimeDays) || 1,
        imageUrl: finalImageUrl,
        description: description.trim() || undefined,
        productionDate: undefined,
        autoActivateMarketplace: false,
        allowsUnderMoq: false,
        underMoqPricePerKg: null,
        isMarketplaceActive: initialCommodity?.is_marketplace_active ?? true,
        priceTiers: formattedTiers,
      };

      let res;
      if (isEdit && initialCommodity) {
        res = await updateSupplierCommodityAction(initialCommodity.id, payload);
      } else {
        res = await createSupplierCommodityAction(payload);
      }

      if (res.success) {
        toast.success(
          `Komoditas ${name} berhasil ${
            isEdit ? "diperbarui" : "disimpan ke katalog pasokan"
          }.`,
          isEdit ? "Perubahan Disimpan" : "Katalog Berhasil Ditambahkan",
        );
        router.push(
          isEdit && initialCommodity
            ? `/katalog/${initialCommodity.id}`
            : "/katalog",
        );
      } else {
        toast.error(res.message || "Gagal menyimpan komoditas ke backend.");
      }
    } catch {
      toast.error("Terjadi kendala saat menghubungi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const backUrl =
    isEdit && initialCommodity
      ? `/katalog/${initialCommodity.id}`
      : "/katalog";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Form */}
      <div>
        <Link
          href={backUrl}
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
        >
          &larr; Kembali ke {isEdit ? "Rincian Komoditas" : "Katalog"}
        </Link>
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary">
          {isEdit ? "Perbarui Pasokan Komoditas" : "Tambah Pasokan Komoditas Baru"}
        </h1>
        <p className="font-body text-xs sm:text-sm text-text-secondary mt-1">
          {isEdit
            ? "Perbarui rincian harga, kuota stok, batas minimum pemesanan, atau skema harga bertingkat."
            : "Daftarkan kuota pasokan, atur harga utama, foto produk, batas minimum pesanan, serta skema harga bertingkat."}
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

        {/* Section 2: Skema Harga Bertingkat */}
        <EceranDanHargaSection
          unit={unit}
          minOrderQty={minOrderQty}
          enablePriceTiers={enablePriceTiers}
          setEnablePriceTiers={setEnablePriceTiers}
          priceTiers={priceTiers}
          setPriceTiers={setPriceTiers}
          errors={errors}
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href={backUrl}>
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
            {isSubmitting
              ? isEdit
                ? "Menyimpan Perubahan..."
                : "Menyimpan Komoditas..."
              : isEdit
              ? "Simpan Perubahan"
              : "Simpan & Publikasikan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
