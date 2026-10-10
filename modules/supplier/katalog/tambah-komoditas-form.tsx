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
import { uploadFileAction, deleteFileAction } from "@/actions/upload";
import { getBusinessProfileAction } from "@/actions/business-profile";
import type {
  BESupplierCommodity,
  BEWholesaleUnit,
  BEBusinessEntity,
  BEBusinessRole,
} from "@/lib/api/types";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface TambahKomoditasFormProps {
  initialCommodity?: BESupplierCommodity;
  isEdit?: boolean;
  initialEntity?: BEBusinessEntity | null;
  initialRoles?: BEBusinessRole[];
}

export function TambahKomoditasForm({
  initialCommodity,
  isEdit = false,
  initialEntity = null,
  initialRoles = [],
}: TambahKomoditasFormProps = {}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [entity, setEntity] = React.useState<BEBusinessEntity | null>(initialEntity);
  const [roles, setRoles] = React.useState<BEBusinessRole[]>(initialRoles);

  // Load profil jika belum di-supply dari server
  React.useEffect(() => {
    if (!initialEntity) {
      getBusinessProfileAction().then((res) => {
        if (res.success && res.entity) {
          setEntity(res.entity);
          if (res.roles) setRoles(res.roles);
        }
      });
    }
  }, [initialEntity]);

  // Evaluasi kelengkapan profil: Nomor Telepon, Rekening Bank, dan Kapasitas Penyimpanan Gudang
  const bankInfo = (entity?.bank_account_info || {}) as Record<string, any>;
  const hasPhone = Boolean(entity?.phone_number?.trim() || bankInfo.phone?.trim());
  const hasBank = Boolean(
    (Array.isArray(bankInfo.accounts) && bankInfo.accounts.length > 0) ||
    bankInfo.account_number?.trim()
  );
  const supplierRole = roles.find((r) => r.role_type.toUpperCase() === "SUPPLIER") || roles[0];
  const hasStorage = Boolean(
    (supplierRole?.storage_capacity && supplierRole.storage_capacity > 0) ||
    Number(bankInfo.storage_value) > 0
  );
  const isProfileComplete = hasPhone && hasBank && hasStorage;

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
        } else if (Number(basePrice) > 0) {
          const exceedsBasePrice = priceTiers.some(
            (tier) => tier.price > Number(basePrice),
          );
          if (exceedsBasePrice) {
            err.priceTiers = `Harga yang diterapkan pada setiap tingkatan tidak boleh melebihi harga utama (Rp ${Number(basePrice).toLocaleString("id-ID")}).`;
          }
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

    // 1. Validasi formulir terlebih dahulu
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // 2. Verifikasi status kelengkapan profil secara mutakhir langsung dari backend
      // Memastikan nomor telepon, rekening bank, dan kapasitas penyimpanan terisi lengkap
      const profileCheck = await getBusinessProfileAction();
      const currentEntity = profileCheck.success && profileCheck.entity ? profileCheck.entity : entity;
      const currentRoles = profileCheck.success && profileCheck.roles ? profileCheck.roles : roles;

      const bankInfoCheck = (currentEntity?.bank_account_info || {}) as Record<string, any>;
      const phoneOk = Boolean(currentEntity?.phone_number?.trim() || bankInfoCheck.phone?.trim());
      const bankOk = Boolean(
        (Array.isArray(bankInfoCheck.accounts) && bankInfoCheck.accounts.length > 0) ||
        bankInfoCheck.account_number?.trim()
      );
      const roleOk = currentRoles?.find((r) => r.role_type.toUpperCase() === "SUPPLIER") || currentRoles?.[0];
      const storageOk = Boolean(
        (roleOk?.storage_capacity && roleOk.storage_capacity > 0) ||
        Number(bankInfoCheck.storage_value) > 0
      );

      if (!isEdit && (!phoneOk || !bankOk || !storageOk)) {
        const missingFields: string[] = [];
        if (!phoneOk) missingFields.push("Nomor Telepon/Kontak");
        if (!bankOk) missingFields.push("Informasi Rekening Bank");
        if (!storageOk) missingFields.push("Kapasitas Penyimpanan Gudang");

        toast.error(
          `Profil usaha belum lengkap (${missingFields.join(", ")}). Harap lengkapi di menu Profil terlebih dahulu. Foto dan data komoditas tidak akan diunggah agar penyimpanan Supabase tidak penuh.`,
          "Profil Belum Lengkap"
        );
        setIsSubmitting(false);
        return;
      }

      // 3. Setelah valid bahwa profil lengkap hingga nomor telepon, proses unggah foto dan data
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
      let newlyUploadedPath: string | null = null;

      // Unggah foto ke Supabase Storage hanya setelah profil dan form valid
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);
        uploadFormData.append("folder", "catalog-images");
        if (currentEntity?.id) uploadFormData.append("entity_id", currentEntity.id);
        if (roleOk?.id) uploadFormData.append("supplier_role_id", roleOk.id);

        const uploadRes = await uploadFileAction(uploadFormData);
        if (!uploadRes.success || !uploadRes.url) {
          toast.error(uploadRes.message || "Gagal mengunggah foto komoditas ke Supabase.");
          setIsSubmitting(false);
          return;
        }
        finalImageUrl = uploadRes.url;
        newlyUploadedPath = uploadRes.data?.path || null;
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
        // Rollback: Hapus file gambar dari Supabase Storage jika simpan komoditas gagal
        if (newlyUploadedPath) {
          await deleteFileAction(newlyUploadedPath);
        }
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

      {/* Banner Peringatan Kelengkapan Profil Usaha Supplier */}
      {!isEdit && !isProfileComplete && (
        <div className="p-4 sm:p-5 border border-amber-300 bg-amber-50/90 rounded-2xl shadow-sm space-y-3.5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-900 shrink-0 mt-0.5">
              <AlertTriangle className="size-5 text-amber-700" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-sm sm:text-base text-amber-950">
                Lengkapi Profil Usaha Sebelum Mengunggah Katalog
              </h3>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                Untuk menjamin kelancaran transaksi, pencairan dana escrow, dan verifikasi daya tampung gudang di bursa, Anda wajib melengkapi data profil usaha berikut:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-amber-200/80 text-xs">
            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                hasPhone
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                  : "bg-white border-amber-200 text-amber-900"
              }`}
            >
              {hasPhone ? (
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="size-4 text-red-500 shrink-0" />
              )}
              <span className="font-semibold text-xs">Nomor Kontak / Telepon</span>
            </div>

            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                hasBank
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                  : "bg-white border-amber-200 text-amber-900"
              }`}
            >
              {hasBank ? (
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="size-4 text-red-500 shrink-0" />
              )}
              <span className="font-semibold text-xs">Rekening Bank Pencairan</span>
            </div>

            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                hasStorage
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                  : "bg-white border-amber-200 text-amber-900"
              }`}
            >
              {hasStorage ? (
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="size-4 text-red-500 shrink-0" />
              )}
              <span className="font-semibold text-xs">Kapasitas Penyimpanan</span>
            </div>
          </div>

          <div className="flex items-center justify-end pt-1">
            <Link href="/profil">
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
              >
                <span>Lengkapi Profil di Menu Profil</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

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
          isProfileComplete={isProfileComplete}
        />

        {/* Section 2: Skema Harga Bertingkat */}
        <EceranDanHargaSection
          unit={unit}
          minOrderQty={minOrderQty}
          basePrice={basePrice}
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
          {!isEdit && !isProfileComplete ? (
            <Link href="/profil">
              <Button
                type="button"
                variant="primary"
                size="md"
                className="font-semibold px-6 min-h-[44px] gap-2 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
              >
                <span>Lengkapi Profil Dahulu</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          ) : (
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
          )}
        </div>
      </form>
    </div>
  );
}
