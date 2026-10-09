"use client";

import * as React from "react";
import { MapPin, Truck, ChevronDown, ChevronUp, Navigation, Store, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPicker } from "@/components/ui/map-picker";
import { formatCurrency } from "@/lib/utils";

export type PurchaseDeliveryMethod = "HEMAT_HUB" | "ON_YOUR_DOOR";

export interface DeliveryDetails {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
    locationName?: string;
  };
  method: PurchaseDeliveryMethod;
  deliveryFee: number;
}

interface PurchaseDeliverySelectorProps {
  value: DeliveryDetails;
  onChange: (details: DeliveryDetails) => void;
}

export const DELIVERY_METHOD_CONFIG: Record<
  PurchaseDeliveryMethod,
  {
    title: string;
    badge: string;
    fee: number;
    description: string;
    icon: typeof Truck;
  }
> = {
  HEMAT_HUB: {
    title: "Hemat Hub",
    badge: "Paling Hemat",
    fee: 35000,
    description:
      "Mengambil pada titik yang akan ditentukan oleh supplier (Hub konsolidasi bersama). Rekomendasi terbaik untuk menekan biaya logistik pengadaan.",
    icon: Store,
  },
  ON_YOUR_DOOR: {
    title: "On Your Door",
    badge: "Antar ke Pintu",
    fee: 85000,
    description:
      "Langsung diantarkan ke rumah atau dapur usaha Anda, hanya saja lebih mahal karena memerlukan armada pengiriman rute mandiri.",
    icon: Home,
  },
};

export function PurchaseDeliverySelector({
  value,
  onChange,
}: PurchaseDeliverySelectorProps) {
  const [isMapExpanded, setIsMapExpanded] = React.useState(false);

  const handleMethodChange = (method: PurchaseDeliveryMethod) => {
    onChange({
      ...value,
      method,
      deliveryFee: DELIVERY_METHOD_CONFIG[method].fee,
    });
  };

  const handleAddressChange = (address: string) => {
    onChange({
      ...value,
      address,
    });
  };

  const handleCoordsChange = (coords: { lat: number; lng: number; locationName?: string }) => {
    onChange({
      ...value,
      coordinates: coords,
      address: coords.locationName ? `${coords.locationName} (${value.address})` : value.address,
    });
  };

  return (
    <div className="space-y-4">
      {/* Pilihan Metode Pengiriman: HEMAT_HUB vs ON_YOUR_DOOR */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-text-primary flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-primary" />
            <span>Pilihan Metode Pengiriman</span>
          </span>
          <span className="text-[10px] text-text-muted">Pilih skema logistik</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(["HEMAT_HUB", "ON_YOUR_DOOR"] as const).map((method) => {
            const config = DELIVERY_METHOD_CONFIG[method];
            const isSelected = value.method === method;
            const Icon = config.icon;

            return (
              <div
                key={method}
                onClick={() => handleMethodChange(method)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                  isSelected
                    ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20"
                    : "bg-surface border-border hover:border-border-strong hover:bg-neutral-50/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-text-muted"}`} />
                      <span className="font-heading font-bold text-xs text-text-primary">
                        {config.title}
                      </span>
                    </div>
                    <Badge
                      variant={isSelected ? "primary" : "neutral"}
                      className="text-[9px] px-1.5 py-0 font-bold"
                    >
                      {config.badge}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {config.description}
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-text-muted font-medium">Ongkos Kirim:</span>
                  <span
                    className={`font-heading font-bold tabular-nums ${
                      isSelected ? "text-primary" : "text-text-secondary"
                    }`}
                  >
                    +{formatCurrency(config.fee)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alamat Pengiriman UMKM */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>Alamat Tujuan Pengiriman</span>
          </label>
          <span className="text-[10px] text-text-muted">Default terdaftar</span>
        </div>

        <textarea
          value={value.address}
          onChange={(e) => handleAddressChange(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          placeholder="Tuliskan alamat lengkap atau patokan lokasi usaha Anda..."
        />
      </div>

      {/* Titik Lokasi Peta (Map Coordinates & Picker) */}
      <div className="p-3 rounded-2xl bg-surface-subtle border border-border/80 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <Navigation className="w-3.5 h-3.5 text-primary shrink-0" />
            <div className="truncate text-xs">
              <span className="font-semibold text-text-primary block truncate">
                {value.coordinates.locationName || "Titik Koordinat UMKM"}
              </span>
              <span className="font-mono text-[10px] text-text-muted tabular-nums">
                Lat: {value.coordinates.lat.toFixed(4)}, Lng: {value.coordinates.lng.toFixed(4)}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsMapExpanded((prev) => !prev)}
            className="text-[11px] font-semibold h-7 px-2.5 rounded-lg border-border shrink-0 cursor-pointer flex items-center gap-1"
          >
            <span>{isMapExpanded ? "Tutup Peta" : "Sesuaikan di Peta"}</span>
            {isMapExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </Button>
        </div>

        {isMapExpanded && (
          <div className="pt-2 border-t border-border/60">
            <p className="text-[11px] text-text-secondary mb-2">
              Pilih titik lokasi akurat di peta untuk memastikan koordinat pengantaran atau alokasi hub terdekat:
            </p>
            <MapPicker
              latitude={value.coordinates.lat}
              longitude={value.coordinates.lng}
              onChange={handleCoordsChange}
              className="rounded-xl overflow-hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
}
