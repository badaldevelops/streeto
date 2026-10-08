import { buildPushPayload } from "@block65/webcrypto-web-push";
import { env } from "cloudflare:workers";
import { prisma } from "@/lib/prisma";
import { VAPID_PUBLIC_KEY } from "@/lib/push-vapid-public";

const vapidSubject = "https://streeto.badaldevelops.workers.dev";

function allowedPushEndpoint(endpoint: string) {
  try {
    const host = new URL(endpoint).hostname;
    return (
      host === "fcm.googleapis.com" ||
      host.endsWith(".push.services.mozilla.com") ||
      host.endsWith(".push.apple.com")
    );
  } catch {
    return false;
  }
}

export async function sendNewOrderPush(
  companyId: string,
  order: { id: string; orderNumber: string; total: number }
) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { isOpen: true },
  });
  if (!company?.isOpen) return;

  const privateKey = (env as typeof env & { VAPID_PRIVATE_KEY?: string })
    .VAPID_PRIVATE_KEY;
  if (!privateKey) {
    console.error("Business order push is not configured: VAPID_PRIVATE_KEY is missing.");
    return;
  }

  try {
    const subscriptions = await prisma.businessPushSubscription.findMany({
      where: { companyId },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    });

    await Promise.allSettled(
      subscriptions.map(async (saved) => {
        if (!allowedPushEndpoint(saved.endpoint)) return;

        const subscription = {
          endpoint: saved.endpoint,
          expirationTime: null,
          keys: { p256dh: saved.p256dh, auth: saved.auth },
        };

        try {
          const payload = await buildPushPayload(
            {
              data: JSON.stringify({
                title: "New StreetO order",
                body: `Order #${order.orderNumber} · ₹${order.total.toFixed(0)}. Tap to review and accept.`,
                tag: `streeto-order-${order.id}`,
                data: { url: "/business-admin" },
              }),
              // Keep a new order queued while a phone is asleep or temporarily offline.
              options: { ttl: 86400, urgency: "high" },
            },
            subscription,
            {
              subject: vapidSubject,
              publicKey: VAPID_PUBLIC_KEY,
              privateKey,
            }
          );

          const response = await fetch(saved.endpoint, {
            ...payload,
            signal: AbortSignal.timeout(4000),
          });

          if (response.status === 404 || response.status === 410) {
            await prisma.businessPushSubscription.deleteMany({
              where: { id: saved.id },
            });
          } else if (!response.ok) {
            console.error("Business order push failed with status:", response.status);
          }
        } catch (error) {
          console.error("Business order push delivery failed:", error);
        }
      })
    );
  } catch (error) {
    console.error("Business order push lookup failed:", error);
  }
}
