"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { SidebarLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeftRight, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole, UserSession } from "@/constants/auth";
import { getNavItemsForRole, NavItemDef } from "@/constants/navigation";
import { logoutAction } from "@/actions/auth";
import { toast } from "@/components/ui/toast";
import { switchRoleAction } from "@/actions/switch-role";

export interface NavbarProps {
  role: UserRole;
  session?: UserSession | null;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Navbar({
  role,
  session,
  isMobileOpen = false,
  onCloseMobile,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState<boolean>(true);
  const [isSwitching, setIsSwitching] = React.useState(false);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const isSupplier = role === "supplier";
  const navItems = React.useMemo(() => getNavItemsForRole(role), [role]);

  const sidebarRef = React.useRef<HTMLElement>(null);
  const mobileDrawerRef = React.useRef<HTMLDivElement>(null);

  // Mencegah scroll pada page utama saat cursor berada di area sidebar
  React.useEffect(() => {
    const attachWheelIsolation = (element: HTMLElement | null) => {
      if (!element) return () => {};

      const handleWheel = (e: WheelEvent) => {
        const { scrollTop, scrollHeight, clientHeight } = element;
        const isScrollable = scrollHeight > clientHeight;

        // Jika sidebar muat dalam layar (tidak bisa di-scroll), cegah scroll sepenuhnya ke halaman
        if (!isScrollable) {
          e.preventDefault();
          return;
        }

        const isScrollingUp = e.deltaY < 0;
        const isScrollingDown = e.deltaY > 0;
        const isAtTop = scrollTop <= 0;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

        // Cegah scroll tembus/chain ke halaman saat sudah mentok di atas atau di bawah
        if ((isScrollingUp && isAtTop) || (isScrollingDown && isAtBottom)) {
          e.preventDefault();
        }
      };

      element.addEventListener("wheel", handleWheel, { passive: false });
      return () => {
        element.removeEventListener("wheel", handleWheel);
      };
    };

    const cleanupDesktop = attachWheelIsolation(sidebarRef.current);
    const cleanupMobile = attachWheelIsolation(mobileDrawerRef.current);

    return () => {
      cleanupDesktop();
      cleanupMobile();
    };
  }, [isMobileOpen, isOpen]);

  const isLinkActive = (item: NavItemDef) => {
    if (item.href === "/home") {
      return pathname === "/home";
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const handleSwitchRole = async () => {
    if (isSwitching) return;
    const targetRole: UserRole = isSupplier ? "umkm" : "supplier";
    setIsSwitching(true);

    try {
      const res = await switchRoleAction(targetRole);
      if (res.success) {
        toast.success(
          `Beralih ke peran ${targetRole === "supplier" ? "Supplier" : "UMKM"}.`,
          "Peran Diubah"
        );
        router.push(res.redirectTo || "/home");
        router.refresh();
      } else if (res.requiresBusinessStep && res.redirectTo) {
        toast.info(res.error || "Silakan lengkapi profil usaha Anda.", "Lengkapi Profil Usaha");
        router.push(res.redirectTo);
      } else {
        toast.error(res.error || "Gagal beralih peran usaha.", "Gagal");
      }
    } catch {
      toast.error("Terjadi gangguan saat memproses pergantian peran.", "Kesalahan");
    } finally {
      setIsSwitching(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await logoutAction(role);
      window.location.href = res.redirectTo || "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  const businessName =
    session?.name || (isSupplier ? "PT Agroniaga Nusantara" : "Warung Makan Berkah");
  const sectorInfo = isSupplier
    ? "Sektor: Pertanian & Pangan"
    : "Sektor: Kuliner & Pengolahan";

  const renderNavList = (expanded: boolean, isMobileView = false) => (
    <div
      className="relative z-10 flex w-full flex-col gap-1.5 whitespace-nowrap"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {navItems.map((item, index) => {
        const isSelected = isLinkActive(item);
        const isHovered = hoveredIndex === index && !isSelected;
        const IconComponent = item.icon;

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
              "relative cursor-pointer min-h-[42px] rounded-xl flex items-center transition-all duration-150 active:scale-[0.98]",
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

            {/* Hover Pill Background with Spring Physics */}
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  layoutId={isMobileView ? "mobile-hover-bg" : "sidebar-hover-bg"}
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

            {/* Icon, Label, and Badge Content */}
            <div
              className={cn(
                "relative z-10 flex items-center w-full gap-3",
                !expanded && "justify-center"
              )}
            >
              <span
                className={cn(
                  "shrink-0 transition-colors duration-150",
                  isSelected
                    ? "text-primary"
                    : "text-text-muted group-hover:text-text-primary"
                )}
              >
                <IconComponent className="w-5 h-5" />
              </span>

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
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-accent text-text-inverse shrink-0 shadow-xs">
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
      {/* Desktop Animated MacOS Collapsible Sidebar */}
      <motion.aside
        ref={sidebarRef}
        animate={{
          width: isOpen ? 256 : 72,
        }}
        transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
        className={cn(
          "hidden md:flex flex-col justify-between border-r border-border bg-surface p-3 shrink-0 sticky top-0 h-screen overflow-y-auto overscroll-contain select-none z-20",
          isOpen ? "shadow-elevation-1" : "items-center"
        )}
      >
        <div className="flex flex-col w-full">
          {/* Header Controls (Logo from /public/logo / Toggle Action) */}
          <div
            className={cn(
              "flex w-full items-center shrink-0 min-h-[48px] pb-3 border-b border-border/70",
              isOpen ? "justify-between gap-2 px-1" : "justify-center"
            )}
          >
            {isOpen && (
              <Link
                href="/home"
                className="flex items-center gap-2 min-w-0 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
              >
                {/* Logo from /public/logo/without-bg.svg */}
                <Image
                  src="/logo/without-bg.svg"
                  alt="KUMPUL Logo"
                  width={110}
                  height={32}
                  className="h-7 w-auto object-contain shrink-0"
                  priority
                />
                <span
                  className={cn(
                    "text-[10px] font-heading font-bold px-1.5 py-0.5 rounded-md border shrink-0 uppercase tracking-wider",
                    isSupplier
                      ? "bg-accent/10 text-accent border-accent/20"
                      : "bg-primary-light text-primary border-primary/20"
                  )}
                >
                  {isSupplier ? "Supplier" : "UMKM"}
                </span>
              </Link>
            )}

            <div className="flex items-center shrink-0">
              <motion.button
                layout
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                title={isOpen ? "Tutup Sidebar (Collapse)" : "Buka Sidebar (Expand)"}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer active:scale-95 flex items-center justify-center"
                aria-label={isOpen ? "Tutup Sidebar" : "Buka Sidebar"}
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
              <p className="px-3 text-[10px] font-heading font-bold text-text-muted mb-2 uppercase tracking-wider">
                {isSupplier ? "Manajemen Pasokan" : "Pengadaan & Dapur"}
              </p>
            )}
            {renderNavList(isOpen, false)}
          </div>
        </div>

        {/* Footer Info Entitas & Actions */}
        <div className="w-full pt-3 border-t border-border/70 mt-4">
          {isOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-3 rounded-xl bg-surface-subtle border border-border/80 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-text-muted">Legalitas</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  NIB Aktif
                </span>
              </div>
              <p className="text-xs font-bold text-text-primary truncate" title={businessName}>
                {businessName}
              </p>
              <p className="text-[11px] text-text-muted leading-tight truncate">
                {sectorInfo}
              </p>

              {/* Action Buttons */}
              <div className="pt-1.5 border-t border-border/60 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSwitchRole}
                  disabled={isSwitching}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold rounded-lg bg-surface hover:bg-surface-hover text-text-secondary border border-border cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  title={`Beralih ke peran ${isSupplier ? "UMKM" : "Supplier"}`}
                >
                  <ArrowLeftRight className={cn("w-3.5 h-3.5 shrink-0", isSwitching && "animate-spin")} />
                  <span className="truncate">{isSupplier ? "Ke UMKM" : "Ke Supplier"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light cursor-pointer transition-colors shrink-0"
                  title="Keluar Akun"
                  aria-label="Keluar akun"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={handleSwitchRole}
                disabled={isSwitching}
                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-subtle cursor-pointer transition-colors"
                title={`Beralih ke ${isSupplier ? "UMKM" : "Supplier"}`}
                aria-label={`Beralih ke ${isSupplier ? "UMKM" : "Supplier"}`}
              >
                <ArrowLeftRight className={cn("w-4 h-4", isSwitching && "animate-spin")} />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl text-text-muted hover:text-danger hover:bg-danger-light cursor-pointer transition-colors"
                title="Keluar"
                aria-label="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
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
            ref={mobileDrawerRef}
            className="w-72 max-w-[85vw] bg-surface h-full shadow-2xl flex flex-col justify-between p-4 animate-in slide-in-from-left duration-200 border-r border-border overflow-y-auto overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              {/* Mobile Header with Logo from /public/logo */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <Link
                  href="/home"
                  className="flex items-center gap-2"
                  onClick={onCloseMobile}
                >
                  <Image
                    src="/logo/without-bg.svg"
                    alt="KUMPUL Logo"
                    width={110}
                    height={32}
                    className="h-7 w-auto object-contain shrink-0"
                    priority
                  />
                  <span
                    className={cn(
                      "text-[10px] font-heading font-bold px-1.5 py-0.5 rounded-md border shrink-0 uppercase tracking-wider",
                      isSupplier
                        ? "bg-accent/10 text-accent border-accent/20"
                        : "bg-primary-light text-primary border-primary/20"
                    )}
                  >
                    {isSupplier ? "Supplier" : "UMKM"}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-xl text-text-muted hover:text-text-primary min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="Tutup menu navigasi"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Nav List */}
              <div>
                <p className="px-3 text-[10px] font-heading font-bold text-text-muted mb-2 uppercase tracking-wider">
                  {isSupplier ? "Manajemen Pasokan" : "Pengadaan & Dapur"}
                </p>
                {renderNavList(true, true)}
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="p-3.5 rounded-xl bg-surface-subtle border border-border/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-text-muted">Legalitas</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  NIB Aktif
                </span>
              </div>
              <p className="text-xs font-bold text-text-primary truncate">
                {businessName}
              </p>
              <p className="text-[11px] text-text-muted leading-tight truncate">
                {sectorInfo}
              </p>

              <div className="pt-2 border-t border-border/60 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSwitchRole}
                  disabled={isSwitching}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold rounded-lg bg-surface text-text-secondary border border-border"
                >
                  <ArrowLeftRight className={cn("w-3.5 h-3.5", isSwitching && "animate-spin")} />
                  <span>{isSupplier ? "Ke UMKM" : "Ke Supplier"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light"
                  aria-label="Keluar akun"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
