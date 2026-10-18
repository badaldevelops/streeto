"use client";

import { useState } from "react";
import AddToCartButton from "@/app/components/AddToCartButton";
import { readProductAddOns } from "@/lib/product-addons";
import { readProductVariants } from "@/lib/product-variants";

type MenuProduct = {
  id: string;
  category: string;
  addOns: unknown;
  variants: unknown;
  price: number;
  isVeg: boolean;
  product: { name: string; description: string | null; imageUrl: string | null };
};

export default function CustomerMenuSections({
  products,
  outletId,
  outletName,
  companyId,
  companyName,
  storeOpen,
  selectedCategory,
}: {
  products: MenuProduct[];
  outletId: string;
  outletName: string;
  companyId: string;
  companyName: string;
  storeOpen: boolean;
  selectedCategory: string | null;
}) {
  const [activeCategory, setActiveCategory] = useState(selectedCategory);
  const groups = new Map<string, MenuProduct[]>();
  for (const product of products) {
    const category = product.category?.trim() || "Other";
    groups.set(category, [...(groups.get(category) ?? []), product]);
  }
  const sections = Array.from(groups.entries());
  const visibleProducts = activeCategory
    ? groups.get(activeCategory) ?? []
    : sections.flatMap(([, categoryProducts]) => categoryProducts);

  return (
    <>
      <nav aria-label={`${outletName} menu sections`} className="mb-5 flex snap-x gap-2 overflow-x-auto scroll-smooth pb-2">
        <button type="button" onClick={() => setActiveCategory(null)} aria-pressed={!activeCategory} className={`shrink-0 snap-start rounded-full border px-4 py-2 text-sm font-extrabold shadow-sm ${!activeCategory ? "border-orange-600 bg-orange-600 text-white" : "border-orange-200 bg-white text-gray-700 hover:border-orange-400 hover:text-orange-700"}`}>All</button>
        {sections.map(([category]) => (
          <button key={category} type="button" onClick={() => setActiveCategory(category)} aria-pressed={activeCategory === category} className={`shrink-0 snap-start rounded-full border px-4 py-2 text-sm font-extrabold shadow-sm ${activeCategory === category ? "border-orange-600 bg-orange-600 text-white" : "border-orange-200 bg-white text-gray-700 hover:border-orange-400 hover:text-orange-700"}`}>{category}</button>
        ))}
      </nav>
      <div key={activeCategory ?? "all"} className="menu-category-slide">
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
              {visibleProducts.map((item) => (
                (() => {
                  const variants = readProductVariants(item.variants);
                  const displayPrice = variants.length > 0 ? Math.min(...variants.map((variant) => variant.price)) : item.price;
                  return <article key={item.id} className="group flex overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(234,88,12,0.12)] sm:block sm:rounded-[28px]">
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-gradient-to-br from-orange-50 via-white to-red-50 sm:h-56 sm:w-auto">
                    {item.product.imageUrl ? <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-contain p-2 transition duration-500 group-hover:scale-105 sm:p-4" /> : <div className="flex h-full items-center justify-center text-4xl sm:text-7xl">🍽️</div>}
                    <div className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-2 py-1 text-[8px] font-extrabold uppercase text-orange-600 shadow-sm sm:left-4 sm:top-4 sm:px-3 sm:text-[10px]">Available</div>
                    <div className="absolute bottom-1.5 right-1.5 rounded-full bg-white/95 px-2 py-1 text-xs font-black text-gray-900 shadow-lg sm:bottom-4 sm:right-4 sm:px-3 sm:py-1.5 sm:text-sm">{variants.length > 0 ? "From " : ""}₹{displayPrice}</div>
                  </div>
                  <div className="min-w-0 flex-1 p-3 sm:p-5">
                    <div className="sm:min-h-[78px]">
                      <h5 className="line-clamp-2 text-base font-black leading-tight text-gray-950 sm:text-xl">{item.product.name}</h5>
                      <span className={`mt-1 inline-flex rounded border px-1.5 py-0.5 text-[10px] font-bold ${item.isVeg ? "border-green-600 text-green-700" : "border-red-600 text-red-700"}`}>
                        <span className={`mr-1 inline-block h-2 w-2 ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />{item.isVeg ? "Veg" : "Non-veg"}
                      </span>
                      <p className="mt-1 line-clamp-2 text-xs font-medium leading-4 text-gray-500 sm:mt-2 sm:text-sm sm:leading-5">{item.product.description || "Fresh and delicious."}</p>
                    </div>
                    <div className="mt-2 sm:mt-4">
                      <AddToCartButton productId={item.id} productName={item.product.name} price={item.price} companyId={companyId} companyName={companyName} outletId={outletId} outletName={outletName} disabled={!storeOpen} addOns={readProductAddOns(item.addOns)} variants={variants} />
                    </div>
                  </div>
                  </article>;
                })()
              ))}
        </div>
      </div>
    </>
  );
}
