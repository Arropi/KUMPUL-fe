"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import { BEPoolParticipant } from "@/lib/api/types";
import { MapPin, Users } from "lucide-react";

interface PoolParticipantsMapProps {
  participants: BEPoolParticipant[];
  className?: string;
  wholesaleUnit?: string;
}

export function PoolParticipantsMap({
  participants,
  className = "",
  wholesaleUnit = "kg",
}: PoolParticipantsMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = React.useRef<any>(null);

  // Filter peserta yang memilih metode HEMAT_HUB dan memiliki koordinat valid
  const hematHubParticipants = React.useMemo(() => {
    return participants.filter((p) => {
      const isHemat = p.delivery_method === "HEMAT_HUB";
      const lat = Number(p.final_delivery_lat);
      const lng = Number(p.final_delivery_lng);
      return isHemat && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    });
  }, [participants]);

  React.useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const L = await import("leaflet");
      if (!isMounted || !mapContainerRef.current) return;

      // Default center
      let initialLat = -7.2575;
      let initialLng = 112.7521;
      if (hematHubParticipants.length > 0) {
        initialLat = Number(hematHubParticipants[0].final_delivery_lat);
        initialLng = Number(hematHubParticipants[0].final_delivery_lng);
      }

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Icon khusus titik Hemat Hub KUMPUL
      const createHematIcon = (labelNum: number) =>
        L.divIcon({
          className: "hemat-hub-pin",
          iconSize: [28, 36],
          iconAnchor: [14, 36],
          popupAnchor: [0, -32],
          html: `
            <div style="position: relative; width: 28px; height: 36px; display: flex; align-items: center; justify-content: center;">
              <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                <path d="M14 35.5C14 35.5 25.5 22.8 25.5 13C25.5 6.6487 20.3513 1.5 14 1.5C7.6487 1.5 2.5 6.6487 2.5 13C2.5 22.8 14 35.5 14 35.5Z" fill="#0D3B2E" stroke="#FFFFFF" stroke-width="1.8"/>
                <circle cx="14" cy="13" r="8" fill="#10B981" />
              </svg>
              <span style="position: absolute; top: 7px; color: #FFFFFF; font-size: 10px; font-weight: 800; font-family: sans-serif; pointer-events: none;">${labelNum}</span>
            </div>
          `,
        });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markers: any[] = [];

      hematHubParticipants.forEach((p, index) => {
        const lat = Number(p.final_delivery_lat);
        const lng = Number(p.final_delivery_lng);
        const marker = L.marker([lat, lng], {
          icon: createHematIcon(index + 1),
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 11px; line-height: 1.4; min-width: 140px; padding: 2px;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">
              ${p.umkm_name || "UMKM Pemesan"}
            </div>
            <div style="font-weight: 600; color: #0d3b2e; font-size: 10px; margin-bottom: 4px;">
              Pesanan: ${p.order_qty} ${wholesaleUnit}
            </div>
            <div style="color: #64748b; font-size: 10px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
              ${p.final_delivery_address || "-"}
            </div>
            <div style="margin-top: 4px; display: inline-block; background: #ecfdf5; color: #047857; font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 9999px;">
              Hemat Hub
            </div>
          </div>
        `);

        markers.push(marker);
      });

      if (markers.length > 1) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.2));
      } else if (markers.length === 1) {
        map.setView([initialLat, initialLng], 14);
      }

      mapInstanceRef.current = map;

      // Invalidate size agar render mulus di modal
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 300);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hematHubParticipants, wholesaleUnit]);

  return (
    <div className={`relative rounded-xl overflow-hidden border border-border bg-surface flex flex-col ${className}`}>
      {/* Header Info Peta */}
      <div className="px-3 py-2 bg-surface border-b border-border flex items-center justify-between text-xs z-10 shrink-0">
        <div className="flex items-center gap-1.5 font-bold text-text-primary">
          <MapPin className="size-3.5 text-primary" />
          <span>Sebaran Titik Hemat Hub</span>
        </div>
        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          {hematHubParticipants.length} Titik UMKM
        </span>
      </div>

      {/* Kontainer Peta */}
      <div className="relative flex-1 min-h-[160px] w-full">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

        {hematHubParticipants.length === 0 && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-10 space-y-1">
            <Users className="size-6 text-text-muted" />
            <p className="font-bold text-xs text-text-primary">
              Belum Ada Titik Hemat Hub
            </p>
            <p className="text-[10px] text-text-muted max-w-[200px] leading-relaxed">
              Anggota yang telah bergabung saat ini memilih pengiriman Direct Door-to-Door.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
