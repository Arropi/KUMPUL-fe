"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ForgotPasswordModal } from "@/modules/auth/forgot-password-modal";
import {
  loginWithCredentialsAction,
  registerWithCredentialsAction,
  initiateGoogleAuthAction,
} from "@/actions/auth";
import { BusinessStep } from "./business-step";

export type AuthMode = "login" | "register";

interface AuthCardProps {
  defaultMode?: AuthMode;
}

export function AuthCard({ defaultMode = "login" }: AuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode via URL parameter (?mode=register / ?mode=login) atau prop
  const paramMode = searchParams.get("mode");
  const initialMode: AuthMode =
    paramMode === "register" || paramMode === "login" ? paramMode : defaultMode;
  const [mode, setMode] = React.useState<AuthMode>(initialMode);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);

  const [viewMode, setViewMode] = React.useState<"AUTH" | "BUSINESS_STEP">(
    searchParams.get("step") === "business" ? "BUSINESS_STEP" : "AUTH"
  );
  const [pendingUserId, setPendingUserId] = React.useState<string>("");
  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = React.useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = React.useState(false);

  React.useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "register" || m === "login") setMode(m);
    if (searchParams.get("step") === "business") setViewMode("BUSINESS_STEP");
  }, [searchParams]);

  const handleSwitchMode = (targetMode: AuthMode) => {
    setMode(targetMode);
    setErrors({});
    setViewMode("AUTH");
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("mode", targetMode);
    router.replace(`?${newParams.toString()}`);
  };

  const validate = () => {
    const nextErrors: Record<string, string | undefined> = {};
    if (!email.trim()) {
      nextErrors.email = "Alamat email operasional wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Format alamat email tidak valid.";
    }
    if (!password) {
      nextErrors.password = "Kata sandi wajib diisi.";
    } else if (password.length < 6) {
      nextErrors.password = "Kata sandi minimal 6 karakter.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Submit Handler: Tetap membedakan function register vs login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        // FUNCTION: Register akun Supabase lalu cek login token BE
        const result = await registerWithCredentialsAction({
          email: email.trim(),
          password,
        });
        setIsSubmitting(false);

        // Jika belum REGISTERED di BE: arahkan ke form pengisian role & tempat (business-step)
        if (result.requiresBusinessStep) {
          if (result.userId) setPendingUserId(result.userId);
          setViewMode("BUSINESS_STEP");
          toast.info("Akun dibuat. Silakan lengkapi profil & peran usaha Anda.", "Langkah Terakhir");
          return;
        }

        if (!result.success) {
          toast.error(result.error || "Gagal mendaftarkan akun.", "Registrasi Gagal");
          setErrors({ email: result.error });
          return;
        }

        if (result.redirectTo) window.location.href = result.redirectTo;
      } else {
        // FUNCTION: Login kredensial & token exchange BE
        const result = await loginWithCredentialsAction({
          email: email.trim(),
          password,
          rememberMe,
        });
        setIsSubmitting(false);

        // Jika belum REGISTERED / profil belum lengkap: alihkan ke business-step
        if (result.requiresBusinessStep) {
          if (result.userId) setPendingUserId(result.userId);
          toast.info("Akun belum memiliki peran & profil usaha lengkap.", "Lengkapi Profil Usaha");
          setViewMode("BUSINESS_STEP");
          return;
        }

        if (!result.success) {
          toast.error(result.error || "Gagal masuk.", "Login Gagal");
          setErrors({ email: result.error || "Email atau kata sandi salah." });
          return;
        }

        toast.success(`Selamat datang kembali, ${result.user?.name || "Pengguna"}.`, "Login Berhasil");
        const targetUrl = result.redirectTo || "/home";
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 500);
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      const errMsg = err instanceof Error ? err.message : "Gangguan sistem server.";
      toast.error(errMsg, "Kesalahan Server");
    }
  };

  const handleGoogleAuth = async () => {
    setIsOAuthLoading(true);
    try {
      const result = await initiateGoogleAuthAction({ origin: window.location.origin });
      if (!result.success || !result.url) {
        setIsOAuthLoading(false);
        toast.error(result.error || "Gagal menginisiasi Google OAuth.", "Gagal Google");
        return;
      }
      window.location.href = result.url;
    } catch {
      setIsOAuthLoading(false);
      toast.error("Terjadi kendala saat menghubungkan ke Google.", "Gagal Google");
    }
  };

  // Tampilan Form BusinessStep (Pengisian Role, Profil Usaha, dan Titik Lokasi Peta)
  if (viewMode === "BUSINESS_STEP") {
    return (
      <Card className="w-full max-w-[480px] mx-auto rounded-3xl border border-border bg-surface shadow-elevation-2 overflow-hidden">
        <CardHeader className="gap-2 pt-6 pb-2 px-6 sm:px-8 text-center flex flex-col items-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-2xl bg-primary text-text-inverse flex items-center justify-center font-heading font-extrabold text-xl shadow-xs">
              K
            </div>
            <span className="font-heading font-extrabold text-xl text-primary tracking-tight">KUMPUL</span>
          </div>
          <div className="space-y-1 text-center">
            <CardTitle className="text-lg sm:text-xl font-bold text-text-primary">Lengkapi Profil Usaha</CardTitle>
            <CardDescription className="text-xs text-text-secondary">Pilih peran bisnis, legalitas, dan lokasi operasional</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-7 pt-2">
          <BusinessStep
            userId={pendingUserId}
            email={email}
            onBack={() => setViewMode("AUTH")}
            onSuccess={(target) => {
              window.location.href = target;
            }}
          />
        </CardContent>
      </Card>
    );
  }

  // Tampilan Seragam Auth Awal (Tanpa Role Selection di Awal)
  return (
    <>
      <Card className="w-full max-w-[440px] mx-auto rounded-3xl border border-border bg-surface shadow-elevation-2 overflow-hidden flex flex-col justify-center">
        <CardHeader className="gap-2.5 pt-6 sm:pt-7 pb-2 px-6 sm:px-8 text-center flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-1 pb-1">
            <div className="w-11 h-11 rounded-2xl bg-primary text-text-inverse flex items-center justify-center font-heading font-extrabold text-xl shadow-xs">
              K
            </div>
            <span className="font-heading font-extrabold text-xl text-primary tracking-tight">KUMPUL</span>
          </div>

          <div className="text-center space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight text-text-primary">
              {mode === "register" ? "Daftar Akun Baru" : "Masuk ke Akun"}
            </CardTitle>
            <CardDescription className="text-xs text-text-secondary max-w-xs mx-auto">
              {mode === "register"
                ? "Bergabung ke ekosistem kolaborasi rantai pasok pangan KUMPUL"
                : "Kelola pasokan bahan baku dan operasional bisnis Anda"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6 sm:px-8 pb-7 sm:pb-8 pt-2 flex flex-col gap-3">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            <FloatingInput
              id="auth-email"
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
              id="auth-password"
              label="Kata Sandi"
              isPassword
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />

            {mode === "login" && (
              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <label htmlFor="remember-me" className="text-xs text-text-secondary cursor-pointer select-none font-medium">
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
            )}

            {/* Tombol Utama */}
            <div className="pt-1">
              <Button type="submit" variant="primary" size="default" isLoading={isSubmitting} className="w-full font-bold">
                {isSubmitting
                  ? mode === "register" ? "Mendaftarkan..." : "Memverifikasi..."
                  : mode === "register" ? "Daftar Akun Baru" : "Masuk ke Akun"}
              </Button>
            </div>
          </form>

          {/* Pemisah "atau" */}
          <div className="relative flex items-center justify-center py-1.5">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-3 text-[11px] font-medium text-text-muted font-sans">atau</span>
            </div>
          </div>

          {/* Tombol Google OAuth */}
          <Button
            type="button"
            variant="secondary"
            size="default"
            onClick={handleGoogleAuth}
            disabled={isOAuthLoading || isSubmitting}
            className="w-full flex items-center justify-center gap-2.5 font-semibold"
          >
            {isOAuthLoading ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
            )}
            <span>{mode === "register" ? "Daftar dengan Google" : "Masuk dengan Google"}</span>
          </Button>

          {/* Switch Mode via Parameter */}
          <div className="relative flex items-center justify-center pt-2 pb-1">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-3 text-xs text-text-secondary font-medium font-sans">
                {mode === "register" ? "Sudah memiliki akun KUMPUL?" : "Belum memiliki akun KUMPUL?"}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="default"
            onClick={() => handleSwitchMode(mode === "register" ? "login" : "register")}
            className="w-full font-bold"
          >
            {mode === "register" ? "Masuk ke Akun Anda" : "Daftar Akun Baru"}
          </Button>
        </CardContent>
      </Card>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        role="umkm"
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccess={(msg) => toast.success(msg, "Tautan Terkirim")}
      />
    </>
  );
}
