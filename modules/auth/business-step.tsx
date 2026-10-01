"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { MapPicker } from "@/components/ui/map-picker";
import { RoleSwitcher } from "@/modules/auth/role-switcher";
import { toast } from "@/components/ui/toast";
import { UserRole } from "@/constants/auth";
import { completeBusinessRegistrationAction } from "@/actions/auth";
import { BESectorType } from "@/lib/be-auth";
import { createClient } from "@/lib/supabase/client";

export interface BusinessStepProps {
  userId: string;
  email?: string;
  initialRole?: UserRole;
  onSuccess?: (redirectTo: string) => void;
  onBack?: () => void;
}

const SECTOR_OPTIONS: Array<{ value: BESectorType; label: string }> = [
  { value: "FNB_PENGOLAHAN", label: "F&B / Kuliner & Pengolahan Pangan" },
  { value: "PERTANIAN", label: "Pertanian & Hasil Bumi" },
  { value: "PETERNAKAN", label: "Peternakan & Unggas" },
  { value: "PERIKANAN", label: "Perikanan & Kelautan" },
  { value: "PERKEBUNAN", label: "Perkebunan" },
  { value: "RITEL", label: "Ritel / Grosir / Toko Bahan Baku" },
  { value: "LOGISTIK", label: "Logistik & Pergudangan" },
];

