"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface NavigationLoadingContextValue {
  isNavigating: boolean;
  targetHref: string | null;
  startNavigation: (href: string) => void;
  finishNavigation: () => void;
}

const NavigationLoadingContext = React.createContext<NavigationLoadingContextValue>({
  isNavigating: false,
  targetHref: null,
  startNavigation: () => {},
  finishNavigation: () => {},
});

export function useNavigationLoading() {
  return React.useContext(NavigationLoadingContext);
}

export function NavigationLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [targetHref, setTargetHref] = React.useState<string | null>(null);
  const [showStatusBadge, setShowStatusBadge] = React.useState(false);

  const startNavigation = React.useCallback((href: string) => {
    setTargetHref(href);
    setIsNavigating(true);
  }, []);

  const finishNavigation = React.useCallback(() => {
    setIsNavigating(false);
    setTargetHref(null);
    setShowStatusBadge(false);
  }, []);

  // Reset loading saat rute atau query parameter berhasil berpindah
  React.useEffect(() => {
    finishNavigation();
  }, [pathname, searchParams, finishNavigation]);

  // Safety fallback timeout agar tidak ada loading yang menggantung selamanya jika navigasi batal
  React.useEffect(() => {
    if (!isNavigating) return;

    // Tampilkan floating badge hanya jika loading berlangsung lebih dari 150ms
    const badgeTimer = setTimeout(() => {
      setShowStatusBadge(true);
    }, 150);

    const safetyTimer = setTimeout(() => {
      finishNavigation();
    }, 7000);

    return () => {
      clearTimeout(badgeTimer);
      clearTimeout(safetyTimer);
    };
  }, [isNavigating, finishNavigation]);

  // Intersep klik tautan internal secara global
  React.useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.target === "_blank" ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      try {
        const currentUrl = new URL(window.location.href);
        const targetUrl = new URL(href, window.location.href);

        // Hanya picu loading jika rute berbeda dengan halaman saat ini
        if (
          targetUrl.pathname !== currentUrl.pathname ||
          targetUrl.search !== currentUrl.search
        ) {
          startNavigation(targetUrl.pathname);
        }
      } catch {
        // Abaikan URL yang tidak valid
      }
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick, {
        capture: true,
      });
    };
  }, [startNavigation]);

  return (
    <NavigationLoadingContext.Provider
      value={{
        isNavigating,
        targetHref,
        startNavigation,
        finishNavigation,
      }}
    >
      {/* 1. Glowing Top Progress Bar */}
      <TopProgressBar isNavigating={isNavigating} />

      {/* 2. Floating Loading Status Badge */}
      <AnimatePresence>
        {isNavigating && showStatusBadge && <FloatingNavBadge />}
      </AnimatePresence>

      {children}
    </NavigationLoadingContext.Provider>
  );
}

function TopProgressBar({ isNavigating }: { isNavigating: boolean }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (isNavigating) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isNavigating]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-transparent pointer-events-none overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-primary via-circular-waste to-accent shadow-[0_0_10px_rgba(180,83,9,0.8),0_0_4px_rgba(13,59,46,0.6)]"
        initial={{ width: "0%", opacity: 1 }}
        animate={{
          width: isNavigating ? "85%" : "100%",
          opacity: isNavigating ? 1 : 0,
        }}
        transition={{
          width: {
            duration: isNavigating ? 1.4 : 0.25,
            ease: isNavigating ? [0.22, 1, 0.36, 1] : "easeOut",
          },
          opacity: {
            duration: isNavigating ? 0.1 : 0.3,
            delay: isNavigating ? 0 : 0.1,
          },
        }}
      />
    </div>
  );
}

function FloatingNavBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.95 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="fixed top-16 md:top-4 left-1/2 -translate-x-1/2 z-[90] pointer-events-none flex items-center gap-2.5 px-4 py-2 rounded-full bg-surface/95 backdrop-blur-md border border-border shadow-elevation-2 select-none"
    >
      <div className="size-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span className="font-heading text-xs font-bold text-text-primary">
        Memuat halaman...
      </span>
    </motion.div>
  );
}
