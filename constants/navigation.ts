import * as React from "react";
import {
  Home,
  UtensilsCrossed,
  Package,
  ClipboardList,
  LayoutDashboard,
  Recycle,
  Building2,
} from "lucide-react";
import { UserRole } from "./auth";

export interface NavItemDef {
  id: string;
  label: string;
  href: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function getNavItemsForRole(role: UserRole): NavItemDef[] {
  const commonHome: NavItemDef = {
    id: "home",
    label: "Beranda",
    href: "/home",
    icon: Home,
  };

  const commonProfile: NavItemDef = {
    id: "profil",
    label: role === "supplier" ? "Profil & Rekening" : "Profil Usaha",
    href: "/profil",
    icon: Building2,
  };

  if (role === "supplier") {
    return [
      commonHome,
      { id: "katalog", label: "Katalog", href: "/katalog", icon: Package },
      { id: "pesanan", label: "Pesanan PO", href: "/pesanan", badge: "1 Baru", icon: ClipboardList },
      { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      commonProfile,
    ];
  }

  return [
    commonHome,
    { id: "produk", label: "Produk", href: "/produk", icon: Package },
    { id: "pesanan", label: "Pesanan Saya", href: "/pesanan", badge: "1 Siap", icon: ClipboardList },
    { id: "dashboard", label: "Dashboard", href: "/dashboard", badge: "4 Aktif", icon: LayoutDashboard },
    { id: "limbah", label: "Limbah", href: "/limbah", icon: Recycle },
    commonProfile,
  ];
}
