"use client";

import { useState } from "react";
import { useCart, getCartLineId } from "./CartProvider";
import type { ProductAddOn } from "@/lib/product-addons";

type Props = {
  productId: string;
  productName: string;
  price: number;
  companyId: string;
  companyName: string;
  outletId: string;
  outletName: string;
  disabled?: boolean;
  addOns?: ProductAddOn[];
};

export default function AddToCartButton({
  productId,
  productName,
  price,
  companyId,
  companyName,
  outletId,
  outletName,
  disabled = false,
  addOns = [],
}: Props) {
  const { items, addItem, decreaseItem, openCart } = useCart();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedAddOns = addOns.filter((addOn) => selectedIds.includes(addOn.id));
  const lineId = getCartLineId(productId, selectedAddOns);
  const quantity = items.find((cartItem) => cartItem.lineId === lineId)?.quantity ?? 0;
  const itemPrice = price + selectedAddOns.reduce((total, addOn) => total + addOn.price, 0);

  if (disabled) {
    return <button type="button" disabled className="mt-5 w-full cursor-not-allowed rounded-xl bg-gray-200 px-4 py-3 font-semibold text-gray-500">Store Closed</button>;
  }

  return (
    <div className="mt-3">
      {addOns.length > 0 && (
        <fieldset className="mb-3 rounded-xl border border-orange-100 bg-orange-50/60 p-3">
          <legend className="px-1 text-xs font-extrabold text-gray-700">Add extras</legend>
          <div className="space-y-2">
            {addOns.map((addOn) => (
              <label key={addOn.id} className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(addOn.id)}
                    onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, addOn.id] : current.filter((id) => id !== addOn.id))}
                    className="h-4 w-4 accent-orange-600"
                  />
                  <span className="truncate">{addOn.name}</span>
                </span>
                <span className="shrink-0 font-bold text-gray-800">+₹{addOn.price.toFixed(2)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {quantity === 0 ? (
        <button
          type="button"
          onClick={() => {
            addItem({ productId, productName, price, companyId, companyName, outletId, outletName, addOns: selectedAddOns, lineId });
            openCart();
          }}
          className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-800"
        >
          Add to Cart · ₹{itemPrice.toFixed(2)}
        </button>
      ) : (
        <div className="flex items-center justify-between rounded-xl border bg-white p-2">
          <button type="button" onClick={() => decreaseItem(lineId)} className="h-10 w-10 rounded-lg border text-xl font-bold">−</button>
          <div className="text-center">
            <p className="font-bold">{quantity}</p>
            <p className="text-xs text-gray-500">₹{(quantity * itemPrice).toFixed(2)}</p>
          </div>
          <button type="button" onClick={() => addItem({ productId, productName, price, companyId, companyName, outletId, outletName, addOns: selectedAddOns, lineId })} className="h-10 w-10 rounded-lg bg-black text-xl font-bold text-white">+</button>
        </div>
      )}
    </div>
  );
}
