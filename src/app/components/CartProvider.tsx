"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { readProductAddOns, type ProductAddOn } from "@/lib/product-addons";
import type { ProductVariant } from "@/lib/product-variants";

const cartStorageKey = "streeto:customer-cart";

type CartItem = {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  companyId: string;
  companyName: string;
  outletId: string;
  outletName: string;
  addOns: ProductAddOn[];
  variant: ProductVariant | null;
  lineId: string;
};

type AddCartItem = Omit<CartItem, "quantity" | "lineId"> & { lineId?: string };

export function getCartLineId(productId: string, addOns: ProductAddOn[] = [], variantId: string | null = null) {
  const addOnIds = addOns.map((addOn) => addOn.id).sort().join(",");
  return `${productId}::${variantId ?? ""}::${addOnIds}`;
}

type CartContextType = {
  items: CartItem[];
  cartLoaded: boolean;
  clearCart: () => void;
  addItem: (item: AddCartItem) => void;
  decreaseItem: (productId: string) => void;
  cartCount: number;
  cartTotal: number;
  cartCompanyId: string | null;
  cartCompanyName: string | null;
  cartOutletId: string | null;
  cartOutletName: string | null;
  isCartOpen: boolean;
openCart: () => void;
closeCart: () => void;
};

const CartContext =
  createContext<CartContextType | null>(null);

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>(
    []
  );
  const [cartLoaded, setCartLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartChangedBeforeLoad = useRef(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(cartStorageKey);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) {
        const restoredItems = parsed.filter((item): item is Omit<CartItem, "addOns" | "lineId" | "variant"> & Partial<Pick<CartItem, "addOns" | "lineId" | "variant">> =>
          item && typeof item.productId === "string" &&
          typeof item.productName === "string" &&
          typeof item.price === "number" &&
          Number.isFinite(item.price) &&
          Number.isInteger(item.quantity) && item.quantity > 0 &&
          typeof item.companyId === "string" &&
          typeof item.companyName === "string" &&
          typeof item.outletId === "string" &&
          typeof item.outletName === "string"
        ).map((item) => {
          const addOns = readProductAddOns(item.addOns);
          const variant = item.variant && typeof item.variant.id === "string" && typeof item.variant.name === "string" && Number.isFinite(item.variant.price)
            ? item.variant as ProductVariant
            : null;
          return { ...item, addOns, variant, lineId: getCartLineId(item.productId, addOns, variant?.id ?? null) };
        });
        setItems((current) =>
          cartChangedBeforeLoad.current ? current : restoredItems
        );
      }
    } catch {
      // Keep the cart usable when browser storage is unavailable or malformed.
    } finally {
      setCartLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;
    try {
      window.localStorage.setItem(cartStorageKey, JSON.stringify(items));
    } catch {
      // Cart storage is best-effort when browser storage is unavailable.
    }
  }, [cartLoaded, items]);

function openCart() {
  setIsCartOpen(true);
}

function closeCart() {
  setIsCartOpen(false);
}

function clearCart() {
  if (!cartLoaded) cartChangedBeforeLoad.current = true;
  setItems([]);
  setIsCartOpen(false);
}

  function addItem(item: AddCartItem) {
    if (!cartLoaded) cartChangedBeforeLoad.current = true;
    setItems((current) => {
      /*
       * Cart ek hi business aur ek hi outlet
       * ke products rakhega.
       */
      if (current.length > 0) {
        const currentCompanyId =
          current[0].companyId;

        const currentOutletId =
          current[0].outletId;

        const differentBusiness =
          currentCompanyId !== item.companyId;

        const differentOutlet =
          currentOutletId !== item.outletId;

        if (
          differentBusiness ||
          differentOutlet
        ) {
          const shouldReplace =
            window.confirm(
              `Your cart already contains items from ${current[0].companyName} - ${current[0].outletName}.\n\nDo you want to clear the current cart and start a new cart for ${item.companyName} - ${item.outletName}?`
            );

          if (!shouldReplace) {
            return current;
          }

          return [
            {
              ...item,
              lineId: item.lineId ?? getCartLineId(item.productId, item.addOns, item.variant?.id ?? null),
              quantity: 1,
            },
          ];
        }
      }

      const existing = current.find(
        (cartItem) => cartItem.lineId === (item.lineId ?? getCartLineId(item.productId, item.addOns, item.variant?.id ?? null))
      );

      if (existing) {
        return current.map((cartItem) =>
          cartItem.lineId === (item.lineId ?? getCartLineId(item.productId, item.addOns, item.variant?.id ?? null))
            ? {
                ...cartItem,
                quantity:
                  cartItem.quantity + 1,
              }
            : cartItem
        );
      }

      return [
        ...current,
        {
          ...item,
          lineId: item.lineId ?? getCartLineId(item.productId, item.addOns, item.variant?.id ?? null),
          quantity: 1,
        },
      ];
    });
  }

  function decreaseItem(lineId: string) {
    if (!cartLoaded) cartChangedBeforeLoad.current = true;
    setItems((current) =>
      current
        .map((item) =>
          item.lineId === lineId
            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) => item.quantity > 0
        )
    );
  }

  const cartCount = items.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  const cartTotal = items.reduce(
    (total, item) =>
      total +
      ((item.variant?.price ?? item.price) + item.addOns.reduce((sum, addOn) => sum + addOn.price, 0)) * item.quantity,
    0
  );

  const cartCompanyId =
    items.length > 0
      ? items[0].companyId
      : null;

  const cartCompanyName =
    items.length > 0
      ? items[0].companyName
      : null;

  const cartOutletId =
    items.length > 0
      ? items[0].outletId
      : null;

  const cartOutletName =
    items.length > 0
      ? items[0].outletName
      : null;

  return (
    <CartContext.Provider
      value={{
        items,
        cartLoaded,
        clearCart,
        addItem,
        decreaseItem,
        cartCount,
        cartTotal,
        cartCompanyId,
        cartCompanyName,
        cartOutletId,
        cartOutletName,
        isCartOpen,
openCart,
closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}
