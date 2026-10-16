import Link from "next/link";


import CartButton from "./components/CartButton";
import CustomerLocation from "./components/CustomerLocation";
import CartPanel from "./components/CartPanel";
import MobileCustomerNav from "./components/MobileCustomerNav";

import CustomerStatus from "./components/CustomerStatus";
import QtooWordmark from "./components/QtooWordmark";
import InstallQtooButton from "./components/InstallQtooButton";


export default function Home() {
  return (
    <main className="min-h-screen bg-[#fffaf5] pb-20 text-gray-900 sm:pb-0">
      {/* TOP NAV */}
      <header className="sticky top-0 z-40 border-b border-orange-100/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5 sm:gap-3"
          >
            <QtooWordmark />
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-3">
     
           

            <CustomerStatus />
            <CartButton />
          </div>
        </div>
      </header>
      {/* HERO */}
      <section className="px-3 pb-5 pt-3 sm:px-6 sm:pb-8 sm:pt-7 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[24px] bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950 px-5 py-6 text-white shadow-[0_18px_45px_rgba(0,0,0,0.14)] sm:rounded-[32px] sm:px-10 sm:py-14 lg:px-14 lg:py-16">
          {/* Decorative circles */}
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-orange-500/20 blur-2xl" />
          <div className="absolute -bottom-28 right-28 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-orange-400/5 blur-3xl" />

          <div className="relative max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-orange-200 backdrop-blur sm:mb-5 sm:px-4 sm:py-2 sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
              Local food marketplace
            </div>

            <h2 className="text-[2rem] font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
              Good food.
              <br />
              <span className="bg-gradient-to-r from-orange-300 via-orange-200 to-red-300 bg-clip-text text-transparent">
                Great local stores.
              </span>
            </h2>

            <p className="mt-3 max-w-2xl text-[13px] font-medium leading-5 text-gray-300 sm:mt-5 sm:text-base sm:leading-8">
              Discover your favourite local businesses, explore
              their menus and choose Self Receive or Dine In at checkout.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 sm:mt-7 sm:gap-3">
              <a
                href="#discover"
                className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-orange-950/30 transition hover:-translate-y-0.5 hover:shadow-xl sm:rounded-2xl sm:px-6 sm:py-3.5"
              >
                Explore Food →
              </a>

              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-xs font-bold text-gray-200 backdrop-blur sm:rounded-2xl sm:px-5 sm:py-3.5 sm:text-sm">
                🏪 Self Receive · 🍽️ Dine In
              </div>
              <InstallQtooButton />
            </div>
          </div>

          {/* Floating food visual */}
          <div className="absolute bottom-5 right-5 hidden h-44 w-44 items-center justify-center rounded-full border border-white/10 bg-white/5 text-8xl shadow-2xl backdrop-blur sm:flex lg:bottom-10 lg:right-12 lg:h-56 lg:w-56 lg:text-9xl">
            🍔
          </div>
        </div>
      </section>

      <CustomerLocation />

      {/* TRUST STRIP */}
      <section className="px-3 py-1 sm:px-6 sm:py-3 lg:px-8">
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
          <TrustCard
            icon="🏪"
            title="Local Businesses"
            description="Order directly from nearby stores."
          />

          <TrustCard
            icon="🥡"
            title="Self Receive & Dine In"
            description="Order ahead, then collect your food or enjoy it at the outlet."
          />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-7 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8">
          <div className="sm:text-left">
            <p className="font-black text-gray-900">
              Qtoo
            </p>

            <p className="mt-1 text-xs font-medium text-gray-400">
              Good food. Less wait. Pick up from local outlets.
            </p>
            <a href="mailto:info@qtoo.com" className="mt-2 inline-block text-xs font-bold text-orange-700 hover:text-orange-800">Support · info@qtoo.com</a>
          </div>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-bold text-gray-600 sm:justify-end">
            <Link href="/terms" className="hover:text-orange-700">Terms</Link>
            <Link href="/privacy" className="hover:text-orange-700">Privacy</Link>
            <Link href="/refunds" className="hover:text-orange-700">Cancellation & refunds</Link>
            <p className="w-full text-gray-400 sm:w-auto">© 2026 Qtoo</p>
          </div>
        </div>
      </footer>
      <CartPanel />
      <MobileCustomerNav />
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
    <div className="flex min-w-[220px] items-center gap-3 rounded-2xl border border-orange-100 bg-white p-3 shadow-sm sm:min-w-0 sm:p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-lg sm:h-11 sm:w-11 sm:text-xl">
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
