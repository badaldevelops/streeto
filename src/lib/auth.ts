import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await verifySession(sessionToken);

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      companyId: true,
      sessionVersion: true,
      company: {
        select: { isActive: true },
      },
    },
  });

  if (
    !user ||
    user.sessionVersion !== session.sessionVersion ||
    (user.role === "BUSINESS_ADMIN" && !user.company?.isActive)
  ) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    companyId: user.companyId,
  };
}
