"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
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
  const [showPassword, setShowPassword] = React.useState(false);

  const [errors, setErrors] = React.useState<{ identifier?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = React.useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = React.useState(false);

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
        setToast({
          isOpen: true,
          title: "Login Google Berhasil",
          message: `Selamat datang kembali, ${name || "Pengguna"}. Masuk sebagai ${roleLabel} (${email || "Google"}).`,
          type: "success",
        });
      }, 0);
      return () => clearTimeout(timer);
    } else if (oauthError) {
      const timer = setTimeout(() => {
        setToast({
          isOpen: true,
          title: "Gagal Masuk Google",
          message: decodeURIComponent(oauthError),
          type: "error",
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setErrors({});
  };

  const handleQuickFill = (targetRole: UserRole) => {
    setRole(targetRole);
    const targetConfig = AUTH_ROLE_CONFIGS[targetRole];
    setIdentifier(targetConfig.defaultEmail);
    setPassword("kumpul2026");
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
          setToast({
            isOpen: true,
            title: "Provider Google Belum Aktif",
            message:
              "Provider Google belum diaktifkan di Dashboard Supabase. Buka Authentication > Providers > Google dan masukkan Client ID & Secret.",
            type: "error",
          });
        } else {
          setToast({
            isOpen: true,
            title: "Gagal Masuk Google",
            message: error.message,
            type: "error",
          });
        }
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      setIsOAuthLoading(false);
      setToast({
        isOpen: true,
        title: "Gagal Masuk Google",
        message:
          err instanceof Error
            ? err.message
            : "Terjadi kendala saat menghubungkan ke Supabase.",
        type: "error",
      });
    }
  };

  const validate = () => {
    const nextErrors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      nextErrors.identifier =
        role === "umkm"
          ? "Email atau nomor WhatsApp wajib diisi."
          : "Email atau ID Supplier wajib diisi.";
    } else if (identifier.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
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
      setToast({
        isOpen: true,
        title: "Login Berhasil",
        message: `Selamat datang kembali, ${roleLabel}. Mengalihkan ke beranda...`,
        type: "success",
      });

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
      <Toast
        isOpen={toast.isOpen}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
      />

      <Card className="w-full max-w-md mx-auto text-left">
        <CardHeader className="gap-2">
          <div>
            <CardTitle>{currentConfig.title}</CardTitle>
            <CardDescription className="mt-1">
              {currentConfig.shortDescription}
            </CardDescription>
          </div>

          <div className="pt-2">
            <RoleSwitcher activeRole={role} onRoleChange={handleRoleChange} />
          </div>
        </CardHeader>

        <CardContent className="pb-8 flex flex-col gap-4">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
            noValidate
          >
            <Input
              id={`input-identifier-${role}`}
              label={currentConfig.identifierLabel}
              placeholder={currentConfig.identifierPlaceholder}
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errors.identifier) {
                  setErrors((prev) => ({ ...prev, identifier: undefined }));
                }
              }}
              error={errors.identifier}
              autoComplete="username"
              required
            />

            <div className="flex flex-col gap-1">
              <Input
                id={`input-password-${role}`}
                label="Kata Sandi"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan kata sandi"
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
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer active:scale-[0.96]"
                    aria-label={
                      showPassword
                        ? "Sembunyikan karakter kata sandi"
                        : "Tampilkan karakter kata sandi"
                    }
                  >
                    {showPassword ? (
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                }
              />
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-neutral-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-[#0D3B2E] focus:ring-2 focus:ring-[#0D3B2E] cursor-pointer"
                />
                <span>Ingat saya</span>
              </label>

              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-xs font-semibold text-[#0D3B2E] hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E] rounded active:scale-[0.96]"
              >
                Lupa sandi?
              </button>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="w-full font-semibold"
              >
                {isSubmitting ? "Memverifikasi..." : currentConfig.submitButtonText}
              </Button>
            </div>
          </form>

          {/* Pemisah Garis Halus */}
          <div className="relative flex items-center justify-center my-0.5">
            <div className="w-full border-t border-neutral-200" aria-hidden="true" />
            <span className="relative bg-white px-3 text-[11px] text-neutral-400 font-sans uppercase tracking-wider">
              atau
            </span>
          </div>

          {/* Tombol Masuk dengan Google OAuth (Supabase) */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isOAuthLoading || isSubmitting}
            className={`w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-neutral-200/90 bg-white hover:bg-neutral-50 active:scale-[0.96] text-neutral-800 text-sm font-medium transition-all duration-150 flex items-center justify-center gap-3 shadow-xs hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E] ${
              isOAuthLoading || isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
            aria-label="Masuk dengan akun Google via Supabase"
          >
            {isOAuthLoading ? (
              <svg
                className="animate-spin h-4 w-4 text-neutral-600"
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
          </button>

          {/* Baris Akun Demo untuk Pengujian Cepat */}
          <div className="pt-1 flex items-center justify-center gap-3 text-xs text-neutral-500">
            <span className="text-[11px] text-neutral-400">Akun demo:</span>
            <button
              type="button"
              onClick={() => handleQuickFill("umkm")}
              className="font-medium text-neutral-700 hover:text-[#0D3B2E] transition-colors cursor-pointer hover:underline"
            >
              UMKM
            </button>
            <span className="text-neutral-300">&bull;</span>
            <button
              type="button"
              onClick={() => handleQuickFill("supplier")}
              className="font-medium text-neutral-700 hover:text-[#0D3B2E] transition-colors cursor-pointer hover:underline"
            >
              Supplier
            </button>
          </div>
        </CardContent>
      </Card>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        role={role}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccess={(msg) =>
          setToast({
            isOpen: true,
            title: "Tautan Terkirim",
            message: msg,
            type: "success",
          })
        }
      />
    </>
  );
}

export function LoginForm() {
  return (
    <React.Suspense fallback={<div className="w-full max-w-md h-[400px] mx-auto bg-white rounded-2xl shadow-sm animate-pulse" />}>
      <LoginFormInner />
    </React.Suspense>
  );
}
