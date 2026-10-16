import { requireRole } from "@/lib/route-access";

export default async function ProfileLayout({
  children,
}: LayoutProps<"/profile">) {
  await requireRole("CUSTOMER");
  return children;
}
