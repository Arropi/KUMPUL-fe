"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { switchRoleAction } from "@/actions/auth";

interface SupplierHeaderProps {
  onToggleMobileNav?: () => void;
}

export function SupplierHeader({ onToggleMobileNav }: SupplierHeaderProps) {
  const router = useRouter();
  const [isSwitching, setIsSwitching] = React.useState(false);

  const handleSwitchToUmkm = async () => {
    if (isSwitching) return;
    setIsSwitching(true);
    toast.info(
      "Menyiapkan akun & beralih ke portal UMKM...",
      "Beralih Peran Usaha"
    );

    try {
      const res = await switchRoleAction("umkm");
      if (res.success) {
        toast.success(
          res.autoCreatedInDb
            ? "Akun Pelaku UMKM baru otomatis dibuat & diaktifkan."
            : "Berhasil beralih ke portal Pelaku UMKM.",
          "Beralih Peran Usaha"
        );
        router.push(res.redirectTo);
        router.refresh();
      } else {
        window.location.href = "/api/auth/switch-role?to=umkm&next=/umkm";
      }
    } catch {
      window.location.href = "/api/auth/switch-role?to=umkm&next=/umkm";
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-surface/95 backdrop-blur-md border-b border-border h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Sisi Kiri: Tombol Burger Mobile & Status Halaman */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileNav}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-text-secondary hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Buka menu navigasi"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold text-text-primary">
              PT Agroniaga Nusantara
            </span>
            <span className="text-text-muted">&bull;</span>
            <span className="text-[11px] font-medium text-primary bg-[#EBF5F0] px-2.5 py-0.5 rounded-full border border-[#0D3B2E]/20">
              Verified Supplier
            </span>
          </div>
        </div>

        {/* Sisi Kanan: Role Switcher 1-Klik & Akun */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* PRD Modul A.3: 1-Click Cross-Role Account Switching */}
          <button
            type="button"
            disabled={isSwitching}
            onClick={handleSwitchToUmkm}
            className="min-h-[40px] px-3.5 sm:px-4 py-1.5 rounded-xl border border-primary/20 bg-[#EBF5F0] text-primary text-xs font-bold transition-all duration-150 flex items-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(13,59,46,0.1),0_2px_6px_rgba(13,59,46,0.08)] hover:bg-[#E0EFE8] hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_4px_12px_rgba(13,59,46,0.12)] active:scale-[0.98] active:translate-y-[0.5px] active:shadow-[inset_0_2px_4px_rgba(13,59,46,0.2)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
            title="Pindah ke peran UMKM untuk pengadaan pooling (tanpa login ulang)"
          >
            {isSwitching ? (
              <svg className="w-3.5 h-3.5 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            )}
            <span className="hidden xs:inline">Mode:</span>
            <span className="font-extrabold text-accent">Supplier</span>
            <span className="text-text-muted">➔</span>
            <span className="underline decoration-dotted">{isSwitching ? "Beralih..." : "UMKM"}</span>
          </button>

          {/* Notifikasi PO Cepat */}
          <Link
            href="/supplier/pesanan"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-border bg-surface text-text-secondary shadow-[inset_0_1px_0_#FFFFFF,inset_0_-1px_0_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.04)] hover:bg-surface-subtle hover:text-text-primary hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_#FFFFFF,0_4px_12px_rgba(0,0,0,0.08)] active:scale-[0.98] active:translate-y-[0.5px] relative transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Lihat pesanan masuk"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" />
          </Link>

          {/* Link Profil Supplier */}
          <Link
            href="/supplier/profil"
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-surface-subtle transition-colors"
            title="Profil Badan Usaha Supplier"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-text-inverse flex items-center justify-center font-bold text-xs shadow-xs">
              S
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-text-primary leading-tight">
                PT Agroniaga
              </span>
              <span className="text-[10px] text-text-muted leading-tight">
                Mitra Supplier
              </span>
            </div>
          </Link>

          {/* Tombol Logout */}
          <a
            href="/api/auth/logout?role=supplier"
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-subtle hover:-translate-y-0.5 text-text-secondary hover:text-text-primary active:scale-[0.98] active:translate-y-[0.5px] text-xs font-semibold transition-all duration-150 shadow-[inset_0_1px_0_#FFFFFF,inset_0_-1px_0_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.04)] hover:shadow-[inset_0_1px_0_#FFFFFF,0_4px_12px_rgba(0,0,0,0.08)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)] flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="Keluar dari akun"
          >
            <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Keluar</span>
          </a>
        </div>
      </header>
    </>
  );
}
