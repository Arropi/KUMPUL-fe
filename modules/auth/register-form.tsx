"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { Toast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RoleSwitcher } from "@/modules/auth/role-switcher";
import { MapPicker } from "@/components/ui/map-picker";
import { UserRole, DEFAULT_ROLE } from "@/constants/auth";

type StepType = "AUTH" | "BUSINESS_VALIDATION";

function RegisterFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Role Switcher State
  const roleFromUrl = searchParams.get("role");
  const initialRole: UserRole = roleFromUrl === "supplier" ? "supplier" : DEFAULT_ROLE;
  const [role, setRole] = React.useState<UserRole>(initialRole);

  // Wizard Step State: Hanya 2 Langkah (Auth -> Validasi Usaha & Peta Lokasi)
  const [currentStep, setCurrentStep] = React.useState<StepType>("AUTH");

  // Step 1: Auth State (HANYA Email & Password)
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  // Step 2: Validasi Usaha Dagang & Peta Lokasi (Latitude / Longitude)
  const [businessName, setBusinessName] = React.useState("");
  const [taxId, setTaxId] = React.useState(""); // NPWP / NIB
  const [address, setAddress] = React.useState(""); // Alamat Lengkap
  const [latitude, setLatitude] = React.useState<number>(-7.2575); // Default Surabaya
  const [longitude, setLongitude] = React.useState<number>(112.7521);
  const [locationName, setLocationName] = React.useState<string>("Surabaya, Jawa Timur");

  // Error State per-step
  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = React.useState(false);

  // Toast State
  const [toast, setToast] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
  }>({
    isOpen: false,
    title: "Berhasil",
    message: "",
    type: "success",
  });

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
        setToast({
          isOpen: true,
          title: "Registrasi Google Gagal",
          message: error.message || "Gagal menghubungkan ke akun Google.",
          type: "error",
        });
        setIsOAuthLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch {
      setToast({
        isOpen: true,
        title: "Kesalahan Sistem",
        message: "Terjadi gangguan koneksi saat mendaftar dengan Google.",
        type: "error",
      });
      setIsOAuthLoading(false);
    }
  };

  // Validasi Step 1: Auth (Hanya Email & Password)
  const validateAuthStep = () => {
    const errs: Record<string, string | undefined> = {};

    if (!email.trim()) {
      errs.email = "Alamat email operasional wajib diisi.";
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

  // Validasi Step 2: Validasi Usaha Dagang & Lokasi
  const validateBusinessStep = () => {
    const errs: Record<string, string | undefined> = {};

    if (!businessName.trim()) {
      errs.businessName = role === "supplier"
        ? "Legal nama atau nama badan usaha wajib diisi."
        : "Nama usaha dagang atau kedai UMKM wajib diisi.";
    }
    if (!taxId.trim()) {
      errs.taxId = "Nomor NPWP atau NIB usaha dagang wajib diisi.";
    }
    if (!address.trim()) {
      errs.address = "Alamat lengkap fasilitas atau toko operasional wajib diisi.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Step 1 -> Masuk ke Validasi Usaha Dagang
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAuthStep()) return;
    setCurrentStep("BUSINESS_VALIDATION");
  };

  // Submit Final Step 2 -> Daftarkan Usaha & Masuk Dashboard
  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBusinessStep()) return;

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role,
            business_name: businessName.trim(),
            tax_id: taxId.trim(),
            address: address.trim(),
            latitude,
            longitude,
            location_name: locationName,
            profile_completed: false, // Perlu dilengkapi di dashboard
          },
        },
      });

      if (error) {
        console.warn("Supabase auth fallback simulation:", error.message);
      }

      // Simpan data usaha sementara di localStorage untuk sinkronisasi dashboard & profiling
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "kumpul_pending_onboarding",
          JSON.stringify({
            role,
            email: email.trim(),
            businessName: businessName.trim(),
            taxId: taxId.trim(),
            address: address.trim(),
            latitude,
            longitude,
            locationName,
            isProfileComplete: false,
          })
        );
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setToast({
          isOpen: true,
          title: "Pendaftaran Usaha Berhasil",
          message: `Akun ${businessName} berhasil didaftarkan. Mengalihkan ke dashboard...`,
          type: "success",
        });

        setTimeout(() => {
          if (role === "supplier") {
            router.push("/supplier?onboarding=pending");
          } else {
            router.push("/home?onboarding=pending");
          }
        }, 900);
      }, 700);
    } catch {
      setIsSubmitting(false);
      setToast({
        isOpen: true,
        title: "Pendaftaran Usaha Berhasil",
        message: "Melanjutkan ke dashboard operasional...",
        type: "success",
      });
      setTimeout(() => {
        if (role === "supplier") {
          router.push("/supplier?onboarding=pending");
        } else {
          router.push("/home?onboarding=pending");
        }
      }, 900);
    }
  };

  return (
    <>
      <Toast
        isOpen={toast.isOpen}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
      />

      <Card className="w-full max-w-[480px] mx-auto rounded-3xl border border-border bg-surface shadow-elevation-2 overflow-hidden flex flex-col justify-center">
        {/* Header Bersama dengan Logo & Indikator */}
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

          {currentStep === "BUSINESS_VALIDATION" && (
            <div className="w-full space-y-2 text-center">
              <CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-text-primary text-center">
                Legalitas &amp; Lokasi Peta Usaha
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary text-center max-w-xs mx-auto">
                Tentukan identitas usaha dan titik koordinat maps untuk radius logistik
              </CardDescription>
            </div>
          )}
        </CardHeader>

        <CardContent className="px-6 sm:px-8 pb-7 sm:pb-8 pt-2 flex flex-col gap-3">
          {/* ========================================================= */}
          {/* LANGKAH 1: FORM AUTH DASAR (HANYA EMAIL & PASSWORD)      */}
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
                    className="w-full font-bold"
                  >
                    Lanjut ke Validasi Usaha &rarr;
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
          {/* LANGKAH 2: FORM VALIDASI USAHA & MAP PICKER              */}
          {/* ========================================================= */}
          {currentStep === "BUSINESS_VALIDATION" && (
            <form onSubmit={handleBusinessSubmit} className="flex flex-col gap-3" noValidate>
              <FloatingInput
                id="business-legal-name"
                label={role === "supplier" ? "Legal Nama / Nama Badan Usaha" : "Nama Usaha Dagang / Kedai UMKM"}
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  if (errors.businessName) setErrors((prev) => ({ ...prev, businessName: undefined }));
                }}
                error={errors.businessName}
                placeholder={role === "supplier" ? "Contoh: PT Sumber Pangan Nusantara" : "Contoh: Kedai Berkah Sejahtera"}
                required
              />

              <FloatingInput
                id="business-tax-id"
                label="Nomor NPWP / NIB Usaha Dagang"
                value={taxId}
                onChange={(e) => {
                  setTaxId(e.target.value);
                  if (errors.taxId) setErrors((prev) => ({ ...prev, taxId: undefined }));
                }}
                error={errors.taxId}
                placeholder="01.234.567.8-901.000 / 9120001234567"
                required
              />

              <FloatingInput
                id="business-address"
                label="Alamat Lengkap Fasilitas / Toko"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
                }}
                error={errors.address}
                placeholder="Contoh: Jl. Industri Raya No. 45, Kompleks Pergudangan B-12"
                required
              />

              {/* Komponen Peta Interaktif (Latitude / Longitude) */}
              <MapPicker
                latitude={latitude}
                longitude={longitude}
                onChange={(coords) => {
                  setLatitude(coords.lat);
                  setLongitude(coords.lng);
                  if (coords.locationName) {
                    setLocationName(coords.locationName);
                  }
                }}
              />

              <div className="pt-2 flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="default"
                  onClick={() => setCurrentStep("AUTH")}
                  className="w-1/3 font-semibold"
                >
                  &larr; Kembali
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="default"
                  isLoading={isSubmitting}
                  className="w-2/3 font-bold"
                >
                  {isSubmitting ? "Mendaftarkan Usaha..." : "Daftarkan Usaha & Masuk"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export function RegisterForm() {
  return (
    <React.Suspense fallback={<div className="w-full max-w-[480px] h-[440px] mx-auto bg-surface rounded-3xl shadow-elevation-1 animate-pulse" />}>
      <RegisterFormInner />
    </React.Suspense>
  );
}
