"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  address?: string;
  onChange: (coords: { lat: number; lng: number; locationName?: string }) => void;
  className?: string;
}

interface GeocodeResult {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type?: string;
}

export function MapPicker({
  latitude,
  longitude,
  onChange,
  className = "",
}: MapPickerProps) {
  const [internalLat, setInternalLat] = React.useState<number>(latitude ?? -7.2575);
  const [internalLng, setInternalLng] = React.useState<number>(longitude ?? 112.7521);
  const [isLocating, setIsLocating] = React.useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = React.useState(false);
  const [activePlace, setActivePlace] = React.useState<string>("Surabaya, Jawa Timur");

  // State pencarian alamat
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Leaflet refs
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = React.useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = React.useRef<any>(null);

  const currentLat = latitude ?? internalLat;
  const currentLng = longitude ?? internalLng;

  // Reverse geocode koordinat menjadi nama tempat/alamat
  const reverseGeocode = React.useCallback(
    async (lat: number, lng: number) => {
      setIsReverseGeocoding(true);
      try {
        const res = await fetch(`/api/maps/geocode?lat=${lat}&lng=${lng}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.result) {
            const placeName = data.result.displayName || data.result.name;
            const shortName = data.result.name || placeName;
            setActivePlace(shortName);
            onChange({ lat, lng, locationName: placeName });
            return;
          }
        }
      } catch {
        // Fallback jika API gagal
      } finally {
        setIsReverseGeocoding(false);
      }

      const fallbackName = `Koordinat (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      setActivePlace(fallbackName);
      onChange({ lat, lng, locationName: fallbackName });
    },
    [onChange]
  );

  // Tutup dropdown jika klik di luar
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Eksekusi pencarian alamat via backend
  const executeSearch = React.useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/maps/geocode?q=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
        setIsDropdownOpen(true);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 3) {
      debounceTimerRef.current = setTimeout(() => {
        executeSearch(val);
      }, 400);
    } else {
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      executeSearch(searchQuery);
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  const handleSelectResult = (result: GeocodeResult) => {
    const newLat = Number(result.lat.toFixed(6));
    const newLng = Number(result.lng.toFixed(6));
    setInternalLat(newLat);
    setInternalLng(newLng);
    setActivePlace(result.name);
    setSearchQuery(result.name);
    setIsDropdownOpen(false);

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
      mapInstanceRef.current.flyTo([newLat, newLng], 15, { duration: 1 });
    }

    onChange({
      lat: newLat,
      lng: newLng,
      locationName: result.displayName || result.name,
    });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolokasi tidak didukung oleh browser kamu.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setInternalLat(lat);
        setInternalLng(lng);

        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
        }

        reverseGeocode(lat, lng);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert("Izin lokasi GPS tidak dapat diakses.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([currentLat, currentLng], 15, { duration: 0.8 });
    }
  };

  // Inisialisasi peta Leaflet interaktif secara client-side
  React.useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = await import("leaflet");

      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 14,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // OpenStreetMap Tiles Resmi (100% Gratis, Tanpa API Key)
      const osmLayer = L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        }
      );

      osmLayer.addTo(map);

      // Icon Pin Modern KUMPUL: Ramping, Ringkas, Flat-Modern, dan Proporsional
      const customPinIcon = L.divIcon({
        className: "custom-modern-pin",
        html: `
          <div style="position: relative; width: 28px; height: 38px; cursor: grab; user-select: none;">
            <!-- Bayangan Titik Kontak Peta Ramping -->
            <div class="ground-shadow" style="position: absolute; bottom: 0px; left: 50%; transform: translateX(-50%); width: 14px; height: 4px; border-radius: 50%; background: rgba(15, 23, 42, 0.28); filter: blur(0.5px); transition: transform 0.2s ease, opacity 0.2s ease; pointer-events: none;"></div>

            <!-- Lingkaran Radar Pulsa Lembut -->
            <div style="position: absolute; bottom: 1px; left: 50%; transform: translateX(-50%) translateY(50%); width: 11px; height: 11px; border-radius: 9999px; background: rgba(13, 59, 46, 0.18); border: 1px solid rgba(13, 59, 46, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none;"></div>

            <!-- Pin Head Flat Modern KUMPUL -->
            <div class="pin-head" style="position: absolute; top: 0; left: 0; width: 28px; height: 36px; filter: drop-shadow(0 3px 6px rgba(13, 59, 46, 0.28)); transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);">
              <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Badan Teardrop Pin Warna Primary KUMPUL dengan Border Putih Bersih -->
                <path d="M14 35.5C14 35.5 25.5 22.8 25.5 13C25.5 6.6487 20.3513 1.5 14 1.5C7.6487 1.5 2.5 6.6487 2.5 13C2.5 22.8 14 35.5 14 35.5Z" fill="#0D3B2E" stroke="#FFFFFF" stroke-width="1.8" stroke-linejoin="round" />

                <!-- Lingkaran Inti Bersih & Titik Presisi Usaha -->
                <circle cx="14" cy="13" r="4.3" fill="#FFFFFF" />
                <circle cx="14" cy="13" r="1.9" fill="#0D3B2E" />
              </svg>
            </div>
          </div>
        `,
        iconSize: [28, 38],
        iconAnchor: [14, 36],
      });

      const marker = L.marker([currentLat, currentLng], {
        draggable: true,
        icon: customPinIcon,
        title: "Tahan dan geser pin untuk memindahkan lokasi",
      }).addTo(map);

      // Efek fisik saat mulai di-drag (pin terangkat sedikit)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      marker.on("dragstart", (e: any) => {
        const el = e.target.getElement();
        if (el) {
          const pinHead = el.querySelector(".pin-head") as HTMLElement | null;
          const shadow = el.querySelector(".ground-shadow") as HTMLElement | null;
          if (pinHead) pinHead.style.transform = "translateY(-4px) scale(1.06)";
          if (shadow) {
            shadow.style.transform = "translateX(-50%) scale(0.85)";
            shadow.style.opacity = "0.4";
          }
        }
      });

      // Listener saat pin selesai digeser (dragend)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      marker.on("dragend", (e: any) => {
        const el = e.target.getElement();
        if (el) {
          const pinHead = el.querySelector(".pin-head") as HTMLElement | null;
          const shadow = el.querySelector(".ground-shadow") as HTMLElement | null;
          if (pinHead) pinHead.style.transform = "";
          if (shadow) {
            shadow.style.transform = "translateX(-50%)";
            shadow.style.opacity = "1";
          }
        }
        const pos = e.target.getLatLng();
        const newLat = Number(pos.lat.toFixed(6));
        const newLng = Number(pos.lng.toFixed(6));
        setInternalLat(newLat);
        setInternalLng(newLng);
        reverseGeocode(newLat, newLng);
      });

      // Listener saat peta diklik (click)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on("click", (e: any) => {
        const newLat = Number(e.latlng.lat.toFixed(6));
        const newLng = Number(e.latlng.lng.toFixed(6));
        marker.setLatLng([newLat, newLng]);
        setInternalLat(newLat);
        setInternalLng(newLng);
        reverseGeocode(newLat, newLng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      setTimeout(() => {
        if (isMounted && mapInstanceRef.current) {
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
        markerRef.current = null;
      }
    };
  }, []);

  // Update posisi marker jika koordinat berubah dari luar
  React.useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const pos = markerRef.current.getLatLng();
      if (
        Math.abs(pos.lat - currentLat) > 0.00001 ||
        Math.abs(pos.lng - currentLng) > 0.00001
      ) {
        markerRef.current.setLatLng([currentLat, currentLng]);
      }
    }
  }, [currentLat, currentLng]);

  return (
    <div className={`space-y-2 rounded-2xl border border-border bg-surface-subtle/40 p-3 text-left ${className}`}>
      {/* Header ringkas & Tombol GPS */}
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="map-search-input" className="text-xs font-semibold text-text-primary">
          Titik Lokasi Peta
        </label>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRecenter}
            className="text-[11px] font-medium h-7 px-2 rounded-lg flex items-center gap-1 border border-border shrink-0 cursor-pointer shadow-xs hover:bg-surface-raised transition-colors"
            title="Pusatkan peta ke pin lokasi"
          >
            <svg className="w-3.5 h-3.5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
            </svg>
            <span className="hidden sm:inline">Pusatkan</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleGetCurrentLocation}
            isLoading={isLocating}
            className="text-[11px] font-medium h-7 px-2.5 rounded-lg flex items-center gap-1.5 border border-border shrink-0 cursor-pointer shadow-xs hover:bg-surface-raised transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>GPS Live</span>
          </Button>
        </div>
      </div>

      {/* Input Pencarian Alamat */}
      <div ref={searchContainerRef} className="relative w-full z-20">
        <div className="relative flex items-center">
          <div className="absolute left-3 text-text-muted pointer-events-none flex items-center justify-center">
            {isSearching ? (
              <svg className="w-3.5 h-3.5 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>

          <input
            id="map-search-input"
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchResults.length > 0) setIsDropdownOpen(true);
            }}
            placeholder="Cari alamat atau nama tempat..."
            className="w-full h-9 pl-8 pr-16 text-xs rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
          />

          <div className="absolute right-1 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setIsDropdownOpen(false);
                }}
                className="w-5 h-5 rounded-md hover:bg-surface-raised flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            <button
              type="button"
              onClick={() => executeSearch(searchQuery)}
              className="h-6 px-2 rounded-md bg-primary text-text-inverse text-[10px] font-semibold hover:bg-primary-hover transition-colors cursor-pointer shadow-xs"
            >
              Cari
            </button>
          </div>
        </div>

        {/* Dropdown Hasil Pencarian */}
        {isDropdownOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-surface rounded-xl border border-border shadow-elevation-3 overflow-hidden max-h-52 overflow-y-auto">
            {searchResults.length > 0 ? (
              <div className="py-1 divide-y divide-border/60">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectResult(item)}
                    className="w-full px-3 py-2 text-left hover:bg-primary/5 transition-colors flex items-start gap-2 cursor-pointer group"
                  >
                    <svg className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>

                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors truncate block">
                        {item.name}
                      </span>
                      <p className="text-[11px] text-text-muted truncate mt-0.5 leading-tight">
                        {item.displayName}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : hasSearched && !isSearching ? (
              <div className="p-2.5 text-center text-xs text-text-muted">
                Lokasi tidak ditemukan. Coba ketik kata kunci lain.
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Frame Peta Interaktif Leaflet dengan Pin Fleksibel */}
      <div className="relative w-full h-[220px] rounded-xl overflow-hidden border border-border bg-surface-subtle shadow-inner isolate z-0">
        <div ref={mapContainerRef} className="kumpul-leaflet-map w-full h-full" />

        {/* Pin Location Badge */}
        <div className="absolute top-2 left-2 z-10 max-w-[85%] bg-surface/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-border shadow-xs flex items-center gap-1.5 text-[10px] text-text-primary font-medium pointer-events-none">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isReverseGeocoding ? "bg-amber-500 animate-spin" : "bg-primary animate-pulse"
            }`}
          />
          <span className="truncate">
            {isReverseGeocoding ? "Mendeteksi alamat..." : activePlace}
          </span>
        </div>

        {/* Petunjuk Fleksibilitas Pin */}
        <div className="absolute bottom-2 left-2 z-10 bg-surface/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-border shadow-xs text-[9.5px] text-text-secondary font-medium pointer-events-none flex items-center gap-1">
          <span className="text-primary font-bold">📍</span>
          <span>Klik peta atau geser pin untuk memindahkan</span>
        </div>

        {/* Koordinat Tag */}
        <div className="absolute top-2 right-2 z-10 bg-surface/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-border text-[9.5px] text-text-muted font-mono pointer-events-none hidden sm:block">
          {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
        </div>
      </div>
    </div>
  );
}
