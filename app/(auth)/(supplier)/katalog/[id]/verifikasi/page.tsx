import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { VerifikasiKepatuhanView } from "@/modules/supplier/katalog/verifikasi-kepatuhan-view";
import { getSupplierCommodityDetailAction } from "@/actions/supplier-catalog";
import { getAuthSession } from "@/lib/auth-cookies";
import { mapBEToSupplierCommodity } from "@/modules/supplier/helpers";

export const metadata: Metadata = {
  title: "Verifikasi Kepatuhan & Paspor Mutu | Portal Supplier KUMPUL",
  description:
    "Pengajuan verifikasi kepatuhan sanitasi digital, penentuan suhu penyimpanan rantai pasok, dan pengunggahan berkas uji lab.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VerifikasiKepatuhanPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getAuthSession();
  const res = await getSupplierCommodityDetailAction(id);

  if (!res.success || !res.data) {
    notFound();
  }

  const beCommodity = res.data;

  // Proteksi kepemilikan: Hanya supplier pemilik yang boleh mengajukan verifikasi
  let isOwner = false;
  if (session?.role === "supplier") {
    if (session.roleId && session.roleId === beCommodity.supplier_role_id) {
      isOwner = true;
    } else if (
      session.entityId &&
      beCommodity.supplier_entity_id &&
      session.entityId === beCommodity.supplier_entity_id
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
            (r) => r.id === beCommodity.supplier_role_id
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

  const commodity = mapBEToSupplierCommodity(beCommodity);
  return <VerifikasiKepatuhanView commodity={commodity} />;
}

