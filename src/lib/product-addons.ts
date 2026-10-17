export type ProductAddOn = {
  id: string;
  name: string;
  price: number;
};

export function parseProductAddOns(value: unknown): ProductAddOn[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 20) return null;

  const result: ProductAddOn[] = [];
  const ids = new Set<string>();
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;
    const candidate = entry as { id?: unknown; name?: unknown; price?: unknown };
    const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
    const price = Number(candidate.price);
    const id = typeof candidate.id === "string" && candidate.id.trim()
      ? candidate.id.trim()
      : crypto.randomUUID();
    if (!name || name.length > 80 || id.length > 100 || ids.has(id) || !Number.isFinite(price) || price < 0 || price > 100000) {
      return null;
    }
    ids.add(id);
    result.push({ id, name, price: Math.round(price * 100) / 100 });
  }

  return result;
}

export function readProductAddOns(value: unknown): ProductAddOn[] {
  return parseProductAddOns(value) ?? [];
}

export function productAddOnTotal(addOns: ProductAddOn[]): number {
  return addOns.reduce((total, addOn) => total + addOn.price, 0);
}
