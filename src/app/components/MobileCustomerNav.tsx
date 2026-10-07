"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export default function MobileCustomerNav() {
  const { cartCount, openCart } = useCart();

  return (
    <nav
      aria-label="Customer navigation"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-orange-100 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(30,20,10,0.08)] backdrop-blur sm:hidden"
    >
      <Link href="/#businesses" className="flex min-h-11 flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-orange-600">
        <span aria-hidden="true" className="text-lg leading-none">⌂</span>Explore
      </Link>
      <Link href="/my-orders" className="flex min-h-11 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-gray-500">
        <span aria-hidden="true" className="text-lg leading-none">▤</span>Orders
      </Link>
      <Link href="/profile" className="flex min-h-11 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-gray-500">
        <span aria-hidden="true" className="text-lg leading-none">◎</span>Profile
      </Link>
      <button type="button" onClick={openCart} className="relative flex min-h-11 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-gray-500">
        <span aria-hidden="true" className="text-lg leading-none">🛒</span>
        Cart{cartCount > 0 ? ` · ${cartCount}` : ""}
      </button>
    </nav>
  );
}
