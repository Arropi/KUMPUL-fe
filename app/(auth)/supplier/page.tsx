import * as React from "react";
import type { Metadata } from "next";
import { SupplierDashboardView } from "@/modules/supplier/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard Pasokan | Portal Supplier KUMPUL",
  description:
    "Ringkasan operasional pasokan komoditas, pesanan terpadu (Consolidated PO), dan monitoring radar pooling UMKM.",
};

export default function SupplierPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <SupplierDashboardView />
    </React.Suspense>
  );
}
