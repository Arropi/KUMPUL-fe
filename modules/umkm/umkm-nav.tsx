"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { PlusSignIcon, SidebarLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  href: string;
  exact?: boolean;
  badge?: string;
  icon: (active: boolean) => React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "pooling",
    label: "Radar Pooling",
    href: "/umkm",
    exact: true,
    badge: "4 Aktif",
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-primary" : "text-text-muted"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    id: "katalog",
    label: "Katalog Bahan Baku",
    href: "/umkm/katalog",
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-primary" : "text-text-muted"}`}
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
    id: "pesanan",
    label: "Pesanan Saya",
    href: "/umkm/pesanan",
    badge: "1 Siap",
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-primary" : "text-text-muted"}`}
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
    id: "paspor-mutu",
    label: "Paspor Mutu Mandiri",
    href: "/umkm/paspor-mutu",
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-primary" : "text-text-muted"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    id: "sirkular",
    label: "Bursa Limbah P2P",
    href: "/umkm/sirkular",
    badge: "Eco",
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-primary" : "text-text-muted"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    ),
  },
  {
    id: "profil",
    label: "Profil & Rekening",
    href: "/umkm/profil",
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-primary" : "text-text-muted"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

interface UmkmNavProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function UmkmNav({ isMobileOpen = false, onCloseMobile }: UmkmNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(true);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const getActiveIndex = () => {
    const idx = NAV_ITEMS.findIndex((item) => {
      if (item.exact) {
        return pathname === item.href;
      }
      return pathname.startsWith(item.href);
    });
    return idx >= 0 ? idx : 0;
  };

  const selectedIndex = getActiveIndex();

  const handleInitiatePooling = () => {
    router.push("/umkm/katalog");
  };

  const renderNavList = (expanded: boolean, isMobileView = false) => (
    <div
      className="relative z-10 flex w-full flex-col gap-1.5 whitespace-nowrap"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {NAV_ITEMS.map((item, index) => {
        const isSelected = selectedIndex === index;
        const isHovered = hoveredIndex === index && !isSelected;

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => {
              if (isMobileView && onCloseMobile) {
                onCloseMobile();
              }
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            title={!expanded ? item.label : undefined}
            className={cn(
              "relative cursor-pointer min-h-[44px] rounded-xl flex items-center transition-all duration-150 active:scale-[0.98]",
              expanded ? "px-3.5 py-2.5" : "justify-center px-2 py-2"
            )}
          >
            {/* Active Selected Background (Watermelon UI MacOS Style) */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  className="bg-primary-light border border-primary/20 absolute inset-0 z-0 rounded-xl shadow-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>

            {/* Hover Pill with Spring Physics */}
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  layoutId={isMobileView ? "mobile-hover-bg" : "umkm-hover-bg"}
                  className="bg-surface-subtle/90 absolute inset-0 z-0 rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 32,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Label, Icon, and Badge Content */}
            <div
              className={cn(
                "relative z-10 flex items-center w-full gap-3",
                !expanded && "justify-center"
              )}
            >
              <span className="shrink-0">{item.icon(isSelected)}</span>

              {expanded && (
                <div className="flex items-center justify-between flex-1 min-w-0 gap-2">
                  <span
                    className={cn(
                      "font-sans text-xs truncate",
                      isSelected
                        ? "text-primary font-bold"
                        : "text-text-secondary font-medium"
                    )}
                  >
                    {item.label}
                  </span>

                  {item.badge && (
                    <span
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 shadow-xs",
                        item.badge === "Eco"
                          ? "bg-emerald-500/15 text-emerald-800 border border-emerald-500/30"
                          : "bg-accent text-text-inverse"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop Animated MacOS Sidebar */}
      <motion.aside
        animate={{
          width: isOpen ? 256 : 72,
        }}
        transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
        className={cn(
          "hidden md:flex flex-col justify-between border-r border-border bg-surface p-3 shrink-0 sticky top-0 h-screen overflow-y-auto select-none z-20",
          isOpen ? "shadow-elevation-1" : "items-center"
        )}
      >
        <div className="flex flex-col w-full">
          {/* Header Controls (Logo / Brand / Plus & Toggle) */}
          <div
            className={cn(
              "flex w-full items-center shrink-0 min-h-[48px] pb-3 border-b border-border/70",
              isOpen ? "justify-between gap-2 px-1" : "justify-center"
            )}
          >
            {isOpen && (
              <Link
                href="/umkm"
                className="flex items-center gap-2 min-w-0 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
              >
                <Image
                  src="/logo/without-bg.svg"
                  alt="Logo KUMPUL"
                  width={140}
                  height={44}
                  className="h-10 w-auto object-contain shrink-0"
                  priority
                />
                <span className="font-heading text-[10px] font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded-md border border-primary/20 shrink-0">
                  UMKM
                </span>
              </Link>
            )}

            <div className="flex items-center gap-1 shrink-0">
              <AnimatePresence>
                {isOpen && (
                  <motion.button
                    type="button"
                    onClick={handleInitiatePooling}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    title="Cari & Gabung Pooling Bahan Baku"
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer active:scale-95"
                  >
                    <HugeiconsIcon
                      icon={PlusSignIcon}
                      className="size-4.5"
                    />
                  </motion.button>
                )}
              </AnimatePresence>

              <motion.button
                layout
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                title={isOpen ? "Tutup Sidebar" : "Buka Sidebar"}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer active:scale-95 flex items-center justify-center"
              >
                <HugeiconsIcon
                  icon={SidebarLeftIcon}
                  className="size-4.5"
                />
              </motion.button>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="mt-4">
            {isOpen && (
              <p className="px-3 text-[10px] font-bold text-text-muted mb-2 font-heading">
                Pengadaan &amp; Mutu Pangan
              </p>
            )}
            {renderNavList(isOpen, false)}
          </div>
        </div>

        {/* Footer Info Entitas UMKM & Hub Logistik */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-3.5 mt-4 rounded-xl bg-surface-subtle border border-border/80 shadow-xs space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-text-muted">Hub Konsolidasi</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Rungkut Aktif
              </span>
            </div>
            <p className="text-xs font-bold text-text-primary truncate">
              Warung Katering Bu Siti
            </p>
            <p className="text-[11px] text-text-muted leading-tight truncate">
              Sektor: Katering &amp; Olahan Pangan
            </p>
          </motion.div>
        )}
      </motion.aside>

      {/* Mobile Drawer (Overlay) */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-black/40 backdrop-blur-xs flex"
          role="dialog"
          aria-modal="true"
          onClick={onCloseMobile}
        >
          <div
            className="w-72 max-w-[85vw] bg-surface h-full shadow-2xl flex flex-col justify-between p-4 animate-in slide-in-from-left duration-200 border-r border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-5">
              {/* Brand & Close Button */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <Link
                  href="/umkm"
                  className="flex items-center gap-2 min-w-0 overflow-hidden"
                  onClick={onCloseMobile}
                >
                  <Image
                    src="/logo/without-bg.svg"
                    alt="Logo KUMPUL"
                    width={140}
                    height={44}
                    className="h-10 w-auto object-contain shrink-0"
                    priority
                  />
                  <span className="font-heading text-[10px] font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded-md border border-primary/20 shrink-0">
                    UMKM
                  </span>
                </Link>

                {onCloseMobile && (
                  <button
                    type="button"
                    onClick={onCloseMobile}
                    className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-subtle min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-[0.96]"
                    aria-label="Tutup menu navigasi"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Nav List for Mobile */}
              <div>
                <p className="px-3 text-[10px] font-bold text-text-muted mb-2 font-heading">
                  Pengadaan &amp; Mutu Pangan
                </p>
                {renderNavList(true, true)}
              </div>
            </div>

            {/* Mobile Footer Info */}
            <div className="p-3.5 rounded-xl bg-surface-subtle border border-border/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-text-muted">Hub Konsolidasi</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Rungkut Aktif
                </span>
              </div>
              <p className="text-xs font-bold text-text-primary truncate">
                Warung Katering Bu Siti
              </p>
              <p className="text-[11px] text-text-muted leading-tight truncate">
                Sektor: Katering &amp; Olahan Pangan
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
