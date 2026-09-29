"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  isOpen: boolean;
  message: string;
  title?: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
}

export function Toast({
  isOpen,
  message,
  title = "Berhasil",
  type = "success",
  duration = 4000,
  onClose,
}: ToastProps) {
  React.useEffect(() => {
    if (!isOpen || duration <= 0) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed top-5 right-5 z-50 max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] sm:w-auto",
        "bg-surface rounded-2xl shadow-xl shadow-black/10 border border-border p-4",
        "flex items-start gap-3 transition-all duration-200 animate-in fade-in slide-in-from-top-3"
      )}
    >
      <div className="w-6 h-6 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
        {type === "success" && (
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      <div className="flex-1 text-left">
        <p className="font-heading text-xs font-bold text-text-primary">
          {title}
        </p>
        <p className="font-sans text-xs text-text-secondary mt-0.5 leading-relaxed text-pretty">
          {message}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup notifikasi"
        className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer active:scale-[0.96]"
      >
        <svg
          className="w-3.5 h-3.5"
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
  );
}
