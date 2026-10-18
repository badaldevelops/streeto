export type ProductVariant = {
  id: string;
  name: string;
  price: number;
};

export function parseProductVariants(value: unknown): ProductVariant[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 50) return null;

  const result: ProductVariant[] = [];
  const ids = new Set<string>();

  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;
    const candidate = entry as { id?: unknown; name?: unknown; price?: unknown };
    const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
    const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
    const price = Number(candidate.price);

    if (!id || id.length > 100 || ids.has(id) || !name || name.length > 80 || !Number.isFinite(price) || price < 0 || price > 100000) {
      return null;
    }

    ids.add(id);
    result.push({ id, name, price: Math.round(price * 100) / 100 });
  }

  return result;
}

export function readProductVariants(value: unknown): ProductVariant[] {
  return parseProductVariants(value) ?? [];
}

export type OrderItemOptions = {
  variant: ProductVariant | null;
  addOns: Array<{ id: string; name: string; price: number }>;
};

export function readOrderItemOptions(value: unknown): OrderItemOptions {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const options = value as { variant?: unknown; addOns?: unknown };
    const variants = parseProductVariants(options.variant ? [options.variant] : []);
    const addOns = Array.isArray(options.addOns) ? options.addOns : [];
    return {
      variant: variants?.[0] ?? null,
      addOns: addOns.flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const item = entry as { id?: unknown; name?: unknown; price?: unknown };
        const price = Number(item.price);
        if (typeof item.id !== "string" || typeof item.name !== "string" || !Number.isFinite(price) || price < 0) return [];
        return [{ id: item.id, name: item.name, price }];
      }),
    };
  }

  // Orders created before variants stored add-ons directly as an array.
  if (!Array.isArray(value)) return { variant: null, addOns: [] };
  return {
    variant: null,
    addOns: value.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const item = entry as { id?: unknown; name?: unknown; price?: unknown };
      const price = Number(item.price);
      if (typeof item.id !== "string" || typeof item.name !== "string" || !Number.isFinite(price) || price < 0) return [];
      return [{ id: item.id, name: item.name, price }];
    }),
  };
}
