import { requireRole } from "@/lib/route-access";

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  await requireRole("SUPER_ADMIN");
  return children;
}
