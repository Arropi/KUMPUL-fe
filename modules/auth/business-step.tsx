"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { MapPicker } from "@/components/ui/map-picker";
import { UserRole } from "@/constants/auth";

interface RegisterBusinessStepProps {
  role: UserRole;
  businessName: string;
  setBusinessName: (val: string) => void;
  taxId: string;
  setTaxId: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  latitude: number;
  setLatitude: (val: number) => void;
  longitude: number;
  setLongitude: (val: number) => void;
  locationName: string;
  setLocationName: (val: string) => void;
  errors: Record<string, string | undefined>;
  clearError: (field: string) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export function RegisterBusinessStep({
  role,
  businessName,
  setBusinessName,
  taxId,
  setTaxId,
  address,
  setAddress,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  setLocationName,
  errors,
  clearError,
  onBack,
  onSubmit,
  isSubmitting,
}: RegisterBusinessStepProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <FloatingInput
        id="business-legal-name"
        label={
          role === "supplier"
            ? "Legal Nama / Nama Badan Usaha"
            : "Nama Usaha Dagang / Kedai UMKM"
        }
        value={businessName}
        onChange={(e) => {
          setBusinessName(e.target.value);
          if (errors.businessName) clearError("businessName");
        }}
        error={errors.businessName}
        placeholder={
          role === "supplier"
            ? "Contoh: PT Sumber Pangan Nusantara"
            : "Contoh: Kedai Berkah Sejahtera"
        }
        required
      />

      <FloatingInput
        id="business-tax-id"
        label="Nomor NPWP / NIB Usaha Dagang"
        value={taxId}
        onChange={(e) => {
          setTaxId(e.target.value);
          if (errors.taxId) clearError("taxId");
        }}
        error={errors.taxId}
        placeholder="01.234.567.8-901.000 / 9120001234567"
        required
      />

      <FloatingInput
        id="business-address"
        label="Alamat Lengkap Fasilitas / Toko"
        value={address}
        onChange={(e) => {
          setAddress(e.target.value);
          if (errors.address) clearError("address");
        }}
        error={errors.address}
        placeholder="Contoh: Jl. Industri Raya No. 45, Kompleks Pergudangan B-12"
        required
      />

      {/* Komponen Peta Interaktif (Latitude / Longitude) */}
      <MapPicker
        latitude={latitude}
        longitude={longitude}
        onChange={(coords) => {
          setLatitude(coords.lat);
          setLongitude(coords.lng);
          if (coords.locationName) {
            setLocationName(coords.locationName);
          }
        }}
      />

      <div className="pt-2 flex items-center gap-2.5">
        <Button
          type="button"
          variant="secondary"
          size="default"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-1/3 font-semibold"
        >
          &larr; Kembali
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="default"
          isLoading={isSubmitting}
          className="w-2/3 font-bold"
        >
          {isSubmitting ? "Mendaftarkan Usaha..." : "Daftarkan Usaha & Masuk"}
        </Button>
      </div>
    </form>
  );
}
