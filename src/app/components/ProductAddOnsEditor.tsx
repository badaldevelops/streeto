"use client";

export type ProductAddOnDraft = { id: string; name: string; price: string };

export default function ProductAddOnsEditor({
  value,
  onChange,
}: {
  value: ProductAddOnDraft[];
  onChange: (next: ProductAddOnDraft[]) => void;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-gray-950">Optional add-ons</h2>
          <p className="mt-1 text-xs text-gray-600">Examples: Extra cheese ₹20, Paneer ₹35. Customers choose these per item.</p>
        </div>
        <button
          type="button"
          disabled={value.length >= 20}
          onClick={() => onChange([...value, { id: crypto.randomUUID(), name: "", price: "" }])}
          className="shrink-0 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          + Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="mt-3 space-y-2">
          {value.map((addOn, index) => (
            <div className="flex gap-2" key={addOn.id}>
              <input
                aria-label={`Add-on ${index + 1} name`}
                value={addOn.name}
                onChange={(event) => onChange(value.map((entry) => entry.id === addOn.id ? { ...entry, name: event.target.value } : entry))}
                maxLength={80}
                placeholder="Extra cheese"
                className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              />
              <label className="flex w-28 shrink-0 items-center rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-500">
                ₹<input
                  aria-label={`Add-on ${index + 1} price`}
                  type="number"
                  min="0"
                  max="100000"
                  step="0.01"
                  value={addOn.price}
                  onChange={(event) => onChange(value.map((entry) => entry.id === addOn.id ? { ...entry, price: event.target.value } : entry))}
                  placeholder="0"
                  className="w-full border-0 bg-transparent px-1 py-2 text-right text-sm outline-none"
                />
              </label>
              <button type="button" aria-label={`Remove ${addOn.name || `add-on ${index + 1}`}`} onClick={() => onChange(value.filter((entry) => entry.id !== addOn.id))} className="rounded-lg px-3 font-bold text-red-700 hover:bg-red-50">×</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
