"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type OutletProduct = {
  id: string;
  price: number;
  isAvailable: boolean;
  outlet: {
    id: string;
    name: string;
    isActive: boolean;
  };
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  outletProducts: OutletProduct[];
};

export default function BusinessAdminProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/business-admin/products", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to load products.");
        return;
      }

      setProducts(data.products || []);
    } catch (error) {
      console.error("Load business products error:", error);
      setError("Something went wrong while loading products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function checkLogin() {
      try {
        const response = await fetch("/api/me", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.authenticated) {
          router.push("/login");
          return;
        }

        if (data.user?.role !== "BUSINESS_ADMIN") {
          router.push("/");
          return;
        }

        await loadProducts();
      } catch (error) {
        console.error("Business admin session error:", error);
        router.push("/login");
      }
    }

    checkLogin();
  }, [router]);

  async function deactivateProduct(product: Product) {
    const confirmed = window.confirm(
      `Deactivate "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/business-admin/products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Unable to deactivate product.");
        return;
      }

      await loadProducts();
    } catch (error) {
      console.error("Deactivate product error:", error);

      alert(
        "Something went wrong while deactivating the product."
      );
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 rounded-3xl border border-orange-100 bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <button
                onClick={() => router.push("/business-admin")}
                className="mb-4 inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                ← Back to Dashboard
              </button>

              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl shadow-inner backdrop-blur">
                  🍽️
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-100">
                    Food Business
                  </p>

                  <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
                    Products
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-orange-50 sm:text-base">
                Manage your menu, product pricing, outlet availability
                and active products from one place.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={loadProducts}
                disabled={loading}
                className="rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Loading..." : "↻ Refresh"}
              </button>

              <button
                onClick={() =>
                  router.push("/business-admin/products/new")
                }
                className="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-orange-600 shadow-lg transition hover:-translate-y-0.5 hover:bg-orange-50"
              >
                + Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        {!loading && !error && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              icon="🍽️"
              title="Total Products"
              value={products.length}
              description="Products in your catalog"
            />

            <SummaryCard
              icon="✅"
              title="Active Products"
              value={products.filter((p) => p.isActive).length}
              description="Currently active"
            />

            <SummaryCard
              icon="⛔"
              title="Inactive Products"
              value={products.filter((p) => !p.isActive).length}
              description="Deactivated products"
            />

            <SummaryCard
              icon="🏪"
              title="Outlet Listings"
              value={products.reduce(
                (total, product) =>
                  total + product.outletProducts.length,
                0
              )}
              description="Product outlet assignments"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>

              <div>
                <p className="font-extrabold">Unable to load products</p>
                <p className="mt-1 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-3xl border border-orange-100 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl">
              🍳
            </div>

            <h2 className="text-lg font-extrabold text-gray-900">
              Loading products...
            </h2>

            <p className="mt-2 text-sm font-medium text-gray-500">
              Please wait while we load your menu.
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && products.length === 0 && (
          <div className="rounded-3xl border border-orange-100 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100 text-4xl">
              🍽️
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900">
              No products yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Start building your menu by adding your first food
              product.
            </p>

            <button
              onClick={() =>
                router.push("/business-admin/products/new")
              }
              className="mt-6 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5"
            >
              + Add Your First Product
            </button>
          </div>
        )}

        {/* Products */}
        {!loading && !error && products.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="group overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Image */}
                <div className="relative overflow-hidden bg-orange-50">
                  {product.imageUrl ? (
                   <img
  src={product.imageUrl}
  alt={product.name}
  className="h-48 w-full object-contain bg-orange-50 p-3 transition duration-500 group-hover:scale-105 sm:h-52"
/>
                  ) : (
                    <div className="flex h-64 w-full items-center justify-center bg-gradient-to-br from-orange-100 to-red-100 text-7xl">
                      🍽️
                    </div>
                  )}

                  <div className="absolute left-4 top-4">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-extrabold shadow-sm ${
                        product.isActive
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-700 text-white"
                      }`}
                    >
                      {product.isActive ? "● ACTIVE" : "● INACTIVE"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-extrabold text-gray-900">
                        {product.name}
                      </h2>

                      <p className="mt-2 min-h-[44px] text-sm leading-6 text-gray-500">
                        {product.description ||
                          "No description available."}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-xl">
                      🍴
                    </div>
                  </div>

                  {/* Outlets */}
                  <div className="mt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gray-400">
                        Outlet Pricing
                      </p>

                      <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-600">
                        {product.outletProducts.length}{" "}
                        {product.outletProducts.length === 1
                          ? "Outlet"
                          : "Outlets"}
                      </span>
                    </div>

                    {product.outletProducts.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm font-medium text-gray-500">
                        No outlet assigned
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {product.outletProducts.map(
                          (outletProduct) => (
                            <div
                              key={outletProduct.id}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-3.5 py-3 transition hover:border-orange-200 hover:bg-orange-50/50"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-extrabold text-gray-900">
                                  {outletProduct.outlet.name}
                                </p>

                                <p className="mt-0.5 text-xs font-medium text-gray-500">
                                  {outletProduct.outlet.isActive
                                    ? "Outlet Active"
                                    : "Outlet Inactive"}
                                </p>
                              </div>

                              <div className="shrink-0 text-right">
                                <p className="text-base font-extrabold text-orange-600">
                                  {formatPrice(
                                    outletProduct.price
                                  )}
                                </p>

                                <p
                                  className={`mt-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                                    outletProduct.isAvailable
                                      ? "text-emerald-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {outletProduct.isAvailable
                                    ? "Available"
                                    : "Unavailable"}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        router.push(
                          `/business-admin/products/edit/${product.id}`
                        )
                      }
                      className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      onClick={() => deactivateProduct(product)}
                      disabled={!product.isActive}
                      className={`rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                        product.isActive
                          ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                          : "cursor-not-allowed bg-gray-100 text-gray-400"
                      }`}
                    >
                      {product.isActive
                        ? "🚫 Deactivate"
                        : "✓ Deactivated"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {!loading && !error && products.length > 0 && (
          <div className="mt-8 rounded-2xl border border-orange-100 bg-white p-4 text-center text-xs font-medium text-gray-500 shadow-sm">
            Product management • Prices and availability are managed
            outlet-wise
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  description,
}: {
  icon: string;
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-gray-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black tracking-tight text-gray-900">
            {value}
          </p>

          <p className="mt-1 text-xs font-medium text-gray-500">
            {description}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

function formatPrice(price: number) {
  return `₹${price.toFixed(2)}`;
}