import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

import AddToCartButton from "@/app/components/AddToCartButton";
import CartButton from "@/app/components/CartButton";
import CartPanel from "@/app/components/CartPanel";
import Checkout from "@/app/components/Checkout";
import CustomerStatus from "@/app/components/CustomerStatus";
import MobileCustomerNav from "@/app/components/MobileCustomerNav";

import { prisma } from "@/lib/prisma";

type BusinessPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BusinessPage({
  params,
}: BusinessPageProps) {
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

  const { id } = await params;

  const business = await prisma.company.findUnique({
    where: {
      id,
    },
    include: {
      outlets: {
        where: {
          isActive: true,
        },
        include: {
          outletProducts: {
            where: {
              isAvailable: true,
              product: {
                isActive: true,
              },
            },
            include: {
              product: true,
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

  const activeOutlets = business.outlets;

  const totalProducts = activeOutlets.reduce(
    (total, outlet) =>
      total + outlet.outletProducts.length,
    0
  );

  return (
    <main className="min-h-screen bg-[#fffaf5] pb-20 text-gray-900 sm:pb-0">
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
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[24px] bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950 px-5 py-6 text-white shadow-[0_18px_45px_rgba(0,0,0,0.14)] sm:rounded-[32px] sm:px-10 sm:py-14 lg:px-14">
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

            <p className="mt-3 max-w-2xl text-[13px] font-medium leading-5 text-gray-300 sm:mt-5 sm:text-base sm:leading-8">
              Explore the menu, choose your favourite food and
              order from the outlet that works best for you.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 sm:mt-7 sm:gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold backdrop-blur">
                🏪 {activeOutlets.length}{" "}
                {activeOutlets.length === 1
                  ? "Outlet"
                  : "Outlets"}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold backdrop-blur">
                🍽️ {totalProducts}{" "}
                {totalProducts === 1
                  ? "Product"
                  : "Products"}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold backdrop-blur">
                🚚 Delivery Available
              </div>
            </div>
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

                        <div className="mt-2 space-y-1">
                          {outlet.address && (
                            <p className="text-sm font-medium text-gray-500">
                              📍 {outlet.address}
                            </p>
                          )}

                          {outlet.phone && (
                            <p className="text-sm font-medium text-gray-500">
                              📞 {outlet.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-gray-400">
                          Delivery
                        </p>

                        <p className="mt-1 text-sm font-black text-gray-800">
                          {outlet.deliveryCharge === 0
                            ? "Free"
                            : `₹${outlet.deliveryCharge}`}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-orange-500">
                          Radius
                        </p>

                        <p className="mt-1 text-sm font-black text-orange-800">
                          {outlet.deliveryRadiusKm} km
                        </p>
                      </div>

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
                        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-orange-500">
                          Fresh from the kitchen
                        </p>

                        <h4 className="mt-1 text-xl font-black text-gray-950">
                          Popular Menu
                        </h4>
                      </div>

                      <span className="rounded-full border border-orange-100 bg-white px-3 py-1.5 text-xs font-bold text-gray-500 shadow-sm">
                        {outletIndex === 0
                          ? "Featured"
                          : "Available Now"}
                      </span>
                    </div>

                <div className="grid gap-3 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
                      {outlet.outletProducts.map(
                        (item) => (
                          <article
                            key={item.id}
                            className="group flex overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(234,88,12,0.12)] sm:block sm:rounded-[28px]"
                          >
                            {/* Product Image */}
                            <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-gradient-to-br from-orange-50 via-white to-red-50 sm:h-56 sm:w-auto">
                              {item.product.imageUrl ? (
                                <img
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  className="h-full w-full object-contain p-2 transition duration-500 group-hover:scale-105 sm:p-4"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-4xl transition duration-500 group-hover:scale-110 sm:text-7xl">
                                  🍽️
                                </div>
                              )}

                              <div className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-2 py-1 text-[8px] font-extrabold uppercase tracking-wide text-orange-600 shadow-sm backdrop-blur sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-[10px]">
                                Available
                              </div>

                              <div className="absolute bottom-1.5 right-1.5 rounded-full bg-white/95 px-2 py-1 text-xs font-black text-gray-900 shadow-lg sm:bottom-4 sm:right-4 sm:px-3 sm:py-1.5 sm:text-sm">
                                ₹{item.price}
                              </div>
                            </div>

                            {/* Product Info */}
                            <div className="min-w-0 flex-1 p-3 sm:p-5">
                              <div className="sm:min-h-[78px]">
                                <h5 className="line-clamp-2 text-base font-black leading-tight text-gray-950 sm:text-xl">
                                  {item.product.name}
                                </h5>

                                <p className="mt-1 line-clamp-2 text-xs font-medium leading-4 text-gray-500 sm:mt-2 sm:text-sm sm:leading-5">
                                  {item.product.description ||
                                    "Fresh and delicious."}
                                </p>
                              </div>

                              <div className="mt-2 hidden items-center gap-2 text-xs font-semibold text-gray-400 sm:mt-4 sm:flex">
                                <span className="rounded-full bg-gray-50 px-3 py-1.5">
                                  📍 {outlet.name}
                                </span>
                              </div>

                              <div className="mt-2 sm:mt-4">
                                <AddToCartButton
                                  productId={item.id}
                                  productName={
                                    item.product.name
                                  }
                                  price={item.price}
                                  companyId={business.id}
                                  companyName={business.name}
                                  outletId={outlet.id}
                                  outletName={outlet.name}
                                  disabled={!business.isOpen}
                                />
                              </div>
                            </div>
                          </article>
                        )
                      )}
                    </div>
                  </>
                )}
              </section>
            ))}
          </div>
        )}
      </section>

      {/* CART */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-5">
         

          <h2 className="mt-1 text-2xl font-black text-gray-950">
            Cart
          </h2>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-lg">
      <CartPanel />
      <MobileCustomerNav />
        </div>
      </section>

      {/* CHECKOUT */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-5">
         

          
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
