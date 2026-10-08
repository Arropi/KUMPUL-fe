import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailKomoditasView } from "@/modules/supplier/katalog/detail-komoditas-view";
import { getSupplierCommodityDetailAction } from "@/actions/supplier-catalog";
import { getAuthSession } from "@/lib/auth-cookies";
import { mapBEToSupplierCommodity } from "@/modules/supplier/helpers";
import type { UserRole } from "@/constants/auth";

export const metadata: Metadata = {
  title: "Rincian Pasokan Komoditas | KUMPUL",
  description:
    "Detail spesifikasi komoditas, harga utama, kuota pasokan, formulir pemesanan pooling, dan paspor mutu sanitasi pangan.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailKomoditasPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getAuthSession();
  const res = await getSupplierCommodityDetailAction(id);

  if (!res.success || !res.data) {
    notFound();
  }

  const beCommodity = res.data;
  const commodity = mapBEToSupplierCommodity(beCommodity);
  const role: UserRole = session?.role === "supplier" ? "supplier" : "umkm";

  // Cek kepemilikan komoditas secara menyeluruh
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

  return (
    <DetailKomoditasView
      initialCommodity={commodity}
      role={role}
      isOwner={Boolean(isOwner)}
    />
  );
}

