import * as React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { UserRole, UserSession } from "@/constants/auth";
import { UmkmDashboardView } from "@/modules/umkm/dashboard-view";
import { SupplierDashboardView } from "@/modules/supplier/dashboard-view";
import DashboardLoading from "./loading";

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
    <React.Suspense fallback={<DashboardLoading />}>
      {role === "supplier" ? <SupplierDashboardView /> : <UmkmDashboardView />}
    </React.Suspense>
  );
}
