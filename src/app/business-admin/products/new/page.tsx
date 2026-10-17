"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import ProductAddOnsEditor, { type ProductAddOnDraft } from "@/app/components/ProductAddOnsEditor";

export default function NewProductPage() {
  const router = useRouter();

const [name, setName] = useState("");
const [description, setDescription] = useState("");
const [category, setCategory] = useState("Other");
const [addOns, setAddOns] = useState<ProductAddOnDraft[]>([]);

const [outlets, setOutlets] = useState<
  { id: string; name: string; gstin?: string | null; foodType: "VEG" | "NON_VEG" | "BOTH" }[]
>([]);

const [outletId, setOutletId] = useState("");
const [price, setPrice] = useState("");
const [gstin, setGstin] = useState("");
const [sgstRate, setSgstRate] = useState("");
const [cgstRate, setCgstRate] = useState("");
const [isAvailable, setIsAvailable] =
  useState(true);
const [isVeg, setIsVeg] = useState(true);

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
            gstin?: string | null;
            foodType: "VEG" | "NON_VEG" | "BOTH";
          }) => ({
            id: outlet.id,
            name: outlet.name,
            gstin: outlet.gstin ?? null,
            foodType: outlet.foodType,
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
  category,
  addOns: addOns.map((addOn) => ({ id: addOn.id, name: addOn.name, price: Number(addOn.price) })),
  outletId,
  price: Number(price),
  gstin,
  sgstRate: sgstRate ? Number(sgstRate) : null,
  cgstRate: cgstRate ? Number(cgstRate) : null,
  isAvailable,
  isVeg,
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
          <label htmlFor="menuCategory" style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#374151", marginTop: "20px", marginBottom: "8px" }}>Menu section</label>
          <input id="menuCategory" value={category} onChange={(event) => setCategory(event.target.value)} maxLength={60} placeholder="Burger, Pasta, Dosa" style={{ width: "100%", boxSizing: "border-box", border: "1px solid #d1d5db", borderRadius: "10px", padding: "12px", outline: "none", fontSize: "15px" }} />
          <p style={{ marginTop: "6px", fontSize: "12px", color: "#6b7280" }}>Type any section name you want. Reuse the same name to put products together; a new section appears after you save its first product.</p>
          <ProductAddOnsEditor value={addOns} onChange={setAddOns} />
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
    onChange={(event) => {
      const selectedId = event.target.value;
      setOutletId(selectedId);
      const selectedOutlet = outlets.find((outlet) => outlet.id === selectedId);
      setGstin(selectedOutlet?.gstin ?? "");
      setIsVeg(selectedOutlet?.foodType !== "NON_VEG");
    }}
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

{outlets.find((outlet) => outlet.id === outletId)?.foodType === "BOTH" ? (
  <div style={{ marginTop: "20px" }}>
    <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>Food type</label>
    <div style={{ display: "flex", gap: "12px" }}>
      <button type="button" aria-pressed={isVeg} onClick={() => setIsVeg(true)} style={{ border: `2px solid ${isVeg ? "#16a34a" : "#d1d5db"}`, borderRadius: "10px", padding: "10px 16px", background: isVeg ? "#f0fdf4" : "white", fontWeight: 700 }}>🟢 Veg</button>
      <button type="button" aria-pressed={!isVeg} onClick={() => setIsVeg(false)} style={{ border: `2px solid ${!isVeg ? "#dc2626" : "#d1d5db"}`, borderRadius: "10px", padding: "10px 16px", background: !isVeg ? "#fef2f2" : "white", fontWeight: 700 }}>🔴 Non-veg</button>
    </div>
  </div>
) : outletId ? (
  <p style={{ marginTop: "16px", fontSize: "14px", fontWeight: 700, color: outlets.find((outlet) => outlet.id === outletId)?.foodType === "NON_VEG" ? "#b91c1c" : "#15803d" }}>
    {outlets.find((outlet) => outlet.id === outletId)?.foodType === "NON_VEG" ? "🔴 Non-veg label is set automatically for this outlet." : "🟢 Veg label is set automatically for this outlet."}
  </p>
) : null}

<div style={{ marginTop: "20px" }}>
  <label htmlFor="gstin" style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>
    Outlet GSTIN (optional)
  </label>
  <input id="gstin" value={gstin} onChange={(event) => setGstin(event.target.value.toUpperCase())} maxLength={15} placeholder="Enter GSTIN to apply tax" style={{ width: "100%", boxSizing: "border-box", border: "1px solid #d1d5db", borderRadius: "10px", padding: "12px", fontSize: "15px" }} />
  <p style={{ marginTop: "6px", fontSize: "12px", color: "#6b7280" }}>GST is not added when this is left blank. This GSTIN is shared by all products for this outlet.</p>
</div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px" }}>
  <div><label htmlFor="sgstRate" style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>SGST rate (%)</label><input id="sgstRate" type="number" min="0" max="100" step="0.01" value={sgstRate} onChange={(event) => setSgstRate(event.target.value)} placeholder="0" style={{ width: "100%", boxSizing: "border-box", border: "1px solid #d1d5db", borderRadius: "10px", padding: "12px", fontSize: "15px" }} /></div>
  <div><label htmlFor="cgstRate" style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>CGST rate (%)</label><input id="cgstRate" type="number" min="0" max="100" step="0.01" value={cgstRate} onChange={(event) => setCgstRate(event.target.value)} placeholder="0" style={{ width: "100%", boxSizing: "border-box", border: "1px solid #d1d5db", borderRadius: "10px", padding: "12px", fontSize: "15px" }} /></div>
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
