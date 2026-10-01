import * as React from "react";
import type { Metadata } from "next";
import { UmkmShell } from "@/modules/umkm/umkm-shell";

export const metadata: Metadata = {
  title: "Portal Pengadaan & Pooling UMKM | KUMPUL",
  description:
    "Portal Autonomous MOQ Pooling, Pengadaan Bahan Baku Grosir Berpaspor Mutu, dan Circular Economy UMKM.",
};

export default function UmkmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UmkmShell>{children}</UmkmShell>;
}
