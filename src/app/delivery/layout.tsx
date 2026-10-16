import { requireRole } from "@/lib/route-access";

export default async function DeliveryLayout({
  children,
}: LayoutProps<"/delivery">) {
  await requireRole("DELIVERY_STAFF");
  return children;
}
