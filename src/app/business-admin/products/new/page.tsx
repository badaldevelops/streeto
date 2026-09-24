"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();

const [name, setName] = useState("");
const [description, setDescription] = useState("");
const [imageUrl, setImageUrl] = useState("");
const [selectedImage, setSelectedImage] =
  useState<File | null>(null);

const [outlets, setOutlets] = useState<
  { id: string; name: string }[]
>([]);

const [outletId, setOutletId] = useState("");
const [price, setPrice] = useState("");
const [isAvailable, setIsAvailable] =
  useState(true);

const [saving, setSaving] = useState(false);
const [error, setError] = useState("");

 useEffect(() => {
  async function loadOutlets() {
    try {
      const response = await fetch(
        "/api/business-admin/outlets",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to load outlets."
        );
        return;
      }

      setOutlets(
        (data.outlets || []).map(
          (outlet: {
            id: string;
            name: string;
          }) => ({
            id: outlet.id,
            name: outlet.name,
          })
        )
      );
    } catch (error) {
      console.error(
        "Load outlets error:",
        error
      );

      setError(
        "Unable to load outlets."
      );
    }
  }

  loadOutlets();
}, []);

async function createProduct() {
  try {
    setSaving(true);
    setError("");

    let uploadedImageUrl = "";

    if (selectedImage) {
      const formData = new FormData();

      formData.append(
        "file",
        selectedImage
      );

      const uploadResponse = await fetch(
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

      uploadedImageUrl =
        uploadData.imageUrl;
    }

    if (!outletId) {
  setError("Please select an outlet.");
  return;
}

if (!price || Number(price) < 0) {
  setError("Please enter a valid price.");
  return;
}
    const response = await fetch(
      "/api/business-admin/products",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
       body: JSON.stringify({
  name,
  description,
  imageUrl: uploadedImageUrl || null,
  outletId,
  price: Number(price),
  isAvailable,
}),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(
        data.error ||
          "Unable to create product."
      );
      return;
    }

    router.push(
      "/business-admin/products"
    );
  } catch (error) {
    console.error(
      "Create product error:",
      error
    );

    setError(
      "Something went wrong while creating the product."
    );
  } finally {
    setSaving(false);
  }
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
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        <button
          type="button"
          onClick={() =>
            router.push("/business-admin/products")
          }
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            color: "#2563eb",
            cursor: "pointer",
            fontSize: "14px",
            marginBottom: "12px",
          }}
        >
          ← Back to Products
        </button>

        <h1
          style={{
            margin: 0,
            fontSize: "32px",
            fontWeight: 800,
            color: "#111827",
          }}
        >
          Add Product
        </h1>

        <p
          style={{
            marginTop: "8px",
            color: "#6b7280",
          }}
        >
          Create a new product for your business.
        </p>

        {error && (
          <div
            style={{
              marginTop: "20px",
              background: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              padding: "14px",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            marginTop: "24px",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            border: "1px solid #e5e7eb",
          }}
        >
          <label
            htmlFor="name"
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 700,
              color: "#374151",
              marginBottom: "8px",
            }}
          >
            Product Name
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Example: Dabeli"
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid #d1d5db",
              borderRadius: "10px",
              padding: "12px",
              outline: "none",
              fontSize: "15px",
            }}
          />

          <label
            htmlFor="description"
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 700,
              color: "#374151",
              marginTop: "20px",
              marginBottom: "8px",
            }}
          >
            Description
          </label>

          <textarea
            id="description"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Enter product description"
            rows={4}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid #d1d5db",
              borderRadius: "10px",
              padding: "12px",
              outline: "none",
              fontSize: "15px",
              resize: "vertical",
            }}
          />
<div
  style={{
    marginTop: "20px",
  }}
>
  <label
    htmlFor="productImage"
    style={{
      display: "block",
      fontSize: "14px",
      fontWeight: 700,
      color: "#374151",
      marginBottom: "8px",
    }}
  >
    Product Image
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
      boxSizing: "border-box",
      border: "1px solid #d1d5db",
      borderRadius: "10px",
      padding: "12px",
      background: "#ffffff",
      fontSize: "14px",
    }}
  />

  <p
    style={{
      marginTop: "6px",
      fontSize: "12px",
      color: "#6b7280",
    }}
  >
    JPG, PNG or WEBP. Maximum size: 5 MB.
  </p>

  {selectedImage && (
    <p
      style={{
        marginTop: "8px",
        fontSize: "13px",
        color: "#166534",
        fontWeight: 600,
      }}
    >
      Selected: {selectedImage.name}
    </p>
  )}
</div>

<div
  style={{
    marginTop: "20px",
  }}
>
  <label
    htmlFor="outlet"
    style={{
      display: "block",
      fontSize: "14px",
      fontWeight: 700,
      color: "#374151",
      marginBottom: "8px",
    }}
  >
    Outlet
  </label>

  <select
    id="outlet"
    value={outletId}
    onChange={(event) =>
      setOutletId(event.target.value)
    }
    style={{
      width: "100%",
      boxSizing: "border-box",
      border: "1px solid #d1d5db",
      borderRadius: "10px",
      padding: "12px",
      outline: "none",
      fontSize: "15px",
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
    marginTop: "20px",
  }}
>
  <label
    htmlFor="price"
    style={{
      display: "block",
      fontSize: "14px",
      fontWeight: 700,
      color: "#374151",
      marginBottom: "8px",
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
      setPrice(event.target.value)
    }
    placeholder="Example: 40"
    style={{
      width: "100%",
      boxSizing: "border-box",
      border: "1px solid #d1d5db",
      borderRadius: "10px",
      padding: "12px",
      outline: "none",
      fontSize: "15px",
    }}
  />
</div>

<div
  style={{
    marginTop: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  }}
>
  <input
    id="isAvailable"
    type="checkbox"
    checked={isAvailable}
    onChange={(event) =>
      setIsAvailable(event.target.checked)
    }
    style={{
      width: "18px",
      height: "18px",
      cursor: "pointer",
    }}
  />

  <label
    htmlFor="isAvailable"
    style={{
      fontSize: "14px",
      fontWeight: 700,
      color: "#374151",
      cursor: "pointer",
    }}
  >
    Product is available
  </label>
</div>
          <div
            style={{
              marginTop: "24px",
              display: "flex",
              gap: "12px",
            }}
          >
        
            <button
              type="button"
              onClick={() =>
                router.push("/business-admin/products")
              }
              disabled={saving}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                background: "#ffffff",
                color: "#374151",
                padding: "12px 18px",
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
                fontWeight: 600,
                opacity: saving ? 0.6 : 1,
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={createProduct}
              disabled={saving}
              style={{
                border: "none",
                borderRadius: "10px",
                background: "#2563eb",
                color: "#ffffff",
                padding: "12px 18px",
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
                fontWeight: 600,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving
                ? "Creating..."
                : "Create Product"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}