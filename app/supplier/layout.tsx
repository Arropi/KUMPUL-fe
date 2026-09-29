import type { Metadata } from "next";
import { SupplierShell } from "@/modules/supplier/supplier-shell";

export const metadata: Metadata = {
  title: "Portal Mitra Supplier | KUMPUL",
  description:
    "Pusat pengelolaan katalog pasokan komoditas grosir, penentuan harga bertingkat (Tiered Pricing), dan pemenuhan pesanan pooling terpadu KUMPUL.",
};

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SupplierShell>{children}</SupplierShell>;
}
