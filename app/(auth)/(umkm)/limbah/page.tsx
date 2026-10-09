import * as React from "react";
import type { Metadata } from "next";
import { UmkmSirkularView } from "@/modules/umkm/sirkular-view";

export const metadata: Metadata = {
  title: "Sirkular Ekonomi & Valuasi Limbah | KUMPUL UMKM",
  description: "Monetisasi limbah organik dan minyak jelantah sisa pengolahan dapur UMKM ke offtaker industri sirkular.",
};

export default function UmkmLimbahPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <UmkmSirkularView />
    </React.Suspense>
  );
}
