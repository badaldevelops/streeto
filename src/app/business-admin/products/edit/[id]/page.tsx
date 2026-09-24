"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Outlet = {
  id: string;
  name: string;
};

type ProductOutlet = {
  outletId: string;
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
  outletProducts: ProductOutlet[];
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();

  const productId =
    typeof params.id === "string" ? params.id : "";

  const [product, setProduct] =
    useState<Product | null>(null);

  const [outlets, setOutlets] = useState<Outlet[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [outletId, setOutletId] = useState("");
  const [price, setPrice] = useState("");
  const [isAvailable, setIsAvailable] =
    useState(true);

  const [isActive, setIsActive] =
    useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const meResponse = await fetch("/api/me", {
          cache: "no-store",
        });

        const meData = await meResponse.json();

        if (
          !meResponse.ok ||
          !meData.authenticated
        ) {
          router.push("/login");
          return;
        }

        if (
          meData.user?.role !== "BUSINESS_ADMIN"
        ) {
          router.push("/");
          return;
        }

        const [
          productsResponse,
          outletsResponse,
        ] = await Promise.all([
          fetch("/api/business-admin/products", {
            cache: "no-store",
          }),
          fetch("/api/business-admin/outlets", {
            cache: "no-store",
          }),
        ]);

        const productsData =
          await productsResponse.json();

        const outletsData =
          await outletsResponse.json();

        if (!productsResponse.ok) {
          setError(
            productsData.error ||
              "Unable to load product."
          );
          return;
        }

        if (!outletsResponse.ok) {
          setError(
            outletsData.error ||
              "Unable to load outlets."
          );
          return;
        }

        const foundProduct =
          (productsData.products || []).find(
            (item: Product) =>
              item.id === productId
          );

        if (!foundProduct) {
          setError("Product not found.");
          return;
        }

        setProduct(foundProduct);

        setName(foundProduct.name);
        setDescription(
          foundProduct.description || ""
        );
        setImageUrl(
          foundProduct.imageUrl || ""
        );
        setIsActive(
          foundProduct.isActive
        );

        setOutlets(
          (outletsData.outlets || []).map(
            (outlet: Outlet) => ({
              id: outlet.id,
              name: outlet.name,
            })
          )
        );

        const firstOutlet =
          foundProduct.outletProducts?.[0];

        if (firstOutlet) {
          setOutletId(
            firstOutlet.outletId
          );
          setPrice(
            String(firstOutlet.price)
          );
          setIsAvailable(
            firstOutlet.isAvailable
          );
        }
      } catch (error) {
        console.error(
          "Load edit product error:",
          error
        );

        setError(
          "Something went wrong while loading the product."
        );
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      loadData();
    }
  }, [productId, router]);

  async function saveProduct() {
    try {
      setSaving(true);
      setError("");

      if (!name.trim()) {
        setError(
          "Product name is required."
        );
        return;
      }

      if (!outletId) {
        setError(
          "Please select an outlet."
        );
        return;
      }

      if (
        !price ||
        Number(price) < 0 ||
        !Number.isFinite(Number(price))
      ) {
        setError(
          "Please enter a valid price."
        );
        return;
      }

      let finalImageUrl = imageUrl;

      if (selectedImage) {
        const formData = new FormData();

        formData.append(
          "file",
          selectedImage
        );

        const uploadResponse =
          await fetch(
            "/api/business-admin/upload-image",
            {
              method: "POST",
              body: formData,
            }
          );

        const uploadData =
          await uploadResponse.json();

        if (!uploadResponse.ok) {
          setError(
            uploadData.error ||
              "Unable to upload image."
          );
          return;
        }

        finalImageUrl =
          uploadData.imageUrl;
      }

      const response = await fetch(
        "/api/business-admin/products",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            productId,
            name: name.trim(),
            description:
              description.trim(),
            imageUrl:
              finalImageUrl || null,
            isActive,
            outletId,
            price: Number(price),
            isAvailable,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to update product."
        );
        return;
      }

      router.push(
        "/business-admin/products"
      );
    } catch (error) {
      console.error(
        "Update product error:",
        error
      );

      setError(
        "Something went wrong while updating the product."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f5f7fb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            padding: "40px",
            borderRadius: "16px",
            color: "#6b7280",
          }}
        >
          Loading product...
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "32px",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <button
          onClick={() =>
            router.push(
              "/business-admin/products"
            )
          }
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            color: "#2563eb",
            cursor: "pointer",
            fontSize: "14px",
            marginBottom: "18px",
          }}
        >
          ← Back to Products
        </button>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "28px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              fontWeight: 800,
              color: "#111827",
            }}
          >
            Edit Product
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#6b7280",
              marginBottom: "28px",
            }}
          >
            Update product details, price,
            image and availability.
          </p>

          {error && (
            <div
              style={{
                background: "#fee2e2",
                color: "#991b1b",
                border:
                  "1px solid #fecaca",
                borderRadius: "10px",
                padding: "14px",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          {imageUrl && (
            <div
              style={{
                marginBottom: "22px",
              }}
            >
              <img
                src={imageUrl}
                alt={name}
                style={{
                  width: "100%",
                  maxHeight: "260px",
                  objectFit: "contain",
                  background: "#f3f4f6",
                  borderRadius: "12px",
                  display: "block",
                }}
              />
            </div>
          )}

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              htmlFor="productName"
              style={{
                display: "block",
                fontWeight: 700,
                marginBottom: "8px",
                color: "#111827",
              }}
            >
              Product Name
            </label>

            <input
              id="productName"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Enter product name"
              style={{
                width: "100%",
                padding: "12px 14px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "10px",
                fontSize: "15px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              htmlFor="description"
              style={{
                display: "block",
                fontWeight: 700,
                marginBottom: "8px",
                color: "#111827",
              }}
            >
              Description
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Enter product description"
              rows={4}
              style={{
                width: "100%",
                padding: "12px 14px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "10px",
                fontSize: "15px",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
          </div>

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              htmlFor="productImage"
              style={{
                display: "block",
                fontWeight: 700,
                marginBottom: "8px",
                color: "#111827",
              }}
            >
              Change Product Image
            </label>

            <input
              id="productImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file =
                  event.target.files?.[0];

                if (file) {
                  setSelectedImage(file);
                }
              }}
              style={{
                width: "100%",
              }}
            />

            <p
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginTop: "6px",
              }}
            >
              JPG, PNG or WEBP. Maximum 5 MB.
            </p>
          </div>

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              htmlFor="outlet"
              style={{
                display: "block",
                fontWeight: 700,
                marginBottom: "8px",
                color: "#111827",
              }}
            >
              Outlet
            </label>

            <select
              id="outlet"
              value={outletId}
              onChange={(event) =>
                setOutletId(
                  event.target.value
                )
              }
              style={{
                width: "100%",
                padding: "12px 14px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "10px",
                fontSize: "15px",
                boxSizing: "border-box",
                background: "#ffffff",
              }}
            >
              <option value="">
                Select an outlet
              </option>

              {outlets.map((outlet) => (
                <option
                  key={outlet.id}
                  value={outlet.id}
                >
                  {outlet.name}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              htmlFor="price"
              style={{
                display: "block",
                fontWeight: 700,
                marginBottom: "8px",
                color: "#111827",
              }}
            >
              Price
            </label>

            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) =>
                setPrice(
                  event.target.value
                )
              }
              placeholder="Enter price"
              style={{
                width: "100%",
                padding: "12px 14px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "10px",
                fontSize: "15px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "18px",
              cursor: "pointer",
              color: "#111827",
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(event) =>
                setIsAvailable(
                  event.target.checked
                )
              }
            />

            Available for customers
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "28px",
              cursor: "pointer",
              color: "#111827",
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) =>
                setIsActive(
                  event.target.checked
                )
              }
            />

            Product Active
          </label>

          <div
            style={{
              display: "flex",
              gap: "12px",
            }}
          >
            <button
              onClick={() =>
                router.push(
                  "/business-admin/products"
                )
              }
              disabled={saving}
              style={{
                flex: 1,
                border:
                  "1px solid #d1d5db",
                borderRadius: "10px",
                background: "#ffffff",
                color: "#374151",
                padding: "13px 18px",
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
                fontWeight: 700,
              }}
            >
              Cancel
            </button>

            <button
              onClick={saveProduct}
              disabled={saving}
              style={{
                flex: 1,
                border: "none",
                borderRadius: "10px",
                background: "#2563eb",
                color: "#ffffff",
                padding: "13px 18px",
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
                fontWeight: 700,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}