import type { Metadata } from "next";
import { SupplierPesananView } from "@/modules/supplier/pesanan-view";

export const metadata: Metadata = {
  title: "Pesanan Terpadu (Consolidated PO) | Portal Supplier KUMPUL",
  description:
    "Pemenuhan pesanan grosir terpadu hasil agregasi kuota pooling UMKM berstatus locked.",
};

export default function SupplierPesananPage() {
  return <SupplierPesananView />;
}
