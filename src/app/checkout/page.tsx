import Link from "next/link";

import CartButton from "../components/CartButton";
import CartPanel from "../components/CartPanel";
import Checkout from "../components/Checkout";
import QtooWordmark from "../components/QtooWordmark";

type CheckoutPageProps = {
  searchParams: Promise<{
    pickupOnly?: string;
    orderType?: string;
  }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const query = await searchParams;
  const pickupOnly = query.pickupOnly === "1";

  return (
    <main className="min-h-screen bg-[#fffaf5] pb-10 text-gray-900">
      <header className="sticky top-0 z-40 border-b border-orange-100/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="Qtoo home" className="flex items-center">
            <QtooWordmark />
          </Link>
          <CartButton />
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-3 py-5 sm:px-6 sm:py-8">
        <Link href="/#discover" className="text-sm font-bold text-orange-600 hover:text-orange-700">
          ← Continue shopping
        </Link>
        <div className="mt-4 overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-lg">
          <Checkout pickupOnly={pickupOnly} />
        </div>
      </section>

      <CartPanel />
    </main>
  );
}
