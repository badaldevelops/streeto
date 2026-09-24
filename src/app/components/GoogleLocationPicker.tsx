"use client";

import { useEffect, useRef, useState } from "react";
import {
  importLibrary,
  setOptions,
} from "@googlemaps/js-api-loader";

type GoogleLocationPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (
    latitude: number,
    longitude: number
  ) => void;
};

export default function GoogleLocationPicker({
  latitude,
  longitude,
  onLocationChange,
}: GoogleLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
 const mapInstanceRef =
  useRef<any>(null);
 const markerRef =
  useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gettingLocation, setGettingLocation] =
    useState(false);

  async function loadGoogleMap() {
    try {
      setLoading(true);
      setError("");

      const apiKey =
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        setError(
          "Google Maps API key is not configured."
        );
        setLoading(false);
        return;
      }

      setOptions({
        key: apiKey,
        v: "weekly",
      });

      const { Map } =
        (await importLibrary(
          "maps"
       )) as any;

      const { AdvancedMarkerElement } =
        (await importLibrary(
          "marker"
       )) as any;
      if (!mapRef.current) {
        return;
      }

      const defaultLocation = {
        lat:
          latitude !== null
            ? latitude
            : 28.6139,
        lng:
          longitude !== null
            ? longitude
            : 77.209,
      };

      const map = new Map(mapRef.current, {
        center: defaultLocation,
        zoom:
          latitude !== null &&
          longitude !== null
            ? 16
            : 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: "greedy",
        mapId: "DEMO_MAP_ID",
      });

      mapInstanceRef.current = map;

      const marker =
        new AdvancedMarkerElement({
          map,
          position: defaultLocation,
          gmpDraggable: true,
          title: "Outlet Location",
        });

      markerRef.current = marker;

      map.addListener(
        "click",
        (
          event: any
        ) => {
          if (!event.latLng) {
            return;
          }

          const newLatitude =
            event.latLng.lat();
          const newLongitude =
            event.latLng.lng();

          marker.position = {
            lat: newLatitude,
            lng: newLongitude,
          };

          onLocationChange(
            newLatitude,
            newLongitude
          );
        }
      );

      marker.addListener(
        "dragend",
        () => {
          const position =
            marker.position;

          if (!position) {
            return;
          }

          const newLatitude =
            typeof position.lat === "function"
              ? position.lat()
              : position.lat;

          const newLongitude =
            typeof position.lng === "function"
              ? position.lng()
              : position.lng;

          onLocationChange(
            Number(newLatitude),
            Number(newLongitude)
          );
        }
      );

      setLoading(false);
    } catch (error) {
      console.error(
        "Google Maps loading error:",
        error
      );

      setError(
        "Unable to load Google Maps."
      );

      setLoading(false);
    }
  }

  useEffect(() => {
    loadGoogleMap();

    return () => {
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
    // Map ko sirf component open hone par initialize karna hai.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError(
        "Your browser does not support location access."
      );
      return;
    }

    setGettingLocation(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLatitude =
          position.coords.latitude;

        const newLongitude =
          position.coords.longitude;

        onLocationChange(
          newLatitude,
          newLongitude
        );

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({
            lat: newLatitude,
            lng: newLongitude,
          });

          mapInstanceRef.current.setZoom(17);
        }

        if (markerRef.current) {
          markerRef.current.position = {
            lat: newLatitude,
            lng: newLongitude,
          };
        }

        setGettingLocation(false);
      },
      (locationError) => {
        console.error(
          "Current location error:",
          locationError
        );

        if (
          locationError.code ===
          locationError.PERMISSION_DENIED
        ) {
          setError(
            "Location permission denied. Please allow location access in your browser."
          );
        } else if (
          locationError.code ===
          locationError.POSITION_UNAVAILABLE
        ) {
          setError(
            "Current location is unavailable. Please try again."
          );
        } else if (
          locationError.code ===
          locationError.TIMEOUT
        ) {
          setError(
            "Location request timed out. Please try again."
          );
       } else {
  setError("");
}

        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">
            📍 Choose Outlet Location
          </h3>

          <p className="mt-1 text-xs font-medium text-slate-500">
            Map par tap karo ya marker ko drag karo.
          </p>
        </div>

        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={
            gettingLocation || loading
          }
          className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {gettingLocation
            ? "📍 Detecting..."
            : "📍 Use My Current Location"}
        </button>
      </div>

      {/* Selected Location */}
      {latitude !== null &&
        longitude !== null && (
          <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
            <p className="text-xs font-extrabold text-emerald-700">
              ✓ Location selected
            </p>

            <p className="mt-1 text-[11px] font-semibold text-emerald-600">
              {latitude.toFixed(6)},{" "}
              {longitude.toFixed(6)}
            </p>
          </div>
        )}

      {/* Error */}
      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Map */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />

              <p className="text-xs font-bold text-slate-600">
                Loading Google Map...
              </p>
            </div>
          </div>
        )}

        <div
          ref={mapRef}
          className="h-[320px] w-full sm:h-[360px]"
        />
      </div>

      {/* Helper */}
      <p className="mt-2 text-[11px] font-medium text-slate-400">
        💡 Current location ke liye button dabao, ya map
        par directly exact location select karo.
      </p>
    </div>
  );
}