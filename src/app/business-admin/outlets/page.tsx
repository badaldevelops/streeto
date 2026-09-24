"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GoogleLocationPicker from "@/app/components/GoogleLocationPicker";

type Outlet = {
  id: string;
  name: string;
  businessType: string;
locationUpdatedAt: string | null;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  deliveryRadiusKm: number;
  deliveryCharge: number;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    orders: number;
  };
};

type OutletForm = {
  name: string;
  businessType: string;
  address: string;
  phone: string;
  latitude: string;
  longitude: string;
  deliveryRadiusKm: string;
  deliveryCharge: string;
};

const emptyForm: OutletForm = {
  name: "",
  businessType: "FIXED_SHOP",
  address: "",
  phone: "",
  latitude: "",
  longitude: "",
  deliveryRadiusKm: "5",
  deliveryCharge: "0",
};

export default function BusinessAdminOutletsPage() {
  const router = useRouter();

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingOutlet, setEditingOutlet] =
    useState<Outlet | null>(null);

  const [form, setForm] = useState<OutletForm>(emptyForm);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  async function loadOutlets() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/business-admin/outlets",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to load outlets.");
        return;
      }

      setOutlets(data.outlets || []);
    } catch (error) {
      console.error("Load business outlets error:", error);

      setError(
        "Something went wrong while loading outlets."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function checkLogin() {
      try {
        const response = await fetch("/api/me", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.authenticated) {
          router.push("/login");
          return;
        }

        if (data.user?.role !== "BUSINESS_ADMIN") {
          router.push("/");
          return;
        }

        await loadOutlets();
      } catch (error) {
        console.error(
          "Business admin session error:",
          error
        );

        router.push("/login");
      }
    }

    checkLogin();
  }, [router]);

  function openCreateForm() {
    setEditingOutlet(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(outlet: Outlet) {
    setEditingOutlet(outlet);

    setForm({
      name: outlet.name,
      businessType: outlet.businessType,
      address: outlet.address || "",
      phone: outlet.phone || "",
      latitude:
        outlet.latitude !== null
          ? String(outlet.latitude)
          : "",
      longitude:
        outlet.longitude !== null
          ? String(outlet.longitude)
          : "",
      deliveryRadiusKm: String(outlet.deliveryRadiusKm),
      deliveryCharge: String(outlet.deliveryCharge),
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingOutlet(null);
    setForm(emptyForm);
    setError("");
  }

  function updateForm(
    field: keyof OutletForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function updateCartLocation(outlet: Outlet) {
  if (outlet.businessType !== "MOVING_CART") {
    return;
  }

  if (!navigator.geolocation) {
    alert("Your browser does not support location access.");
    return;
  }

  const confirmed = window.confirm(
    "Allow location access to update this cart's current location?"
  );

  if (!confirmed) {
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const response = await fetch("/api/business-admin/outlets", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        body: JSON.stringify({
  outletId: outlet.id,
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
}),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to update location.");
        }

        await loadOutlets();

        alert("Cart location updated successfully.");
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Unable to update cart location."
        );
      }
    },
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        alert(
          "Location permission was denied. Please allow location access in your browser."
        );
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        alert("Current location is unavailable. Please try again.");
      } else if (error.code === error.TIMEOUT) {
        alert("Location request timed out. Please try again.");
      } else {
        alert("Unable to get your current location.");
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  );
}

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const radius = Number(form.deliveryRadiusKm);
      const charge = Number(form.deliveryCharge);

      const latitude =
        form.latitude.trim() === ""
          ? null
          : Number(form.latitude);

      const longitude =
        form.longitude.trim() === ""
          ? null
          : Number(form.longitude);

      if (!form.name.trim()) {
        setError("Outlet name is required.");
        return;
      }

      if (!Number.isFinite(radius) || radius <= 0) {
        setError(
          "Delivery radius must be greater than 0."
        );
        return;
      }

      if (!Number.isFinite(charge) || charge < 0) {
        setError("Delivery charge cannot be negative.");
        return;
      }

      if (
        latitude !== null &&
        (!Number.isFinite(latitude) ||
          latitude < -90 ||
          latitude > 90)
      ) {
        setError(
          "Latitude must be between -90 and 90."
        );
        return;
      }

      if (
        longitude !== null &&
        (!Number.isFinite(longitude) ||
          longitude < -180 ||
          longitude > 180)
      ) {
        setError(
          "Longitude must be between -180 and 180."
        );
        return;
      }

      const isEditing = Boolean(editingOutlet);

      const response = await fetch(
        "/api/business-admin/outlets",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
   body: JSON.stringify(
  isEditing
    ? {
        outletId: editingOutlet?.id,
        name: form.name.trim(),
        businessType: form.businessType,
        address: form.address.trim(),
        phone: form.phone.trim(),
        deliveryRadiusKm: radius,
        deliveryCharge: charge,
        latitude,
        longitude,
      }
    : {
        name: form.name.trim(),
        businessType: form.businessType,
        address: form.address.trim(),
        phone: form.phone.trim(),
        deliveryRadiusKm: radius,
        deliveryCharge: charge,
        latitude,
        longitude,
      }
),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            `Unable to ${
              isEditing ? "update" : "create"
            } outlet.`
        );
        return;
      }

      setSuccess(
        isEditing
          ? "Outlet updated successfully."
          : "Outlet created successfully."
      );

      setShowForm(false);
      setEditingOutlet(null);
      setForm(emptyForm);

      await loadOutlets();
    } catch (error) {
      console.error("Save outlet error:", error);

      setError(
        "Something went wrong while saving the outlet."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleOutlet(outlet: Outlet) {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/business-admin/outlets",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            outletId: outlet.id,
            isActive: !outlet.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to update outlet status."
        );
        return;
      }

      setSuccess(
        outlet.isActive
          ? "Outlet deactivated successfully."
          : "Outlet activated successfully."
      );

      await loadOutlets();
    } catch (error) {
      console.error("Toggle outlet error:", error);

      setError(
        "Something went wrong while updating outlet status."
      );
    }
  }

 
 
  return (
   
   
   <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <button
                onClick={() =>
                  router.push("/business-admin")
                }
                className="mb-4 inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                ← Back to Dashboard
              </button>

              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl backdrop-blur">
                  🏪
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-100">
                    Food Business
                  </p>

                  <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
                    Outlets
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-orange-50 sm:text-base">
                Manage outlet locations, delivery settings,
                contact details and operating status from one
                place.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={loadOutlets}
                disabled={loading}
                className="rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Loading..." : "↻ Refresh"}
              </button>

              <button
                onClick={openCreateForm}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-orange-600 shadow-lg transition hover:-translate-y-0.5 hover:bg-orange-50"
              >
                + Add Outlet
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        {!loading && !error && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {showLocationPicker && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-orange-100 px-5 py-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            📍 Select Outlet Location
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Map par location select karo ya marker ko drag karo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowLocationPicker(false)}
          className="rounded-xl bg-slate-100 px-3 py-2 text-lg font-bold text-slate-600 hover:bg-slate-200"
        >
          ✕
        </button>
      </div>

      <div className="p-4">
        <GoogleLocationPicker
          latitude={form.latitude ? Number(form.latitude) : null}
          longitude={form.longitude ? Number(form.longitude) : null}
          onLocationChange={(latitude, longitude) => {
            updateForm("latitude", String(latitude));
            updateForm("longitude", String(longitude));
          }}
        />

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setShowLocationPicker(false)}
            className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-extrabold text-white hover:bg-orange-600"
          >
            ✓ Use This Location
          </button>
        </div>
      </div>
    </div>
  </div>
)}
            <SummaryCard
              icon="🏪"
              title="Total Outlets"
              value={outlets.length}
              description="Your business locations"
            />

            <SummaryCard
              icon="✅"
              title="Active Outlets"
              value={
                outlets.filter(
                  (outlet) => outlet.isActive
                ).length
              }
              description="Currently operating"
            />

            <SummaryCard
              icon="👥"
              title="Staff"
              value={outlets.reduce(
                (total, outlet) =>
                  total + outlet._count.users,
                0
              )}
              description="Assigned outlet staff"
            />

            <SummaryCard
              icon="🛒"
              title="Orders"
              value={outlets.reduce(
                (total, outlet) =>
                  total + outlet._count.orders,
                0
              )}
              description="Orders across outlets"
            />
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-700 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xl">✅</span>
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>

              <div>
                <p className="font-extrabold">
                  Something needs attention
                </p>
                <p className="mt-1 font-medium">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add / Edit Form */}
        {showForm && (
          <div className="mb-8 overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-xl">
            <div className="bg-gradient-to-r from-orange-100 to-red-50 px-6 py-5 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                      {editingOutlet ? "✏️" : "🏪"}
                    </div>

                    <div>
                      <h2 className="text-xl font-extrabold text-gray-900">
                        {editingOutlet
                          ? "Edit Outlet"
                          : "Add New Outlet"}
                      </h2>

                      <p className="mt-1 text-sm font-medium text-gray-500">
                        Enter your outlet details below.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed"
                >
                  ✕
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 sm:p-8"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Name */}
                <Field
                  label="Outlet Name"
                  required
                  icon="🏪"
                >
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      updateForm(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Main Outlet"
                    required
                    className="input-style"
                  />
                </Field>
                <div>
  <label className="mb-2 block text-sm font-semibold text-gray-700">
    Business Type
  </label>

  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <button
      type="button"
      onClick={() =>
        setForm((current) => ({
          ...current,
          businessType: "FIXED_SHOP",
        }))
      }
      className={`rounded-2xl border-2 p-4 text-left transition ${
        form.businessType === "FIXED_SHOP"
          ? "border-orange-500 bg-orange-50 shadow-md"
          : "border-gray-200 bg-white hover:border-orange-300"
      }`}
    >
      <div className="text-2xl">🏪</div>
      <div className="mt-2 font-bold text-gray-900">
        Fixed Shop
      </div>
      <div className="mt-1 text-sm text-gray-500">
        Permanent shop location
      </div>
    </button>

    <button
      type="button"
      onClick={() =>
        setForm((current) => ({
          ...current,
          businessType: "MOVING_CART",
        }))
      }
      className={`rounded-2xl border-2 p-4 text-left transition ${
        form.businessType === "MOVING_CART"
          ? "border-orange-500 bg-orange-50 shadow-md"
          : "border-gray-200 bg-white hover:border-orange-300"
      }`}
    >
      <div className="text-2xl">🛺</div>
      <div className="mt-2 font-bold text-gray-900">
        Moving Cart
      </div>
      <div className="mt-1 text-sm text-gray-500">
        Location can be updated from phone
      </div>
    </button>
  </div>
</div>

                {/* Phone */}
                <Field label="Phone" icon="📞">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateForm(
                        "phone",
                        event.target.value
                      )
                    }
                    placeholder="e.g. 9999999999"
                    className="input-style"
                  />
                </Field>

                {/* Address */}
                <div className="sm:col-span-2">
                  <Field label="Address" icon="📍">
                    <textarea
                      value={form.address}
                      onChange={(event) =>
                        updateForm(
                          "address",
                          event.target.value
                        )
                      }
                      placeholder="Enter complete outlet address"
                      rows={3}
                      className="input-style resize-y"
                    />
                  </Field>
                </div>

                {/* Radius */}
                <Field
                  label="Delivery Radius (km)"
                  required
                  icon="📏"
                >
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={form.deliveryRadiusKm}
                    onChange={(event) =>
                      updateForm(
                        "deliveryRadiusKm",
                        event.target.value
                      )
                    }
                    required
                    className="input-style"
                  />
                </Field>

                {/* Charge */}
                <Field
                  label="Delivery Charge (₹)"
                  required
                  icon="💰"
                >
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.deliveryCharge}
                    onChange={(event) =>
                      updateForm(
                        "deliveryCharge",
                        event.target.value
                      )
                    }
                    required
                    className="input-style"
                  />
                </Field>

                {/* Google Map Location */}
<div className="sm:col-span-2">
  <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-extrabold text-orange-800">
          📍 Outlet Location
        </p>

        <p className="mt-1 text-xs font-medium text-orange-700">
          Google Map se outlet ki exact location select karo.
        </p>

        {form.latitude && form.longitude ? (
          <p className="mt-2 text-xs font-bold text-green-600">
            ✓ Location selected
          </p>
        ) : (
          <p className="mt-2 text-xs font-semibold text-slate-500">
            Location abhi select nahi ki gayi.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowLocationPicker(true)}
        className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-orange-600"
      >
        📍 Select Location on Map
      </button>
    </div>
  </div>
</div>
              </div>

              {/* Location info */}
              <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">📍</span>

                  <div>
                    <p className="text-sm font-extrabold text-orange-800">
                      Delivery location
                    </p>

                    <p className="mt-1 text-xs font-medium leading-5 text-orange-700">
                      Latitude and longitude are used to
                      calculate whether a customer is inside
                      the outlet&apos;s delivery radius.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingOutlet
                    ? "✓ Update Outlet"
                    : "+ Create Outlet"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-3xl border border-orange-100 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl">
              🏪
            </div>

            <h2 className="text-lg font-extrabold text-gray-900">
              Loading outlets...
            </h2>

            <p className="mt-2 text-sm font-medium text-gray-500">
              Please wait while we load your locations.
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && outlets.length === 0 && (
          <div className="rounded-3xl border border-orange-100 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100 text-4xl">
              🏪
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900">
              No outlets yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Create your first outlet to start managing
              locations and delivery settings.
            </p>

            <button
              onClick={openCreateForm}
              className="mt-6 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5"
            >
              + Add Your First Outlet
            </button>
          </div>
        )}

        {/* Outlets */}
        {!loading && !error && outlets.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {outlets.map((outlet) => (
              <div
                key={outlet.id}
                className="group rounded-3xl border border-orange-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-2xl">
                      🏪
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-extrabold text-gray-900">
                        {outlet.name}
                      </h2>

                      <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Business Outlet
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide ${
                      outlet.isActive
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    {outlet.isActive
                      ? "● Active"
                      : "● Inactive"}
                  </span>
                </div>

                {/* Address */}
                <div className="mt-6 rounded-2xl bg-gray-50 p-4">
                  <div className="flex gap-3">
                    <span className="text-lg">📍</span>

                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-400">
                        Address
                      </p>

                      <p className="mt-1 text-sm font-semibold leading-5 text-gray-700">
                        {outlet.address ||
                          "No address added"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-gray-100 px-4 py-3">
                  <span className="text-lg">📞</span>

                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-400">
                      Phone
                    </p>

                    <p className="mt-0.5 truncate text-sm font-bold text-gray-700">
                      {outlet.phone ||
                        "No phone added"}
                    </p>
                  </div>
                </div>

                {/* Delivery */}
                <div className="mt-5">
                  <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-gray-400">
                    Delivery Settings
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <InfoBox
                      icon="📏"
                      label="Radius"
                      value={`${outlet.deliveryRadiusKm} km`}
                    />

                    <InfoBox
                      icon="💰"
                      label="Charge"
                      value={`₹${outlet.deliveryCharge.toFixed(
                        2
                      )}`}
                    />
                  </div>
                </div>

                {/* Location */}
<div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4">
  <div className="flex items-center justify-between gap-3">
    <div>
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-orange-500">
        {outlet.businessType === "MOVING_CART"
          ? "Cart Location"
          : "Map Location"}
      </p>

      <p className="mt-1 text-xs font-semibold text-orange-800">
        {outlet.latitude !== null &&
        outlet.longitude !== null
          ? "Location configured"
          : "Location not configured"}
      </p>
    </div>

    <span className="text-xl">
      {outlet.businessType === "MOVING_CART" ? "🛺" : "🌐"}
    </span>
  </div>

  {outlet.latitude !== null &&
    outlet.longitude !== null && (
      <p className="mt-2 text-[11px] font-medium text-orange-700">
        {outlet.latitude.toFixed(4)},{" "}
        {outlet.longitude.toFixed(4)}
      </p>
    )}

  {outlet.businessType === "MOVING_CART" &&
    outlet.locationUpdatedAt && (
      <p className="mt-2 text-[11px] font-bold text-orange-600">
        Last updated:{" "}
        {new Date(outlet.locationUpdatedAt).toLocaleString()}
      </p>
    )}

  {outlet.businessType === "MOVING_CART" && (
    <p className="mt-2 text-[11px] font-medium text-orange-700">
      Update your location whenever the cart moves.
    </p>
  )}
  </div>

                {/* Stats */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        👥
                      </span>

                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-gray-400">
                        Staff
                      </span>
                    </div>

                    <p className="mt-2 text-2xl font-black text-gray-900">
                      {outlet._count.users}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        🛒
                      </span>

                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-gray-400">
                        Orders
                      </span>
                    </div>

                    <p className="mt-2 text-2xl font-black text-gray-900">
                      {outlet._count.orders}
                    </p>
                  </div>
                </div>

              {/* Actions */}
<div className="mt-5 grid gap-3">
  {outlet.businessType === "MOVING_CART" && (
    <button
      type="button"
      onClick={() => updateCartLocation(outlet)}
      className="w-full rounded-2xl bg-orange-50 px-4 py-3 text-sm font-extrabold text-orange-600 transition hover:bg-orange-100"
    >
      📍 Update My Location
    </button>
  )}

  <div className="grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={() => openEditForm(outlet)}
      className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      ✏️ Edit
    </button>

    <button
      type="button"
      onClick={() => toggleOutlet(outlet)}
      className={`rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
        outlet.isActive
          ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          : "border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
      }`}
    >
      {outlet.isActive
        ? "🚫 Deactivate"
        : "✓ Activate"}
    </button>
  </div>
</div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {!loading && !error && outlets.length > 0 && (
          <div className="mt-8 rounded-2xl border border-orange-100 bg-white p-4 text-center text-xs font-medium text-gray-500 shadow-sm">
            Outlet management • Delivery radius and map
            coordinates control customer delivery eligibility
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  description,
}: {
  icon: string;
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-gray-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black tracking-tight text-gray-900">
            {value}
          </p>

          <p className="mt-1 text-xs font-medium text-gray-500">
            {description}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

function InfoBox({
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
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>

        <span className="text-[10px] font-extrabold uppercase tracking-wide text-gray-400">
          {label}
        </span>
      </div>

      <p className="mt-2 text-lg font-black text-gray-900">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  required,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-extrabold text-gray-700">
        <span>{icon}</span>
        <span>{label}</span>
        {required && (
          <span className="text-red-500">*</span>
        )}
      </label>

      {children}
    </div>
  );
}