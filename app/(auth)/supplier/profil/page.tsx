import * as React from "react";
import type { Metadata } from "next";
import { SupplierProfilView } from "@/modules/supplier/profil-view";

export const metadata: Metadata = {
  title: "Profil & Rekening Usaha | Portal Supplier KUMPUL",
  description: "Informasi legalitas entitas bisnis terverifikasi, kontak operasional, dan rekening escrow.",
};

export default function SupplierProfilPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <SupplierProfilView />
    </React.Suspense>
  );
}
