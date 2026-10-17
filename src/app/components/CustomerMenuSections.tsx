import AddToCartButton from "@/app/components/AddToCartButton";
import { readProductAddOns } from "@/lib/product-addons";

type MenuProduct = {
  id: string;
  category: string;
  addOns: unknown;
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
}: {
  products: MenuProduct[];
  outletId: string;
  outletName: string;
  companyId: string;
  companyName: string;
  storeOpen: boolean;
}) {
  const groups = new Map<string, MenuProduct[]>();
  for (const product of products) {
    const category = product.category?.trim() || "Other";
    groups.set(category, [...(groups.get(category) ?? []), product]);
  }
  const sections = Array.from(groups.entries());
  const sectionId = (index: number) => `menu-${outletId}-${index}`;
  const allSectionId = `menu-${outletId}-all`;

  return (
    <>
      <nav aria-label={`${outletName} menu sections`} className="mb-5 flex snap-x gap-2 overflow-x-auto scroll-smooth pb-2">
        <a href={`#${allSectionId}`} className="shrink-0 snap-start rounded-full border border-orange-200 bg-orange-600 px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-orange-700">All</a>
        {sections.map(([category], index) => (
          <a key={category} href={`#${sectionId(index)}`} className="shrink-0 snap-start rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-extrabold text-gray-700 shadow-sm hover:border-orange-400 hover:text-orange-700">{category}</a>
        ))}
      </nav>
      <div id={allSectionId} className="scroll-mt-28 space-y-8">
        <div className="border-b border-orange-100 pb-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-orange-500">Complete menu</p>
          <h4 className="mt-1 text-xl font-black text-gray-950 sm:text-2xl">All items</h4>
        </div>
        {sections.map(([category, categoryProducts], index) => (
          <section key={category} id={sectionId(index)} className="scroll-mt-28">
            <div className="mb-3 flex items-end justify-between border-b border-orange-100 pb-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-orange-500">Menu section</p>
                <h4 className="mt-1 text-xl font-black text-gray-950 sm:text-2xl">{category}</h4>
              </div>
              <span className="text-xs font-bold text-gray-500">{categoryProducts.length} items</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
              {categoryProducts.map((item) => (
                <article key={item.id} className="group flex overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(234,88,12,0.12)] sm:block sm:rounded-[28px]">
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-gradient-to-br from-orange-50 via-white to-red-50 sm:h-56 sm:w-auto">
                    {item.product.imageUrl ? <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-contain p-2 transition duration-500 group-hover:scale-105 sm:p-4" /> : <div className="flex h-full items-center justify-center text-4xl sm:text-7xl">🍽️</div>}
                    <div className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-2 py-1 text-[8px] font-extrabold uppercase text-orange-600 shadow-sm sm:left-4 sm:top-4 sm:px-3 sm:text-[10px]">Available</div>
                    <div className="absolute bottom-1.5 right-1.5 rounded-full bg-white/95 px-2 py-1 text-xs font-black text-gray-900 shadow-lg sm:bottom-4 sm:right-4 sm:px-3 sm:py-1.5 sm:text-sm">₹{item.price}</div>
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
                      <AddToCartButton productId={item.id} productName={item.product.name} price={item.price} companyId={companyId} companyName={companyName} outletId={outletId} outletName={outletName} disabled={!storeOpen} addOns={readProductAddOns(item.addOns)} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
