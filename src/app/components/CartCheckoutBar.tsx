"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export default function CartCheckoutBar({ href }: { href: string }) {
  const { cartCount, cartTotal } = useCart();
  if (cartCount === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-[4.5rem] z-30 px-3 sm:bottom-4 sm:left-auto sm:right-5 sm:w-[min(26rem,calc(100vw-2.5rem))] sm:px-0">
      <Link href={href} prefetch className="flex min-h-14 items-center justify-between rounded-2xl bg-emerald-600 px-5 text-white shadow-[0_12px_35px_rgba(5,150,105,0.28)] transition hover:bg-emerald-700">
        <span className="text-sm font-bold">{cartCount} {cartCount === 1 ? "item" : "items"} · ₹{cartTotal}</span>
        <span className="text-sm font-extrabold">Checkout <span aria-hidden="true">→</span></span>
      </Link>
    </div>
  );
}
