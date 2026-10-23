"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { UserRole, UserSession } from "@/constants/auth";
import { Navbar } from "./navbar";
import {
  NavigationLoadingProvider,
  useNavigationLoading,
} from "@/components/ui/navigation-progress";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import Image from "next/image";

export interface AuthShellProps {
  children: React.ReactNode;
  role: UserRole;
  session?: UserSession | null;
}
function MainContent({
  children,
  mainRef,
}: {
  children: React.ReactNode;
  mainRef: React.RefObject<HTMLElement | null>;
}) {
  const { isNavigating } = useNavigationLoading();

  return (
    <main
      ref={mainRef}
      className={cn(
        "flex-1 overflow-y-auto overscroll-contain focus:outline-none transition-opacity duration-150",
        isNavigating && "opacity-65"
      )}
    >
      <div className="p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-5 sm:space-y-6">
        {children}
      </div>
    </main>
  );
}


export function AuthShell({ children, role, session }: AuthShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const pathname = usePathname();
  const mainRef = React.useRef<HTMLElement>(null);

  // Pastikan posisi scroll kontainer konten direset ke atas saat rute berpindah
  React.useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <NavigationLoadingProvider>
      <div className="h-screen overflow-hidden bg-background text-text-primary flex flex-col md:flex-row font-sans selection:bg-primary-light selection:text-primary">
      {/* Unified Sidebar Navigation */}
      <React.Suspense fallback={<aside className="hidden md:flex w-[260px] h-full shrink-0 border-r border-border bg-surface" />}>
        <Navbar
          role={role}
          session={session}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />
      </React.Suspense>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile-Only Header Bar (Desktop top navbar removed) */}
        <header className="md:hidden shrink-0 z-20 w-full bg-surface/95 backdrop-blur-md border-b border-border h-14 px-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-text-secondary hover:bg-surface-subtle transition-colors active:scale-95"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Image
            src="/logo/without-bg.svg"
            alt="Logo KUMPUL"
            width={120}
            height={36}
            className="h-8 w-auto object-contain"
            priority
          />

          <div className="w-11" aria-hidden="true" />
        </header>

        {/* Page Content */}
          <MainContent mainRef={mainRef}>
            {children}
          </MainContent>
        </div>
      </div>
    </NavigationLoadingProvider>
  );
}
