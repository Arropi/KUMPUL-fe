"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserRole, AUTH_ROLE_CONFIGS } from "@/constants/auth";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  role: UserRole;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function ForgotPasswordModal({
  isOpen,
  role,
  onClose,
  onSuccess,
}: ForgotPasswordModalProps) {
  const [identifier, setIdentifier] = React.useState("");
  const [error, setError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Masukkan email atau nomor kontak akun Anda.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess(`Tautan pemulihan kata sandi telah dikirim ke ${identifier}.`);
      setIdentifier("");
      onClose();
    }, 600);
  };

  const handleClose = () => {
    setIdentifier("");
    setError("");
    onClose();
  };

  const roleTitle = role === "umkm" ? "UMKM" : "Supplier";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-black/10 border border-neutral-100 p-6 sm:p-7 flex flex-col gap-4 text-left"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3
              id="modal-title"
              className="font-heading text-lg font-bold text-neutral-900"
            >
              Atur Ulang Kata Sandi
            </h3>
            <p className="font-sans text-xs text-neutral-500 mt-1">
              Akun {roleTitle}. Tautan verifikasi akan dikirimkan ke kontak Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer active:scale-[0.96]"
          >
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label={AUTH_ROLE_CONFIGS[role].identifierLabel}
            placeholder={AUTH_ROLE_CONFIGS[role].identifierPlaceholder}
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (error) setError("");
            }}
            error={error}
            autoFocus
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={handleClose}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
            >
              Kirim Tautan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
