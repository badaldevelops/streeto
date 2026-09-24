import Link from "next/link";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

import CartButton from "./components/CartButton";
import CustomerLocation from "./components/CustomerLocation";
import CartPanel from "./components/CartPanel";

import Checkout from "./components/Checkout";
import CustomerStatus from "./components/CustomerStatus";

import { prisma } from "@/lib/prisma";

export default async function Home() {
  const user = await getCurrentUser();

  if (user?.role === "SUPER_ADMIN") {
    redirect("/admin");
  }

  if (user?.role === "BUSINESS_ADMIN") {
    redirect("/business-admin");
  }

  if (user?.role === "DELIVERY_STAFF") {
    redirect("/delivery");
  }

  const businesses = await prisma.company.findMany({
    where: {
      outlets: {
        some: {
          isActive: true,
        },
      },
    },
    include: {
      outlets: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          address: true,
          deliveryRadiusKm: true,
          deliveryCharge: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-[#fffaf5] text-gray-900">
      {/* TOP NAV */}
      <header className="sticky top-0 z-40 border-b border-orange-100/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-2xl shadow-lg shadow-orange-200 transition group-hover:scale-105">
              🍽️
            </div>

            <div>
              <h1 className="text-lg font-black tracking-tight text-gray-950 sm:text-xl">
                Local Food
              </h1>

              <p className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-500 sm:block">
                Fresh • Local • Delicious
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
     
           

            <CustomerStatus />
            <CartButton />
          </div>
        </div>
      </header>
     <CustomerLocation />

      {/* HERO */}
      <section className="px-4 pb-8 pt-5 sm:px-6 sm:pt-7 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950 px-6 py-10 text-white shadow-[0_25px_70px_rgba(0,0,0,0.16)] sm:px-10 sm:py-14 lg:px-14 lg:py-16">
          {/* Decorative circles */}
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-orange-500/20 blur-2xl" />
          <div className="absolute -bottom-28 right-28 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-orange-400/5 blur-3xl" />

          <div className="relative max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-orange-200 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
              Local food marketplace
            </div>

            <h2 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Good food.
              <br />
              <span className="bg-gradient-to-r from-orange-300 via-orange-200 to-red-300 bg-clip-text text-transparent">
                Great local stores.
              </span>
            </h2>

            <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-gray-300 sm:text-base sm:leading-8">
              Discover your favourite local businesses, explore
              their menus and order fresh food for delivery or
              self receive.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#businesses"
                className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-950/30 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Explore Food →
              </a>

              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3.5 text-sm font-bold text-gray-200 backdrop-blur">
                🚚 Delivery & Self Receive
              </div>
            </div>
          </div>

          {/* Floating food visual */}
          <div className="absolute bottom-5 right-5 hidden h-44 w-44 items-center justify-center rounded-full border border-white/10 bg-white/5 text-8xl shadow-2xl backdrop-blur sm:flex lg:bottom-10 lg:right-12 lg:h-56 lg:w-56 lg:text-9xl">
            🍔
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-3">
          <TrustCard
            icon="🏪"
            title="Local Businesses"
            description="Order directly from nearby stores."
          />

          <TrustCard
            icon="🚚"
            title="Easy Delivery"
            description="Delivery availability shown by outlet."
          />

          <TrustCard
            icon="🥡"
            title="Self Receive"
            description="Prefer pickup? Collect your order yourself."
          />
        </div>
      </section>

      {/* BUSINESSES */}
      <section
        id="businesses"
        className="mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:px-8"
      >
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-orange-500">
              Discover
            </p>

            <h2 className="mt-1 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
              Explore Businesses
            </h2>

            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-gray-500">
              Find a local business, check its outlets and
              explore the food available near you.
            </p>
          </div>

          <div className="rounded-full border border-orange-100 bg-white px-4 py-2 text-xs font-bold text-gray-500 shadow-sm">
            {businesses.length}{" "}
            {businesses.length === 1
              ? "business"
              : "businesses"}{" "}
            available
          </div>
        </div>

        {businesses.length === 0 ? (
          <div className="rounded-[28px] border border-orange-100 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100 text-4xl">
              🏪
            </div>

            <h3 className="mt-5 text-2xl font-black text-gray-900">
              No businesses available
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              No businesses are currently available for
              ordering. Please check again later.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {businesses.map((business, index) => (
              <article
                key={business.id}
                className="group overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(234,88,12,0.12)]"
              >
                {/* Business Cover */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-orange-100 via-orange-50 to-red-50">
                  <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-orange-200/60 blur-xl" />
                  <div className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-red-200/40 blur-xl" />

                  <div className="absolute left-5 top-5 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-orange-600 shadow-sm backdrop-blur">
                    {index === 0
                      ? "Featured Store"
                      : "Local Favourite"}
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center text-7xl transition duration-500 group-hover:scale-110 sm:text-8xl">
                    🏪
                  </div>

                  <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-extrabold text-emerald-600 shadow-sm backdrop-blur">
                    ● Open
                  </div>
                </div>

                {/* Business Content */}
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-2xl font-black text-gray-950">
                        {business.name}
                      </h3>

                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">
                        {business.outlets.length}{" "}
                        {business.outlets.length === 1
                          ? "Outlet"
                          : "Outlets"}
                      </p>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-lg">
                      🍴
                    </div>
                  </div>

                  {/* Outlets */}
                  <div className="mt-5 space-y-3">
                    {business.outlets.map((outlet) => (
                      <div
                        key={outlet.id}
                        className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 transition group-hover:border-orange-100"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold text-gray-900">
                              {outlet.name}
                            </p>

                            {outlet.address && (
                              <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-gray-500">
                                📍 {outlet.address}
                              </p>
                            )}
                          </div>

                          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-600">
                            OPEN
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-gray-500 shadow-sm">
                            🚚 Up to{" "}
                            {outlet.deliveryRadiusKm} km
                          </span>

                          <span
                            className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold shadow-sm ${
                              outlet.deliveryCharge === 0
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-orange-50 text-orange-600"
                            }`}
                          >
                            {outlet.deliveryCharge === 0
                              ? "✓ Free Delivery"
                              : `Delivery ₹${outlet.deliveryCharge}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* View Menu */}
                  <Link
                    href={`/business/${business.id}`}
                    className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    View Menu
                    <span className="transition group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

    

      {/* CHECKOUT */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-orange-500">
            Almost There
          </p>

          <h2 className="mt-1 text-2xl font-black text-gray-950">
            Complete Your Order
          </h2>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-lg">
          <Checkout />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8">
          <div>
            <p className="font-black text-gray-900">
              Local Food
            </p>

            <p className="mt-1 text-xs font-medium text-gray-400">
              Fresh food from local businesses.
            </p>
          </div>

          <p className="text-xs font-medium text-gray-400">
            © 2026 Local Food. All rights reserved.
          </p>
        </div>
      </footer>
      <CartPanel />
    </main>
  );
}

function TrustCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-xl">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-extrabold text-gray-900">
          {title}
        </p>

        <p className="mt-0.5 text-xs font-medium leading-5 text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}