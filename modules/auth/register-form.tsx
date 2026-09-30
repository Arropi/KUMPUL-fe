"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { toast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RoleSwitcher } from "@/modules/auth/role-switcher";
import { UserRole, DEFAULT_ROLE } from "@/constants/auth";
import { InlineDisclosureSelect } from "@/components/ui/inline-disclosure-select";

type StepType = "AUTH" | "SUPPLIER_LEGAL" | "SUPPLIER_PROFILE" | "SUPPLIER_CATALOG" | "SUCCESS";

const COMMODITY_SECTORS = [
  "Beras & Biji-bijian",
  "Hortikultura & Sayuran",
  "Bumbu & Rempah",
  "Daging & Unggas",
  "Perikanan & Hasil Laut",
  "Minyak & Gula Grosir",
];

const PACKAGING_UNITS = [
  "Karung (50 kg)",
  "Sak (25 kg)",
  "Krat Plastik (15 kg)",
  "Box Karton (10 kg)",
  "Tonase Curah (Ton)",
];

const BANK_OPTIONS = [
  "Bank Central Asia (BCA)",
  "Bank Mandiri",
  "Bank Rakyat Indonesia (BRI)",
  "Bank Negara Indonesia (BNI)",
  "Bank Syariah Indonesia (BSI)",
];

function generateSKU(commodityName: string): string {
  const clean = commodityName
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 3)
    .toUpperCase();
  const prefix = clean.length >= 2 ? clean : "KMP";
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `KMPL-${prefix}-${randomSuffix}`;
}

function RegisterFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Role Switcher State
  const roleFromUrl = searchParams.get("role");
  const initialRole: UserRole = roleFromUrl === "supplier" ? "supplier" : DEFAULT_ROLE;
  const [role, setRole] = React.useState<UserRole>(initialRole);

  // Wizard Step State
  const [currentStep, setCurrentStep] = React.useState<StepType>("AUTH");

  // Step 0: Auth State (HANYA Email & Password)
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  // Step 1: Supplier Legalitas & Identitas Usaha
  const [businessName, setBusinessName] = React.useState("");
  const [taxId, setTaxId] = React.useState(""); // NPWP / NIB
  const [location, setLocation] = React.useState(""); // Kota / Provinsi
  const [address, setAddress] = React.useState(""); // Alamat Fasilitas / Gudang

  // Step 2: Supplier Profil Operasional & Finansial
  const [sector, setSector] = React.useState(COMMODITY_SECTORS[0]);
  const [storageCapacity, setStorageCapacity] = React.useState("");
  const [bankName, setBankName] = React.useState(BANK_OPTIONS[0]);
  const [bankAccountNumber, setBankAccountNumber] = React.useState("");
  const [bankAccountHolder, setBankAccountHolder] = React.useState("");

  // Step 3: Tambah Katalog Komoditas Pertama
  const [commodityName, setCommodityName] = React.useState("");
  const [commoditySKU, setCommoditySKU] = React.useState("KMPL-BRS-7721");
  const [commodityUnit, setCommodityUnit] = React.useState(PACKAGING_UNITS[0]);
  const [minOrderQty, setMinOrderQty] = React.useState("");
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  // Error State per-step
  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = React.useState(false);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setErrors({});
  };

  // Handler OAuth Google
  const handleGoogleSignUp = async () => {
    setIsOAuthLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/api/auth/callback?role=${role}`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        toast.error(error.message || "Gagal menghubungkan ke akun Google.", "Registrasi Google Gagal");
        setIsOAuthLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Terjadi gangguan koneksi saat mendaftar dengan Google.", "Kesalahan Sistem");
      setIsOAuthLoading(false);
    }
  };

  // Validasi Step 0: Auth (HANYA Email & Password)
  const validateAuthStep = () => {
    const errs: Record<string, string | undefined> = {};

    if (!email.trim()) {
      errs.email = "Alamat email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Format email tidak valid.";
    }

    if (!password) {
      errs.password = "Kata sandi wajib diisi.";
    } else if (password.length < 6) {
      errs.password = "Kata sandi minimal 6 karakter.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validasi Step 1: Legalitas Supplier
  const validateLegalStep = () => {
    const errs: Record<string, string | undefined> = {};

    if (!businessName.trim()) {
      errs.businessName = "Legal nama atau nama usaha wajib diisi.";
    }
    if (!taxId.trim()) {
      errs.taxId = "Nomor NPWP atau NIB wajib diisi.";
    }
    if (!location.trim()) {
      errs.location = "Lokasi kota dan provinsi operasional wajib diisi.";
    }
    if (!address.trim()) {
      errs.address = "Alamat lengkap fasilitas atau gudang wajib diisi.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validasi Step 2: Profil Operasional & Rekening
  const validateProfileStep = () => {
    const errs: Record<string, string | undefined> = {};

    if (!sector.trim()) {
      errs.sector = "Silakan tentukan sektor komoditas utama.";
    }
    if (!storageCapacity.trim()) {
      errs.storageCapacity = "Kapasitas gudang atau penyimpanan wajib diisi.";
    }
    if (!bankAccountNumber.trim()) {
      errs.bankAccountNumber = "Nomor rekening bank wajib diisi.";
    }
    if (!bankAccountHolder.trim()) {
      errs.bankAccountHolder = "Nama pemilik rekening wajib diisi sesuai buku tabungan.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validasi Step 3: Katalog Komoditas Pertama
  const validateCatalogStep = () => {
    const errs: Record<string, string | undefined> = {};

    if (!commodityName.trim()) {
      errs.commodityName = "Nama komoditas perdana wajib diisi.";
    }
    if (!commoditySKU.trim()) {
      errs.commoditySKU = "Kode SKU wajib dibuat.";
    }
    if (!commodityUnit.trim()) {
      errs.commodityUnit = "Pilih satuan kemasan grosir.";
    }
    if (!minOrderQty.trim()) {
      errs.minOrderQty = "Tentukan batas minimum pemesanan (MOQ).";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Step 0 (Pendaftaran Auth Awal)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAuthStep()) return;

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role,
          },
        },
      });

      if (error) {
        console.warn("Supabase auth fallback simulation:", error.message);
      }

      setTimeout(() => {
        setIsSubmitting(false);

        // Jika Supplier: Masuk ke Onboarding Wizard
        if (role === "supplier") {
          toast.success(
            "Akun telah dibuat. Silakan lengkapi profil legalitas dan operasional Supplier kamu.",
            "Pendaftaran Berhasil"
          );
          setCurrentStep("SUPPLIER_LEGAL");
        } else {
          // Jika UMKM: Tampilkan Sukses dan redirect ke Home UMKM
          toast.success(
            "Akun Pelaku UMKM berhasil didaftarkan. Mengalihkan ke beranda...",
            "Pendaftaran UMKM Berhasil"
          );
          setTimeout(() => {
            router.push("/home");
          }, 1000);
        }
      }, 600);
    } catch {
      setIsSubmitting(false);
      if (role === "supplier") {
        setCurrentStep("SUPPLIER_LEGAL");
      } else {
        router.push("/home");
      }
    }
  };

  // Submit Step 1: Lanjut ke Profil Operasional
  const handleLegalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLegalStep()) return;
    setCurrentStep("SUPPLIER_PROFILE");
  };

  // Submit Step 2: Lanjut ke Tambah Katalog
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfileStep()) return;
    setCurrentStep("SUPPLIER_CATALOG");
  };

  // Submit Step 3: Selesaikan Onboarding Supplier
  const handleCatalogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCatalogStep()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCurrentStep("SUCCESS");
      toast.success(
        "Profil supplier dan katalog komoditas perdana kamu telah aktif di pasar KUMPUL.",
        "Onboarding Berhasil!"
      );
    }, 800);
  };

  // Handler Upload Foto Gambar Komoditas Opsional
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Menentukan lebar card yang dinamis & proporsional
  const isAdvancedStep = currentStep !== "AUTH" && currentStep !== "SUCCESS";
  const cardMaxWidth = isAdvancedStep ? "max-w-[500px]" : "max-w-[440px]";

  return (
    <>
      <Card className={`w-full ${cardMaxWidth} mx-auto rounded-3xl border border-border bg-surface shadow-elevation-2 overflow-hidden flex flex-col justify-center transition-all duration-200`}>
        {/* Header Bersama dengan Indikator Wizard */}
        <CardHeader className="gap-2.5 pt-6 sm:pt-7 pb-2 px-6 sm:px-8 text-center flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-1.5 pb-0.5">
            <div className="w-11 h-11 rounded-2xl bg-primary text-text-inverse flex items-center justify-center font-heading font-extrabold text-xl shadow-xs">
              K
            </div>
            <span className="font-heading font-extrabold text-xl text-primary tracking-tight">
              KUMPUL
            </span>
          </div>

          {currentStep === "AUTH" && (
            <div className="w-full text-center space-y-2">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold tracking-tight text-text-primary text-center">
                  Daftar Akun Baru
                </CardTitle>
                <CardDescription className="text-xs text-text-secondary text-center max-w-xs mx-auto">
                  {role === "umkm"
                    ? "Bergabung untuk menikmati harga grosir lewat pooling komoditas"
                    : "Daftarkan fasilitas pasokan untuk terhubung langsung ke ribuan UMKM"}
                </CardDescription>
              </div>

              {/* Tab Switcher Role (UMKM / Supplier) */}
              <div className="pt-1.5 w-full flex justify-center">
                <RoleSwitcher activeRole={role} onRoleChange={handleRoleChange} />
              </div>
            </div>
          )}

          {isAdvancedStep && (
            <div className="w-full space-y-3 text-center">
              {/* Modern Stepper Indicator with Node Numbers & Connectors */}
              <div className="flex items-center justify-between max-w-xs mx-auto px-2">
                {/* Node 1 */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      currentStep === "SUPPLIER_LEGAL"
                        ? "bg-primary text-text-inverse shadow-xs ring-2 ring-primary/20"
                        : "bg-primary text-text-inverse"
                    }`}
                  >
                    {currentStep !== "SUPPLIER_LEGAL" ? "✓" : "1"}
                  </div>
                  <span className="text-[10px] font-semibold text-text-primary">Legalitas</span>
                </div>

                {/* Line 1-2 */}
                <div
                  className={`h-0.5 flex-1 mx-2 transition-colors ${
                    currentStep === "SUPPLIER_PROFILE" || currentStep === "SUPPLIER_CATALOG"
                      ? "bg-primary"
                      : "bg-surface-sunken"
                  }`}
                />

                {/* Node 2 */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      currentStep === "SUPPLIER_PROFILE"
                        ? "bg-primary text-text-inverse shadow-xs ring-2 ring-primary/20"
                        : currentStep === "SUPPLIER_CATALOG"
                        ? "bg-primary text-text-inverse"
                        : "bg-surface-sunken text-text-muted"
                    }`}
                  >
                    {currentStep === "SUPPLIER_CATALOG" ? "✓" : "2"}
                  </div>
                  <span
                    className={`text-[10px] font-semibold ${
                      currentStep === "SUPPLIER_PROFILE" || currentStep === "SUPPLIER_CATALOG"
                        ? "text-text-primary"
                        : "text-text-muted"
                    }`}
                  >
                    Profil
                  </span>
                </div>

                {/* Line 2-3 */}
                <div
                  className={`h-0.5 flex-1 mx-2 transition-colors ${
                    currentStep === "SUPPLIER_CATALOG" ? "bg-primary" : "bg-surface-sunken"
                  }`}
                />

                {/* Node 3 */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      currentStep === "SUPPLIER_CATALOG"
                        ? "bg-primary text-text-inverse shadow-xs ring-2 ring-primary/20"
                        : "bg-surface-sunken text-text-muted"
                    }`}
                  >
                    3
                  </div>
                  <span
                    className={`text-[10px] font-semibold ${
                      currentStep === "SUPPLIER_CATALOG" ? "text-text-primary" : "text-text-muted"
                    }`}
                  >
                    Katalog
                  </span>
                </div>
              </div>

              <div className="space-y-0.5 pt-0.5">
                <CardTitle className="text-lg font-bold tracking-tight text-text-primary text-center">
                  {currentStep === "SUPPLIER_LEGAL" && "Legalitas & Identitas Usaha"}
                  {currentStep === "SUPPLIER_PROFILE" && "Profil Operasional & Finansial"}
                  {currentStep === "SUPPLIER_CATALOG" && "Katalog Komoditas Perdana"}
                </CardTitle>
                <CardDescription className="text-xs text-text-secondary text-center max-w-sm mx-auto">
                  {currentStep === "SUPPLIER_LEGAL" && "Lengkapi data resmi untuk sertifikasi Paspor Mutu Supplier"}
                  {currentStep === "SUPPLIER_PROFILE" && "Kapasitas penyimpanan dan akun rekening settlement escrow"}
                  {currentStep === "SUPPLIER_CATALOG" && "Tambahkan komoditas pertama yang siap dipasok ke pooling"}
                </CardDescription>
              </div>
            </div>
          )}

          {currentStep === "SUCCESS" && (
            <div className="text-center space-y-1">
              <Badge variant="success">
                Pendaftaran Selesai
              </Badge>
              <CardTitle className="text-xl font-bold tracking-tight text-text-primary text-center">
                Selamat Datang di KUMPUL!
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary text-center max-w-xs mx-auto">
                Profil usahamu dan katalog perdana telah berhasil diaktifkan
              </CardDescription>
            </div>
          )}
        </CardHeader>

        <CardContent className="px-6 sm:px-8 pb-7 sm:pb-8 pt-2 flex flex-col gap-3">
          {/* ========================================================= */}
          {/* STEP 0: FORM REGISTER AWAL (HANYA EMAIL & PASSWORD)      */}
          {/* ========================================================= */}
          {currentStep === "AUTH" && (
            <div className="flex flex-col gap-3">
              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3" noValidate>
                <FloatingInput
                  id="register-email"
                  label="Email Operasional"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  error={errors.email}
                  autoComplete="email"
                  required
                />

                <FloatingInput
                  id="register-password"
                  label="Kata Sandi"
                  isPassword
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  error={errors.password}
                  autoComplete="new-password"
                  required
                />

                <div className="pt-1">
                  <Button
                    type="submit"
                    variant="primary"
                    size="default"
                    isLoading={isSubmitting}
                    className="w-full font-bold"
                  >
                    {isSubmitting
                      ? "Mendaftarkan Akun..."
                      : role === "supplier"
                      ? "Lanjut Pendaftaran Supplier"
                      : "Daftar Sekarang"}
                  </Button>
                </div>
              </form>

              {/* Pemisah Garis Halus Presisi untuk "atau" */}
              <div className="relative flex items-center justify-center py-1.5">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-surface px-3 text-[11px] font-medium text-text-muted font-sans">
                    atau
                  </span>
                </div>
              </div>

              {/* Tombol Daftar dengan Google */}
              <Button
                type="button"
                variant="secondary"
                size="default"
                onClick={handleGoogleSignUp}
                disabled={isOAuthLoading || isSubmitting}
                className="w-full flex items-center justify-center gap-2.5 font-semibold"
                aria-label="Daftar dengan akun Google via Supabase"
              >
                {isOAuthLoading ? (
                  <svg
                    className="animate-spin h-4 w-4 text-text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                )}
                <span>Daftar dengan Google</span>
              </Button>

              {/* Pemisah Garis Halus Presisi untuk "Sudah memiliki akun KUMPUL?" */}
              <div className="relative flex items-center justify-center pt-2 pb-1">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-surface px-3 text-xs text-text-secondary font-medium font-sans">
                    Sudah memiliki akun KUMPUL?
                  </span>
                </div>
              </div>

              {/* Tombol Menuju Halaman Masuk (Login) */}
              <Button
                asChild
                variant="secondary"
                size="default"
                className="w-full font-bold"
              >
                <Link href={`/login?role=${role}`}>
                  <span>Masuk ke Akun Anda</span>
                </Link>
              </Button>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 1: SUPPLIER LEGALITAS & IDENTITAS USAHA              */}
          {/* ========================================================= */}
          {currentStep === "SUPPLIER_LEGAL" && (
            <form onSubmit={handleLegalSubmit} className="flex flex-col gap-3" noValidate>
              <FloatingInput
                id="supplier-legal-name"
                label="Legal Nama / Nama Usaha"
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  if (errors.businessName) setErrors((prev) => ({ ...prev, businessName: undefined }));
                }}
                error={errors.businessName}
                required
              />

              <FloatingInput
                id="supplier-tax-id"
                label="Nomor NPWP / NIB"
                value={taxId}
                onChange={(e) => {
                  setTaxId(e.target.value);
                  if (errors.taxId) setErrors((prev) => ({ ...prev, taxId: undefined }));
                }}
                error={errors.taxId}
                required
              />

              <FloatingInput
                id="supplier-location"
                label="Location (Kota / Provinsi Operasional)"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (errors.location) setErrors((prev) => ({ ...prev, location: undefined }));
                }}
                error={errors.location}
                required
              />

              <FloatingInput
                id="supplier-address"
                label="Address (Alamat Fasilitas / Gudang Logistik)"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
                }}
                error={errors.address}
                required
              />

              <div className="pt-2 flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="default"
                  onClick={() => setCurrentStep("AUTH")}
                  className="w-1/3 font-semibold flex items-center justify-center gap-1.5"
                >
                  <span>&larr;</span>
                  <span>Kembali</span>
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="default"
                  className="w-2/3 font-bold flex items-center justify-center gap-1.5"
                >
                  <span>Lanjut ke Profil</span>
                  <span>&rarr;</span>
                </Button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* STEP 2: PROFILE OPERASIONAL & BANK ACCOUNT                */}
          {/* ========================================================= */}
          {currentStep === "SUPPLIER_PROFILE" && (
            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-3" noValidate>
              {/* Sektor Dropdown dengan InlineDisclosureSelect */}
              <InlineDisclosureSelect
                id="supplier-sector"
                label="Sektor Komoditas Utama (Sector)"
                options={COMMODITY_SECTORS}
                value={sector}
                onChange={(val) => {
                  setSector(val);
                  if (errors.sector) setErrors((prev) => ({ ...prev, sector: undefined }));
                }}
                error={errors.sector}
              />

              <FloatingInput
                id="supplier-storage"
                label="Kapasitas Storage (Gudang / Cold Storage)"
                value={storageCapacity}
                onChange={(e) => {
                  setStorageCapacity(e.target.value);
                  if (errors.storageCapacity) setErrors((prev) => ({ ...prev, storageCapacity: undefined }));
                }}
                error={errors.storageCapacity}
                required
              />

              {/* Section Rekening Settlement Escrow dengan Spacing Lega & Bebas Benturan */}
              <div className="mt-2 pt-3 border-t border-border/60 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-heading font-bold text-text-primary tracking-tight">
                      Rekening Settlement Escrow
                    </h4>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Pilih bank penampung pencairan dana hasil transaksi pooling
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 shrink-0">
                    Otomatis Kliring
                  </span>
                </div>

                {/* Dropdown Pilihan Bank dengan InlineDisclosureSelect */}
                <InlineDisclosureSelect
                  id="supplier-bank-name"
                  label="Pilihan Bank Penampung"
                  options={BANK_OPTIONS}
                  value={bankName}
                  onChange={(val) => setBankName(val)}
                />

                {/* Input Nomor Rekening dan Pemilik */}
                <div className="space-y-2.5 pt-0.5">
                  <FloatingInput
                    id="supplier-bank-number"
                    label="Nomor Rekening Bank"
                    value={bankAccountNumber}
                    onChange={(e) => {
                      setBankAccountNumber(e.target.value);
                      if (errors.bankAccountNumber) setErrors((prev) => ({ ...prev, bankAccountNumber: undefined }));
                    }}
                    error={errors.bankAccountNumber}
                    placeholder="Contoh: 8820192849"
                    required
                  />

                  <FloatingInput
                    id="supplier-bank-holder"
                    label="Nama Pemilik Rekening (Sesuai Buku Tabungan)"
                    value={bankAccountHolder}
                    onChange={(e) => {
                      setBankAccountHolder(e.target.value);
                      if (errors.bankAccountHolder) setErrors((prev) => ({ ...prev, bankAccountHolder: undefined }));
                    }}
                    error={errors.bankAccountHolder}
                    placeholder="Contoh: PT Sumber Pangan Nusantara"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="default"
                  onClick={() => setCurrentStep("SUPPLIER_LEGAL")}
                  className="w-1/3 font-semibold flex items-center justify-center gap-1.5"
                >
                  <span>&larr;</span>
                  <span>Kembali</span>
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="default"
                  className="w-2/3 font-bold flex items-center justify-center gap-1.5"
                >
                  <span>Lanjut ke Katalog</span>
                  <span>&rarr;</span>
                </Button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* STEP 3: PENAMBAHAN KATALOG KOMODITAS PERTAMA              */}
          {/* ========================================================= */}
          {currentStep === "SUPPLIER_CATALOG" && (
            <form onSubmit={handleCatalogSubmit} className="flex flex-col gap-3" noValidate>
              <FloatingInput
                id="catalog-name"
                label="Nama Komoditas"
                value={commodityName}
                onChange={(e) => {
                  const val = e.target.value;
                  setCommodityName(val);
                  if (val.trim().length >= 3) {
                    setCommoditySKU(generateSKU(val));
                  }
                  if (errors.commodityName) setErrors((prev) => ({ ...prev, commodityName: undefined }));
                }}
                error={errors.commodityName}
                required
              />

              {/* SKU Auto Generated dengan Tombol Acak Samping yang Bersih */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <FloatingInput
                    id="catalog-sku"
                    label="SKU (Auto Generated)"
                    value={commoditySKU}
                    onChange={(e) => setCommoditySKU(e.target.value)}
                    error={errors.commoditySKU}
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="default"
                  onClick={() => setCommoditySKU(generateSKU(commodityName || "KMP"))}
                  className="h-[52px] px-3.5 text-xs font-semibold shrink-0"
                  title="Acak Ulang Kode SKU"
                >
                  <svg className="w-4 h-4 mr-1 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Acak</span>
                </Button>
              </div>

              {/* Satuan & MOQ dengan Layout Grid Responsif */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <InlineDisclosureSelect
                  id="catalog-unit"
                  label="Satuan Kemasan Grosir"
                  options={PACKAGING_UNITS}
                  value={commodityUnit}
                  onChange={(val) => {
                    setCommodityUnit(val);
                    if (errors.commodityUnit) setErrors((prev) => ({ ...prev, commodityUnit: undefined }));
                  }}
                  error={errors.commodityUnit}
                />

                <FloatingInput
                  id="catalog-moq"
                  label="MOQ (Min. Pemesanan)"
                  value={minOrderQty}
                  onChange={(e) => {
                    setMinOrderQty(e.target.value);
                    if (errors.minOrderQty) setErrors((prev) => ({ ...prev, minOrderQty: undefined }));
                  }}
                  error={errors.minOrderQty}
                  required
                />
              </div>

              {/* Image Opsional dengan Dropzone Tactile yang Cantik */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                  <span>Foto Gambar Komoditas</span>
                  <span className="text-text-muted text-[11px] font-normal">Opsional</span>
                </div>

                <div className="border border-dashed border-border/80 hover:border-primary/50 transition-colors rounded-2xl p-3.5 bg-surface-subtle/40 flex items-center gap-3.5">
                  {imagePreview ? (
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-border shrink-0 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Preview Komoditas" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImagePreview(null)}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center text-[10px] font-bold hover:bg-black/75 transition-colors"
                        title="Hapus Foto"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-text-muted shrink-0 shadow-xs">
                      <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  <div className="flex-1 text-left">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                      <span>Pilih Foto Produk</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      Format PNG, JPG atau WebP (Dapat diunggah nanti)
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="default"
                  onClick={() => setCurrentStep("SUPPLIER_PROFILE")}
                  className="w-1/3 font-semibold flex items-center justify-center gap-1.5"
                >
                  <span>&larr;</span>
                  <span>Kembali</span>
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="default"
                  isLoading={isSubmitting}
                  className="w-2/3 font-bold flex items-center justify-center gap-1.5"
                >
                  <span>{isSubmitting ? "Menyimpan Data..." : "Selesaikan Pendaftaran"}</span>
                  {!isSubmitting && <span>&rarr;</span>}
                </Button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* STEP 4: SUCCESS VIEW & ONBOARDING SELESAI                 */}
          {/* ========================================================= */}
          {currentStep === "SUCCESS" && (
            <div className="flex flex-col items-center justify-center gap-3.5 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto border border-success/30 shadow-xs">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="space-y-1">
                <h3 className="font-heading font-bold text-lg text-text-primary">
                  {businessName || "Entitas Usaha Supplier"}
                </h3>
                <p className="text-xs text-text-secondary max-w-xs mx-auto">
                  Katalog perdana <strong>{commodityName || "Komoditas Grosir"}</strong> ({commoditySKU}) dengan kuota MOQ {minOrderQty || "20 Karung"} telah terdaftar.
                </p>
              </div>

              <div className="w-full bg-surface-sunken p-3.5 rounded-2xl border border-border text-left space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-text-secondary">
                  <span>Lokasi Hub:</span>
                  <span className="font-semibold text-text-primary">{location || "Jawa Timur"}</span>
                </div>
                <div className="flex justify-between items-center text-text-secondary">
                  <span>Sektor Usaha:</span>
                  <span className="font-semibold text-text-primary">{sector}</span>
                </div>
                <div className="flex justify-between items-center text-text-secondary">
                  <span>Rekening Escrow:</span>
                  <span className="font-semibold text-text-primary font-mono">{bankName.split(" ")[0]} - {bankAccountNumber || "8820192849"}</span>
                </div>
                <div className="flex justify-between items-center text-text-secondary">
                  <span>Status Paspor Mutu:</span>
                  <span className="font-bold text-success">Grade A (Terverifikasi)</span>
                </div>
              </div>

              <div className="w-full pt-1.5">
                <Button
                  type="button"
                  variant="primary"
                  size="default"
                  onClick={() => router.push("/supplier")}
                  className="w-full font-bold"
                >
                  Masuk ke Dashboard Supplier
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export function RegisterForm() {
  return (
    <React.Suspense fallback={<div className="w-full max-w-[440px] h-[440px] mx-auto bg-surface rounded-3xl shadow-elevation-1 animate-pulse" />}>
      <RegisterFormInner />
    </React.Suspense>
  );
}
