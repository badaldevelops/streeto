import { CartProvider } from "@/app/components/CartProvider";

export default function BusinessMenuLayout({
  children,
}: LayoutProps<"/business/[id]">) {
  return <CartProvider>{children}</CartProvider>;
}
