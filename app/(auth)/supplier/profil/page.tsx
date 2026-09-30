import type { Metadata } from "next";
import { SupplierProfilView } from "@/modules/supplier/profil-view";

export const metadata: Metadata = {
  title: "Profil & Rekening Usaha | Portal Supplier KUMPUL",
  description: "Informasi legalitas entitas bisnis terverifikasi, kontak operasional, dan rekening escrow.",
};

export default function SupplierProfilPage() {
  return <SupplierProfilView />;
}
