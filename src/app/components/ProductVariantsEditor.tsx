"use client";

import type { ProductVariant } from "@/lib/product-variants";

export type ProductVariantDraft = Omit<ProductVariant, "price"> & { price: string };

export default function ProductVariantsEditor({
  value,
  onChange,
}: {
  value: ProductVariantDraft[];
  onChange: (value: ProductVariantDraft[]) => void;
}) {
  function addVariant() {
    onChange([...value, { id: crypto.randomUUID(), name: "", price: "" }]);
  }

  function updateVariant(index: number, patch: Partial<ProductVariantDraft>) {
    onChange(value.map((variant, currentIndex) => currentIndex === index ? { ...variant, ...patch } : variant));
  }

  return (
    <fieldset className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <legend className="font-bold text-gray-900">Variants / sizes (optional)</legend>
          <p className="mt-1 text-xs leading-5 text-gray-500">For example: Regular ₹80, Large ₹120. Each price is the full price for that option.</p>
        </div>
        <button type="button" onClick={addVariant} disabled={value.length >= 50} className="shrink-0 rounded-xl bg-gray-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">+ Add size</button>
      </div>
      {value.length > 0 && (
        <div className="mt-3 space-y-2">
          {value.map((variant, index) => (
            <div key={variant.id} className="grid grid-cols-[minmax(0,1fr)_7rem_2.5rem] gap-2">
              <input aria-label={`Variant ${index + 1} name`} value={variant.name} onChange={(event) => updateVariant(index, { name: event.target.value })} maxLength={80} placeholder="Regular, Large" className="min-w-0 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm" />
              <label className="flex items-center rounded-xl border border-gray-300 bg-white px-2 text-sm text-gray-500">₹<input aria-label={`Variant ${index + 1} price`} type="number" min="0" max="100000" step="0.01" value={variant.price} onChange={(event) => updateVariant(index, { price: event.target.value })} className="w-full min-w-0 border-0 px-1 py-2 text-sm text-gray-900 outline-none" /></label>
              <button type="button" aria-label={`Remove variant ${index + 1}`} onClick={() => onChange(value.filter((_, currentIndex) => currentIndex !== index))} className="rounded-xl border border-red-200 bg-white font-bold text-red-600">×</button>
            </div>
          ))}
        </div>
      )}
    </fieldset>
  );
}
