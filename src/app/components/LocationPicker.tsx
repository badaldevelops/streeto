"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

type LocationPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (
    latitude: number,
    longitude: number
  ) => void;
};

const defaultLatitude = 28.6139;
const defaultLongitude = 77.209;

const markerIcon = L.icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapClickHandler({
  onLocationChange,
}: {
  onLocationChange: (
    latitude: number,
    longitude: number
  ) => void;
}) {
  useMapEvents({
    click(event) {
      onLocationChange(
        event.latlng.lat,
        event.latlng.lng
      );
    },
  });

  return null;
}

export default function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
}: LocationPickerProps) {
  const [mapLocation, setMapLocation] = useState<
    [number, number]
  >([
    latitude ?? defaultLatitude,
    longitude ?? defaultLongitude,
  ]);

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      setMapLocation([latitude, longitude]);
    }
  }, [latitude, longitude]);

  function handleLocationChange(
    newLatitude: number,
    newLongitude: number
  ) {
    setMapLocation([
      newLatitude,
      newLongitude,
    ]);

    onLocationChange(
      newLatitude,
      newLongitude
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border">
      <div className="bg-gray-50 px-4 py-3">
        <p className="font-semibold">
          🗺️ Choose Location Manually
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Tap anywhere on the map to select your
          delivery location.
        </p>

        {latitude !== null &&
          longitude !== null && (
            <p className="mt-2 text-sm font-semibold text-green-700">
              📍 Selected: {latitude.toFixed(6)},{" "}
              {longitude.toFixed(6)}
            </p>
          )}
      </div>

      <MapContainer
        center={mapLocation}
        zoom={13}
        scrollWheelZoom={true}
        style={{
          height: "350px",
          width: "100%",
        }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler
          onLocationChange={
            handleLocationChange
          }
        />

        <Marker
          position={mapLocation}
          icon={markerIcon}
        />
      </MapContainer>
    </div>
  );
}