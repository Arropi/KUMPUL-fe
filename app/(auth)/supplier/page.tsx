import type { Metadata } from "next";
import { SupplierDashboardView } from "@/modules/supplier/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard Pasokan | Portal Supplier KUMPUL",
  description:
    "Ringkasan operasional pasokan komoditas, pesanan terpadu (Consolidated PO), dan monitoring radar pooling UMKM.",
};

export default function SupplierPage() {
  return <SupplierDashboardView />;
}
