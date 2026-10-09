import * as React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { UserRole, UserSession } from "@/constants/auth";
import { UmkmDashboardView } from "@/modules/umkm/dashboard-view";
import { SupplierDashboardView } from "@/modules/supplier/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard Operasional | KUMPUL",
  description: "Monitoring performa operasional, kuota pasokan, dan aktivitas rantai pasok KUMPUL.",
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("kumpul_session");
  let role: UserRole = "umkm";

  if (sessionCookie?.value) {
    try {
      const session = JSON.parse(sessionCookie.value) as UserSession;
      if (session.role === "supplier") {
        role = "supplier";
      }
    } catch {
      // Fallback
    }
  }

  return (
    <React.Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      {role === "supplier" ? <SupplierDashboardView /> : <UmkmDashboardView />}
    </React.Suspense>
  );
}
