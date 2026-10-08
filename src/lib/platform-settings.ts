import { prisma } from "@/lib/prisma";

const platformSettingsId = "global";

export async function isDeliveryEnabled() {
  const settings = await prisma.platformSettings.findUnique({
    where: { id: platformSettingsId },
    select: { deliveryEnabled: true },
  });
  return settings?.deliveryEnabled ?? false;
}

export async function setDeliveryEnabled(deliveryEnabled: boolean) {
  return prisma.platformSettings.upsert({
    where: { id: platformSettingsId },
    update: { deliveryEnabled },
    create: { id: platformSettingsId, deliveryEnabled },
    select: { deliveryEnabled: true },
  });
}
