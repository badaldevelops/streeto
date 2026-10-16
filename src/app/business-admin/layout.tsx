import BusinessAdminOrderAlerts from "@/app/components/BusinessAdminOrderAlerts";
import { requireRole } from "@/lib/route-access";

export default async function BusinessAdminLayout({
  children,
}: LayoutProps<"/business-admin">) {
  await requireRole("BUSINESS_ADMIN");
  return (
    <>
      <BusinessAdminOrderAlerts />
      {children}
    </>
  );
}
