"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RoleSwitcher } from "@/modules/auth/role-switcher";
import { ForgotPasswordModal } from "@/modules/auth/forgot-password-modal";
import { UserRole, AUTH_ROLE_CONFIGS, DEFAULT_ROLE } from "@/constants/auth";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roleFromUrl = searchParams.get("role");
  const initialRole: UserRole = roleFromUrl === "supplier" ? "supplier" : DEFAULT_ROLE;
  const [role, setRole] = React.useState<UserRole>(initialRole);
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [errors, setErrors] = React.useState<{ identifier?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = React.useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = React.useState(false);

  const currentConfig = AUTH_ROLE_CONFIGS[role];

  // Mendengarkan respon callback dari OAuth
  React.useEffect(() => {
    const isSuccess = searchParams.get("oauth_success");
    const oauthError = searchParams.get("oauth_error");
    const oauthRole = searchParams.get("role") as UserRole | null;
    const email = searchParams.get("email");
    const name = searchParams.get("name");

    if (isSuccess === "true") {
      const roleLabel = oauthRole === "supplier" ? "Mitra Supplier" : "Pelaku UMKM";
      const timer = setTimeout(() => {
        toast.success(
          `Selamat datang kembali, ${name || "Pengguna"}. Masuk sebagai ${roleLabel} (${email || "Google"}).`,
          "Login Google Berhasil"
        );
      }, 0);
      return () => clearTimeout(timer);
    } else if (oauthError) {
      const timer = setTimeout(() => {
        toast.error(decodeURIComponent(oauthError), "Gagal Masuk Google");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setErrors({});
  };

  const handleGoogleSignIn = async () => {
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
            prompt: "select_account",
          },
        },
      });

      if (error) {
        setIsOAuthLoading(false);
        if (
          error.message.includes("provider is not enabled") ||
          error.message.includes("validation_failed")
        ) {
          toast.error(
            "Provider Google belum diaktifkan di Dashboard Supabase. Buka Authentication > Providers > Google dan masukkan Client ID & Secret.",
            "Provider Google Belum Aktif"
          );
        } else {
          toast.error(error.message, "Gagal Masuk Google");
        }
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      setIsOAuthLoading(false);
      toast.error(
        err instanceof Error
          ? err.message
          : "Terjadi kendala saat menghubungkan ke Supabase.",
        "Gagal Masuk Google"
      );
    }
  };

  const validate = () => {
    const nextErrors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      nextErrors.identifier = "Alamat email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())) {
      nextErrors.identifier = "Format alamat email belum valid.";
    }

    if (!password) {
      nextErrors.password = "Kata sandi wajib diisi.";
    } else if (password.length < 6) {
      nextErrors.password = "Kata sandi minimal 6 karakter.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const roleLabel = role === "umkm" ? "Pelaku UMKM" : "Mitra Supplier";
      toast.success(
        `Selamat datang kembali, ${roleLabel}. Mengalihkan ke beranda...`,
        "Login Berhasil"
      );

      const extractedName = identifier.includes("@") ? identifier.split("@")[0] : identifier;
      setTimeout(() => {
        if (role === "supplier") {
          router.push("/supplier");
        } else {
          router.push(
            `/home?login_success=true&role=${encodeURIComponent(role)}&name=${encodeURIComponent(extractedName)}&email=${encodeURIComponent(identifier)}`
          );
        }
      }, 700);
    }, 600);
  };

  return (
    <>
      <Card className="w-full max-w-[420px] mx-auto rounded-3xl border border-border bg-surface shadow-elevation-2 overflow-hidden flex flex-col justify-center">
        <CardHeader className="gap-2.5 pt-6 sm:pt-7 pb-2 px-6 sm:px-8 text-center flex flex-col items-center justify-center">
          {/* Logo KUMPUL di Bagian Atas Tengah Card */}
          <div className="flex flex-col items-center justify-center gap-1.5 pb-1">
            <div className="w-11 h-11 rounded-2xl bg-primary text-text-inverse flex items-center justify-center font-heading font-extrabold text-xl shadow-xs">
              K
            </div>
            <span className="font-heading font-extrabold text-xl text-primary tracking-tight">
              KUMPUL
            </span>
          </div>

          <div className="text-center space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight text-text-primary text-center">
              {currentConfig.title}
            </CardTitle>
            <CardDescription className="text-xs text-text-secondary text-center max-w-xs mx-auto">
              {currentConfig.shortDescription}
            </CardDescription>
          </div>

          <div className="pt-2 w-full flex justify-center">
            <RoleSwitcher activeRole={role} onRoleChange={handleRoleChange} />
          </div>
        </CardHeader>

        <CardContent className="px-6 sm:px-8 pb-7 sm:pb-8 pt-2 flex flex-col gap-3">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3"
            noValidate
          >
            <FloatingInput
              id={`input-identifier-${role}`}
              label={currentConfig.identifierLabel}
              type="email"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errors.identifier) {
                  setErrors((prev) => ({ ...prev, identifier: undefined }));
                }
              }}
              error={errors.identifier}
              autoComplete="email"
              required
            />

            <FloatingInput
              id={`input-password-${role}`}
              label="Kata Sandi"
              isPassword
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              error={errors.password}
              autoComplete="current-password"
              required
            />

            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <label
                  htmlFor="remember-me"
                  className="text-xs text-text-secondary cursor-pointer select-none font-medium"
                >
                  Ingat saya
                </label>
              </div>

              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded active:scale-[0.96]"
              >
                Lupa sandi?
              </button>
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                size="default"
                isLoading={isSubmitting}
                className="w-full font-bold"
              >
                {isSubmitting ? "Memverifikasi..." : currentConfig.submitButtonText}
              </Button>
            </div>
          </form>

          {/* Pemisah Garis Halus Presisi untuk "atau" */}
          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-3 text-[11px] font-medium text-text-muted font-sans">
                atau
              </span>
            </div>
          </div>

          {/* Tombol Masuk dengan Google OAuth (Supabase) Menggunakan Button Variant Secondary */}
          <Button
            type="button"
            variant="secondary"
            size="default"
            onClick={handleGoogleSignIn}
            disabled={isOAuthLoading || isSubmitting}
            className="w-full flex items-center justify-center gap-2.5 font-semibold"
            aria-label="Masuk dengan akun Google"
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
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>Masuk dengan Google</span>
          </Button>

          {/* Pemisah Garis Halus Presisi untuk "Belum memiliki akun KUMPUL?" */}
          <div className="relative flex items-center justify-center pt-2 pb-1">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-3 text-xs text-text-secondary font-medium font-sans">
                Belum memiliki akun KUMPUL?
              </span>
            </div>
          </div>

          <Button
            asChild
            variant="secondary"
            size="default"
            className="w-full font-bold"
          >
            <Link href={`/register?role=${role}`}>
              <span>Daftar Akun Baru</span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        role={role}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccess={(msg) => toast.success(msg, "Tautan Terkirim")}
      />
    </>
  );
}

export function LoginForm() {
  return (
    <React.Suspense fallback={<div className="w-full max-w-[420px] h-[380px] mx-auto bg-surface rounded-3xl shadow-elevation-1 animate-pulse" />}>
      <LoginFormInner />
    </React.Suspense>
  );
}
