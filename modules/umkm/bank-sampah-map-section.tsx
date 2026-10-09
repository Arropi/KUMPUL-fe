"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import {
  MOCK_BANK_SAMPAH_POINTS,
  MOCK_UMKM_PROFILE,
  type BankSampahPoint,
} from "@/constants/umkm";
import { getNearestOfftakersAction } from "@/actions/waste";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Navigation,
  Clock,
  Phone,
  ExternalLink,
  Search,
  Building2,
  Copy,
  Check,
  RotateCcw,
  Compass,
} from "lucide-react";

export function BankSampahMapSection() {
  const [bankSampahList, setBankSampahList] = React.useState<BankSampahPoint[]>(MOCK_BANK_SAMPAH_POINTS);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedPointId, setSelectedPointId] = React.useState<string>(MOCK_BANK_SAMPAH_POINTS[0]?.id || "");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const umkmCoords = MOCK_UMKM_PROFILE.coordinates || { lat: -7.3248, lng: 112.7758 };

  React.useEffect(() => {
    async function loadOfftakers() {
      try {
        const res = await getNearestOfftakersAction({
          latitude: umkmCoords.lat,
          longitude: umkmCoords.lng,
          limit: 15,
        });
        if (res.success && res.data && res.data.length > 0) {
          const mapped: BankSampahPoint[] = res.data.map((off) => ({
            id: off.id,
            name: off.org_name,
            category: "Bank Sampah Induk Kota",
            address: off.address || "Surabaya, Jawa Timur",
            subdistrict: off.service_area_city || "Surabaya",
            distanceKm: off.distance_km || 1.5,
            rating: 4.8,
            userRatingsTotal: 45,
            operatingHours: "08:00 - 16:00 WIB",
            openStatus: "Buka Sekarang",
            acceptedCommodities:
              off.accepted_waste_types && off.accepted_waste_types.length > 0
                ? off.accepted_waste_types
                : ["Minyak Jelantah (UCO)", "Ampas Organik"],
            contactPerson: off.contact_person || "Petugas Bank Sampah",
            phone: off.phone || "0812-3456-7890",
            hasDropbox24h: true,
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${off.latitude},${off.longitude}`,
            serviceFeatures: ["Penjemputan Mandiri", "Insentif Kompos", "Dropbox 24 Jam"],
            coordinates: {
              lat: Number(off.latitude),
              lng: Number(off.longitude),
            },
          }));
          setBankSampahList(mapped);
          if (mapped[0]) setSelectedPointId(mapped[0].id);
        }
      } catch {
        // Fallback to MOCK_BANK_SAMPAH_POINTS
      }
    }
    loadOfftakers();
  }, [umkmCoords.lat, umkmCoords.lng]);

  // Leaflet map refs
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = React.useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = React.useRef<Map<string, any>>(new Map());
  const cardsContainerRef = React.useRef<HTMLDivElement>(null);
  // Filter Bank Sampah berdasarkan nama / jalan / kecamatan
  const filteredList = bankSampahList.filter((bs) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      bs.name.toLowerCase().includes(query) ||
      bs.address.toLowerCase().includes(query) ||
      bs.subdistrict.toLowerCase().includes(query)
    );
  });

  const selectedPoint = bankSampahList.find((bs) => bs.id === selectedPointId) || filteredList[0];

  // Inisialisasi peta Leaflet interaktif dengan styling Carto Voyager + Kumpul Design Tokens
  React.useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = await import("leaflet");

      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [umkmCoords.lat, umkmCoords.lng],
        zoom: 13,
        zoomControl: false,
      });

      // Zoom control di kanan bawah dengan styling Kumpul (.kumpul-leaflet-map)
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // OpenStreetMap Tiles Resmi (100% Gratis, Tanpa API Key)
      // Tampilan visual dihangatkan dan diselaraskan via CSS filter di .kumpul-leaflet-map
      const osmLayer = L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        }
      );

      osmLayer.addTo(map);
      mapInstanceRef.current = map;

      // 1. Marker Lokasi Dapur UMKM (Deep Forest Pine #0D3B2E + SVG Teardrop Pin)
      const umkmIcon = L.divIcon({
        className: "custom-umkm-pin",
        html: `
          <div style="position: relative; width: 34px; height: 44px; cursor: pointer; user-select: none;">
            <!-- Ground Contact Shadow -->
            <div style="position: absolute; bottom: 0px; left: 50%; transform: translateX(-50%); width: 16px; height: 4px; border-radius: 50%; background: rgba(13, 59, 46, 0.3); filter: blur(0.8px);"></div>
            <!-- Teardrop Pin Head -->
            <div style="position: absolute; top: 0; left: 0; width: 34px; height: 42px; filter: drop-shadow(0 4px 8px rgba(13, 59, 46, 0.4));">
              <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 41C17 41 31 26.2 31 15C31 7.268 24.732 1 17 1C9.268 1 3 7.268 3 15C3 26.2 17 41 17 41Z" fill="#0D3B2E" stroke="#FFFFFF" stroke-width="2.2" stroke-linejoin="round" />
                <circle cx="17" cy="15" r="9" fill="#FFFDF9" />
              </svg>
              <span style="position: absolute; top: 7px; left: 50%; transform: translateX(-50%); font-size: 13px; line-height: 1;">🍳</span>
            </div>
          </div>
        `,
        iconSize: [34, 44],
        iconAnchor: [17, 41],
        popupAnchor: [0, -40],
      });

      const umkmMarker = L.marker([umkmCoords.lat, umkmCoords.lng], { icon: umkmIcon }).addTo(map);
      umkmMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; padding: 14px 16px; min-width: 220px; background: #FFFDF9; border-radius: 16px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 9999px; background: #0D3B2E;"></span>
            <span style="font-size: 10px; font-weight: 700; color: #0D3B2E; text-transform: uppercase; letter-spacing: 0.05em;">Dapur Katering Saya</span>
          </div>
          <strong style="display: block; color: #18201B; font-size: 14px; font-weight: 700; margin-bottom: 2px;">${MOCK_UMKM_PROFILE.name}</strong>
          <span style="display: inline-block; color: #5C6B62; font-size: 11px; margin-bottom: 8px;">Titik keberangkatan pengiriman mandiri</span>
          <div style="font-size: 11px; color: #18201B; line-height: 1.4; padding: 8px 10px; background: #F3EFE8; border-radius: 10px; border: 1px solid #E8E1D5;">
            📍 ${MOCK_UMKM_PROFILE.address}
          </div>
        </div>
      `);

      // 2. Markers untuk Titik-Titik Bank Sampah (Circular Waste Green #2D6A4F)
      markersRef.current.clear();

      bankSampahList.forEach((bs, index) => {
        const pinIcon = L.divIcon({
          className: `custom-bank-pin-${bs.id}`,
          html: `
            <div style="position: relative; width: 32px; height: 42px; cursor: pointer; user-select: none;">
              <!-- Ground Contact Shadow -->
              <div style="position: absolute; bottom: 0px; left: 50%; transform: translateX(-50%); width: 14px; height: 4px; border-radius: 50%; background: rgba(45, 106, 79, 0.28); filter: blur(0.8px);"></div>
              <!-- Teardrop Pin Head -->
              <div style="position: absolute; top: 0; left: 0; width: 32px; height: 40px; filter: drop-shadow(0 3px 8px rgba(45, 106, 79, 0.35)); transition: transform 0.2s ease;">
                <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 39C16 39 29 25 29 14.5C29 7.044 23.18 1 16 1C8.82 1 3 7.044 3 14.5C3 25 16 39 16 39Z" fill="#2D6A4F" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round" />
                  <circle cx="16" cy="14.5" r="8.5" fill="#FFFDF9" />
                  <text x="16" y="18" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" font-size="10.5" fill="#2D6A4F" text-anchor="middle">#${index + 1}</text>
                </svg>
              </div>
            </div>
          `,
          iconSize: [32, 42],
          iconAnchor: [16, 39],
          popupAnchor: [0, -38],
        });

        const marker = L.marker([bs.coordinates.lat, bs.coordinates.lng], { icon: pinIcon }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; padding: 14px 16px; min-width: 240px; background: #FFFDF9; border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 700; color: #2D6A4F; background: #E9F4EC; padding: 2px 7px; border-radius: 9999px; text-transform: uppercase;">
                Bank Sampah #${index + 1}
              </span>
              <span style="color: #2D6A4F; font-weight: 800; font-size: 11px; background: #E9F4EC; padding: 2px 8px; border-radius: 6px; font-variant-numeric: tabular-nums;">
                ${bs.distanceKm} km
              </span>
            </div>
            <strong style="display: block; font-size: 14px; font-weight: 700; color: #18201B; margin-bottom: 2px; line-height: 1.3;">${bs.name}</strong>
            <p style="color: #5C6B62; font-size: 11px; margin: 0 0 8px 0; line-height: 1.35;">${bs.address}</p>
            <div style="background: #F3EFE8; border: 1px solid #E8E1D5; border-radius: 10px; padding: 8px 10px; font-size: 11px; margin-bottom: 10px; line-height: 1.45; color: #4A564F;">
              <div>🕒 Buka: <strong style="color: #18201B;">${bs.operatingHours}</strong></div>
              ${bs.phone ? `<div style="margin-top: 3px;">📞 Kontak: <strong style="color: #18201B;">${bs.phone}</strong> ${bs.contactPerson ? `(${bs.contactPerson})` : ""}</div>` : ""}
            </div>
            <a href="${bs.googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; text-align: center; background: #0D3B2E; color: #FFFFFF; font-weight: 700; font-size: 11px; padding: 9px; border-radius: 10px; text-decoration: none; box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 3px 8px rgba(13, 59, 46, 0.3); transition: all 0.15s ease;">
              <span>Buka Rute di Google Maps</span>
              <span>&rarr;</span>
            </a>
          </div>
        `);

        marker.on("click", () => {
          setSelectedPointId(bs.id);
          const cardEl = document.getElementById(`bank-sampah-card-${bs.id}`);
          if (cardEl && cardsContainerRef.current) {
            cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        });

        markersRef.current.set(bs.id, marker);
      });
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [bankSampahList, umkmCoords.lat, umkmCoords.lng]);

  // Handler saat kartu dipilih: fly map ke titik & buka popup
  const handleSelectBankSampah = (bs: BankSampahPoint) => {
    setSelectedPointId(bs.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([bs.coordinates.lat, bs.coordinates.lng], 15, {
        duration: 0.8,
      });

      const marker = markersRef.current.get(bs.id);
      if (marker) {
        marker.openPopup();
      }
    }
  };

  // Recenter map ke lokasi UMKM
  const handleRecenterUmkm = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([umkmCoords.lat, umkmCoords.lng], 14, { duration: 0.7 });
    }
  };

  // Copy alamat
  const handleCopyAddress = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-4 pt-6 border-t border-border/80">
      {/* 1. Header Section Peta (Clean & Kumpul Branded) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-heading text-xs font-semibold text-text-muted">
              Peta Lokasi Drop-Off Mandiri
            </span>
          </div>
          <h2 className="font-heading text-base sm:text-lg font-bold text-text-primary text-balance mt-0.5 flex items-center gap-2">
            <Building2 className="size-5 text-circular-waste shrink-0" />
            <span>Titik Bank Sampah Terdekat</span>
          </h2>
        </div>

        {/* Search Bar Sederhana & Tombol Recenter */}
        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="size-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama / kelurahan..."
              className="pl-8.5 h-10 text-xs rounded-xl"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRecenterUmkm}
            className="text-xs font-semibold h-10 rounded-xl gap-1.5 shrink-0 cursor-pointer"
          >
            <RotateCcw className="size-3.5 text-primary" />
            <span>Dapur Saya</span>
          </Button>
        </div>
      </div>

      {/* 2. Split View: Peta Leaflet Ber-Style Kumpul + List Simple Ringkas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Kolom Kiri: Peta Leaflet (7 Kolom) */}
        <div className="lg:col-span-7">
          <div className="relative w-full h-[400px] sm:h-[460px] rounded-2xl overflow-hidden border border-border shadow-elevation-1 bg-surface-subtle isolate">
            {/* Map Container dengan kelas .kumpul-leaflet-map */}
            <div ref={mapContainerRef} className="kumpul-leaflet-map w-full h-full z-0" />

            {/* Floating Top HUD: Status Wilayah & Radius */}
            <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface/90 backdrop-blur-md border border-border shadow-elevation-1 pointer-events-none">
              <span className="font-heading text-[11px] font-bold text-text-primary">
                Area Surabaya Timur
              </span>
              <span className="text-[10px] text-text-muted font-medium border-l border-border pl-2">
                Radius Dapur UMKM
              </span>
            </div>

            {/* Floating Top-Right Quick Recenter Button */}
            <div className="absolute top-3 right-3 z-[400]">
              <button
                type="button"
                onClick={handleRecenterUmkm}
                title="Pusatkan ke Dapur Saya"
                className="size-9 rounded-xl bg-surface/95 backdrop-blur-md border border-border shadow-elevation-1 text-primary hover:bg-surface hover:text-primary-hover flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Compass className="size-4.5" />
              </button>
            </div>

            {/* Floating Bottom-Left Legend: Natural Tone */}
            <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-3 p-2 px-3 rounded-xl bg-surface/90 backdrop-blur-md border border-border shadow-elevation-1 text-[11px] font-semibold text-text-primary pointer-events-none">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs bg-[#0D3B2E]" />
                <span>Dapur Saya</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs bg-[#2D6A4F]" />
                <span>Bank Sampah</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: List Bank Sampah Simple & Ringkas (5 Kolom) */}
        <div
          ref={cardsContainerRef}
          className="lg:col-span-5 space-y-2.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar"
        >
          {filteredList.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-surface-subtle space-y-1.5">
              <p className="font-heading text-sm font-bold text-text-primary">Tidak ada hasil ditemukan</p>
              <p className="font-sans text-xs text-text-muted">Coba cari dengan kata kunci nama lokasi atau jalan lain.</p>
            </div>
          ) : (
            filteredList.map((bs, index) => {
              const isSelected = selectedPoint?.id === bs.id;

              return (
                <div
                  id={`bank-sampah-card-${bs.id}`}
                  key={bs.id}
                  onClick={() => handleSelectBankSampah(bs)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 space-y-2.5 select-none ${
                    isSelected
                      ? "border-circular-waste bg-circular-waste-light/50 shadow-xs ring-1 ring-circular-waste/30"
                      : "border-border bg-surface hover:border-border-strong hover:bg-surface-raised"
                  }`}
                >
                  {/* Nama, Jarak, & Alamat */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="size-5 rounded-md bg-[#2D6A4F] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-heading text-xs sm:text-[13px] font-bold text-text-primary line-clamp-1 leading-snug">
                          {bs.name}
                        </h3>
                        <p className="font-sans text-[11px] text-text-muted line-clamp-1 mt-0.5">
                          {bs.address}
                        </p>
                      </div>
                    </div>

                    <Badge variant="waste" className="tabular-nums text-[10px] font-bold shrink-0">
                      {bs.distanceKm} km
                    </Badge>
                  </div>

                  {/* Jam Buka & Telepon / Kontak (Hanya Info Penting) */}
                  <div className="space-y-1 text-xs text-text-secondary pt-1.5 border-t border-border/60">
                    <div className="flex items-center gap-1.5 font-sans">
                      <Clock className="size-3.5 text-text-muted shrink-0" />
                      <span>
                        Buka: <strong className="text-text-primary font-medium">{bs.operatingHours}</strong>
                      </span>
                    </div>

                    {bs.phone && (
                      <div className="flex items-center gap-1.5 font-sans">
                        <Phone className="size-3.5 text-text-muted shrink-0" />
                        <span>
                          Kontak:{" "}
                          <strong className="text-text-primary font-medium">{bs.phone}</strong>
                          {bs.contactPerson ? ` (${bs.contactPerson})` : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Link: Rute di Google Maps & Salin Alamat */}
                  <div className="pt-0.5 flex items-center justify-between text-xs">
                    <a
                      href={bs.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-primary-hover hover:underline transition-colors cursor-pointer"
                    >
                      <Navigation className="size-3" />
                      <span>Rute di Google Maps</span>
                      <ExternalLink className="size-2.5 ml-0.5 text-text-muted" />
                    </a>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyAddress(bs.id, `${bs.name}, ${bs.address}`);
                      }}
                      className="text-[11px] text-text-muted hover:text-text-primary font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedId === bs.id ? (
                        <>
                          <Check className="size-3 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>Salin Alamat</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
