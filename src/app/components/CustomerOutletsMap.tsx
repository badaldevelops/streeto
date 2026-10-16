"use client";

import { useMemo } from "react";
import { divIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

type MapOutlet = {
  outletId: string;
  outletName: string;
  companyId: string;
  companyName: string;
  address: string | null;
  city: string | null;
  locality: string | null;
  latitude: number | null;
  longitude: number | null;
};

export default function CustomerOutletsMap({ outlets }: { outlets: MapOutlet[] }) {
  const mappedOutlets = outlets.filter(
    (outlet) => outlet.latitude !== null && outlet.longitude !== null
  );
  const center = useMemo<[number, number]>(() => {
    if (!mappedOutlets.length) return [28.9845, 77.7064];
    return [
      mappedOutlets.reduce((sum, outlet) => sum + outlet.latitude!, 0) / mappedOutlets.length,
      mappedOutlets.reduce((sum, outlet) => sum + outlet.longitude!, 0) / mappedOutlets.length,
    ];
  }, [mappedOutlets]);
  const outletIcon = useMemo(
    () => divIcon({
      className: "qtoo-outlet-map-icon",
      html: '<span style="display:flex;width:34px;height:34px;align-items:center;justify-content:center;border:2px solid white;border-radius:50%;background:#e85d2a;color:white;font-size:18px;box-shadow:0 2px 8px #0005">🍽</span>',
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    }),
    []
  );

  if (mappedOutlets.length === 0) {
    return <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">These outlets have not added map coordinates yet. Their addresses are still available in the outlet list.</div>;
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
      <MapContainer
        center={center}
        zoom={mappedOutlets.length === 1 ? 14 : 11}
        scrollWheelZoom={false}
        className="h-[360px] w-full"
        key={mappedOutlets.map((outlet) => outlet.outletId).join(":")}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappedOutlets.map((outlet) => (
          <Marker
            key={outlet.outletId}
            position={[outlet.latitude!, outlet.longitude!]}
            icon={outletIcon}
            title={outlet.outletName}
          >
            <Popup>
              <div className="min-w-40">
                <strong>{outlet.outletName}</strong>
                <div>{outlet.companyName}</div>
                <div>{[outlet.locality, outlet.city].filter(Boolean).join(", ")}</div>
                {outlet.address && <div>{outlet.address}</div>}
                <a className="mt-2 inline-block font-bold" href={`/business/${outlet.companyId}?outletId=${encodeURIComponent(outlet.outletId)}&pickupOnly=1&orderType=SELF_RECEIVE`}>View menu →</a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <p className="bg-white px-3 py-2 text-xs font-medium text-gray-500">{mappedOutlets.length} active outlet{mappedOutlets.length === 1 ? "" : "s"} shown · Tap a pin to view its menu</p>
    </div>
  );
}
