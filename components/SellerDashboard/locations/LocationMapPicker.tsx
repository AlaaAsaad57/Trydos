"use client";
import { useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import Spinner from "components/global/Spinner";
import { translateFunction } from "utils/functions";
import { DashIcon } from "components/SellerDashboard/ui";
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LOADER_ID } from "utils/mapsConfig";

const t = (s: string) => translateFunction(s);

/** Mid-map fallback when neither a picked point nor a country hint exists. */
const WORLD_CENTER = { lat: 25, lng: 30 };

/** Pin drawn in the dashboard's danger red, matching the storefront map marker. */
const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="#f85555"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8zm0 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>`;

export interface MapPoint {
  lat: number;
  lng: number;
}

/**
 * Click-to-drop-pin coordinate picker for a shop location.
 *
 * Deliberately dumb: it reports the clicked point upward and renders whatever
 * `value` it is handed back. The latitude/longitude inputs in the form stay
 * editable, so the map is an aid — a location may be saved with no coordinates
 * at all (both are optional in the API contract).
 */
export default function LocationMapPicker({
  value,
  onPick,
  language,
  disabled = false,
}: {
  value: MapPoint | null;
  onPick: (point: MapPoint) => void;
  language?: string;
  disabled?: boolean;
}) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    language,
    preventGoogleFontsLoading: true,
  });

  const handleClick = (e: google.maps.MapMouseEvent) => {
    if (disabled || !e.latLng) return;
    const point = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    onPick(point);
    map?.panTo(point);
  };

  const handleUseMyLocation = () => {
    if (disabled) return;
    setGeoError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError(t("Geolocation is not supported by your browser"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        onPick(point);
        map?.panTo(point);
        map?.setZoom(14);
        setLocating(false);
      },
      () => {
        setGeoError(t("Error getting your location"));
        setLocating(false);
      },
    );
  };

  // The key is browser-visible by design, but if it is missing entirely the map
  // simply cannot render — say so instead of showing a dead grey box, and let
  // the seller carry on with the coordinate inputs.
  if (!GOOGLE_MAPS_API_KEY || loadError) {
    return (
      <div className="w-full h-[240px] rounded-[12px] border border-dashed border-[#ededed] bg-[#f8f8f8] flex flex-col items-center justify-center gap-1.5 text-[#8e8e8e]">
        <DashIcon name="location" size={26} strokeWidth={1.4} />
        <span className="text-[13px]">{t("Map is unavailable")}</span>
        <span className="text-[12px] text-[#b8b8b8]">
          {t("Coordinates are optional")}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative w-full h-[240px] rounded-[12px] overflow-hidden border border-[#ededed] bg-[#f8f8f8]">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={value || WORLD_CENTER}
            zoom={value ? 13 : 3}
            onClick={handleClick}
            clickableIcons={false}
            onLoad={(m) => setMap(m)}
            onUnmount={() => setMap(null)}
            options={{
              streetViewControl: false,
              fullscreenControl: false,
              mapTypeControl: false,
              gestureHandling: "greedy",
              zoomControl: true,
              draggableCursor: disabled ? "default" : "crosshair",
            }}
          >
            {value && (
              <Marker
                position={value}
                icon={{
                  url: `data:image/svg+xml;base64,${btoa(PIN_SVG)}`,
                  scaledSize: new window.google.maps.Size(30, 30),
                }}
              />
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Spinner />
          </div>
        )}

        {isLoaded && !disabled && (
          <button
            type="button"
            onClick={handleUseMyLocation}
            title={t("Use my current location")}
            aria-label={t("Use my current location")}
            className="absolute bottom-3 right-3 z-10 w-10 h-10 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.18)] flex items-center justify-center text-[#5d5d5d] hover:bg-[#f4f4f4] transition-colors"
          >
            {locating ? <Spinner /> : <DashIcon name="location" size={18} />}
          </button>
        )}
      </div>

      <p className="text-[12px] text-[#8e8e8e]">
        {disabled ? t("Coordinates are optional") : t("Pick the position on the map")}
      </p>
      {geoError && <p className="text-[12px] text-[#f85555]">{geoError}</p>}
    </div>
  );
}