export function BusinessStep({
  userId,
  email = "",
  initialRole = "umkm",
  onSuccess,
  onBack,
}: BusinessStepProps) {
  const router = useRouter();

  const [effectiveUserId, setEffectiveUserId] = React.useState<string>(userId || "");
  const [effectiveEmail, setEffectiveEmail] = React.useState<string>(email || "");

  React.useEffect(() => {
    if (userId) setEffectiveUserId(userId);
    if (email) setEffectiveEmail(email);

    if (!userId || !email) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          if (!userId && user.id) setEffectiveUserId(user.id);
          if (!email && user.email) setEffectiveEmail(user.email);
        }
      }).catch(() => {});
    }
  }, [userId, email]);

  const [role, setRole] = React.useState<UserRole>(initialRole);
  const [legalName, setLegalName] = React.useState("");
  const [npwpNib, setNpwpNib] = React.useState("");
  const [defaultAddress, setDefaultAddress] = React.useState("");
  const [latitude, setLatitude] = React.useState<number>(-7.2575);
  const [longitude, setLongitude] = React.useState<number>(112.7521);
  const [locationName, setLocationName] = React.useState<string>("Surabaya, Jawa Timur");
  const [sectorType, setSectorType] = React.useState<BESectorType>(
    initialRole === "supplier" ? "PERTANIAN" : "FNB_PENGOLAHAN"
  );
  const [storageCapacity, setStorageCapacity] = React.useState<number>(0);

  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === "supplier" && sectorType === "FNB_PENGOLAHAN") {
      setSectorType("PERTANIAN");
    }
    setErrors({});
  };

  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: Record<string, string | undefined> = {};

    const trimmedLegal = legalName.trim();
    if (!trimmedLegal) {
      nextErrors.legalName =
        role === "supplier"
          ? "Legal nama badan usaha wajib diisi."
          : "Nama usaha dagang atau kedai UMKM wajib diisi.";
    } else if (trimmedLegal.length < 2) {
      nextErrors.legalName = "Nama usaha minimal 2 karakter.";
    } else if (
      trimmedLegal.toLowerCase() === "nama usaha belum disetel" ||
      trimmedLegal.toLowerCase() === "nama usaha belum di setel"
    ) {
      nextErrors.legalName = "Nama usaha tidak boleh menggunakan teks default.";
    }

    const trimmedNpwp = npwpNib.trim();
    if (!trimmedNpwp) {
      nextErrors.npwpNib = "Nomor NPWP atau NIB wajib diisi.";
    } else if (trimmedNpwp.length < 5) {
      nextErrors.npwpNib = "Nomor NPWP atau NIB minimal 5 karakter.";
    } else if (trimmedNpwp.toUpperCase().startsWith("PENDING-")) {
      nextErrors.npwpNib = "Masukkan nomor NPWP/NIB resmi, bukan placeholder.";
    }

    const trimmedAddress = defaultAddress.trim();
    if (!trimmedAddress || trimmedAddress === "-") {
      nextErrors.defaultAddress = "Alamat operasional lengkap wajib diisi.";
    } else if (trimmedAddress.length < 3) {
      nextErrors.defaultAddress = "Alamat operasional minimal 3 karakter.";
    }

    if (latitude === 0 && longitude === 0) {
      nextErrors.location = "Tentukan titik koordinat lokasi usaha yang valid pada peta.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    let finalUserId = effectiveUserId || userId;
    let finalEmail = effectiveEmail || email;

    if (!finalUserId) {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) {
          finalUserId = data.user.id;
          if (!finalEmail && data.user.email) finalEmail = data.user.email;
          setEffectiveUserId(data.user.id);
        }
      } catch {
        // Abaikan
      }
    }

    if (!finalUserId) {
      toast.error(
        "ID pengguna tidak ditemukan. Silakan login atau register ulang.",
        "Sesi Tidak Valid"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Panggil Server Action completeBusinessRegistrationAction -> POST /api/auth/register-complete
      const result = await completeBusinessRegistrationAction({
        userId: finalUserId,
        email: finalEmail,
        legalName: legalName.trim(),
        npwpNib: npwpNib.trim(),
        defaultAddress: defaultAddress.trim(),
        latitude,
        longitude,
        role,
        sectorType,
        storageCapacity: role === "supplier" ? Number(storageCapacity) || 0 : 0,
      });

      setIsSubmitting(false);

      if (!result.success) {
        toast.error(
          result.error || "Gagal melengkapi data profil usaha. Silakan periksa data Anda.",
          "Registrasi Usaha Gagal"
        );

        if (result.error?.toLowerCase().includes("npwp")) {
          setErrors((prev) => ({ ...prev, npwpNib: result.error }));
        } else if (result.error?.toLowerCase().includes("nama")) {
          setErrors((prev) => ({ ...prev, legalName: result.error }));
        }
        return;
      }

      toast.success(
        `Profil usaha ${legalName.trim()} berhasil diverifikasi! Mengalihkan ke dashboard...`,
        "Pendaftaran Berhasil"
      );

      const targetPath =
        result.redirectTo || (role === "supplier" ? "/supplier" : "/home");

      if (onSuccess) {
        onSuccess(targetPath);
      } else {
        setTimeout(() => {
          window.location.href = targetPath;
        }, 500);
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat melengkapi data profil usaha.";
      toast.error(msg, "Kesalahan Server");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
      {/* Role Switcher */}
      <div className="flex flex-col items-center gap-1.5 pb-1">
        <span className="text-xs font-semibold text-text-secondary">
          Pilih Peran Utama Bisnis Anda:
        </span>
        <RoleSwitcher activeRole={role} onRoleChange={handleRoleChange} />
      </div>

      {/* Sektor Bisnis Dropdown */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="business-sector"
          className="text-xs font-semibold text-text-secondary"
        >
          Sektor Komoditas / Bisnis
        </label>
        <div className="relative">
          <select
            id="business-sector"
            value={sectorType}
            onChange={(e) => setSectorType(e.target.value as BESectorType)}
            className="w-full rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-text-primary focus:border-primary focus:outline-none transition-colors"
          >
            {SECTOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Nama Legal Usaha */}
      <FloatingInput
        id="business-legal-name"
        label={
          role === "supplier"
            ? "Legal Nama / Nama Badan Usaha (PT/CV/UD)"
            : "Nama Usaha Dagang / Kedai UMKM"
        }
        value={legalName}
        onChange={(e) => {
          setLegalName(e.target.value);
          if (errors.legalName) clearError("legalName");
        }}
        error={errors.legalName}
        placeholder={
          role === "supplier"
            ? "Contoh: PT Sumber Pangan Nusantara"
            : "Contoh: Kedai Berkah Sejahtera"
        }
        required
      />

      {/* Nomor NPWP / NIB */}
      <FloatingInput
        id="business-npwp-nib"
        label="Nomor NPWP atau NIB Usaha"
        value={npwpNib}
        onChange={(e) => {
          setNpwpNib(e.target.value);
          if (errors.npwpNib) clearError("npwpNib");
        }}
        error={errors.npwpNib}
        placeholder="01.234.567.8-901.000 / 9120001234567"
        required
      />

      {/* Alamat Lengkap */}
      <FloatingInput
        id="business-address"
        label="Alamat Lengkap Fasilitas / Toko"
        value={defaultAddress}
        onChange={(e) => {
          setDefaultAddress(e.target.value);
          if (errors.defaultAddress) clearError("defaultAddress");
        }}
        error={errors.defaultAddress}
        placeholder="Contoh: Jl. Industri Raya No. 45, Kompleks Pergudangan B-12"
        required
      />

      {/* Kapasitas Gudang (Khusus Supplier) */}
      {role === "supplier" && (
        <FloatingInput
          id="business-storage-capacity"
          label="Kapasitas Penyimpanan Gudang (Ton/Kg)"
          type="number"
          value={storageCapacity === 0 ? "" : storageCapacity.toString()}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            setStorageCapacity(isNaN(val) ? 0 : val);
            if (errors.storageCapacity) clearError("storageCapacity");
          }}
          error={errors.storageCapacity}
          placeholder="Contoh: 150"
        />
      )}

      {/* Peta Interaktif Lokasi */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-text-secondary">
          Titik Koordinat Fasilitas / Kedai:
        </label>
        <MapPicker
          latitude={latitude}
          longitude={longitude}
          onChange={(coords) => {
            setLatitude(coords.lat);
            setLongitude(coords.lng);
            if (coords.locationName) {
              setLocationName(coords.locationName);
            }
            if (errors.location) clearError("location");
          }}
        />
        {errors.location && (
          <p className="text-xs text-error font-medium mt-0.5">{errors.location}</p>
        )}
      </div>

      {/* Tombol Aksi */}
      <div className="pt-2 flex items-center gap-2.5">
        {onBack && (
          <Button
            type="button"
            variant="secondary"
            size="default"
            onClick={onBack}
            disabled={isSubmitting}
            className="w-1/3 font-semibold"
          >
            &larr; Kembali
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="default"
          isLoading={isSubmitting}
          className={`${onBack ? "w-2/3" : "w-full"} font-bold`}
        >
          {isSubmitting ? "Menyimpan Data Usaha..." : "Selesaikan & Masuk"}
        </Button>
      </div>
    </form>
  );
}

// Export default and named for flexible imports
export { BusinessStep as RegisterBusinessStep };
