"use client";

import { useEffect, useState } from "react";

type Company = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export default function BusinessAdminSettingsPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/business-admin/settings",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Unable to load business settings."
        );
        return;
      }

      setCompany(result.company);
      setBusinessName(result.company.name);
    } catch {
      setError(
        "Unable to load business settings."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function saveSettings() {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/business-admin/settings",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: businessName,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Unable to update settings."
        );
        return;
      }

      setCompany(result.company);
      setBusinessName(result.company.name);

      setMessage(
        "Business settings updated successfully."
      );
    } catch {
      setError(
        "Unable to update business settings."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-[30px] bg-white shadow-xl">
            <div className="h-36 animate-pulse bg-orange-100" />

            <div className="space-y-5 p-6 sm:p-8">
              <div className="h-7 w-52 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-12 w-full animate-pulse rounded-2xl bg-gray-100" />
              <div className="h-12 w-36 animate-pulse rounded-2xl bg-gray-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <section className="relative mb-8 overflow-hidden rounded-[30px] bg-gradient-to-br from-orange-600 via-orange-500 to-red-500 p-6 text-white shadow-[0_20px_50px_rgba(234,88,12,0.20)] sm:p-8">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-28 right-24 h-64 w-64 rounded-full bg-white/5" />

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                (window.location.href = "/business-admin")
              }
              className="mb-5 inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              ← Back to Dashboard
            </button>

            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl shadow-sm backdrop-blur">
                ⚙️
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-100">
                  Business Management
                </p>

                <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                  Settings
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-orange-50 sm:text-base">
              Manage your business information and keep your
              business profile up to date.
            </p>
          </div>
        </section>

        {/* Messages */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>

              <div>
                <p className="font-extrabold text-red-800">
                  Something needs attention
                </p>

                <p className="mt-1 text-sm font-medium text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xl">✅</span>

              <p className="text-sm font-bold text-emerald-700">
                {message}
              </p>
            </div>
          </div>
        )}

        {/* Business Information */}
        <section className="overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-orange-100 via-orange-50 to-red-50 px-6 py-6 sm:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                🏪
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-orange-500">
                  Business Profile
                </p>

                <h2 className="mt-1 text-2xl font-black text-gray-900">
                  Business Information
                </h2>

                <p className="mt-1 text-sm font-medium text-gray-500">
                  Update the name customers see for your business.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <label
              htmlFor="businessName"
              className="mb-2 flex items-center gap-2 text-sm font-extrabold text-gray-700"
            >
              <span>🏷️</span>
              <span>Business Name</span>
              <span className="text-red-500">*</span>
            </label>

            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(event) =>
                setBusinessName(event.target.value)
              }
              placeholder="Enter business name"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
            />

            <p className="mt-2 text-xs font-medium text-gray-500">
              This name will be used as your business identity
              across the platform.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={loadSettings}
                disabled={saving}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ↻ Reset
              </button>

              <button
                type="button"
                onClick={saveSettings}
                disabled={
                  saving || !businessName.trim()
                }
                className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : "✓ Save Changes"}
              </button>
            </div>
          </div>
        </section>

        {/* Business Details */}
        {company && (
          <section className="mt-6 overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-lg">
            <div className="border-b border-orange-100 px-6 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-xl">
                  📋
                </div>

                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-orange-500">
                    Account Information
                  </p>

                  <h2 className="mt-1 text-xl font-black text-gray-900">
                    Business Details
                  </h2>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
              <DetailCard
                icon="🆔"
                label="Business ID"
                value={company.id}
              />

              <DetailCard
                icon="📅"
                label="Created"
                value={new Date(
                  company.createdAt
                ).toLocaleString("en-IN")}
              />

              <DetailCard
                icon="🔄"
                label="Last Updated"
                value={new Date(
                  company.updatedAt
                ).toLocaleString("en-IN")}
              />
            </div>
          </section>
        )}

        {/* Info */}
        <section className="mt-6 rounded-[26px] border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-xl">
              💡
            </div>

            <div>
              <p className="font-extrabold text-gray-900">
                Keep your business profile updated
              </p>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Your business name is part of your storefront
                identity. Make sure it is clear and matches
                the name customers know.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="py-8 text-center">
          <p className="text-xs font-semibold text-gray-400">
            Business Settings
          </p>

          <p className="mt-1 text-xs text-gray-300">
            Manage • Grow • Serve
          </p>
        </div>
      </div>
    </main>
  );
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-400">
            {label}
          </p>

          <p className="mt-1 break-all text-sm font-bold text-gray-700">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}