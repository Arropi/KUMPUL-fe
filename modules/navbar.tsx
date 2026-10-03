"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeftRight, LogOut, PanelLeftClose, PanelLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole, UserSession } from "@/constants/auth";
import { getNavItemsForRole } from "@/constants/navigation";
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
  const [isOpen, setIsOpen] = React.useState(true);
  const [isSwitching, setIsSwitching] = React.useState(false);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const isSupplier = role === "supplier";
  const navItems = React.useMemo(() => getNavItemsForRole(role), [role]);

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

  const renderNavItems = (expanded: boolean, isMobile = false) => (
    <div className="flex flex-col gap-1 w-full" onMouseLeave={() => setHoveredIndex(null)}>
      {navItems.map((item, index) => {
        const isSelected =
          pathname === item.href ||
          (item.href !== "/home" && pathname.startsWith(item.href));
        const isHovered = hoveredIndex === index;
        const IconComponent = item.icon;

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => isMobile && onCloseMobile?.()}
            onMouseEnter={() => setHoveredIndex(index)}
            title={!expanded ? item.label : undefined}
            className={cn(
              "relative cursor-pointer min-h-[40px] rounded-xl flex items-center transition-all duration-150 active:scale-[0.98]",
              expanded ? "px-3 py-2" : "justify-center px-2 py-2"
            )}
          >
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  className="bg-primary-light border border-primary/20 absolute inset-0 z-0 rounded-xl shadow-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isHovered && !isSelected && (
                <motion.span
                  className="bg-surface-subtle absolute inset-0 z-0 rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                />
              )}
            </AnimatePresence>

            <div
              className={cn(
                "relative z-10 flex items-center w-full gap-3",
                !expanded && "justify-center"
              )}
            >
              <span
                className={cn(
                  "shrink-0 transition-colors",
                  isSelected ? "text-primary" : "text-text-muted"
                )}
              >
                <IconComponent className="w-5 h-5" />
              </span>

              {expanded && (
                <div className="flex items-center justify-between flex-1 min-w-0 gap-2">
                  <span
                    className={cn(
                      "text-xs truncate font-medium",
                      isSelected ? "text-primary font-bold" : "text-text-secondary"
                    )}
                  >
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-accent text-text-inverse shrink-0">
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
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: isOpen ? 250 : 70 }}
        transition={{ type: "spring", bounce: 0.18, duration: 0.35 }}
        className={cn(
          "hidden md:flex flex-col justify-between border-r border-border bg-surface p-3 shrink-0 sticky top-0 h-screen overflow-y-auto select-none z-20",
          isOpen ? "shadow-elevation-1" : "items-center"
        )}
      >
        <div className="flex flex-col w-full">
          <div
            className={cn(
              "flex w-full items-center shrink-0 min-h-[48px] pb-3 border-b border-border/70",
              isOpen ? "justify-between gap-2 px-1" : "justify-center"
            )}
          >
            {isOpen ? (
              <Link href="/home" className="flex items-center gap-2 overflow-hidden">
                <Image
                  src="/logo/without-bg.svg"
                  alt="KUMPUL"
                  width={120}
                  height={36}
                  className="h-8 w-auto object-contain shrink-0"
                  priority
                />
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 font-heading",
                    isSupplier
                      ? "bg-accent/10 text-accent border-accent/20"
                      : "bg-primary/10 text-primary border-primary/20"
                  )}
                >
                  {isSupplier ? "Supplier" : "UMKM"}
                </span>
              </Link>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-primary text-text-inverse flex items-center justify-center font-heading font-extrabold text-sm shadow-xs">
                K
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              title={isOpen ? "Tutup Sidebar" : "Buka Sidebar"}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
              aria-label="Toggle sidebar"
            >
              {isOpen ? <PanelLeftClose className="w-4.5 h-4.5" /> : <PanelLeft className="w-4.5 h-4.5" />}
            </button>
          </div>

          <div className="mt-4">
            {isOpen && (
              <p className="px-3 text-[10px] font-bold text-text-muted mb-2 font-heading uppercase tracking-wider">
                {isSupplier ? "Pasokan & Distribusi" : "Pengadaan & Dapur"}
              </p>
            )}
            {renderNavItems(isOpen, false)}
          </div>
        </div>

        {/* Footer User Info */}
        <div className="flex flex-col gap-2 w-full pt-3 border-t border-border/70 mt-4">
          {isOpen ? (
            <div className="p-2.5 rounded-xl bg-surface-subtle border border-border/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted">Profil Aktif</span>
                <span className="text-[10px] font-bold text-text-primary truncate max-w-[130px]" title={businessName}>
                  {businessName}
                </span>
              </div>
              <div className="pt-1 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSwitchRole}
                  disabled={isSwitching}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium rounded-lg bg-surface hover:bg-surface-hover text-text-secondary border border-border cursor-pointer transition-all active:scale-95"
                >
                  <ArrowLeftRight className={cn("w-3.5 h-3.5", isSwitching && "animate-spin")} />
                  <span>{isSupplier ? "Ke UMKM" : "Ke Supplier"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light cursor-pointer transition-colors"
                  title="Keluar Akun"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={handleSwitchRole}
                disabled={isSwitching}
                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-subtle cursor-pointer"
                title={`Beralih ke ${isSupplier ? "UMKM" : "Supplier"}`}
              >
                <ArrowLeftRight className={cn("w-4 h-4", isSwitching && "animate-spin")} />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl text-text-muted hover:text-danger hover:bg-danger-light cursor-pointer"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Mobile Drawer */}
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
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <Link href="/home" className="flex items-center gap-2" onClick={onCloseMobile}>
                  <Image
                    src="/logo/without-bg.svg"
                    alt="KUMPUL"
                    width={120}
                    height={36}
                    className="h-8 w-auto object-contain shrink-0"
                    priority
                  />
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 font-heading",
                      isSupplier
                        ? "bg-accent/10 text-accent border-accent/20"
                        : "bg-primary/10 text-primary border-primary/20"
                    )}
                  >
                    {isSupplier ? "Supplier" : "UMKM"}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-xl text-text-muted hover:text-text-primary"
                  aria-label="Tutup menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <p className="px-3 text-[10px] font-bold text-text-muted mb-2 font-heading uppercase tracking-wider">
                  {isSupplier ? "Pasokan & Distribusi" : "Pengadaan & Dapur"}
                </p>
                {renderNavItems(true, true)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle border border-border/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted">Profil Aktif</span>
                <span className="text-[10px] font-bold text-text-primary truncate max-w-[140px]">
                  {businessName}
                </span>
              </div>
              <div className="pt-1 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSwitchRole}
                  disabled={isSwitching}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium rounded-lg bg-surface text-text-secondary border border-border"
                >
                  <ArrowLeftRight className={cn("w-3.5 h-3.5", isSwitching && "animate-spin")} />
                  <span>{isSupplier ? "Ke UMKM" : "Ke Supplier"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light"
                  aria-label="Keluar"
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
