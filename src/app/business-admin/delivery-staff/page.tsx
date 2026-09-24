"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Outlet = {
  id: string;
  name: string;
};

type DeliveryStaff = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  outletId: string | null;
  outlet: Outlet | null;
  _count: {
    deliveries: number;
  };
};

type StaffForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  outletId: string;
};

const emptyForm: StaffForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  outletId: "",
};

export default function DeliveryStaffPage() {
  const router = useRouter();

  const [staff, setStaff] = useState<DeliveryStaff[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] =
    useState<DeliveryStaff | null>(null);

  const [form, setForm] = useState<StaffForm>(emptyForm);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [staffResponse, outletsResponse] =
        await Promise.all([
          fetch(
            "/api/business-admin/delivery-staff",
            {
              cache: "no-store",
            }
          ),
          fetch(
            "/api/business-admin/outlets",
            {
              cache: "no-store",
            }
          ),
        ]);

      const staffData = await staffResponse.json();
      const outletsData = await outletsResponse.json();

      if (!staffResponse.ok) {
        setError(
          staffData.error ||
            "Unable to load delivery staff."
        );
        return;
      }

      if (!outletsResponse.ok) {
        setError(
          outletsData.error ||
            "Unable to load outlets."
        );
        return;
      }

      setStaff(staffData.staff || []);

      setOutlets(
        (outletsData.outlets || []).map(
          (outlet: Outlet) => ({
            id: outlet.id,
            name: outlet.name,
          })
        )
      );
    } catch (error) {
      console.error(
        "Load delivery staff error:",
        error
      );

      setError(
        "Something went wrong while loading delivery staff."
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

        if (
          !response.ok ||
          !data.authenticated
        ) {
          router.push("/login");
          return;
        }

        if (
          data.user?.role !==
          "BUSINESS_ADMIN"
        ) {
          router.push("/");
          return;
        }

        await loadData();
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
    setEditingStaff(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(
    deliveryStaff: DeliveryStaff
  ) {
    setEditingStaff(deliveryStaff);

    setForm({
      name: deliveryStaff.name,
      email: deliveryStaff.email,
      phone:
        deliveryStaff.phone || "",
      password: "",
      outletId:
        deliveryStaff.outletId || "",
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
    setEditingStaff(null);
    setForm(emptyForm);
    setError("");
  }

  function updateForm(
    field: keyof StaffForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!form.name.trim()) {
        setError("Name is required.");
        return;
      }

      if (!form.email.trim()) {
        setError("Email is required.");
        return;
      }

      if (!form.outletId) {
        setError("Please select an outlet.");
        return;
      }

      if (
        !editingStaff &&
        form.password.length < 6
      ) {
        setError(
          "Password must be at least 6 characters."
        );
        return;
      }

      if (
        editingStaff &&
        form.password &&
        form.password.length < 6
      ) {
        setError(
          "Password must be at least 6 characters."
        );
        return;
      }

      const isEditing =
        Boolean(editingStaff);

      const body: Record<
        string,
        string | boolean
      > = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        outletId: form.outletId,
      };

      if (!isEditing) {
        body.email =
          form.email.trim().toLowerCase();

        body.password = form.password;
      }

      if (
        isEditing &&
        form.password
      ) {
        body.password = form.password;
      }

      if (isEditing) {
        body.staffId =
          editingStaff!.id;
      }

      const response = await fetch(
        "/api/business-admin/delivery-staff",
        {
          method: isEditing
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            `Unable to ${
              isEditing
                ? "update"
                : "create"
            } delivery staff.`
        );
        return;
      }

      setSuccess(
        isEditing
          ? "Delivery staff updated successfully."
          : "Delivery staff created successfully."
      );

      setShowForm(false);
      setEditingStaff(null);
      setForm(emptyForm);

      await loadData();
    } catch (error) {
      console.error(
        "Save delivery staff error:",
        error
      );

      setError(
        "Something went wrong while saving delivery staff."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStaff(
    deliveryStaff: DeliveryStaff
  ) {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/business-admin/delivery-staff",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            staffId:
              deliveryStaff.id,
            isActive:
              !deliveryStaff.isActive,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to update staff status."
        );
        return;
      }

      setSuccess(
        deliveryStaff.isActive
          ? "Delivery staff deactivated successfully."
          : "Delivery staff activated successfully."
      );

      await loadData();
    } catch (error) {
      console.error(
        "Toggle delivery staff error:",
        error
      );

      setError(
        "Something went wrong while updating staff status."
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
                  router.push(
                    "/business-admin"
                  )
                }
                className="mb-4 inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                ← Back to Dashboard
              </button>

              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl backdrop-blur">
                  🛵
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-100">
                    Delivery Team
                  </p>

                  <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
                    Delivery Staff
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-orange-50 sm:text-base">
                Manage your delivery team, outlet
                assignments and staff accounts from one
                place.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={loadData}
                disabled={loading}
                className="rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Loading..."
                  : "↻ Refresh"}
              </button>

              <button
                onClick={openCreateForm}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-orange-600 shadow-lg transition hover:-translate-y-0.5 hover:bg-orange-50"
              >
                + Add Staff
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        {!loading && !error && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              icon="🛵"
              title="Total Staff"
              value={staff.length}
              description="Delivery team members"
            />

            <SummaryCard
              icon="✅"
              title="Active Staff"
              value={
                staff.filter(
                  (member) => member.isActive
                ).length
              }
              description="Currently active"
            />

            <SummaryCard
              icon="⛔"
              title="Inactive Staff"
              value={
                staff.filter(
                  (member) => !member.isActive
                ).length
              }
              description="Currently inactive"
            />

            <SummaryCard
              icon="📦"
              title="Deliveries"
              value={staff.reduce(
                (total, member) =>
                  total +
                  member._count.deliveries,
                0
              )}
              description="Total assigned deliveries"
            />
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-700 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xl">
                ✅
              </span>
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-xl">
                ⚠️
              </span>

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

        {/* Form */}
        {showForm && (
          <div className="mb-8 overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-xl">
            <div className="bg-gradient-to-r from-orange-100 to-red-50 px-6 py-5 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                    {editingStaff
                      ? "✏️"
                      : "🛵"}
                  </div>

                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900">
                      {editingStaff
                        ? "Edit Delivery Staff"
                        : "Add Delivery Staff"}
                    </h2>

                    <p className="mt-1 text-sm font-medium text-gray-500">
                      {editingStaff
                        ? "Update staff details and outlet assignment."
                        : "Create a login account for your delivery staff."}
                    </p>
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
                  label="Full Name"
                  required
                  icon="👤"
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
                    placeholder="e.g. Rahul Kumar"
                    required
                    className="input-style"
                  />
                </Field>

                {/* Email */}
                <Field
                  label="Email"
                  required
                  icon="📧"
                >
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateForm(
                        "email",
                        event.target.value
                      )
                    }
                    placeholder="delivery@example.com"
                    required
                    disabled={
                      Boolean(
                        editingStaff
                      )
                    }
                    className={`input-style ${
                      editingStaff
                        ? "cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
                  />
                </Field>

                {/* Phone */}
                <Field
                  label="Phone"
                  icon="📞"
                >
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateForm(
                        "phone",
                        event.target.value
                      )
                    }
                    placeholder="9999999999"
                    className="input-style"
                  />
                </Field>

                {/* Password */}
                <Field
                  label={
                    editingStaff
                      ? "New Password"
                      : "Password"
                  }
                  required={!editingStaff}
                  icon="🔐"
                >
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      updateForm(
                        "password",
                        event.target.value
                      )
                    }
                    placeholder={
                      editingStaff
                        ? "Leave blank to keep current password"
                        : "Minimum 6 characters"
                    }
                    required={!editingStaff}
                    className="input-style"
                  />
                </Field>

                {/* Outlet */}
                <div className="sm:col-span-2">
                  <Field
                    label="Assigned Outlet"
                    required
                    icon="🏪"
                  >
                    <select
                      value={form.outletId}
                      onChange={(event) =>
                        updateForm(
                          "outletId",
                          event.target.value
                        )
                      }
                      required
                      className="input-style"
                    >
                      <option value="">
                        Select outlet
                      </option>

                      {outlets.map(
                        (outlet) => (
                          <option
                            key={outlet.id}
                            value={outlet.id}
                          >
                            {outlet.name}
                          </option>
                        )
                      )}
                    </select>

                    {outlets.length === 0 && (
                      <p className="mt-2 text-xs font-semibold text-red-600">
                        No outlets found. Create an
                        outlet first.
                      </p>
                    )}
                  </Field>
                </div>
              </div>

              {/* Info */}
              <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">
                    💡
                  </span>

                  <div>
                    <p className="text-sm font-extrabold text-orange-800">
                      Staff login
                    </p>

                    <p className="mt-1 text-xs font-medium leading-5 text-orange-700">
                      Delivery staff can use their email
                      and password to access their delivery
                      panel. Email cannot be changed after
                      the account is created.
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
                  disabled={
                    saving ||
                    outlets.length === 0
                  }
                  className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingStaff
                    ? "✓ Update Staff"
                    : "+ Create Staff"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-3xl border border-orange-100 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl">
              🛵
            </div>

            <h2 className="text-lg font-extrabold text-gray-900">
              Loading delivery staff...
            </h2>

            <p className="mt-2 text-sm font-medium text-gray-500">
              Please wait while we load your delivery team.
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          staff.length === 0 && (
            <div className="rounded-3xl border border-orange-100 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100 text-4xl">
                🛵
              </div>

              <h2 className="text-2xl font-extrabold text-gray-900">
                No delivery staff yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Add your first delivery staff member
                and assign them to an outlet.
              </p>

              <button
                onClick={openCreateForm}
                className="mt-6 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5"
              >
                + Add Your First Staff
              </button>
            </div>
          )}

        {/* Staff Cards */}
        {!loading &&
          !error &&
          staff.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {staff.map(
                (deliveryStaff) => (
                  <div
                    key={
                      deliveryStaff.id
                    }
                    className="group rounded-3xl border border-orange-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-2xl">
                          🛵
                        </div>

                        <div className="min-w-0">
                          <h2 className="truncate text-xl font-extrabold text-gray-900">
                            {
                              deliveryStaff.name
                            }
                          </h2>

                          <p className="mt-1 truncate text-xs font-medium text-gray-500">
                            {
                              deliveryStaff.email
                            }
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide ${
                          deliveryStaff.isActive
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-700 text-white"
                        }`}
                      >
                        {deliveryStaff.isActive
                          ? "● Active"
                          : "● Inactive"}
                      </span>
                    </div>

                    {/* Phone */}
                    <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          📞
                        </span>

                        <div className="min-w-0">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-400">
                            Phone
                          </p>

                          <p className="mt-1 truncate text-sm font-bold text-gray-700">
                            {
                              deliveryStaff.phone ||
                              "No phone added"
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Outlet */}
                    <div className="mt-3 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          🏪
                        </span>

                        <div className="min-w-0">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-orange-500">
                            Assigned Outlet
                          </p>

                          <p className="mt-1 truncate text-sm font-extrabold text-orange-800">
                            {
                              deliveryStaff
                                .outlet
                                ?.name ||
                              "No outlet assigned"
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Deliveries */}
                    <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            📦
                          </span>

                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-400">
                              Deliveries
                            </p>

                            <p className="mt-1 text-xs font-medium text-gray-500">
                              Assigned deliveries
                            </p>
                          </div>
                        </div>

                        <p className="text-2xl font-black text-gray-900">
                          {
                            deliveryStaff
                              ._count
                              .deliveries
                          }
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(
                            deliveryStaff
                          )
                        }
                        className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleStaff(
                            deliveryStaff
                          )
                        }
                        className={`rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                          deliveryStaff.isActive
                            ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                            : "border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        }`}
                      >
                        {deliveryStaff.isActive
                          ? "🚫 Deactivate"
                          : "✓ Activate"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

        {/* Footer */}
        {!loading &&
          !error &&
          staff.length > 0 && (
            <div className="mt-8 rounded-2xl border border-orange-100 bg-white p-4 text-center text-xs font-medium text-gray-500 shadow-sm">
              Delivery staff management • Assign every
              rider to the correct outlet for smooth
              order delivery
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
          <span className="text-red-500">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}