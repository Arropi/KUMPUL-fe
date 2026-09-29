"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  exact?: boolean;
  icon: (active: boolean) => React.ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Ringkasan",
    href: "/supplier",
    exact: true,
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-[#0D3B2E]" : "text-neutral-500"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    label: "Katalog & Kuota",
    href: "/supplier/katalog",
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-[#0D3B2E]" : "text-neutral-500"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
  },
  {
    label: "Pesanan PO Masuk",
    href: "/supplier/pesanan",
    badge: "1 Baru",
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-[#0D3B2E]" : "text-neutral-500"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      </svg>
    ),
  },
  {
    label: "Profil & Rekening",
    href: "/supplier/profil",
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-[#0D3B2E]" : "text-neutral-500"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
];

interface SupplierNavProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function SupplierNav({ isMobileOpen = false, onCloseMobile }: SupplierNavProps) {
  const pathname = usePathname();

  const isLinkActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-6">
        {/* Brand KUMPUL */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-neutral-200/80">
          <Link
            href="/supplier"
            className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E] rounded-lg"
            onClick={onCloseMobile}
          >
            <span className="w-9 h-9 rounded-xl bg-[#0D3B2E] flex items-center justify-center text-white font-extrabold text-base shadow-xs">
              K
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-[#0D3B2E] tracking-tight leading-none">
                KUMPUL
              </span>
              <span className="text-[11px] font-semibold text-[#B45309] tracking-wider uppercase mt-1">
                Portal Supplier
              </span>
            </div>
          </Link>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Tutup menu navigasi"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Menu Navigasi */}
        <div className="px-3">
          <p className="px-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            Manajemen Pasokan
          </p>
          <nav className="space-y-1" aria-label="Menu Supplier">
            {NAV_ITEMS.map((item) => {
              const active = isLinkActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all group ${
                    active
                      ? "bg-[#EBF5F0] text-[#0D3B2E] shadow-xs"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon(active)}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#B45309] text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Info Status Legalitas & Ringkasan Entitas */}
      <div className="p-4 m-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-neutral-500">Legalitas Supplier</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            NIB Aktif
          </span>
        </div>
        <p className="text-xs font-semibold text-neutral-800 line-clamp-1">
          PT Agroniaga Nusantara
        </p>
        <p className="text-[11px] text-neutral-500 leading-tight">
          Sektor: Pertanian &amp; Pangan
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-neutral-200/80 shrink-0 sticky top-0 h-screen overflow-y-auto">
        {navContent}
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-black/40 backdrop-blur-xs flex"
          role="dialog"
          aria-modal="true"
          onClick={onCloseMobile}
        >
          <div
            className="w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
