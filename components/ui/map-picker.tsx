"use client";

import * as React from "react";
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
  const [internalLat, setInternalLat] = React.useState<number>(-7.2575);
  const [internalLng, setInternalLng] = React.useState<number>(112.7521);
  const [isLocating, setIsLocating] = React.useState(false);
  const [activePlace, setActivePlace] = React.useState<string>("Surabaya, Jawa Timur");

  // State pencarian alamat
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const currentLat = latitude ?? internalLat;
  const currentLng = longitude ?? internalLng;

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
        setActivePlace("Lokasi GPS Terdeteksi");
        onChange({ lat, lng, locationName: "Lokasi GPS Terdeteksi" });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert("Izin lokasi GPS tidak dapat diakses.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // URL iframe OpenStreetMap interaktif berbasis koordinat
  const bboxDelta = 0.02;
  const mapIframeUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${currentLng - bboxDelta}%2C${currentLat - (bboxDelta * 0.6)}%2C${currentLng + bboxDelta}%2C${currentLat + (bboxDelta * 0.6)}&layer=mapnik&marker=${currentLat}%2C${currentLng}`;

  return (
    <div className={`space-y-2 rounded-2xl border border-border bg-surface-subtle/40 p-3 text-left ${className}`}>
      {/* Header ringkas & Tombol GPS */}
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="map-search-input" className="text-xs font-semibold text-text-primary">
          Titik Lokasi Peta
        </label>

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

      {/* Input Pencarian Alamat */}
      <div ref={searchContainerRef} className="relative w-full">
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

      {/* Frame Peta Terbuka OpenStreetMap Bersih */}
      <div className="relative w-full h-[180px] sm:h-[190px] rounded-xl overflow-hidden border border-border bg-surface shadow-inner">
        <iframe
          key={`${currentLat}-${currentLng}`}
          title="OpenStreetMap Pin Location"
          src={mapIframeUrl}
          className="w-full h-full border-0 pointer-events-auto"
          loading="lazy"
        />

        {/* Pin Location Badge */}
        <div className="absolute top-2 left-2 z-10 max-w-[90%] bg-surface/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-border shadow-xs flex items-center gap-1.5 text-[10px] text-text-primary font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
          <span className="truncate">{activePlace}</span>
        </div>
      </div>
    </div>
  );
}
