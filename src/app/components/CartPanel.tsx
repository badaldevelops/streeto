"use client";

import { useCart } from "./CartProvider";

export default function CartPanel() {
  const {
    items,
    addItem,
    decreaseItem,
    cartTotal,
    cartCount,
    cartCompanyName,
    cartOutletName,
    isCartOpen,
    closeCart,
  } = useCart();

  return (
    <>
      {isCartOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-[100] flex h-full w-full max-w-md flex-col bg-[#fffaf5] shadow-2xl transition-transform duration-300 ${
          isCartOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-orange-100 bg-white px-5 py-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-orange-500">
              Your Order
            </p>

            <h2 className="mt-1 text-2xl font-black text-gray-950">
              Cart
            </h2>

            {cartCompanyName && cartOutletName && (
              <p className="mt-1 text-sm font-medium text-gray-500">
                {cartCompanyName} • {cartOutletName}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={closeCart}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-xl font-bold text-orange-600 transition hover:bg-orange-100"
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        {/* CART CONTENT */}
        {cartCount === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-4xl">
              🛒
            </div>

            <h3 className="mt-5 text-xl font-black text-gray-950">
              Your cart is empty
            </h3>

            <p className="mt-2 max-w-xs text-sm font-medium leading-6 text-gray-500">
              Add something delicious from the menu and it will appear here.
            </p>

            <button
              type="button"
              onClick={closeCart}
              className="mt-6 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-orange-200 transition hover:scale-[1.02]"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-700">
                  {cartCount} item
                  {cartCount !== 1 ? "s" : ""}
                </p>

                <p className="text-sm font-extrabold text-orange-600">
                  ₹{cartTotal}
                </p>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-extrabold text-gray-950">
                          {item.productName}
                        </h3>

                        <p className="mt-1 text-sm font-medium text-gray-500">
                          ₹{item.price} each
                        </p>
                      </div>

                      <p className="whitespace-nowrap font-black text-gray-950">
                        ₹{item.price * item.quantity}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        Quantity
                      </p>

                      <div className="flex items-center gap-2 rounded-xl bg-orange-50 p-1">
                        <button
                          type="button"
                          onClick={() =>
                            decreaseItem(item.productId)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-lg font-black text-orange-600 shadow-sm transition hover:bg-orange-100"
                        >
                          −
                        </button>

                        <span className="w-8 text-center text-sm font-black text-gray-950">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            addItem({
                              productId: item.productId,
                              productName: item.productName,
                              price: item.price,
                              companyId: item.companyId,
                              companyName: item.companyName,
                              outletId: item.outletId,
                              outletName: item.outletName,
                            })
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-lg font-black text-white shadow-sm transition hover:scale-105"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FOOTER */}
            <div className="border-t border-orange-100 bg-white px-5 pb-6 pt-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-base font-bold text-gray-600">
                  Subtotal
                </span>

                <span className="text-2xl font-black text-gray-950">
                  ₹{cartTotal}
                </span>
              </div>

              <button
                type="button"
                onClick={closeCart}
                className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-4 text-sm font-black text-white shadow-lg shadow-orange-200 transition hover:scale-[1.01]"
              >
                Continue to Checkout →
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}