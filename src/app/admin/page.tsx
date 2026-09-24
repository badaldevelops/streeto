"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

type Stats = {
  todaysOrders: number;
  todaysSales: number;
  onlineOrders: number;
  offlineOrders: number;
};

type Company = {
  id: string;
  name: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessPassword, setBusinessPassword] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const meResponse = await fetch("/api/me");

        if (!meResponse.ok) {
          router.replace("/login");
          return;
        }

        const meData = await meResponse.json();

        if (
          !meData.authenticated ||
          meData.user?.role !== "SUPER_ADMIN"
        ) {
          router.replace("/");
          return;
        }

        setUser(meData.user);

        const [statsResponse, companiesResponse] =
          await Promise.all([
            fetch("/api/admin-stats"),
            fetch("/api/admin/companies"),
          ]);

        const statsData = await statsResponse.json();

        if (!statsResponse.ok) {
          setError(
            statsData.error ||
              "Unable to load dashboard statistics."
          );
        } else {
          setStats(statsData.stats);
        }

        if (companiesResponse.ok) {
          const companiesData =
            await companiesResponse.json();

          setCompanies(
            companiesData.companies || []
          );
        }
      } catch (error) {
        console.error(error);
        setError("Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await fetch("/api/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error(error);
    } finally {
      router.replace("/login");
    }
  }

  async function handleCreateBusinessAdmin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setCreatingAdmin(true);
    setAdminMessage("");
    setAdminError("");

    try {
      const response = await fetch(
        "/api/admin/business-admin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: businessName,
            email: businessEmail,
            phone: businessPhone,
            password: businessPassword,
            companyId: selectedCompanyId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setAdminError(
          data.error ||
            "Unable to create Business Admin."
        );
        return;
      }

      setAdminMessage(
        "Business Admin created successfully."
      );

      setBusinessName("");
      setBusinessEmail("");
      setBusinessPhone("");
      setBusinessPassword("");
      setSelectedCompanyId("");
    } catch (error) {
      console.error(error);
      setAdminError(
        "Unable to create Business Admin."
      );
    } finally {
      setCreatingAdmin(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 px-5 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-600">
              Loading dashboard...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100 px-5 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-500">
                BUSINESSHUB PLATFORM
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                Platform Admin Dashboard
              </h1>

              <p className="mt-2 text-gray-600">
                Welcome, {user.name}.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {user.email}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Today&apos;s Orders
            </p>

            <p className="mt-2 text-3xl font-bold">
              {stats?.todaysOrders ?? 0}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Today&apos;s Sales
            </p>

            <p className="mt-2 text-3xl font-bold">
              ₹{stats?.todaysSales ?? 0}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Online Orders
            </p>

            <p className="mt-2 text-3xl font-bold">
              {stats?.onlineOrders ?? 0}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Offline Orders
            </p>

            <p className="mt-2 text-3xl font-bold">
              {stats?.offlineOrders ?? 0}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-gray-500">
              CLIENT MANAGEMENT
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Create Business Admin
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Create an admin account for a business.
              The account will only belong to the
              selected business.
            </p>
          </div>

          <form
            onSubmit={handleCreateBusinessAdmin}
            className="mt-6 grid gap-5 md:grid-cols-2"
          >
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Business
              </label>

              <select
                value={selectedCompanyId}
                onChange={(event) =>
                  setSelectedCompanyId(
                    event.target.value
                  )
                }
                required
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              >
                <option value="">
                  Select Business
                </option>

                {companies.map((company) => (
                  <option
                    key={company.id}
                    value={company.id}
                  >
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Name
              </label>

              <input
                type="text"
                value={businessName}
                onChange={(event) =>
                  setBusinessName(event.target.value)
                }
                required
                placeholder="Business Admin name"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Email
              </label>

              <input
                type="email"
                value={businessEmail}
                onChange={(event) =>
                  setBusinessEmail(event.target.value)
                }
                required
                placeholder="admin@example.com"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Phone
              </label>

              <input
                type="tel"
                value={businessPhone}
                onChange={(event) =>
                  setBusinessPhone(event.target.value)
                }
                placeholder="10 digit phone"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Password
              </label>

              <input
                type="password"
                value={businessPassword}
                onChange={(event) =>
                  setBusinessPassword(
                    event.target.value
                  )
                }
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={creatingAdmin}
                className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {creatingAdmin
                  ? "Creating..."
                  : "Create Business Admin"}
              </button>
            </div>
          </form>

          {adminMessage && (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
              {adminMessage}
            </div>
          )}

          {adminError && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {adminError}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">
              Orders
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              View and manage customer orders.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">
              Products
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Manage products, prices and availability.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">
              Outlets
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Manage outlets and outlet settings.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}