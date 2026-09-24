"use client";

import {
  createContext,
  useContext,
  useState,
} from "react";

type CartItem = {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  companyId: string;
  companyName: string;
  outletId: string;
  outletName: string;
};

type AddCartItem = Omit<CartItem, "quantity">;

type CartContextType = {
  items: CartItem[];
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
  const [isCartOpen, setIsCartOpen] = useState(false);

function openCart() {
  setIsCartOpen(true);
}

function closeCart() {
  setIsCartOpen(false);
}

  function addItem(item: AddCartItem) {
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
              quantity: 1,
            },
          ];
        }
      }

      const existing = current.find(
        (cartItem) =>
          cartItem.productId === item.productId
      );

      if (existing) {
        return current.map((cartItem) =>
          cartItem.productId === item.productId
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
          quantity: 1,
        },
      ];
    });
  }

  function decreaseItem(productId: string) {
    setItems((current) =>
      current
        .map((item) =>
          item.productId === productId
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
      item.price * item.quantity,
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