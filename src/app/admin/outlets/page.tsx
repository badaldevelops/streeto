"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  city?: string | null;
  locality?: string | null;
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

type Company = { id: string; name: string; isActive: boolean };

function getCity(outlet: Outlet) {
  return outlet.city?.trim() || "City not set";
}

export default function AdminOutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newOutlet, setNewOutlet] = useState({ companyId: "", name: "", city: "", address: "", phone: "" });

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
    fetch("/api/admin/companies", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setCompanies(data.companies || []);
      })
      .catch((loadError) => console.error("Load businesses for outlet creation error:", loadError));
  }, []);

  async function createOutlet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      const response = await fetch("/api/admin/outlets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOutlet),
      });
      const data = await response.json();
      if (!response.ok) {
        setCreateError(data.error || "Unable to create outlet.");
        return;
      }
      setOutlets((current) => [...current, data.outlet]);
      setNewOutlet({ companyId: "", name: "", city: "", address: "", phone: "" });
      setShowCreateForm(false);
    } catch {
      setCreateError("Unable to create outlet. Please try again.");
    } finally {
      setCreating(false);
    }
  }

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

          <button
            type="button"
            onClick={() => setShowCreateForm((open) => !open)}
            className="rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-orange-700 shadow transition hover:bg-orange-50"
          >
            {showCreateForm ? "Close" : "+ Add Outlet"}
          </button>
        </section>

        {showCreateForm && (
          <form onSubmit={createOutlet} className="mb-8 grid gap-4 rounded-2xl border border-orange-200 bg-white p-5 shadow-sm sm:grid-cols-2">
            <h2 className="text-lg font-extrabold text-slate-900 sm:col-span-2">Create outlet as Super Admin</h2>
            <select required value={newOutlet.companyId} onChange={(event) => setNewOutlet((current) => ({ ...current, companyId: event.target.value }))} className="rounded-xl border border-slate-200 px-4 py-3 sm:col-span-2">
              <option value="">Choose business</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
            <input required value={newOutlet.name} onChange={(event) => setNewOutlet((current) => ({ ...current, name: event.target.value }))} placeholder="Outlet name" className="rounded-xl border border-slate-200 px-4 py-3" />
            <input value={newOutlet.phone} onChange={(event) => setNewOutlet((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone (optional)" className="rounded-xl border border-slate-200 px-4 py-3" />
            <input value={newOutlet.city} onChange={(event) => setNewOutlet((current) => ({ ...current, city: event.target.value }))} placeholder="City (optional; Business Admin can update)" maxLength={100} className="rounded-xl border border-slate-200 px-4 py-3" />
            <input value={newOutlet.address} onChange={(event) => setNewOutlet((current) => ({ ...current, address: event.target.value }))} placeholder="Address (optional)" className="rounded-xl border border-slate-200 px-4 py-3 sm:col-span-2" />
            {createError && <p className="text-sm font-semibold text-red-600 sm:col-span-2">{createError}</p>}
            <button disabled={creating || companies.length === 0} className="rounded-xl bg-orange-600 px-5 py-3 font-bold text-white disabled:opacity-50 sm:col-span-2">
              {creating ? "Creating…" : "Create Outlet"}
            </button>
          </form>
        )}

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
          Qtoo · Super Admin
        </footer>
      </div>
    </main>
  );
}
