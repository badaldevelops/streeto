"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  companyId: string | null;
};

type Company = {
  id: string;
  name: string;
};

type Stats = {
  todaysOrders: number;
  todaysSales: number;
  outlets: number;
  products: number;
};

export default function BusinessAdminPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const meResponse = await fetch("/api/me");

        if (!meResponse.ok) {
          router.replace("/login");
          return;
        }

        const meData = await meResponse.json();

        if (!meData.authenticated) {
          router.replace("/login");
          return;
        }

        if (meData.user?.role !== "BUSINESS_ADMIN") {
          router.replace("/");
          return;
        }

        setUser(meData.user);

        if (!meData.user.companyId) {
          setError(
            "This Business Admin account is not connected to a business."
          );
          return;
        }

        const [companyResponse, statsResponse] =
          await Promise.all([
            fetch(
              `/api/business-admin/company?companyId=${meData.user.companyId}`
            ),
            fetch("/api/business-admin/stats"),
          ]);

        const companyData = await companyResponse.json();
        const statsData = await statsResponse.json();

        if (!companyResponse.ok) {
          setError(
            companyData.error || "Unable to load business."
          );
          return;
        }

        if (!statsResponse.ok) {
          setError(
            statsData.error ||
              "Unable to load business statistics."
          );
          return;
        }

        setCompany(companyData.company);
        setStats(statsData.stats);
      } catch (error) {
        console.error(error);

        setError(
          "Unable to load Business Admin dashboard."
        );
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fff8f2] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse overflow-hidden rounded-[28px] bg-white shadow-sm">
            <div className="h-40 bg-orange-100" />
            <div className="space-y-5 p-6">
              <div className="h-6 w-64 rounded-lg bg-gray-200" />
              <div className="h-20 rounded-2xl bg-gray-100" />
              <div className="h-20 rounded-2xl bg-gray-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = [
    {
      title: "Orders",
      description: "View and manage customer orders.",
      icon: "🛒",
      href: "/business-admin/orders",
      bg: "bg-orange-50",
      iconBg: "bg-orange-500",
    },
    {
      title: "Products",
      description: "Manage menu, prices and availability.",
      icon: "🍔",
      href: "/business-admin/products",
      bg: "bg-red-50",
      iconBg: "bg-red-500",
    },
    {
      title: "Outlets",
      description: "Manage locations and delivery settings.",
      icon: "🏪",
      href: "/business-admin/outlets",
      bg: "bg-amber-50",
      iconBg: "bg-amber-500",
    },
    {
      title: "Delivery Staff",
      description: "Manage your delivery team.",
      icon: "🚴",
      href: "/business-admin/delivery-staff",
      bg: "bg-blue-50",
      iconBg: "bg-blue-500",
    },
    {
      title: "Sales",
      description: "View sales and payment summaries.",
      icon: "📈",
      href: "/business-admin/sales",
      bg: "bg-green-50",
      iconBg: "bg-green-500",
    },
    {
      title: "Settings",
      description: "Manage your business settings.",
      icon: "⚙️",
      href: "/business-admin/settings",
      bg: "bg-gray-50",
      iconBg: "bg-gray-700",
    },
  ];

  return (
    <main className="min-h-screen bg-[#fff8f2] px-3 py-3 sm:px-6 sm:py-5 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* HERO HEADER */}
        <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-orange-500 via-orange-500 to-red-500 p-4 text-white shadow-[0_16px_40px_rgba(234,88,12,0.18)] sm:rounded-[30px] sm:p-8">

          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-28 right-24 h-64 w-64 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-4 sm:gap-7 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-green-300" />
                BUSINESS ADMIN PANEL
              </div>

              <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
                {company?.name || "Business Dashboard"}
              </h1>

              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 tracking-wide text-orange-50 sm:mt-3 sm:text-lg sm:leading-8">
                Welcome back,{" "}
<span className="font-extrabold text-white">
  {user.name}
</span>
. Manage your food business, orders,
products and outlets from one place.
              </p>

              <div className="mt-3 flex flex-wrap gap-2 sm:mt-5 sm:gap-3">
                <div className="rounded-xl bg-white/15 px-3 py-2 text-xs backdrop-blur sm:px-4 sm:py-2.5 sm:text-sm">
                  👤 {user.name}
                </div>

                <div className="max-w-full truncate rounded-xl bg-white/15 px-3 py-2 text-xs backdrop-blur sm:px-4 sm:py-2.5 sm:text-sm">
                  ✉️ {user.email}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 lg:flex-col lg:items-end">
              <div className="mb-3 hidden text-right lg:block">
                <p className="text-xs font-medium text-orange-100">
                  Business Admin
                </p>

                <p className="mt-1 text-sm font-bold">
                  Manage your business
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="min-h-11 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-red-600 shadow-lg transition hover:bg-orange-50 disabled:opacity-50"
              >
                {loggingOut
                  ? "Logging out..."
                  : "Logout"}
              </button>
            </div>

          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* STATS */}
        <section className="mt-7">

          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                Today at a glance
              </p>

              <h2 className="mt-1 text-2xl font-black text-gray-900">
                Business Overview
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">

            {/* Orders */}
            <div className="group rounded-2xl border border-orange-100 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-[24px] sm:p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-lg transition group-hover:scale-110 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-2xl">
                  🛒
                </div>

                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-extrabold uppercase text-orange-600">
                  Today
                </span>
              </div>

              <p className="mt-3 text-xs font-semibold text-gray-500 sm:mt-5 sm:text-sm">
                Today&apos;s Orders
              </p>

              <p className="mt-1 text-2xl font-black text-gray-900 sm:text-3xl">
                {stats?.todaysOrders ?? 0}
              </p>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-orange-100">
                <div className="h-full w-2/3 rounded-full bg-orange-500" />
              </div>
            </div>

            {/* Sales */}
            <div className="group rounded-2xl border border-green-100 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-[24px] sm:p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-lg transition group-hover:scale-110 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-2xl">
                  💰
                </div>

                <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-extrabold uppercase text-green-600">
                  Revenue
                </span>
              </div>

              <p className="mt-3 text-xs font-semibold text-gray-500 sm:mt-5 sm:text-sm">
                Today&apos;s Sales
              </p>

              <p className="mt-1 text-2xl font-black text-gray-900 sm:text-3xl">
                ₹{stats?.todaysSales ?? 0}
              </p>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-green-100">
                <div className="h-full w-3/4 rounded-full bg-green-500" />
              </div>
            </div>

            {/* Outlets */}
            <div className="group rounded-2xl border border-amber-100 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-[24px] sm:p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-lg transition group-hover:scale-110 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-2xl">
                  🏪
                </div>

                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold uppercase text-amber-600">
                  Active
                </span>
              </div>

              <p className="mt-3 text-xs font-semibold text-gray-500 sm:mt-5 sm:text-sm">
                Active Outlets
              </p>

              <p className="mt-1 text-2xl font-black text-gray-900 sm:text-3xl">
                {stats?.outlets ?? 0}
              </p>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-amber-100">
                <div className="h-full w-1/2 rounded-full bg-amber-500" />
              </div>
            </div>

            {/* Products */}
            <div className="group rounded-2xl border border-red-100 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-[24px] sm:p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-lg transition group-hover:scale-110 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-2xl">
                  🍔
                </div>

                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-extrabold uppercase text-red-600">
                  Menu
                </span>
              </div>

              <p className="mt-3 text-xs font-semibold text-gray-500 sm:mt-5 sm:text-sm">
                Active Products
              </p>

              <p className="mt-1 text-2xl font-black text-gray-900 sm:text-3xl">
                {stats?.products ?? 0}
              </p>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-red-100">
                <div className="h-full w-3/5 rounded-full bg-red-500" />
              </div>
            </div>

          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="mt-8">

          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
              Manage your business
            </p>

            <h2 className="mt-1 text-2xl font-black text-gray-900">
              Quick Actions
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">

            {menuItems.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => router.push(item.href)}
                className={`group ${item.bg} rounded-2xl border border-white p-3 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-[24px] sm:p-5`}
              >
                <div className="flex items-start justify-between">

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconBg} text-xl text-white shadow-md transition duration-300 group-hover:scale-110 group-hover:rotate-2 sm:h-14 sm:w-14 sm:rounded-2xl sm:text-2xl`}
                  >
                    {item.icon}
                  </div>

                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm transition group-hover:bg-gray-900 group-hover:text-white">
                    →
                  </span>
                </div>

                <h3 className="mt-3 text-base font-black text-gray-900 sm:mt-5 sm:text-xl">
                  {item.title}
                </h3>

                <p className="mt-1 text-xs leading-4 text-gray-600 sm:mt-2 sm:text-sm sm:leading-5">
                  {item.description}
                </p>

                <p className="mt-3 text-xs font-extrabold text-gray-900 sm:mt-5 sm:text-sm">
                  Open {item.title}
                  <span className="ml-2 transition group-hover:ml-3">
                    →
                  </span>
                </p>
              </button>
            ))}

          </div>
        </section>

        {/* BOTTOM INFO */}
        <section className="mt-8 grid gap-5 lg:grid-cols-2">

          <div className="overflow-hidden rounded-[26px] bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-300">
                  Your Business
                </p>

                <h3 className="mt-2 text-2xl font-black">
                  {company?.name || "Business"}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-300">
                  Keep your menu updated, manage incoming orders
                  and monitor your business performance from here.
                </p>
              </div>

              <div className="text-4xl">
                🍽️
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/business-admin/settings")
              }
              className="mt-6 rounded-xl bg-white px-4 py-3 text-sm font-bold text-gray-900 transition hover:bg-orange-50"
            >
              Business Settings →
            </button>
          </div>

          <div className="rounded-[26px] border border-orange-100 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-2xl">
                ⚡
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                  Quick Tip
                </p>

                <h3 className="text-xl font-black text-gray-900">
                  Keep your menu fresh
                </h3>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-gray-600">
              Make sure your products, prices and availability
              are always updated so customers get the right
              information while ordering.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/business-admin/products")
              }
              className="mt-5 rounded-xl bg-orange-500 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-orange-600"
            >
              Manage Products →
            </button>

          </div>

        </section>

        {/* FOOTER */}
        <div className="py-8 text-center">
          <p className="text-xs font-medium text-gray-400">
            Business Management Dashboard
          </p>

          <p className="mt-1 text-xs text-gray-300">
            Manage • Grow • Serve
          </p>
        </div>

      </div>
    </main>
  );
}
