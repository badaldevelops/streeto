import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

import CustomerMenuSections from "@/app/components/CustomerMenuSections";
import CartButton from "@/app/components/CartButton";
import CartPanel from "@/app/components/CartPanel";
import CartCheckoutBar from "@/app/components/CartCheckoutBar";
import CustomerStatus from "@/app/components/CustomerStatus";
import StoreStatusSync from "@/app/components/StoreStatusSync";
import MobileCustomerNav from "@/app/components/MobileCustomerNav";

import { prisma } from "@/lib/prisma";

type BusinessPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    outletId?: string;
    pickupOnly?: string;
    orderType?: string;
  }>;
};

export default async function BusinessPage({
  params,
  searchParams,
}: BusinessPageProps) {
   const user = await getCurrentUser();

if (user?.role === "SUPER_ADMIN") {
    redirect("https://admin.qtoo.in/admin");
  }

  if (user?.role === "BUSINESS_ADMIN") {
    redirect("https://business.qtoo.in/business-admin");
  }

  if (user?.role === "DELIVERY_STAFF") {
    redirect("https://qtoo.in/delivery");
  }

  const [{ id }, query] = await Promise.all([params, searchParams]);

  const business = await prisma.company.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      isOpen: true,
      outlets: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          address: true,
          latitude: true,
          longitude: true,
          foodType: true,
          outletProducts: {
            where: {
              isAvailable: true,
              product: {
                isActive: true,
              },
            },
            select: {
              id: true,
              category: true,
              addOns: true,
              price: true,
              isVeg: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  imageUrl: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!business) {
    notFound();
  }

  const ratingGroups = business.outlets.length
    ? await prisma.outletRating.groupBy({
        by: ["outletId"],
        where: {
          outletId: { in: business.outlets.map((outlet) => outlet.id) },
          order: { status: { in: ["COMPLETED", "DELIVERED"] }, payment: { is: { status: "PAID" } } },
        },
        _avg: { stars: true },
        _count: { stars: true },
      })
    : [];
  const ratingsByOutlet = new Map(ratingGroups.map((rating) => [rating.outletId, {
    average: rating._avg.stars === null ? null : Number(rating._avg.stars.toFixed(2)),
    count: rating._count.stars,
  }]));

  let activeOutlets = business.outlets;
  if (query.outletId) {
    const selectedOutlet = business.outlets.find((outlet) => outlet.id === query.outletId);
    if (!selectedOutlet) notFound();
    activeOutlets = [selectedOutlet];
  }
  const pickupOnly = query.pickupOnly === "1";
  const initialOrderType = "SELF_RECEIVE";

  return (
    <main className="min-h-screen bg-[#fffaf5] pb-20 text-gray-900 sm:pb-0">
      <StoreStatusSync initialStatuses={{ [business.id]: business.isOpen }} />
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-orange-100/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
          <div className="min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 transition hover:text-orange-600"
            >
              ← All Businesses
            </Link>

            <div className="mt-1 flex items-center gap-2">
              <h1 className="truncate text-lg font-black tracking-tight text-gray-950 sm:text-xl">
                {business.name}
              </h1>

              <span className="hidden rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-extrabold uppercase text-orange-600 sm:inline-block">
                Menu
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <CustomerStatus />
            <CartButton />
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="px-3 pb-5 pt-3 sm:px-6 sm:pb-8 sm:pt-7 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[24px] bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950 px-5 py-4 text-white shadow-[0_18px_45px_rgba(0,0,0,0.14)] sm:rounded-[32px] sm:px-10 sm:py-8 lg:px-14">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-orange-500/20 blur-2xl" />
          <div className="absolute -bottom-28 right-24 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-orange-200 backdrop-blur sm:mb-5 sm:px-4 sm:py-2 sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
              {business.isOpen ? "Now accepting orders" : "Store closed"}
            </div>

            <h2 className="text-[2rem] font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
              {business.name}
            </h2>

            <p className="mt-2 max-w-2xl text-[13px] font-medium leading-5 text-gray-300 sm:mt-4 sm:text-base sm:leading-8">
              Explore the menu, choose your favourite food and
              order from the outlet that works best for you.
            </p>

          </div>

          <div className="absolute bottom-4 right-5 hidden h-44 w-44 items-center justify-center rounded-full border border-white/10 bg-white/5 text-8xl shadow-2xl backdrop-blur sm:flex lg:bottom-8 lg:right-12 lg:h-52 lg:w-52">
            🍽️
          </div>
        </div>
      </section>

      {/* OUTLETS */}
      <section className="mx-auto max-w-7xl px-3 pb-10 sm:px-6 sm:pb-14 lg:px-8">
        <div className="mb-5 sm:mb-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-orange-500">
            Choose your location
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-950 sm:text-4xl">
            Our Outlets
          </h2>

          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-gray-500">
            Select an outlet and explore the food available
            there.
          </p>
        </div>

        {activeOutlets.length === 0 ? (
          <div className="rounded-[28px] border border-orange-100 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100 text-4xl">
              🏪
            </div>

            <h3 className="mt-5 text-2xl font-black text-gray-900">
              No active outlets
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              No outlets are currently available for ordering.
            </p>
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-12">
            {activeOutlets.map((outlet, outletIndex) => (
              <section key={outlet.id}>
                {/* OUTLET HEADER */}
                <div className="relative mb-4 overflow-hidden rounded-2xl border border-orange-100 bg-white p-3 shadow-sm sm:mb-6 sm:rounded-[28px] sm:p-6">
                  <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-orange-100/60 blur-2xl" />

                  <div className="relative flex flex-col gap-3 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-xl text-white shadow-md shadow-orange-200 sm:h-14 sm:w-14 sm:rounded-2xl sm:text-2xl">
                        🏪
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black text-gray-950 sm:text-3xl">
                            {outlet.name}
                          </h3>

                          <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide ${business.isOpen ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                            ● {business.isOpen ? "Open" : "Store Closed"}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-bold">
                          {(outlet.foodType === "VEG" || outlet.foodType === "BOTH") && <span className="rounded-full bg-green-50 px-2 py-1 text-green-700">🟢 Veg</span>}
                          {(outlet.foodType === "NON_VEG" || outlet.foodType === "BOTH") && <span className="rounded-full bg-red-50 px-2 py-1 text-red-700">🔴 Non-veg</span>}
                          <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-800">⭐ {ratingsByOutlet.get(outlet.id)?.average === null || !ratingsByOutlet.has(outlet.id) ? "New · no ratings" : `${ratingsByOutlet.get(outlet.id)!.average!.toFixed(1)} · ${ratingsByOutlet.get(outlet.id)!.count} ratings`}</span>
                        </div>

                        <div className="mt-2 space-y-1">
                          {outlet.address && (
                            <p className="text-sm font-medium text-gray-500">
                              📍 {outlet.address}
                            </p>
                          )}

                        </div>
                        {outlet.latitude !== null && outlet.longitude !== null && (
                          <div className="mt-3 overflow-hidden rounded-xl border border-gray-100 bg-white sm:max-w-md">
                            <iframe
                              title={`${outlet.name} location`}
                              src={`https://www.google.com/maps?q=${outlet.latitude},${outlet.longitude}&z=15&output=embed`}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              className="h-36 w-full border-0"
                            />
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${outlet.latitude},${outlet.longitude}`} target="_blank" rel="noopener noreferrer" className="block px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-50">Open directions in Maps ↗</a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-gray-400">
                          Menu
                        </p>

                        <p className="mt-1 text-sm font-black text-gray-800">
                          {outlet.outletProducts.length} items
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PRODUCTS */}
                {outlet.outletProducts.length === 0 ? (
                  <div className="rounded-[28px] border border-orange-100 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
                      🍽️
                    </div>

                    <h4 className="mt-4 text-xl font-black text-gray-900">
                      Menu coming soon
                    </h4>

                    <p className="mt-1 text-sm text-gray-500">
                      No products are currently available at
                      this outlet.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-orange-500">Fresh from the kitchen</p>
                        <h4 className="mt-1 text-xl font-black text-gray-950">Menu</h4>
                      </div>
                      <span className="rounded-full border border-orange-100 bg-white px-3 py-1.5 text-xs font-bold text-gray-500 shadow-sm">{outlet.outletProducts.length} items</span>
                    </div>
                    <CustomerMenuSections products={outlet.outletProducts} outletId={outlet.id} outletName={outlet.name} companyId={business.id} companyName={business.name} storeOpen={business.isOpen} />
                  </>
                )}
              </section>
            ))}
          </div>
        )}
      </section>

      <CartPanel checkoutHref={`/checkout?pickupOnly=${pickupOnly ? "1" : "0"}&orderType=${initialOrderType}`} />
      <CartCheckoutBar href={`/checkout?pickupOnly=${pickupOnly ? "1" : "0"}&orderType=${initialOrderType}`} />
      <MobileCustomerNav />

      {/* FOOTER */}
      <footer className="border-t border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8">
          <div>
            <p className="font-black text-gray-900">
              {business.name}
            </p>

            <p className="mt-1 text-xs font-medium text-gray-400">
              Fresh food • Easy ordering
            </p>
          </div>

          <Link
            href="/"
            className="text-xs font-bold text-orange-500 transition hover:text-orange-600"
          >
            ← Explore other businesses
          </Link>
        </div>
      </footer>
    </main>
  );
}
