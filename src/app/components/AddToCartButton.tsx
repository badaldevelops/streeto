"use client";

import { useCart } from "./CartProvider";

type Props = {
  productId: string;
  productName: string;
  price: number;
  companyId: string;
  companyName: string;
  outletId: string;
  outletName: string;
};

export default function AddToCartButton({
  productId,
  productName,
  price,
  companyId,
  companyName,
  outletId,
  outletName,
}: Props) {
  const {
    items,
    addItem,
    decreaseItem,
  } = useCart();

  const item = items.find(
    (cartItem) =>
      cartItem.productId === productId
  );

  const quantity = item?.quantity ?? 0;

  if (quantity === 0) {
    return (
      <button
        onClick={() =>
          addItem({
            productId,
            productName,
            price,
            companyId,
            companyName,
            outletId,
            outletName,
          })
        }
        className="mt-5 w-full rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-800"
      >
        Add to Cart
      </button>
    );
  }

  return (
    <div className="mt-5 flex items-center justify-between rounded-xl border bg-white p-2">
      <button
        onClick={() =>
          decreaseItem(productId)
        }
        className="h-10 w-10 rounded-lg border text-xl font-bold"
      >
        −
      </button>

      <div className="text-center">
        <p className="font-bold">
          {quantity}
        </p>

        <p className="text-xs text-gray-500">
          ₹{quantity * price}
        </p>
      </div>

      <button
        onClick={() =>
          addItem({
            productId,
            productName,
            price,
            companyId,
            companyName,
            outletId,
            outletName,
          })
        }
        className="h-10 w-10 rounded-lg bg-black text-xl font-bold text-white"
      >
        +
      </button>
    </div>
  );
}