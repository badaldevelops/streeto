"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import "./outlets.css";

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
};

type OutletsResponse = {
  success?: boolean;
  outlets?: Outlet[];
  error?: string;
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

  const words = address.split(/\s+/).filter(Boolean);

  return words[words.length - 1] || "Unknown";
}

export default function AdminOutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOutlets() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/admin/outlets", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data: OutletsResponse = await response.json();

        if (!response.ok) {
          setError(
            data.error || "Unable to load outlets."
          );
          return;
        }

        setOutlets(data.outlets || []);
      } catch (error) {
        console.error(
          "Load admin outlets error:",
          error
        );

        setError("Unable to load outlets.");
      } finally {
        setLoading(false);
      }
    }

    loadOutlets();
  }, []);

  const cities = useMemo(() => {
    const grouped: Record<string, Outlet[]> = {};

    for (const outlet of outlets) {
      const city = getCity(outlet);

      if (!grouped[city]) {
        grouped[city] = [];
      }

      grouped[city].push(outlet);
    }

    return Object.entries(grouped).sort(
      ([a], [b]) => a.localeCompare(b)
    );
  }, [outlets]);

  const totalActive = outlets.filter(
    (outlet) => outlet.isActive !== false
  ).length;

  if (loading) {
    return (
      <main className="outlets-page">
        <div className="outlets-container">
          <section className="outlets-hero">
            <div className="outlets-back-placeholder">
              Loading
            </div>

            <div className="outlets-hero-content">
              <span className="outlets-eyebrow">
                SUPER ADMIN
              </span>

              <h1>Outlets</h1>

              <p>
                Loading your outlet locations...
              </p>
            </div>
          </section>

          <div className="outlets-loading-grid">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="outlet-skeleton"
              >
                <div />
                <div />
                <div />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="outlets-page">
        <div className="outlets-container">
          <Link
            href="/admin"
            className="outlets-back"
          >
            ← Back to Admin
          </Link>

          <section className="outlets-error">
            <div className="outlets-error-icon">
              !
            </div>

            <div>
              <h2>
                Unable to load outlets
              </h2>

              <p>{error}</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="outlets-page">
      <div className="outlets-container">
        <section className="outlets-hero">
          <Link
            href="/admin"
            className="outlets-back hero-back"
          >
            ← Back to Admin
          </Link>

          <div className="outlets-hero-content">
            <span className="outlets-eyebrow">
              SUPER ADMIN
            </span>

            <h1>
              Outlet Locations
            </h1>

            <p>
              Manage and view all outlets grouped
              by their city.
            </p>
          </div>

          <div className="outlets-summary">
            <div>
              <strong>{cities.length}</strong>
              <span>Cities</span>
            </div>

            <div>
              <strong>{outlets.length}</strong>
              <span>Outlets</span>
            </div>

            <div>
              <strong>{totalActive}</strong>
              <span>Active</span>
            </div>
          </div>
        </section>

        <section className="cities-section">
          <div className="cities-heading">
            <div>
              <span className="section-eyebrow">
                LOCATIONS
              </span>

              <h2>
                Select a city
              </h2>
            </div>

            <span className="city-count">
              {cities.length}{" "}
              {cities.length === 1
                ? "City"
                : "Cities"}
            </span>
          </div>

          {cities.length === 0 ? (
            <div className="no-outlets">
              <div className="no-outlets-icon">
                📍
              </div>

              <h2>
                No outlets found
              </h2>

              <p>
                There are currently no outlets
                available.
              </p>
            </div>
          ) : (
            <div className="cities-grid">
              {cities.map(
                ([city, cityOutlets]) => {
                  const activeCount =
                    cityOutlets.filter(
                      (outlet) =>
                        outlet.isActive !== false
                    ).length;

                  return (
                    <Link
                      key={city}
                      href={`/admin/outlets/${encodeURIComponent(
                        city.toLowerCase()
                      )}`}
                      className="city-card"
                    >
                      <div className="city-card-top">
                        <div className="city-icon">
                          📍
                        </div>

                        <span className="city-arrow">
                          →
                        </span>
                      </div>

                      <div className="city-info">
                        <h3>
                          {city}
                        </h3>

                        <p>
                          {cityOutlets.length}{" "}
                          {cityOutlets.length === 1
                            ? "Outlet"
                            : "Outlets"}
                        </p>
                      </div>

                      <div className="city-card-bottom">
                        <span>
                          {activeCount} active
                        </span>

                        <span className="view-city">
                          View outlets →
                        </span>
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          )}
        </section>

        <footer className="outlets-footer">
          Streeto · Super Admin
        </footer>
      </div>
    </main>
  );
}