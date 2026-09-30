"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  type: ToastType;
  duration?: number;
}

export interface ToastOptions {
  title?: string;
  message?: string;
  type?: ToastType;
  duration?: number;
}

// Event listener internal untuk pemanggilan fungsi standalone global
type Listener = () => void;
let memoryToasts: ToastItem[] = [];
const listeners: Listener[] = [];

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function getSnapshot(): ToastItem[] {
  return memoryToasts;
}

const emptySnapshot: ToastItem[] = [];
function getServerSnapshot(): ToastItem[] {
  return emptySnapshot;
}

export function dispatchToast(
  options: ToastOptions | string,
  type: ToastType = "info"
): string {
  const id = Math.random().toString(36).substring(2, 9);
  const defaultTitle =
    type === "success"
      ? "Berhasil"
      : type === "error"
      ? "Gagal"
      : "Informasi";

  const toastItem: ToastItem =
    typeof options === "string"
      ? {
          id,
          message: options,
          title: defaultTitle,
          type,
          duration: 4000,
        }
      : {
          id,
          message: options.message || "",
          title: options.title || defaultTitle,
          type: options.type || type,
          duration: options.duration ?? 4000,
        };

  // Batasi maksimal 3 toast bersamaan agar layar tetap rapi dan tidak tertumpuk
  memoryToasts = [toastItem, ...memoryToasts.filter((t) => t.id !== id)].slice(0, 3);
  notify();
  return id;
}

export function dismissToast(id?: string) {
  if (id) {
    memoryToasts = memoryToasts.filter((t) => t.id !== id);
  } else {
    memoryToasts = [];
  }
  notify();
}

/**
 * Fungsi utilitas global toast yang dapat dipanggil dari mana saja
 * Contoh:
 * - toast.success("Data berhasil disimpan", "Sukses")
 * - toast.error("Terjadi kendala saat login", "Gagal")
 * - toast.info("Modul sedang dalam tahap pengembangan")
 */
export const toast = Object.assign(
  (messageOrOptions: string | ToastOptions) => dispatchToast(messageOrOptions, "info"),
  {
    success: (message: string, title?: string, duration?: number) =>
      dispatchToast({ message, title: title || "Berhasil", type: "success", duration }, "success"),
    error: (message: string, title?: string, duration?: number) =>
      dispatchToast({ message, title: title || "Gagal", type: "error", duration }, "error"),
    info: (message: string, title?: string, duration?: number) =>
      dispatchToast({ message, title: title || "Informasi", type: "info", duration }, "info"),
    dismiss: (id?: string) => dismissToast(id),
  }
);

// React Context untuk pemanggilan via hook useToast()
interface ToastContextValue {
  toasts: ToastItem[];
  toast: typeof toast;
  dismiss: (id?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    return {
      toasts: memoryToasts,
      toast,
      dismiss: dismissToast,
    };
  }
  return context;
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  React.useEffect(() => {
    if (!item.duration || item.duration <= 0) return;
    const timer = setTimeout(() => {
      onDismiss(item.id);
    }, item.duration);
    return () => clearTimeout(timer);
  }, [item.id, item.duration, onDismiss]);

  const isSuccess = item.type === "success";
  const isError = item.type === "error";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto w-full",
        "bg-white rounded-2xl shadow-xl shadow-black/8 border p-4",
        "flex items-start gap-3 transition-all duration-200 animate-in fade-in slide-in-from-top-3",
        isSuccess && "border-primary/20",
        isError && "border-red-200",
        !isSuccess && !isError && "border-neutral-200"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border",
          isSuccess && "bg-[#EBF5F0] text-[#0D3B2E] border-[#0D3B2E]/20",
          isError && "bg-red-50 text-[#DC2626] border-red-200",
          !isSuccess && !isError && "bg-neutral-100 text-neutral-700 border-neutral-200"
        )}
      >
        {isSuccess && (
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {isError && (
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {!isSuccess && !isError && (
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      {/* Konten Teks */}
      <div className="flex-1 text-left min-w-0">
        {item.title && (
          <p className="font-heading text-xs font-bold text-neutral-900 leading-tight">
            {item.title}
          </p>
        )}
        <p className="font-sans text-xs text-neutral-600 mt-0.5 leading-relaxed text-pretty break-words">
          {item.message}
        </p>
      </div>

      {/* Tombol Tutup */}
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Tutup notifikasi"
        className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer active:scale-[0.96] shrink-0"
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

/**
 * Provider Toast yang dipasang di layout root aplikasi
 */
export function ToastProvider({ children }: { children?: React.ReactNode }) {
  const toasts = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const handleDismiss = React.useCallback((id: string) => {
    dismissToast(id);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss: dismissToast }}>
      {children}
      {/* Wadah notifikasi toast mengambang di pojok kanan atas */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] sm:w-auto pointer-events-none"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={handleDismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Komponen Toast kompatibilitas lama jika masih ada yang merender langsung
export interface ToastProps {
  isOpen: boolean;
  message: string;
  title?: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({
  isOpen,
  message,
  title = "Berhasil",
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
        "bg-white rounded-2xl shadow-xl shadow-black/8 border border-neutral-200 p-4",
        "flex items-start gap-3 transition-all duration-200 animate-in fade-in slide-in-from-top-3"
      )}
    >
      <div className="w-6 h-6 rounded-full bg-[#EBF5F0] text-[#0D3B2E] flex items-center justify-center shrink-0 mt-0.5 border border-[#0D3B2E]/20">
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      <div className="flex-1 text-left min-w-0">
        <p className="font-heading text-xs font-bold text-neutral-900">{title}</p>
        <p className="font-sans text-xs text-neutral-600 mt-0.5 leading-relaxed text-pretty">
          {message}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup notifikasi"
        className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer active:scale-[0.96] shrink-0"
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
