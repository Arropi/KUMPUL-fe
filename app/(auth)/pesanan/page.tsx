import * as React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { UserRole, UserSession } from "@/constants/auth";
import { UmkmPesananView } from "@/modules/umkm/pesanan-view";
import { SupplierPesananView } from "@/modules/supplier/pesanan-view";
import PesananLoading from "./loading";

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
    <React.Suspense fallback={<PesananLoading />}>
      {role === "supplier" ? (
        <SupplierPesananView />
      ) : (
        <UmkmPesananView />
      )}
    </React.Suspense>
  );
}