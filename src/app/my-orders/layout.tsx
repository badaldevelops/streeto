import { requireRole } from "@/lib/route-access";

export default async function MyOrdersLayout({
  children,
}: LayoutProps<"/my-orders">) {
  await requireRole("CUSTOMER");
  return children;
}
