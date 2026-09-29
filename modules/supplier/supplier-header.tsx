"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/toast";

interface SupplierHeaderProps {
  onToggleMobileNav?: () => void;
}

export function SupplierHeader({ onToggleMobileNav }: SupplierHeaderProps) {
  const router = useRouter();
  const [toast, setToast] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "info" | "error";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const handleSwitchToUmkm = () => {
    setToast({
      isOpen: true,
      title: "Beralih Peran Usaha",
      message: "Beralih ke akun UMKM KUMPUL (Single Legal Entity). Mengalihkan...",
      type: "info",
    });

    setTimeout(() => {
      router.push("/home?role=umkm&login_success=true");
    }, 500);
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

      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200/80 h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Sisi Kiri: Tombol Burger Mobile & Status Halaman */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileNav}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors"
            aria-label="Buka menu navigasi"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-800">
              PT Agroniaga Nusantara
            </span>
            <span className="text-neutral-300">&bull;</span>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              Verified Supplier
            </span>
          </div>
        </div>

        {/* Sisi Kanan: Role Switcher 1-Klik & Akun */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* PRD Modul A.3: 1-Click Cross-Role Account Switching */}
          <button
            type="button"
            onClick={handleSwitchToUmkm}
            className="min-h-[40px] px-3 sm:px-3.5 py-1.5 rounded-xl border border-[#0D3B2E]/20 bg-[#EBF5F0] hover:bg-[#E0EFE8] active:scale-[0.96] text-[#0D3B2E] text-xs font-bold transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
            title="Pindah ke peran UMKM untuk pengadaan pooling"
          >
            <svg className="w-3.5 h-3.5 text-[#0D3B2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="hidden xs:inline">Mode:</span>
            <span className="font-extrabold text-[#B45309]">Supplier</span>
            <span className="text-neutral-400">➔</span>
            <span className="underline decoration-dotted">UMKM</span>
          </button>

          {/* Notifikasi PO Cepat */}
          <Link
            href="/supplier/pesanan"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 relative transition-all"
            aria-label="Lihat pesanan masuk"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#B45309]" />
          </Link>

          {/* Tombol Logout */}
          <a
            href="/api/auth/logout?role=supplier"
            className="min-h-[40px] px-3 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 active:scale-[0.96] text-neutral-600 text-xs font-medium transition-all shadow-2xs flex items-center gap-1.5"
            title="Keluar dari akun"
          >
            <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Keluar</span>
          </a>
        </div>
      </header>
    </>
  );
}
