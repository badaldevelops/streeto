"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type OutletUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
};

type Outlet = {
  id: string;
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive?: boolean;

  company?: {
    id: string;
    name: string;
  } | null;

  users?: OutletUser[];

  _count?: {
    orders: number;
    users: number;
  };
};

function getCity(outlet: Outlet) {
  const address = outlet.address?.trim();

  if (!address) {
    return "Unknown";
  }

  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    return parts[parts.length - 1];
  }

  const words = address
    .split(/\s+/)
    .filter(Boolean);

  return words[words.length - 1] || "Unknown";
}

function normalizeCity(value: string) {
  return decodeURIComponent(value)
    .trim()
    .toLowerCase();
}

export default function AdminCityOutletsPage() {
  const params = useParams();

  const cityParam =
    typeof params.city === "string"
      ? params.city
      : "";

  const cityName = useMemo(() => {
    return decodeURIComponent(cityParam);
  }, [cityParam]);

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOutlets() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/admin/outlets",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data: any =
          await response.json();

        if (!response.ok) {
          setError(
            data.error ||
              "Unable to load outlets."
          );
          return;
        }

        const allOutlets: Outlet[] =
          data.outlets || [];

        const selectedCity =
          normalizeCity(cityParam);

        const cityOutlets =
          allOutlets.filter((outlet) => {
            return (
              normalizeCity(
                getCity(outlet)
              ) === selectedCity
            );
          });

        setOutlets(cityOutlets);
      } catch (error) {
        console.error(
          "Load city outlets error:",
          error
        );

        setError(
          "Unable to load outlets."
        );
      } finally {
        setLoading(false);
      }
    }

    if (cityParam) {
      loadOutlets();
    }
  }, [cityParam]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">

          <Link
            href="/admin/outlets"
            className="text-sm font-semibold text-gray-600 hover:text-black"
          >
            ← Back to Cities
          </Link>

          <h1 className="mt-6 text-3xl font-bold">
            {cityName} Outlets
          </h1>

          <p className="mt-3 text-gray-600">
            Loading outlets...
          </p>

        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">

          <Link
            href="/admin/outlets"
            className="text-sm font-semibold text-gray-600 hover:text-black"
          >
            ← Back to Cities
          </Link>

          <h1 className="mt-6 text-3xl font-bold">
            {cityName} Outlets
          </h1>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-8">

          <Link
            href="/admin/outlets"
            className="text-sm font-semibold text-gray-600 hover:text-black"
          >
            ← Back to Cities
          </Link>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">

            <div>

              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Outlet Management
              </p>

              <h1 className="mt-1 text-3xl font-bold capitalize text-black">
                {cityName} Outlets
              </h1>

              <p className="mt-2 text-gray-600">
                {outlets.length}{" "}
                {outlets.length === 1
                  ? "outlet"
                  : "outlets"}{" "}
                in {cityName}.
              </p>

            </div>

            <Link
              href="/admin/outlets"
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-100"
            >
              All Cities
            </Link>

          </div>

        </div>

        {/* NO OUTLETS */}

        {outlets.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">

            <h2 className="text-xl font-semibold">
              No outlets found
            </h2>

            <p className="mt-2 text-gray-500">
              There are no outlets listed for this city.
            </p>

          </div>
        ) : (

          /* OUTLET CARDS */

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {outlets.map((outlet) => {

              const adminUser =
                outlet.users?.find(
                  (item) =>
                    item.role ===
                    "BUSINESS_ADMIN"
                );

              return (
                <div
                  key={outlet.id}
                  className="rounded-2xl border bg-white p-5 shadow-sm"
                >

                  {/* OUTLET NAME */}

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <h2 className="text-lg font-bold text-black">
                        {outlet.name}
                      </h2>

                      <p className="mt-1 text-xs text-gray-400 break-all">
                        ID: {outlet.id}
                      </p>

                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        outlet.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {outlet.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>

                  </div>

                  {/* LOCATION */}

                  <div className="mt-4 rounded-xl bg-gray-50 p-3">

                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Location
                    </p>

                    <p className="mt-1 text-sm text-gray-800">
                      📍{" "}
                      {outlet.address ||
                        "Address not available"}
                    </p>

                    {outlet.latitude != null &&
                      outlet.longitude != null && (
                        <p className="mt-2 text-xs text-gray-500">
                          {outlet.latitude},{" "}
                          {outlet.longitude}
                        </p>
                      )}

                  </div>

                  {/* COMPANY */}

                  <div className="mt-4">

                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Business
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {outlet.company?.name ||
                        "Not assigned"}
                    </p>

                  </div>

                  {/* ADMIN */}

                  <div className="mt-4 border-t pt-4">

                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Business Admin
                    </p>

                    {adminUser ? (
                      <div className="mt-2">

                        <p className="text-sm font-semibold">
                          {adminUser.name}
                        </p>

                        <p className="mt-1 break-all text-xs text-gray-500">
                          {adminUser.email}
                        </p>

                        {adminUser.phone && (
                          <p className="mt-1 text-xs text-gray-500">
                            {adminUser.phone}
                          </p>
                        )}

                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">
                        No Business Admin assigned.
                      </p>
                    )}

                  </div>

                  {/* COUNTS */}

                  <div className="mt-4 grid grid-cols-2 gap-2">

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Orders
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        {outlet._count?.orders ??
                          0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Users
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        {outlet._count?.users ??
                          outlet.users?.length ??
                          0}
                      </p>
                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>
    </main>
  );
}