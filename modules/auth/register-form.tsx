"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RoleSwitcher } from "@/modules/auth/role-switcher";
import { UserRole, DEFAULT_ROLE } from "@/constants/auth";
import {
  registerWithCredentialsAction,
  initiateGoogleAuthAction,
} from "@/actions/auth";
import { RegisterAuthStep } from "./register-auth-step";
import { RegisterBusinessStep } from "./register-business-step";

type StepType = "AUTH" | "BUSINESS_VALIDATION";

function RegisterFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Role Switcher State
  const roleFromUrl = searchParams.get("role");
  const initialRole: UserRole = roleFromUrl === "supplier" ? "supplier" : DEFAULT_ROLE;
  const [role, setRole] = React.useState<UserRole>(initialRole);

  // Wizard Step State
  const [currentStep, setCurrentStep] = React.useState<StepType>("AUTH");

  // Step 1: Auth State
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  // Step 2: Validasi Usaha Dagang & Peta Lokasi
  const [businessName, setBusinessName] = React.useState("");
  const [taxId, setTaxId] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [latitude, setLatitude] = React.useState<number>(-7.2575);
  const [longitude, setLongitude] = React.useState<number>(112.7521);
  const [locationName, setLocationName] = React.useState<string>("Surabaya, Jawa Timur");

  // Error State per-step
  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = React.useState(false);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setErrors({});
  };

  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Google OAuth via Server Action
  const handleGoogleSignUp = async () => {
    setIsOAuthLoading(true);
    try {
      const result = await initiateGoogleAuthAction({
        role,
        origin: window.location.origin,
      });

      if (!result.success || !result.url) {
        setIsOAuthLoading(false);
        toast.error(
          result.error || "Gagal menghubungkan ke akun Google.",
          "Registrasi Google Gagal"
        );
        return;
      }

      console.info("[CLIENT LOG] Google OAuth Signup URL disiapkan:", result.log);
      window.location.href = result.url;
    } catch {
      toast.error("Terjadi gangguan koneksi saat mendaftar dengan Google.", "Kesalahan Sistem");
      setIsOAuthLoading(false);
    }
  };

  // Validasi Step 1
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

  // Validasi Step 2
  const validateBusinessStep = () => {
    const errs: Record<string, string | undefined> = {};
    if (!businessName.trim()) {
      errs.businessName =
        role === "supplier"
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

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAuthStep()) return;
    setCurrentStep("BUSINESS_VALIDATION");
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBusinessStep()) return;

    setIsSubmitting(true);

    try {
      // Panggil Server Action registrasi dari server
      const result = await registerWithCredentialsAction({
        role,
        email: email.trim(),
        password,
        businessName: businessName.trim(),
        taxId: taxId.trim() || undefined,
        address: address.trim() || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        locationName: locationName || undefined,
      });

      setIsSubmitting(false);

      // JIKA GAGAL (MISAL EMAIL SUDAH TERDAFTAR): JANGAN REDIRECT
      if (!result.success) {
        toast.error(
          result.error || "Gagal mendaftarkan akun. Silakan coba kembali.",
          "Registrasi Gagal"
        );

        // Jika error terkait email / sudah terdaftar, kembalikan ke Step 1 (AUTH)
        if (
          result.error?.toLowerCase().includes("email") ||
          result.error?.toLowerCase().includes("terdaftar")
        ) {
          setCurrentStep("AUTH");
          setErrors({ email: result.error });
        } else {
          setErrors({ businessName: result.error });
        }
        return;
      }

      console.info("[CLIENT LOG] Registrasi Akun Berhasil:", result.log);

      toast.success(
        `Akun ${businessName} berhasil didaftarkan. Mengalihkan ke dashboard...`,
        "Pendaftaran Usaha Berhasil"
      );

      // HANYA redirect jika registrasi benar-benar berhasil
      setTimeout(() => {
        router.push(
          result.redirectTo ||
            (role === "supplier" ? "/supplier?onboarding=pending" : "/home?onboarding=pending")
        );
      }, 700);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const errMsg =
        err instanceof Error
          ? err.message
          : "Terjadi kendala sistem saat pendaftaran akun.";
      toast.error(errMsg, "Kesalahan Server");
    }
  };

  return (
    <Card className="w-full max-w-[480px] mx-auto rounded-3xl border border-border bg-surface shadow-elevation-2 overflow-hidden flex flex-col justify-center">
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
        {currentStep === "AUTH" ? (
          <RegisterAuthStep
            role={role}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            errors={errors}
            clearError={clearError}
            onSubmit={handleAuthSubmit}
            onGoogleSignUp={handleGoogleSignUp}
            isOAuthLoading={isOAuthLoading}
            isSubmitting={isSubmitting}
          />
        ) : (
          <RegisterBusinessStep
            role={role}
            businessName={businessName}
            setBusinessName={setBusinessName}
            taxId={taxId}
            setTaxId={setTaxId}
            address={address}
            setAddress={setAddress}
            latitude={latitude}
            setLatitude={setLatitude}
            longitude={longitude}
            setLongitude={setLongitude}
            locationName={locationName}
            setLocationName={setLocationName}
            errors={errors}
            clearError={clearError}
            onBack={() => setCurrentStep("AUTH")}
            onSubmit={handleBusinessSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function RegisterForm() {
  return (
    <React.Suspense
      fallback={
        <div className="w-full max-w-[480px] h-[440px] mx-auto bg-surface rounded-3xl shadow-elevation-1 animate-pulse" />
      }
    >
      <RegisterFormInner />
    </React.Suspense>
  );
}
