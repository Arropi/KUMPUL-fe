"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { UserRole } from "@/constants/auth";

interface RegisterAuthStepProps {
  role: UserRole;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  errors: Record<string, string | undefined>;
  clearError: (field: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleSignUp: () => void;
  isOAuthLoading: boolean;
  isSubmitting: boolean;
}

export function RegisterAuthStep({
  role,
  email,
  setEmail,
  password,
  setPassword,
  errors,
  clearError,
  onSubmit,
  onGoogleSignUp,
  isOAuthLoading,
  isSubmitting,
}: RegisterAuthStepProps) {
  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
        <FloatingInput
          id="register-email"
          label="Email Operasional"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) clearError("email");
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
            if (errors.password) clearError("password");
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
            disabled={isSubmitting || isOAuthLoading}
            className="w-full font-bold"
          >
            {isSubmitting ? "Memverifikasi Akun..." : "Lanjut ke Validasi Usaha \u2192"}
          </Button>
        </div>
      </form>

      {/* Pemisah "atau" */}
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
        onClick={onGoogleSignUp}
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
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
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
        <span>Daftar dengan Google</span>
      </Button>

      {/* Link ke Login */}
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

      <Button asChild variant="secondary" size="default" className="w-full font-bold">
        <Link href={`/login?role=${role}`}>
          <span>Masuk ke Akun Anda</span>
        </Link>
      </Button>
    </div>
  );
}
