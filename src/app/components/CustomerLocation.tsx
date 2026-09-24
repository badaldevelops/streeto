"use client";

import { useState } from "react";

type NearbyBusiness = {
  outletId: string;
  outletName: string;
  companyId: string;
  companyName: string;
  businessType: string;
  address: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  distanceText: string;
};

export default function CustomerLocation() {
  const [loading, setLoading] = useState(false);
  const [locationText, setLocationText] = useState("");
  const [businesses, setBusinesses] = useState<NearbyBusiness[]>([]);

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      alert("Your browser does not support location.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setLocationText(
          `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        );

        try {
          const response = await fetch(
            `/api/customer/nearby-businesses?latitude=${latitude}&longitude=${longitude}`
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.error || "Unable to find nearby businesses."
            );
          }

          setBusinesses(data.businesses || []);
        } catch (error) {
          console.error("Nearby businesses error:", error);
          alert("Unable to load nearby businesses.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);

        alert(
          "Your browser does not support location."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-orange-500">
              Discover Nearby
            </p>

            <h2 className="mt-1 text-xl font-black text-gray-950">
              Find businesses near you
            </h2>

            <p className="mt-1 text-sm font-medium text-gray-500">
              Allow your location to discover nearby outlets and see their distance.
            </p>

            {locationText && (
              <p className="mt-2 text-xs font-bold text-green-600">
                📍 Location detected: {locationText}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={loading}
            className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-200 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Finding businesses..." : "📍 Use My Location"}
          </button>
        </div>

        {businesses.length > 0 && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => (
              <div
                key={business.outletId}
                className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-gray-950">
                      {business.companyName}
                    </h3>

                    <p className="mt-1 text-sm font-bold text-gray-600">
                      {business.outletName}
                    </p>
                  </div>

                  <span className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-black text-orange-600 shadow-sm">
                    {business.distanceText}
                  </span>
                </div>

                {business.address && (
                  <p className="mt-3 text-xs font-medium leading-5 text-gray-500">
                    📍 {business.address}
                  </p>
                )}

                <p className="mt-2 text-xs font-bold text-gray-400">
                  Exact location: {business.latitude.toFixed(5)},{" "}
                  {business.longitude.toFixed(5)}
                </p>
              </div>
            ))}
          </div>
        )}

        {!loading && locationText && businesses.length === 0 && (
          <div className="mt-5 rounded-2xl bg-orange-50 p-4 text-center">
            <p className="text-sm font-bold text-gray-600">
              No active business outlets were found near your location.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}