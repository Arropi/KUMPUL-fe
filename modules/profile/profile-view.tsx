"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import type {
  BEBusinessEntity,
  BEBusinessRole,
  BEBankAccountInfo,
} from "@/lib/api/types";
import { getBusinessProfileAction } from "@/actions/business-profile";
import { type UnifiedProfileState } from "./types";
import { ProfileCompletenessBanner } from "./profile-completeness-banner";
import { ProfileHeroCard } from "./profile-hero-card";
import { ProfileMetricsCards } from "./profile-metrics-cards";
import { ProfileBankAccountsCard } from "./profile-bank-accounts-card";
import { ProfileStorageCard } from "./profile-storage-card";
import { ProfileRolesCard } from "./profile-roles-card";
import { Skeleton } from "@/components/ui/skeleton";
import { extractCityFromAddress, formatRegistrationDate } from "@/lib/utils";

interface ProfileViewProps {
  initialRole?: "supplier" | "umkm";
}

export function ProfileView({ initialRole = "umkm" }: ProfileViewProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [entity, setEntity] = React.useState<BEBusinessEntity | null>(null);
  const [roles, setRoles] = React.useState<BEBusinessRole[]>([]);
  const [currentRoleType, setCurrentRoleType] = React.useState<"supplier" | "umkm">(initialRole);

  const [profileState, setProfileState] = React.useState<UnifiedProfileState>({
    id: "",
    brandName: "",
    legalName: "",
    picName: "",
    picTitle: "",
    contactPhone: "",
    contactEmail: "",
    npwpNib: "",
    address: "",
    city: "Surabaya",
    sector: "PERTANIAN",
    sectorLabel: "Pertanian & Agribisnis",
    complianceStatus: "TERVERIFIKASI",
    registrationDate: "Januari 2025",
    storageValue: 0,
    storageUnit: "KG",
    storageType: "DRY",
    totalRevenue: initialRole === "supplier" ? 38500000 : 12450000,
    totalItems: initialRole === "supplier" ? 4 : 6,
  });

  const bankSectionRef = React.useRef<HTMLDivElement>(null);
  const storageSectionRef = React.useRef<HTMLDivElement>(null);

  // Load business profile data from backend
  const loadProfile = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getBusinessProfileAction();
      if (res.success && res.entity) {
        const ent = res.entity;
        const rls = res.roles || [];
        setEntity(ent);
        setRoles(rls);

        const activeRole =
          rls.find(
            (r) => r.role_type.toUpperCase() === (res.session?.role || initialRole).toUpperCase()
          ) || rls[0];

        const sessionRole = (res.session?.role as "supplier" | "umkm") || initialRole;
        setCurrentRoleType(sessionRole);

        const bank = ent.bank_account_info || {};
        const isSupplier = sessionRole === "supplier";
        const dynamicCity =
          (bank.city as string)?.trim() ||
          extractCityFromAddress(ent.default_address);
        const dynamicRegDate = formatRegistrationDate(ent.created_at);

        setProfileState({
          id: ent.id,
          brandName: (bank.brand_name as string) || ent.legal_name,
          legalName: ent.legal_name,
          picName:
            (bank.pic_name as string) ||
            (isSupplier ? "Hendra Pratama" : "Siti Rahmawati"),
          picTitle:
            (bank.pic_title as string) ||
            (isSupplier ? "Head of Operations & Supply" : "Owner / Pengelola Usaha"),
          contactPhone:
            ent.phone_number ||
            (bank.phone as string) ||
            "",
          contactEmail:
            (bank.email as string) ||
            res.session?.email ||
            (isSupplier ? "distribusi@agronusantara.co.id" : "kontak@warung.com"),
          npwpNib: ent.npwp_nib || "",
          address: ent.default_address || "",
          city: dynamicCity,
          sector: activeRole?.sector_type || (isSupplier ? "PERTANIAN" : "FNB_PENGOLAHAN"),
          sectorLabel: activeRole?.sector_type || (isSupplier ? "Pertanian" : "FnB & Pengolahan"),
          complianceStatus: "TERVERIFIKASI",
          registrationDate: dynamicRegDate,
          storageValue: activeRole?.storage_capacity || 0,
          storageUnit: "KG",
          storageType: "DRY",
          totalRevenue: res.total_sales ?? (isSupplier ? 38500000 : 12450000),
          totalItems: res.products?.length ?? (isSupplier ? 4 : 6),
        });
      } else {
        toast.error(res.message || "Gagal memuat profil entitas usaha.");
      }
    } catch {
      toast.error("Gagal terhubung ke backend server.");
    } finally {
      setIsLoading(false);
    }
  }, [initialRole]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const activeRole = React.useMemo(() => {
    const targetType = currentRoleType.toUpperCase();
    return roles.find((r) => r.role_type.toUpperCase() === targetType) || roles[0];
  }, [roles, currentRoleType]);

  // Check completeness: bank accounts
  const hasValidBank = React.useMemo(() => {
    if (!entity?.bank_account_info) return false;
    const bank = entity.bank_account_info;
    if (bank.accounts && bank.accounts.length > 0) {
      return bank.accounts.some(
        (a) => a.account_number && a.account_number !== "0000000000"
      );
    }
    return Boolean(bank.account_number && bank.account_number !== "0000000000");
  }, [entity]);

  // Check completeness: storage capacity
  const hasValidStorage = React.useMemo(() => {
    return (profileState.storageValue || activeRole?.storage_capacity || 0) > 0;
  }, [profileState.storageValue, activeRole]);
  React.useEffect(() => {
    if (hasValidBank && hasValidStorage) {
      try {
        localStorage.removeItem("kumpul_pending_onboarding");
        localStorage.setItem("kumpul_supplier_profile_complete", "true");
      } catch {
        // ignore in SSR
      }
    }
  }, [hasValidBank, hasValidStorage]);


  const handleFocusBank = () => {
    bankSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFocusStorage = () => {
    storageSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleProfileUpdated = (updated: Partial<UnifiedProfileState>) => {
    setProfileState((prev) => ({
      ...prev,
      ...updated,
      city:
        updated.city ||
        (updated.address ? extractCityFromAddress(updated.address) : prev.city),
    }));
    if (entity) {
      setEntity({
        ...entity,
        legal_name: updated.legalName || entity.legal_name,
        npwp_nib: updated.npwpNib || entity.npwp_nib,
        default_address: updated.address || entity.default_address,
      });
    }
  };

  const handleBankUpdated = (newBankInfo: BEBankAccountInfo) => {
    if (entity) {
      setEntity({
        ...entity,
        bank_account_info: newBankInfo,
      });
    }
  };

  const handleRoleUpdated = (updatedRole: BEBusinessRole) => {
    setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
    setProfileState((prev) => ({
      ...prev,
      storageValue: updatedRole.storage_capacity ?? 0,
    }));
  };

  const handleRolesListUpdated = (updatedRoles: BEBusinessRole[]) => {
    setRoles(updatedRoles);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Hero Card Skeleton */}
        <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-elevation-1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-border/70">
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 sm:size-20 rounded-2xl shrink-0" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-44 rounded-md" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3.5 w-60 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-10 w-32 rounded-xl self-start sm:self-center" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3.5 rounded-xl bg-surface-subtle/80 border border-border/70 space-y-1.5">
                <Skeleton className="h-3 w-16 rounded-md" />
                <Skeleton className="h-4 w-28 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-5 shadow-elevation-1 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <Skeleton className="h-8 w-36 rounded-lg" />
              <div className="pt-2 border-t border-border/70 flex justify-between">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
            </div>
          ))}
        </div>

        {/* Storage & Bank Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-elevation-1 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border/70">
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-elevation-1 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border/70">
              <Skeleton className="h-5 w-36 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-xl" />
            </div>
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="p-8 rounded-3xl border border-dashed border-border bg-surface text-center space-y-4 max-w-lg mx-auto">
        <h3 className="font-heading font-bold text-base text-text-primary">
          Data Entitas Usaha Belum Ditemukan
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Silakan hubungi administrator atau lakukan registrasi ulang entitas bisnis Anda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Banner Peringatan Kelengkapan Data */}
      <ProfileCompletenessBanner
        hasValidBank={hasValidBank}
        hasValidStorage={hasValidStorage}
        onFocusBank={handleFocusBank}
        onFocusStorage={handleFocusStorage}
      />

      {/* 2. Hero Profile Card (Visual Sektor, Brand Avatar, PIC Grid, & Ubah Profil Dialog) */}
      <ProfileHeroCard
        role={currentRoleType}
        profile={profileState}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* 3. Tiga Kartu Metrik Ringkas: Penjualan/Pengadaan, Katalog/Menu, dan Kapasitas Gudang */}
      <ProfileMetricsCards
        role={currentRoleType}
        totalRevenue={profileState.totalRevenue}
        totalItems={profileState.totalItems}
        activeItems={profileState.totalItems}
        storageValue={profileState.storageValue}
        storageUnit={profileState.storageUnit}
        storageType={profileState.storageType}
        city={profileState.city}
        onAdjustStorage={handleFocusStorage}
      />

      {/* 4 & 5. Dua Kolom Grid: Kapasitas Ruang Penyimpanan & Rekening Bank */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div ref={storageSectionRef} className="h-full">
          <ProfileStorageCard
            activeRole={activeRole}
            allRoles={roles}
            onRoleUpdated={handleRoleUpdated}
          />
        </div>

        <div ref={bankSectionRef} className="h-full">
          <ProfileBankAccountsCard
            entityId={entity.id}
            bankInfo={entity.bank_account_info}
            defaultHolderName={profileState.legalName || "Pemilik Usaha"}
            onUpdated={handleBankUpdated}
          />
        </div>
      </div>

      {/* 6. Manajemen Peran Usaha & Beralih Portal */}
      <ProfileRolesCard
        entityId={entity.id}
        roles={roles}
        currentRoleType={currentRoleType}
        onRolesUpdated={handleRolesListUpdated}
      />
    </div>
  );
}