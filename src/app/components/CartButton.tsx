"use client";

import { useCart } from "./CartProvider";

export default function CartButton() {
  const {
    cartCount,
    cartTotal,
    openCart,
  } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      className="rounded-full border border-orange-200 bg-white px-3 py-2 text-xs font-extrabold text-orange-600 shadow-sm transition hover:bg-orange-50 sm:px-4 sm:text-sm"
    >
      🛒 Cart
      {cartCount > 0 && ` (${cartCount})`}
      {cartCount > 0 && ` • ₹${cartTotal}`}
    </button>
  );
}
