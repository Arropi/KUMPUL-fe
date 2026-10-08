import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { TambahKomoditasForm } from "@/modules/supplier/katalog/tambah-komoditas-form";
import { getSupplierCommodityDetailAction } from "@/actions/supplier-catalog";
import { getAuthSession } from "@/lib/auth-cookies";

export const metadata: Metadata = {
  title: "Perbarui Pasokan Komoditas | Portal Supplier KUMPUL",
  description: "Perbarui kuota grosir, tier harga, atau paspor mutu komoditas.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditKomoditasPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getAuthSession();
  const res = await getSupplierCommodityDetailAction(id);

  if (!res.success || !res.data) {
    notFound();
  }

  const commodity = res.data;

  // Proteksi kepemilikan: Hanya pemilik yang berhak mengedit
  let isOwner = false;
  if (session?.role === "supplier") {
    if (session.roleId && session.roleId === commodity.supplier_role_id) {
      isOwner = true;
    } else if (
      session.entityId &&
      commodity.supplier_entity_id &&
      session.entityId === commodity.supplier_entity_id
    ) {
      isOwner = true;
    } else if (session.entityId) {
      try {
        const { beFetch } = await import("@/lib/api/be-client");
        const rolesRes = await beFetch<Array<{ id: string }>>(
          `/business/roles?entity_id=${session.entityId}`
        );
        if (rolesRes.success && rolesRes.data) {
          isOwner = rolesRes.data.some(
            (r) => r.id === commodity.supplier_role_id
          );
        }
      } catch {
        // abaikan
      }
    }
  }

  if (!isOwner) {
    redirect(`/katalog/${id}`);
  }

  return <TambahKomoditasForm initialCommodity={commodity} isEdit={true} />;
}

