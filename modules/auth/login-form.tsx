"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RoleSwitcher } from "@/modules/auth/role-switcher";
import { ForgotPasswordModal } from "@/modules/auth/forgot-password-modal";
import { UserRole, AUTH_ROLE_CONFIGS, DEFAULT_ROLE } from "@/constants/auth";

export function LoginForm() {
  const [role, setRole] = React.useState<UserRole>(DEFAULT_ROLE);
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const [errors, setErrors] = React.useState<{ identifier?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
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
        message: `Selamat datang kembali, ${roleLabel} (${identifier}).`,
        type: "success",
      });
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

        <CardContent className="pb-8">
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

            <div className="pt-3 flex items-center justify-center gap-3 text-xs text-neutral-500">
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
          </form>
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
