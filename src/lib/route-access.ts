import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export type AppRole = "CUSTOMER" | "BUSINESS_ADMIN" | "SUPER_ADMIN" | "DELIVERY_STAFF";

function getRoleHome(role: AppRole) {
  switch (role) {
    case "SUPER_ADMIN":
      return "/admin";
    case "BUSINESS_ADMIN":
      return "/business-admin";
    case "DELIVERY_STAFF":
      return "/delivery";
    case "CUSTOMER":
      return "/";
  }
}

export async function requireRole(requiredRole: AppRole) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== requiredRole) {
    redirect(getRoleHome(user.role as AppRole));
  }

  return user;
}
