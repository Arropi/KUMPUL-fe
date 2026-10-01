import * as React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { UserRole, UserSession } from "@/constants/auth";
import { UmkmPesananView } from "@/modules/umkm/pesanan-view";
import { SupplierPesananView } from "@/modules/supplier/pesanan-view";

export const metadata: Metadata = {
  title: "Manajemen Pesanan | KUMPUL",
  description: "Monitoring status pesanan pooling UMKM dan pemenuhan purchase order konsolidasi supplier.",
};

export default async function PesananPage() {
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
      {role === "supplier" ? <SupplierPesananView /> : <UmkmPesananView />}
    </React.Suspense>
  );
}
